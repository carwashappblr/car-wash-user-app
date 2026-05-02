import React, { useState } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { theme } from './src/theme/theme';
import { AuthProvider } from './src/store/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AnimatedSplashScreen } from './src/screens/SplashScreen';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <AppNavigator />
          {!splashDone && (
            <AnimatedSplashScreen onComplete={() => setSplashDone(true)} />
          )}
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
