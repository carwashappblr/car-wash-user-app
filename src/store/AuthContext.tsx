import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { storage } from '../utils/storage';
import { apiClient, setLogoutCallback } from '../api/client';

// Backend emits 'WORKER' for machine role (Role.WORKER in Prisma enum)
// We keep 'WORKER' as the canonical role string to match the JWT
export type UserRole = 'USER' | 'ADMIN' | 'WORKER';

export const isMachineRole = (role?: UserRole | null) => role === 'WORKER';
export const isUserRole = (role?: UserRole | null) => role === 'USER' || role === 'ADMIN';

export type AuthEntityType = 'user' | 'machine';

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: UserRole;
  type: AuthEntityType;
};

interface DecodedToken {
  sub: string;
  email: string;
  role: UserRole;
  type: AuthEntityType;
  exp: number;
}

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  token: string | null;
  role: UserRole | null;
};

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  machineLogin: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: AuthUser) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    token: null,
    role: null,
  });

  useEffect(() => {
    setLogoutCallback(logout);
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const { accessToken } = await storage.getTokens();

      if (accessToken) {
        const decoded = jwtDecode<DecodedToken>(accessToken);
        const currentTime = Date.now() / 1000;

        // Token expired — attempt a request to trigger the interceptor refresh
        if (decoded.exp < currentTime) {
          console.log('[Auth] Token expired on boot — will refresh via interceptor');
        }

        const role = decoded.role;
        const type = decoded.type;

        if (type === 'machine') {
          // Machines don't have a /users/me profile endpoint
          const machineUser: AuthUser = {
            id: decoded.sub,
            email: decoded.email,
            name: `Machine (${decoded.email})`,
            role,
            type: 'machine',
          };
          setState({ user: machineUser, isLoading: false, token: accessToken, role });
          return;
        }

        // Fetch full user profile
        const res = await apiClient.get('/users/me');
        const profileUser: AuthUser = {
          ...res.data,
          role,
          type: 'user',
        };
        setState({ user: profileUser, isLoading: false, token: accessToken, role });
        return;
      }
    } catch (e) {
      console.log('[Auth] Bootstrap failed or no token', e);
      await storage.removeTokens();
    }
    setState({ user: null, isLoading: false, token: null, role: null });
  };

  const login = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { accessToken, refreshToken } = res.data;
      await storage.setTokens(accessToken, refreshToken);

      const decoded = jwtDecode<DecodedToken>(accessToken);
      const profileRes = await apiClient.get('/users/me');

      const user: AuthUser = {
        ...profileRes.data,
        role: decoded.role,
        type: 'user',
      };

      setState({ user, token: accessToken, isLoading: false, role: decoded.role });
    } catch (e) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw e;
    }
  };

  const machineLogin = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      
      const res = await apiClient.post('/auth/machine/login', { email, password });
      const { accessToken, refreshToken } = res.data;
      await storage.setTokens(accessToken, refreshToken);

      const decoded = jwtDecode<DecodedToken>(accessToken);

      const machineUser: AuthUser = {
        id: decoded.sub,
        email: decoded.email,
        name: `Machine (${decoded.email})`,
        role: decoded.role, // 'WORKER'
        type: 'machine',
      };

      setState({
        user: machineUser,
        token: accessToken,
        isLoading: false,
        role: decoded.role,
      });
    } catch (e) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw e;
    }
  };

  const register = async (payload: any) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await apiClient.post('/auth/register', payload);
      // Register doesn't return tokens — follow up with login
      if (payload.email && payload.password) {
        await login(payload.email, payload.password);
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } catch (e) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw e;
    }
  };

  const logout = async () => {
    await storage.removeTokens();
    setState({ user: null, token: null, isLoading: false, role: null });
  };

  const setUser = (user: AuthUser) => {
    setState((prev) => ({ ...prev, user }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, machineLogin, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
