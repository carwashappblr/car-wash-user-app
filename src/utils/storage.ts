import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'carwash_access_token';
const REFRESH_TOKEN_KEY = 'carwash_refresh_token';

export const storage = {
  getTokens: async () => {
    try {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      return { accessToken, refreshToken };
    } catch (e) {
      return { accessToken: null, refreshToken: null };
    }
  },
  setTokens: async (accessToken: string, refreshToken: string) => {
    try {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } catch (e) {
      console.error('Failed to set tokens', e);
    }
  },
  removeTokens: async () => {
    try {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (e) {
      console.error('Failed to clear tokens', e);
    }
  },
};
