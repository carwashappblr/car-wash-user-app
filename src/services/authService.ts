import { apiClient } from '../api/client';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export const authService = {
  loginUser: (email: string, password: string): Promise<{ data: LoginResponse }> =>
    apiClient.post('/auth/login', { email, password }),

  loginMachine: (email: string, password: string): Promise<{ data: LoginResponse }> =>
    apiClient.post('/auth/machine/login', { email, password }),

  registerUser: (payload: RegisterPayload): Promise<{ data: LoginResponse }> =>
    apiClient.post('/auth/register', payload),

  getProfile: (): Promise<{ data: any }> =>
    apiClient.get('/users/me'),
};
