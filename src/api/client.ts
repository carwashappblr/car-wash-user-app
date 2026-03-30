import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { storage } from '../utils/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
console.log('[API Client] Initialized with Base URL:', API_URL);

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Callback to trigger logout from AuthContext
let logoutCallback: () => void = () => {};
export const setLogoutCallback = (cb: () => void) => {
  logoutCallback = cb;
};

interface DecodedToken {
  exp: number;
}

// Request interceptor: The "Badge" (Automatic Transmission)
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const { accessToken, refreshToken } = await storage.getTokens();
      
      if (accessToken) {
        const decoded = jwtDecode<DecodedToken>(accessToken);
        const currentTime = Date.now() / 1000;
        
        // BUFFER: If token expires in less than 30 seconds, refresh now
        if (decoded.exp < currentTime + 30 && refreshToken) {
          console.log('[API Client] Token expiring soon, refreshing proactively...');
          try {
            const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
            await storage.setTokens(data.accessToken, data.refreshToken);
            config.headers.Authorization = `Bearer ${data.accessToken}`;
            return config;
          } catch (e) {
            console.error('[API Client] Proactive refresh failed', e);
            // Don't throw, let the request proceed and fail, or let 401 handler take it
          }
        }

        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (e) {
      console.error('[API Client] Request Interceptor Error', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Session Expiry (Automatic Logout)
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Success] ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = await storage.getTokens();
        if (!refreshToken) throw new Error('No refresh token');

        console.log('[API Client] Retrying refresh (401 safety net)...');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        await storage.setTokens(data.accessToken, data.refreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('[API Client] Session expired. Clearing storage and redirecting...');
        await storage.removeTokens();
        logoutCallback();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
