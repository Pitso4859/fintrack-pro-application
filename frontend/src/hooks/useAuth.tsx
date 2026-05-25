import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api, { tokenStorage } from '@/services/api';

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  role: 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';
  defaultCurrency: string;
}

interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName?: string;
  taxNumber?: string;
  vatNumber?: string;
}

// ----------------------------------------------------------------
// Context
// ----------------------------------------------------------------
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Hydrate from stored token on mount
  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }
    api.get<UserInfo>('/auth/me')
      .then(({ data }) => {
        setState({ user: data, isAuthenticated: true, isLoading: false });
      })
      .catch(() => {
        tokenStorage.clear();
        setState({ user: null, isAuthenticated: false, isLoading: false });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    setState({ user: data.user, isAuthenticated: true, isLoading: false });
  }, []);

  const register = useCallback(async (registerData: RegisterData) => {
    const { data } = await api.post('/auth/register', registerData);
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    setState({ user: data.user, isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefresh();
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } finally {
      tokenStorage.clear();
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, register, logout }),
    [state, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
