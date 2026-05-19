import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log(`${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        // Don't auto-redirect on 401 for login/register pages
        const isAuthPage = window.location.pathname === '/login' ||
            window.location.pathname === '/register' ||
            window.location.pathname === '/forgot-password' ||
            window.location.pathname === '/reset-password';

        if (error.response?.status === 401 && !isAuthPage) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;