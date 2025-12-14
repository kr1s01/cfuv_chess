import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // Check expiry
                    const decoded = jwtDecode(token);
                    if (decoded.exp * 1000 < Date.now()) {
                        logout();
                    } else {
                        const { data } = await authAPI.me();
                        setUser(data);
                    }
                } catch (error) {
                    console.error("Auth init failed", error);
                    logout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (username, password) => {
        const { data } = await authAPI.login({ username, password });
        localStorage.setItem('token', data.access_token);
        const userResp = await authAPI.me();
        setUser(userResp.data);
        return data;
    };

    const register = async (username, email, password) => {
        await authAPI.register({ username, email, password });
        // Auto login after register? Or just return success
        // return login(username, password); 
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
