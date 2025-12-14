import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
    const { user, loading } = useAuth();

    if (loading) return <div className="p-4 text-center retro-card">INITIALIZING_SECURITY_PROTOCOL...</div>;

    return user ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
