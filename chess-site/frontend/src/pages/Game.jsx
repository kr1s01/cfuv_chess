import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { gameAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import RetroCard from '../components/common/RetroCard';
import MoveHistory from '../components/MoveHistory';
import toast from 'react-hot-toast';


const customDarkSquareStyle = { backgroundColor: '#B88762' };
const customLightSquareStyle = { backgroundColor: '#EED2B6' };
const customBoardStyle = { borderRadius: '0' };

const Game = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [game, setGame] = useState(() => new Chess());
    const [gameState, setGameState] = useState(null);
    const [boardOrientation, setBoardOrientation] = useState('white');
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [legalMoves, setLegalMoves] = useState([]);

    // Refs to hold latest state for stable callbacks
    const gameRef = useRef(game);
    const gameStateRef = useRef(gameState);
    const userRef = useRef(user);
    const selectedSquareRef = useRef(selectedSquare);

    useEffect(() => {
        gameRef.current = game;
        gameStateRef.current = gameState;
        userRef.current = user;
        selectedSquareRef.current = selectedSquare;
    }, [game, gameState, user, selectedSquare]);

    useEffect(() => {
        fetchGame();
        // Small delay to ensure Vite proxy is ready
        const timer = setTimeout(() => {
            connectWebSocket();
        }, 100);

        return () => {
            clearTimeout(timer);
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [id]);

    const fetchGame = async () => {
        try {
            const { data } = await gameAPI.getGame(id);
            setGameState(data);

            // Reconstruct game object with history
            const newGame = new Chess();

            if (data.moves && data.moves.length > 0) {
                // Sort moves by ID to ensure chronological order
                const sortedMoves = [...data.moves].sort((a, b) => a.id - b.id);

                // Replay all moves
                sortedMoves.forEach(move => {
                    try {
                        newGame.move(move.move_san);
                    } catch (e) {
                        console.error("Error replaying move:", move.move_san, e);
                    }
                });
            } else if (data.fen) {
                // Fallback: If no moves but we have FEN (e.g. custom start pos), use it
                // Note: This won't have history
                if (data.fen !== newGame.fen()) {
                    newGame.load(data.fen);
                }
            }

            setGame(newGame);

            if (user && data.black_player_id === user.id) {
                setBoardOrientation('black');
            }
        } catch (error) {
            toast.error("Failed to load game");
        }
    };

    const connectWebSocket = useCallback((retryCount = 0) => {
        // Use relative path so Vite proxy forwards to backend
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws/game/${id}`;

        try {
            const socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                setIsConnected(true);
            };

            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                // Don't retry if we already have too many attempts
                if (retryCount < 3) {
                    setTimeout(() => {
                        connectWebSocket(retryCount + 1);
                    }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s, 3s
                }
            };

            socket.onmessage = (event) => {
                const message = event.data;
                if (message.startsWith("move:")) {
                    fetchGame();
                } else if (message === "player_joined") {
                    toast.success("Player joined!");
                    fetchGame();
                }
            };

            socket.onclose = (event) => {
                setIsConnected(false);
                // Only retry on abnormal closure (not user-initiated)
                if (event.code !== 1000 && retryCount < 3) {
                    setTimeout(() => {
                        connectWebSocket(retryCount + 1);
                    }, 1000 * (retryCount + 1));
                }
            };

            socketRef.current = socket;
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            if (retryCount < 3) {
                setTimeout(() => {
                    connectWebSocket(retryCount + 1);
                }, 1000 * (retryCount + 1));
            }
        }
    }, [id]);

    const onDrop = useCallback((sourceSquare, targetSquare) => {
        const currentGame = gameRef.current;

        // Clone the game state properly to preserve history
        const gameCopy = new Chess();
        try {
            gameCopy.loadPgn(currentGame.pgn());
        } catch (e) {
            gameCopy.load(currentGame.fen());
        }

        const move = gameCopy.move({
            from: sourceSquare,
            to: targetSquare,
            promotion: 'q', // Always promote to queen for simplicity
        });

        // If the move is illegal, return false and do nothing.
        if (move === null) {
            return false;
        }

        // Optimistically update the local state.
        setGame(gameCopy);

        // Clear highlights after the move.
        setSelectedSquare(null);
        setLegalMoves([]);

        // Send the move to the backend.
        gameAPI.makeMove(id, move.san)
            .then(() => {
                // The move was successful.
                toast.success(`Move: ${move.san}`);
                // The websocket will trigger a fetchGame, so we don't need to do it here.
            })
            .catch((apiError) => {
                // The backend rejected the move. Revert the local state.
                console.error("Backend rejected move:", apiError);

                // Revert to the state before the optimistic move
                const revertedGame = new Chess();
                try {
                    revertedGame.loadPgn(currentGame.pgn());
                } catch (e) {
                    revertedGame.load(currentGame.fen());
                }
                setGame(revertedGame);

                const errorMsg = apiError.response?.data?.detail || "Move rejected by server";
                toast.error(errorMsg);
            });

        // Return true to indicate a successful drop. 
        return true;
    }, [id]);

    const onSquareClick = useCallback((square) => {
        const currentSelectedSquare = selectedSquareRef.current;
        const currentGame = gameRef.current;
        const currentUser = userRef.current;
        const currentGameState = gameStateRef.current;

        // If clicking the same square, deselect
        if (currentSelectedSquare === square) {
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
        }

        // Get the piece on the clicked square
        const piece = currentGame.get(square);

        // If there's no piece or it's not the player's turn, clear selection
        if (!piece) {
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
        }

        // Check if it's the player's piece
        const isWhitePlayer = currentUser && currentGameState && currentUser.id === currentGameState.white_player_id;
        const isBlackPlayer = currentUser && currentGameState && currentUser.id === currentGameState.black_player_id;
        const isWhitePiece = piece.color === 'w';
        const isTurn = (currentGame.turn() === 'w' && isWhitePlayer) || (currentGame.turn() === 'b' && isBlackPlayer);

        if (!isTurn || (isWhitePlayer && !isWhitePiece) || (isBlackPlayer && isWhitePiece)) {
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
        }

        // Get all legal moves for this piece
        const moves = currentGame.moves({ square, verbose: true });
        const targetSquares = moves.map(move => move.to);

        setSelectedSquare(square);
        setLegalMoves(targetSquares);
    }, []);




    const memoizedChessboard = useMemo(() => (
        <Chessboard
            position={game.fen()}
            boardOrientation={boardOrientation}
            customDarkSquareStyle={customDarkSquareStyle}
            customLightSquareStyle={customLightSquareStyle}
            customBoardStyle={customBoardStyle}
            arePiecesDraggable={gameState?.status === 'active'}
            onPieceDrop={onDrop}
            onSquareClick={onSquareClick}
            animationDuration={200}
        />
    ), [game, boardOrientation, gameState?.status, onDrop, onSquareClick]);

    if (!gameState) return <div className="container"><RetroCard>LOADING_GAME_DATA...</RetroCard></div>;

    return (
        <div className="container" style={{ paddingBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <RetroCard style={{ padding: '0.5rem' }}>
                <div className="flex justify-between items-center" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                    <span>SESSION_ID: {id}</span>
                    <span style={{ color: isConnected ? '#000' : '#red' }}>
                        {isConnected ? "ONLINE" : "OFFLINE"}
                    </span>
                </div>
            </RetroCard>

            {/* Main Game Layout */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: '2rem',
                alignItems: 'flex-start',
                justifyContent: 'center',
                flexWrap: 'wrap'
            }}>
                <div style={{ flex: '0 0 auto', width: '100%', maxWidth: '600px' }}>
                    {/* Chessboard Container */}
                    <RetroCard title="CHESSBOARD_VIEW" style={{ padding: '0', border: 'none', background: 'transparent', boxShadow: 'none' }} titleStyle={{ margin: '0 0 0.5rem 0', width: '100%' }}>
                        <div style={{ width: '100%', maxWidth: '500px', border: '2px solid black' }}>
                            {memoizedChessboard}
                        </div>
                    </RetroCard>

                    <RetroCard title="GAME_INFO.TXT" style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'space-around', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', borderBottom: '2px solid black' }}>PLAYERS</div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span>WHITE: {gameState.white_player_id}</span>
                                    <span>BLACK: {gameState.black_player_id || 'Waiting...'}</span>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', borderBottom: '2px solid black' }}>STATUS</div>
                                <div style={{ padding: '0.25rem 0.5rem', border: '2px solid black', textAlign: 'center', fontWeight: 'bold', background: gameState.status === 'active' ? '#fff' : '#eee' }}>
                                    {gameState.status.toUpperCase()}
                                </div>
                                {gameState.result && (
                                    <div style={{ marginTop: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
                                        RESULT: {gameState.result}
                                    </div>
                                )}
                            </div>
                            <div>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', borderBottom: '2px solid black' }}>TURN</div>
                                <div>{game.turn() === 'w' ? 'WHITE' : 'BLACK'}</div>
                            </div>
                        </div>
                    </RetroCard>
                </div>

                <div style={{ flex: '1 1 300px', maxWidth: '400px' }}>
                    <MoveHistory game={game} />
                </div>
            </div>
        </div>
    );
};

export default Game;
