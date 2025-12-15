import React, { useState, useEffect } from 'react';
import { gameAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import RetroCard from '../components/common/RetroCard';
import RetroButton from '../components/common/RetroButton';

const Dashboard = () => {
    const [games, setGames] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetchGames();
    }, []);

    const fetchGames = async () => {
        try {
            const { data } = await gameAPI.getGames();
            setGames(data);
        } catch (error) {
            console.error("Failed to fetch games", error);
        }
    };

    const createGame = async () => {
        try {
            const { data } = await gameAPI.createGame();
            toast.success('Game session initialized');
            navigate(`/game/${data.id}`);
        } catch (error) {
            toast.error('Failed to create game');
        }
    };

    const joinGame = async (gameId) => {
        try {
            await gameAPI.joinGame(gameId);
            toast.success('Joined game session');
            navigate(`/game/${gameId}`);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to join game');
        }
    };

    return (
        <div className="container" style={{ paddingBottom: '2rem' }}>
            <RetroCard
                title={
                    <div className="flex justify-between items-center w-full">
                        <span>GAMES_DIRECTORY.SYS</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <div style={{ width: '12px', height: '12px', border: '2px solid black', background: 'white' }}></div>
                        </div>
                    </div>
                }
            >

                <div className="flex justify-between items-center" style={{ marginBottom: '1rem', borderBottom: '2px solid black', paddingBottom: '1rem' }}>
                    <div style={{ fontWeight: 'bold' }}>{games.length} ACTIVE PROCESS(ES)</div>
                    <RetroButton onClick={createGame}>
                        + NEW_GAME.EXE
                    </RetroButton>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {games.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', border: '2px dashed #ccc' }}>
                            NO ACTIVE GAMES FOUND.
                        </div>
                    ) : (
                        games.map((game) => (
                            <div key={game.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                border: '2px solid black',
                                padding: '1rem',
                                background: game.status === 'waiting' ? '#fff' : '#f0f0f0'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>GAME_ID: {game.id}</div>
                                    <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                        WHITE: {game.white_player_id} | BLACK: {game.black_player_id || 'Waiting...'}
                                    </div>
                                    <div style={{
                                        marginTop: '0.5rem',
                                        fontWeight: 'bold',
                                        color: game.status === 'waiting' ? '#555' : '#000'
                                    }}>
                                        STATUS: {game.status.toUpperCase()}
                                    </div>
                                </div>

                                <div>
                                    {game.status === 'waiting' ? (
                                        <RetroButton onClick={() => joinGame(game.id)}>
                                            JOIN
                                        </RetroButton>
                                    ) : (
                                        <Link to={`/game/${game.id}`}>
                                            <RetroButton>VIEW</RetroButton>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </RetroCard>
        </div>
    );
};

export default Dashboard;
