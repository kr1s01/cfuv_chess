import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { gameAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Game = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [game, setGame] = useState(new Chess());
    const [gameState, setGameState] = useState(null);
    const [boardOrientation, setBoardOrientation] = useState('white');
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [selectedSquare, setSelectedSquare] = useState(null);
    const [legalMoves, setLegalMoves] = useState([]);

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
            if (data.fen) {
                setGame(new Chess(data.fen));
            }

            if (user && data.black_player_id === user.id) {
                setBoardOrientation('black');
            }
        } catch (error) {
            toast.error("Failed to load game");
        }
    };

    const connectWebSocket = (retryCount = 0) => {
        // Use relative path so Vite proxy forwards to backend
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws/game/${id}`;

        try {
            const socket = new WebSocket(wsUrl);

            socket.onopen = () => {
                console.log('WS Connected');
                setIsConnected(true);
            };

            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                // Don't retry if we already have too many attempts
                if (retryCount < 3) {
                    console.log(`WebSocket connection failed, retrying... (attempt ${retryCount + 1}/3)`);
                    setTimeout(() => {
                        connectWebSocket(retryCount + 1);
                    }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s, 3s
                }
            };

            socket.onmessage = (event) => {
                const message = event.data;
                if (message.startsWith("move:")) {
                    const moveSan = message.split(":")[1];
                    setGame(g => {
                        const update = new Chess(g.fen());
                        update.move(moveSan);
                        return update;
                    });
                    fetchGame();
                } else if (message === "player_joined") {
                    toast.success("Player joined!");
                    fetchGame();
                }
            };

            socket.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
                setIsConnected(false);
                // Only retry on abnormal closure (not user-initiated)
                if (event.code !== 1000 && retryCount < 3) {
                    console.log(`WebSocket closed unexpectedly, retrying... (attempt ${retryCount + 1}/3)`);
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
    };

    const onDrop = async (sourceSquare, targetSquare) => {
        alert(`onDrop вызвана! ${sourceSquare} -> ${targetSquare}`);
        console.log("=== onDrop CALLED ===", { sourceSquare, targetSquare, game: game.fen() });

        try {
            // Try to make the move locally to validate it
            const move = game.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q', // Always promote to queen for simplicity
            });

            // If move is null, it's illegal
            if (move === null) {
                console.log("Illegal move attempted:", sourceSquare, "to", targetSquare);
                return false;
            }

            // Move is legal locally, now send to backend
            console.log("Valid move:", move.san);

            try {
                await gameAPI.makeMove(id, move.san);

                // Clear highlights after successful move
                setSelectedSquare(null);
                setLegalMoves([]);

                // Update the local state
                setGame(new Chess(game.fen()));

                // Refresh game state from backend
                fetchGame();

                toast.success(`Move: ${move.san}`);
                return true;
            } catch (apiError) {
                // Backend rejected the move, revert local state
                console.error("Backend rejected move:", apiError);
                game.undo();
                setGame(new Chess(game.fen()));

                const errorMsg = apiError.response?.data?.detail || "Move rejected by server";
                toast.error(errorMsg);
                return false;
            }
        } catch (error) {
            console.error("Error in onDrop:", error);
            toast.error("Failed to make move");
            return false;
        }
    };

    const onSquareClick = (square) => {
        // If clicking the same square, deselect
        if (selectedSquare === square) {
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
        }

        // Get the piece on the clicked square
        const piece = game.get(square);

        // If there's no piece or it's not the player's turn, clear selection
        if (!piece) {
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
        }

        // Check if it's the player's piece
        const isWhitePlayer = user && gameState && user.id === gameState.white_player_id;
        const isBlackPlayer = user && gameState && user.id === gameState.black_player_id;
        const isWhitePiece = piece.color === 'w';
        const isTurn = (game.turn() === 'w' && isWhitePlayer) || (game.turn() === 'b' && isBlackPlayer);

        if (!isTurn || (isWhitePlayer && !isWhitePiece) || (isBlackPlayer && isWhitePiece)) {
            setSelectedSquare(null);
            setLegalMoves([]);
            return;
        }

        // Get all legal moves for this piece
        const moves = game.moves({ square, verbose: true });
        const targetSquares = moves.map(move => move.to);

        setSelectedSquare(square);
        setLegalMoves(targetSquares);
    };


    if (!gameState) return <div className="container retro-card">LOADING_GAME_DATA...</div>;

    return (
        <div className="container" style={{ paddingBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <div className="retro-card" style={{ padding: '0.5rem' }}>
                <div className="flex justify-between items-center" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                    <span>SESSION_ID: {id}</span>
                    <span style={{ color: isConnected ? '#000' : '#red' }}>
                        {isConnected ? "ONLINE" : "OFFLINE"}
                    </span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div className="retro-card" style={{ padding: '0', border: 'none', background: 'transparent', boxShadow: 'none' }}>
                    <div className="retro-title-bar" style={{ margin: '0 0 0.5rem 0', width: '100%' }}>CHESSBOARD_VIEW</div>
                    <div style={{ width: '100%', maxWidth: '500px', border: '2px solid black' }}>
                        <Chessboard
                            position={game.fen()}
                            boardOrientation={boardOrientation}
                            customDarkSquareStyle={{ backgroundColor: '#000000' }}
                            customLightSquareStyle={{ backgroundColor: '#ffffff' }}
                            customBoardStyle={{ borderRadius: '0' }}
                            isDraggablePiece={({ piece }) => {
                                if (!gameState || gameState.status !== 'active') {
                                    console.log("Drag blocked: Game not active", gameState?.status);
                                    return false;
                                }
                                if (!user) {
                                    console.log("Drag blocked: No user");
                                    return false;
                                }

                                const isWhitePlayer = user.id === gameState.white_player_id;
                                const isBlackPlayer = user.id === gameState.black_player_id;
                                const isWhitePiece = piece[0] === 'w';
                                const isTurn = (game.turn() === 'w' && isWhitePlayer) || (game.turn() === 'b' && isBlackPlayer);

                                if (!isTurn) {
                                    // reducing log noise, but useful for debugging once
                                    // console.log("Drag blocked: Not your turn", { turn: game.turn(), isWhitePlayer, isBlackPlayer });
                                    return false;
                                }

                                if (isWhitePlayer && isWhitePiece) {
                                    console.log("✓ Piece IS draggable:", piece);
                                    return true;
                                }
                                if (isBlackPlayer && !isWhitePiece) {
                                    console.log("✓ Piece IS draggable:", piece);
                                    return true;
                                }

                                console.log("Drag blocked: Wrong piece color", { user: user.id, piece, white: gameState.white_player_id, black: gameState.black_player_id });
                                return false;
                            }}
                            onPieceDrop={onDrop}
                        />
                    </div>
                </div>

                <div className="retro-card" style={{ flex: 1, minWidth: '300px' }}>
                    <div className="retro-title-bar">GAME_INFO.TXT</div>

                    <div className="mb-4">
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '2px solid black' }}>PLAYERS</div>
                        <div className="flex justify-between">
                            <span>WHITE</span>
                            <span>{gameState.white_player_id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>BLACK</span>
                            <span>{gameState.black_player_id || 'Waiting...'}</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', borderBottom: '2px solid black' }}>STATUS</div>
                        <div style={{ padding: '0.5rem', border: '2px solid black', textAlign: 'center', fontWeight: 'bold', background: gameState.status === 'active' ? '#fff' : '#eee' }}>
                            {gameState.status.toUpperCase()}
                        </div>
                        {gameState.result && (
                            <div style={{ marginTop: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>
                                RESULT: {gameState.result}
                            </div>
                        )}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#555', borderTop: '1px dotted #000', paddingTop: '0.5rem' }}>
                        Current Turn: {game.turn() === 'w' ? 'WHITE' : 'BLACK'}
                    </div>

                    {/* DEBUG PANEL */}
                    <div style={{ marginTop: '2rem', border: '2px solid red', padding: '0.5rem', fontSize: '0.7rem', fontFamily: 'monospace', background: '#fff0f0' }}>
                        <div style={{ fontWeight: 'bold', color: 'red' }}>DEBUG_MODE_ACTIVE</div>
                        <div>My User ID: {user?.id}</div>
                        <div>White ID: {gameState.white_player_id}</div>
                        <div>Black ID: {gameState.black_player_id}</div>
                        <div>Turn: {game.turn()}</div>
                        <div>FEN: {game.fen().substring(0, 30)}...</div>
                        <div>Is Draggable: {
                            (!gameState || gameState.status !== 'active') ? "NO (Not Active)" :
                                (!user) ? "NO (No User)" :
                                    (game.turn() === 'w' && user.id !== gameState.white_player_id) ? "NO (Not White's Turn)" :
                                        (game.turn() === 'b' && user.id !== gameState.black_player_id) ? "NO (Not Black's Turn)" :
                                            "YES (Check Color)"
                        }</div>
                        <button onClick={() => window.location.reload()} style={{ marginTop: '0.5rem', border: '1px solid black', padding: '2px 5px', cursor: 'pointer' }}>FORCE RELOAD</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Game;
