import api from './api';

export interface LoginData {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    companyName: string;
}

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    companyName: string;
}

export const authService = {
    async login(data: LoginData) {
        console.log('Login attempt to:', '/auth/login');
        console.log('Email:', data.email);

        const response = await api.post('/auth/login', {
            email: data.email,
            password: data.password
        });

        console.log(' Login response:', response.data);

        if (response.data.success) {
            localStorage.setItem('auth_token', response.data.token);
            localStorage.setItem('user', JSON.stringify({
                id: response.data.userId,
                email: response.data.email,
                firstName: response.data.firstName || '',
                lastName: response.data.lastName || '',
                companyName: response.data.companyName || '',
            }));
        }
        return response.data;
    },

    async register(data: RegisterData) {
        console.log('Register attempt to:', '/auth/register');
        console.log('Email:', data.email);

        const response = await api.post('/auth/register', {
            email: data.email,
            password: data.password,
            firstName: data.firstName,
            lastName: data.lastName,
            companyName: data.companyName
        });

        console.log(' Register response:', response.data);
        return response.data;
    },

    async logout() {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                await api.post('/auth/logout', {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (error) {
                console.warn('Logout API call failed:', error);
            }
        }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    },

    async getCurrentUser() {
        const token = localStorage.getItem('auth_token');
        if (!token) return null;

        try {
            const response = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to get current user:', error);
            return null;
        }
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('auth_token');
    },

    getToken(): string | null {
        return localStorage.getItem('auth_token');
    }
};