import { MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { colors } from './colors';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surfaceContainer,
    onPrimary: colors.onPrimary,
    onSecondary: colors.onSecondary,
    onBackground: colors.onBackground,
    onSurface: colors.onSurface,
    error: colors.error, 
    success: colors.secondary, // Mapping success to the secondary green
  },
  roundness: 24, // Matches the new 24px border radius
  animation: {
    scale: 1.0,
  },
};
