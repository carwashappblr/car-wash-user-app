import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import { storage } from '../utils/storage';
import { apiClient, setLogoutCallback } from '../api/client';

export type UserRole = 'USER' | 'ADMIN' | 'WORKER';

export type User = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role?: UserRole;
};

interface DecodedToken {
  id: string;
  email: string;
  role: UserRole;
  exp: number;
}

type AuthState = {
  user: User | null;
  isLoading: boolean;
  token: string | null; // Keep token in state to drive navigation logic
};

type AuthContextType = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: User) => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    token: null,
  });

  useEffect(() => {
    // Setup logout callback for the 401 interceptor
    setLogoutCallback(logout);
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const { accessToken } = await storage.getTokens();

      if (accessToken) {
        const decoded = jwtDecode<DecodedToken>(accessToken);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          console.log('[Auth] Token expired, attempting silent bootstrap refresh...');
          // The apiClient interceptor will handle the actual refresh logic
          // if we make a request now, or we can just let it fail naturally.
          // Better: try to fetch profile, which triggers the interceptor refresh.
        }

        // fetch user profile from /users/me to sync full user info
        const res = await apiClient.get('/users/me');
        setState({ 
          user: res.data, 
          isLoading: false, 
          token: accessToken 
        });
        return;
      }
    } catch (e) {
      console.log('[Auth] Bootstrap failed or no token', e);
      // If profile fetch fails (even after refresh attempt), we clear
      await storage.removeTokens();
    }
    setState({ user: null, isLoading: false, token: null });
  };

  const login = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      console.log("Reached /auth/login");
      const res = await apiClient.post('/auth/login', { email, password });
      const { accessToken, refreshToken, user } = res.data;
      await storage.setTokens(accessToken, refreshToken);

      if (!user) {
        // Fetch user info from root level if not returned by login
        const profileRes = await apiClient.get('/users/me');
        setState({ user: profileRes.data, token: accessToken, isLoading: false });
      } else {
        setState({ user, token: accessToken, isLoading: false });
      }
    } catch (e) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw e;
    }
  };

  const register = async (payload: any) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const res = await apiClient.post('/auth/register', payload);

      // Check if backend returned tokens automatically after registration
      if (res.data && res.data.accessToken) {
        const { accessToken, refreshToken, user } = res.data;
        await storage.setTokens(accessToken, refreshToken);

        if (!user) {
          const profileRes = await apiClient.get('/users/me');
          setState({ user: profileRes.data, token: accessToken, isLoading: false });
        } else {
          setState({ user, token: accessToken, isLoading: false });
        }
      } else {
        // Otherwise, login explicitly using the payload details
        // Assuming payload has email and password
        if (payload.email && payload.password) {
          await login(payload.email, payload.password);
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      }
    } catch (e) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw e;
    }
  };


  const logout = async () => {
    await storage.removeTokens();
    setState({ user: null, token: null, isLoading: false });
  };

  const setUser = (user: User) => {
    setState((prev) => ({ ...prev, user }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, setUser }}>
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
