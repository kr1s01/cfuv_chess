import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(formData.username, formData.password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center" style={{ minHeight: '80vh' }}>
            <div className="retro-card" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="retro-title-bar">
                    <span>Login.kchess</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <div style={{ width: '12px', height: '12px', border: '2px solid black', background: 'white' }}></div>
                    </div>
                </div>

                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontFamily: 'inherit' }}>
                    AUTHENTICATION
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>USERNAME</label>
                        <input
                            type="text"
                            className="retro-input"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>PASSWORD</label>
                        <input
                            type="password"
                            className="retro-input"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>
                    <button type="submit" className="retro-btn primary" disabled={isLoading} style={{ marginTop: '1rem' }}>
                        {isLoading ? 'LOADING...' : 'ENTER SYSTEM'}
                    </button>
                </form>
                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    NO ACCESS? <Link to="/register">REGISTER_USER.EXE</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
