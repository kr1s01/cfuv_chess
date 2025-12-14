import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const { register } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await register(formData.username, formData.email, formData.password);
            toast.success('Registration successful. Please login.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center" style={{ minHeight: '80vh' }}>
            <div className="retro-card" style={{ width: '100%', maxWidth: '400px' }}>
                <div className="retro-title-bar">
                    <span>Register.kchess</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <div style={{ width: '12px', height: '12px', border: '2px solid black', background: 'white' }}></div>
                    </div>
                </div>

                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', fontFamily: 'inherit' }}>NEW USER</h2>
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
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>EMAIL</label>
                        <input
                            type="email"
                            className="retro-input"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                        {isLoading ? 'PROCESSING...' : 'CREATE ACCOUNT'}
                    </button>
                </form>
                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    EXISTING USER? <Link to="/login">LOGIN.EXE</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
