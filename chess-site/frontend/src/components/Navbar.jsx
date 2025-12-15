import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav style={{
            borderBottom: '2px solid black',
            padding: '1rem 0',
            marginBottom: '2rem',
            background: '#fff'
        }}>
            <div className="container flex justify-between items-center">
                <Link to="/" style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    textDecoration: 'none'
                }}>
                    <span style={{ fontSize: '1.8rem' }}>♟</span> EjudgeChess
                </Link>
                <div className="flex gap-4 items-center">
                    {user ? (
                        <>
                            <span style={{ fontWeight: 'bold' }}>Hello, {user.username} ({user.rating})</span>
                            <a href="/dashboard" className="retro-btn">Dashboard</a>
                            <button onClick={handleLogout} className="retro-btn">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="retro-btn">Login</Link>
                            <Link to="/register" className="retro-btn">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
