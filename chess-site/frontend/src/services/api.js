import axios from 'axios';

// Create axios instance with base URL
// Note: We use relative path '/api' which is proxied by Vite to the backend
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401s (optional logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // localStorage.removeItem('token');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

export const authAPI = {
    login: (credentials) => {
        const formData = new FormData();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);
        return api.post('/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
    },
    register: (data) => api.post('/register', data),
    me: () => api.get('/users/me'),
};

export const gameAPI = {
    getGames: () => api.get('/games'),
    createGame: () => api.post('/games'),
    joinGame: (gameId) => api.post(`/games/${gameId}/join`),
    getGame: (gameId) => api.get(`/games/${gameId}`),
    makeMove: (gameId, san) => api.post(`/games/${gameId}/move`, { san }),
    getHistory: (gameId) => api.get(`/games/${gameId}/history`),
};
