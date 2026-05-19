/**
 * Author: Nkotolane Pitso (Software Developer Intern)
 * File: AuthContext.tsx
 * Description: Authentication context provider for React
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, LoginCredentials, RegisterCredentials } from '../types';
import api from '../services/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string, confirmPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('auth_token'),
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Setup axios interceptors
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
        (config) => {
          if (import.meta.env.DEV) {
            console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
          }

          if (state.token) {
            config.headers.Authorization = `Bearer ${state.token}`;
          }
          return config;
        },
        (error) => {
          console.error('Request Error:', error);
          return Promise.reject(error);
        }
    );

    const responseInterceptor = api.interceptors.response.use(
        (response) => {
          if (import.meta.env.DEV) {
            console.log(`📥 API Response: ${response.status} from ${response.config.url}`);
          }
          return response;
        },
        async (error) => {
          console.error('API Error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
          });

          if (error.response?.status === 401) {
            console.log('Token expired, logging out...');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            setState({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Session expired. Please login again.',
            });
          }

          return Promise.reject(error);
        }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [state.token]);

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        console.log('Loading user profile from /auth/me...');
        const response = await api.get('/auth/me');
        console.log('User loaded:', response.data);

        setState({
          user: response.data,
          token: token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } catch (error: any) {
        console.error('Failed to load user:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Login attempt for:', credentials.email);

      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      const response = await api.post('/auth/login', {
        email: credentials.email.trim(),
        password: credentials.password,
      });

      console.log('Login response:', response.data);

      const { success, token, userId, email, firstName, lastName, companyName, message } = response.data;

      if (!success) {
        throw new Error(message || 'Login failed');
      }

      if (!token) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('auth_token', token);

      const userData = {
        id: userId,
        email: email,
        firstName: firstName || '',
        lastName: lastName || '',
        companyName: companyName || '',
      };

      localStorage.setItem('user', JSON.stringify(userData));

      setState({
        user: userData,
        token: token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      console.log('Login successful!');

    } catch (error: any) {
      console.error('Login error:', error);

      let errorMessage = 'Login failed';

      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please ensure backend is running on port 5000.';
      } else if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        if (error.response.status === 401) {
          errorMessage = 'Invalid email or password';
        } else if (error.response.status === 404) {
          errorMessage = 'Login service not found. Check backend routes.';
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Is the backend running?';
      } else {
        errorMessage = error.message || 'Login failed';
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Registration attempt for:', credentials.email);

      // Only validate password length - match validation done in Register component
      if (!credentials.password || credentials.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      const response = await api.post('/auth/register', {
        email: credentials.email.trim(),
        password: credentials.password,
        firstName: credentials.firstName?.trim() || '',
        lastName: credentials.lastName?.trim() || '',
        companyName: credentials.companyName?.trim() || ''
      });

      console.log('Register response:', response.data);

      const { success, userId, message } = response.data;

      if (!success) {
        throw new Error(message || 'Registration failed');
      }

      // Auto-login after registration
      console.log('Auto-login after registration...');
      const loginResponse = await api.post('/auth/login', {
        email: credentials.email.trim(),
        password: credentials.password,
      });

      const { token, email, firstName, lastName, companyName } = loginResponse.data;

      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify({
        id: userId,
        email: email,
        firstName: firstName || '',
        lastName: lastName || '',
        companyName: companyName || '',
      }));

      setState({
        user: {
          id: userId,
          email: email,
          firstName: firstName || '',
          lastName: lastName || '',
          companyName: companyName || '',
        },
        token: token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      console.log('Registration and auto-login successful!');

    } catch (error: any) {
      console.error('Registration error:', error);

      let errorMessage = 'Registration failed';

      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Cannot connect to server. Please ensure backend is running on port 5000.';
      } else if (error.response) {
        errorMessage = error.response.data?.message || 'Registration failed';
        if (error.response.status === 400) {
          errorMessage = error.response.data?.message || 'Invalid registration data';
        } else if (error.response.status === 409) {
          errorMessage = 'Email already registered. Please login instead.';
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please try again.';
      } else {
        errorMessage = error.message || 'Registration failed';
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('Logging out...');
      if (state.token) {
        await api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${state.token}` }
        }).catch(err => {
          console.warn('Logout API call failed:', err);
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      console.log('Logout complete');
    }
  };

  const requestPasswordReset = async (email: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      console.log('Password reset requested for:', email);
      await api.post('/auth/forgot-password', { email: email.trim() });
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      console.error('Password reset request error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Password reset request failed',
      }));
      throw error;
    }
  };

  const resetPassword = async (token: string, newPassword: string, confirmPassword: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      console.log('Resetting password with token');

      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      await api.post('/auth/reset-password', {
        token,
        newPassword,
        confirmPassword
      });

      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      console.error('Password reset error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Password reset failed',
      }));
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      console.log('Changing password');

      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match');
      }

      await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });

      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      console.error('Password change error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Password change failed',
      }));
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      console.log('Updating profile:', data);
      const response = await api.put('/auth/profile', data);
      setState(prev => ({
        ...prev,
        user: { ...prev.user, ...response.data },
        isLoading: false,
        error: null,
      }));
    } catch (error: any) {
      console.error('Profile update error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Profile update failed',
      }));
      throw error;
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return (
      <AuthContext.Provider
          value={{
            user: state.user,
            token: state.token,
            isAuthenticated: state.isAuthenticated,
            isLoading: state.isLoading,
            error: state.error,
            login,
            register,
            logout,
            requestPasswordReset,
            resetPassword,
            changePassword,
            updateProfile,
            clearError,
          }}
      >
        {children}
      </AuthContext.Provider>
  );
};