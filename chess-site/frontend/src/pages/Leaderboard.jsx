import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import RetroCard from '../components/common/RetroCard';

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRatings = async () => {
            try {
                const { data } = await userAPI.getRatings();
                setUsers(data);
            } catch (error) {
                console.error("Failed to fetch ratings", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRatings();
    }, []);

    return (
        <div className="container" style={{ paddingBottom: '2rem' }}>
            <RetroCard
                title={
                    <div className="flex justify-between items-center w-full">
                        <span>LEADERBOARD.NET</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <div style={{ width: '12px', height: '12px', border: '2px solid black', background: 'white' }}></div>
                        </div>
                    </div>
                }
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>LOADING DATA...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid black' }}>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>#</th>
                                <th style={{ padding: '0.5rem', textAlign: 'left' }}>NICKNAME</th>
                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>RATING</th>
                                <th style={{ padding: '0.5rem', textAlign: 'right' }}>GAMES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr key={user.id} style={{ borderBottom: '1px dashed #ccc' }}>
                                    <td style={{ padding: '0.5rem' }}>{index + 1}</td>
                                    <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{user.username}</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{user.rating}</td>
                                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>{user.games_played}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </RetroCard>
        </div>
    );
};

export default Leaderboard;
