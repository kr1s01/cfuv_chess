from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    rating = Column(Integer, default=1200)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active = Column(DateTime(timezone=True), onupdate=func.now())

    games_white = relationship("Game", back_populates="white_player", foreign_keys="Game.white_player_id")
    games_black = relationship("Game", back_populates="black_player", foreign_keys="Game.black_player_id")

    @property
    def games_played(self):
        return len(self.games_white) + len(self.games_black)

class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    white_player_id = Column(Integer, ForeignKey("users.id"))
    black_player_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Nullable if waiting for opponent
    fen = Column(String, default="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")
    pgn = Column(String, default="")
    status = Column(String(20), default="waiting") # waiting, active, finished
    result = Column(String(10), nullable=True) # 1-0, 0-1, 1/2-1/2
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    white_player = relationship("User", foreign_keys=[white_player_id], back_populates="games_white")
    black_player = relationship("User", foreign_keys=[black_player_id], back_populates="games_black")
    moves = relationship("Move", back_populates="game")

class Move(Base):
    __tablename__ = "moves"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"))
    player_id = Column(Integer, ForeignKey("users.id"))
    move_san = Column(String(10), nullable=False)
    fen_after = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    game = relationship("Game", back_populates="moves")
