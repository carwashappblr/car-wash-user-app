import React, { useState, useEffect } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { theme } from './src/theme/theme';
import { AuthProvider } from './src/store/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AnimatedSplashScreen } from './src/screens/SplashScreen';
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from './src/services/notificationService';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    // Listen for notifications received while app is in foreground
    const receivedSub = addNotificationReceivedListener((notification) => {
      console.log('[App] Notification received in foreground:', notification.request.content);
    });

    // Listen for when user taps a notification
    const responseSub = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      console.log('[App] Notification tapped, data:', data);
      // Future: navigate to task details screen using data.taskId
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

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
