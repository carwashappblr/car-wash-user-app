import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { storage } from '../utils/storage';
import { apiClient, setLogoutCallback } from '../api/client';

export type User = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  // add roles, etc if needed later
};

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
    let userToken;
    try {
      const { accessToken } = await storage.getTokens();
      userToken = accessToken;

      if (userToken) {
        // fetch user profile from /users/me (root level)
        const res = await apiClient.get('/users/me');
        setState({ user: res.data, isLoading: false, token: userToken });
        return;
      }
    } catch (e) {
      // Token invalid or network error
      console.log('Bootstrap failed', e);
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
      const { accessToken, refreshToken, user } = res.data;
      await storage.setTokens(accessToken, refreshToken);

      if (!user) {
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
