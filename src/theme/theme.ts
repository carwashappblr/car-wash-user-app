import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1E40AF', // Deep blue for premium feel
    secondary: '#0EA5E9', // Sky blue accent
    background: '#F8FAFC', // Slate soft grey background
    surface: '#FFFFFF', // Cards and modals
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#0F172A', // Slate 900
    onSurface: '#334155', // Slate 700
    error: '#EF4444', 
    success: '#10B981',
  },
  roundness: 16, // Modern rounded corners
  animation: {
    scale: 1.0,
  },
};
