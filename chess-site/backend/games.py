from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
import chess
import chess.pgn
import io
import database, models, schemas, auth, ratings

router = APIRouter()

# WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, List[WebSocket]] = {}

    async def connect(self, game_id: int, websocket: WebSocket):
        await websocket.accept()
        if game_id not in self.active_connections:
            self.active_connections[game_id] = []
        self.active_connections[game_id].append(websocket)

    def disconnect(self, game_id: int, websocket: WebSocket):
        if game_id in self.active_connections:
            self.active_connections[game_id].remove(websocket)
            if not self.active_connections[game_id]:
                del self.active_connections[game_id]

    async def broadcast(self, game_id: int, message: str):
        if game_id in self.active_connections:
            for connection in self.active_connections[game_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@router.get("/games", response_model=List[schemas.GameOut])
async def read_games(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Game).filter(models.Game.status != "finished").options(selectinload(models.Game.moves)).offset(skip).limit(limit))
    games = result.scalars().all()
    return games

@router.post("/games", response_model=schemas.GameOut)
async def create_game(current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(database.get_db)):
    # Create a new game, current user is White by default
    new_game = models.Game(white_player_id=current_user.id, status="waiting")
    db.add(new_game)
    await db.commit()
    # Re-fetch with moves loaded to satisfy Pydantic serialization
    result = await db.execute(select(models.Game).filter(models.Game.id == new_game.id).options(selectinload(models.Game.moves)))
    new_game = result.scalars().first()
    return new_game

@router.post("/games/{game_id}/join", response_model=schemas.GameOut)
async def join_game(game_id: int, current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Game).filter(models.Game.id == game_id))
    game = result.scalars().first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    if game.white_player_id == current_user.id:
         raise HTTPException(status_code=400, detail="You are already in this game")
    if game.black_player_id is not None:
        raise HTTPException(status_code=400, detail="Game is full")
    
    game.black_player_id = current_user.id
    game.status = "active"
    await db.commit()
    # Re-fetch with moves loaded
    result = await db.execute(select(models.Game).filter(models.Game.id == game.id).options(selectinload(models.Game.moves)))
    game = result.scalars().first()
    
    await manager.broadcast(game_id, "player_joined")
    
    return game

@router.get("/games/{game_id}", response_model=schemas.GameOut)
async def read_game(game_id: int, db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Game).filter(models.Game.id == game_id).options(selectinload(models.Game.moves)))
    game = result.scalars().first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    return game

@router.post("/games/{game_id}/move", response_model=schemas.MoveOut)
async def make_move(game_id: int, move: schemas.MoveCreate, current_user: models.User = Depends(auth.get_current_user), db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Game).filter(models.Game.id == game_id))
    game = result.scalars().first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    if game.status != "active":
        raise HTTPException(status_code=400, detail="Game is not active")

    # Check if user is a player
    is_white = game.white_player_id == current_user.id
    is_black = game.black_player_id == current_user.id
    
    if not (is_white or is_black):
        raise HTTPException(status_code=403, detail="Not a player in this game")

    board = chess.Board(game.fen)
    
    # Check turn
    if board.turn == chess.WHITE and not is_white:
         raise HTTPException(status_code=400, detail="Not your turn")
    if board.turn == chess.BLACK and not is_black:
         raise HTTPException(status_code=400, detail="Not your turn")

    try:
        chess_move = board.parse_san(move.san)
    except ValueError:
        try:
             # Try UCI if SAN fails (though prompt said move validation)
             chess_move = board.parse_uci(move.san)
        except ValueError:
             raise HTTPException(status_code=400, detail="Invalid move format")

    if chess_move not in board.legal_moves:
        raise HTTPException(status_code=400, detail="Illegal move")

    board.push(chess_move)
    new_fen = board.fen()
    game.fen = new_fen
    
    # Save move
    db_move = models.Move(game_id=game.id, player_id=current_user.id, move_san=move.san, fen_after=new_fen)
    db.add(db_move)
    
    # Update game status if game over
    if board.is_game_over():
        game.status = "finished"
        outcome = board.outcome()
        if outcome.winner == chess.WHITE:
            game.result = "1-0"
            game.winner_id = game.white_player_id
            score_white = 1
            score_black = 0
        elif outcome.winner == chess.BLACK:
            game.result = "0-1"
            game.winner_id = game.black_player_id
            score_white = 0
            score_black = 1
        else:
            game.result = "1/2-1/2"
            score_white = 0.5
            score_black = 0.5
            
        # Update ratings
        # Fetch full player objects to get ratings
        w_res = await db.execute(select(models.User).filter(models.User.id == game.white_player_id))
        white_user = w_res.scalars().first()
        b_res = await db.execute(select(models.User).filter(models.User.id == game.black_player_id))
        black_user = b_res.scalars().first()
        
        if white_user and black_user:
            new_w = ratings.calculate_elo(white_user.rating, black_user.rating, score_white)
            new_b = ratings.calculate_elo(black_user.rating, white_user.rating, score_black)
            white_user.rating = new_w
            black_user.rating = new_b
            
    await db.commit()
    await db.refresh(game)
    
    await manager.broadcast(game_id, f"move:{move.san}")
    
    return db_move

@router.get("/games/{game_id}/history", response_model=List[schemas.MoveOut])
async def get_game_history(game_id: int, db: AsyncSession = Depends(database.get_db)):
    result = await db.execute(select(models.Move).filter(models.Move.game_id == game_id).order_by(models.Move.created_at))
    moves = result.scalars().all()
    return moves

@router.websocket("/ws/game/{game_id}")
async def websocket_endpoint(websocket: WebSocket, game_id: int):
    await manager.connect(game_id, websocket)
    try:
        while True:
            # Simple echo or heartbeat, mainly used for server push on moves
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(game_id, websocket)
