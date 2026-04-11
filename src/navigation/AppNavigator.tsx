import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';

import { useAuth, isMachineRole } from '../store/AuthContext';
import { AuthStack } from './AuthStack';
import { UserStack } from './UserStack';
import { MachineStack } from './MachineStack';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const { token, role, isLoading } = useAuth();
  const theme = useTheme();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!token ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : isMachineRole(role) ? (
          <Stack.Screen name="MachineApp" component={MachineStack} />
        ) : (
          <Stack.Screen name="UserApp" component={UserStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
