import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';
import { apiClient } from '../api/client';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowInForeground: true,
  }),
});

/**
 * Request notification permissions and get the FCM/APNs device push token.
 * Returns the token string or null if unavailable.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('[Notifications] Must use physical device for push notifications');
    return null;
  }

  // Remote notifications in Expo Go on Android were removed in SDK 53
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  if (isExpoGo && Platform.OS === 'android') {
    console.log('[Notifications] Skipping push token registration: Expo Go on Android does not support remote push notifications in SDK 53+');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return null;
  }

  try {
    // Get the Expo push token (routed via Expo's push service to FCM/APNs)
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });
    console.log('[Notifications] Expo push token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('[Notifications] Failed to get push token:', error);
    return null;
  }
}

/**
 * Register the device token with the backend.
 */
export async function registerDeviceOnBackend(token: string): Promise<void> {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';

  try {
    await apiClient.post('/notifications/register-device', { token, platform });
    console.log('[Notifications] Device token registered on backend');
  } catch (error) {
    console.error('[Notifications] Failed to register device on backend:', error);
  }
}

/**
 * Remove device token from backend (call on logout).
 */
export async function removeDeviceFromBackend(token: string): Promise<void> {
  try {
    await apiClient.delete(`/notifications/device/${encodeURIComponent(token)}`);
    console.log('[Notifications] Device token removed from backend');
  } catch (error) {
    console.error('[Notifications] Failed to remove device from backend:', error);
  }
}

/**
 * Set up Android notification channel (required for Android 8+).
 */
export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    const isExpoGo = Constants.executionEnvironment === 'storeClient';
    if (isExpoGo) {
      console.log('[Notifications] Skipping notification channel setup on Android in Expo Go');
      return;
    }

    try {
      await Notifications.setNotificationChannelAsync('task-updates', {
        name: 'Task Updates',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
        lightColor: '#4A90D9',
      });
      console.log('[Notifications] Android notification channel created');
    } catch (error) {
      console.warn('[Notifications] Failed to create notification channel:', error);
    }
  }
}

/**
 * Add listener for when a notification is received while the app is open.
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add listener for when the user taps a notification.
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
