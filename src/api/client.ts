import axios from 'axios';
import { storage } from '../utils/storage';

// Temporarily hardcoding to bypass cache issues
const API_URL = 'http://192.168.0.116:3000';
console.log('[API Client] FORCED Base URL:', API_URL);

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Callback to trigger logout from AuthContext if refresh fails
let logoutCallback: () => void = () => {};
export const setLogoutCallback = (cb: () => void) => {
  logoutCallback = cb;
};

// Request interceptor: add bearer token
apiClient.interceptors.request.use(
  async (config) => {
    const { accessToken } = await storage.getTokens();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and refresh
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Success] ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log the error detail for debugging
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, 
      error.response ? { 
        status: error.response.status, 
        data: error.response.data 
      } : error.message
    );

    // If it's a 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = await storage.getTokens();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Attempt refresh
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        // Save new tokens
        await storage.setTokens(newAccessToken, newRefreshToken);

        // Update the failed request header and retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log the user out
        logoutCallback();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
