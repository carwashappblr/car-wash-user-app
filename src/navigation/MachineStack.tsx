import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

import { MachineStackParamList, MachineTabsParamList } from './types';
import { MachineDashboardScreen } from '../screens/machine/MachineDashboardScreen';
import { MachineTasksScreen } from '../screens/machine/MachineTasksScreen';

const Tab = createBottomTabNavigator<MachineTabsParamList>();
const Stack = createNativeStackNavigator<MachineStackParamList>();

const MachineTabs = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof MachineTabsParamList, keyof typeof MaterialCommunityIcons.glyphMap> = {
            Dashboard: 'view-dashboard',
            MachineTasks: 'clipboard-check',
          };
          return (
            <MaterialCommunityIcons
              name={icons[route.name as keyof MachineTabsParamList]}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#1E1B4B',
          borderTopColor: '#312E81',
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          color: '#C4B5FD',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={MachineDashboardScreen}
        options={{ title: 'Dashboard', tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="MachineTasks"
        component={MachineTasksScreen}
        options={{ title: 'Tasks', tabBarLabel: 'Tasks' }}
      />
    </Tab.Navigator>
  );
};

export const MachineStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MachineTabs" component={MachineTabs} />
    </Stack.Navigator>
  );
};
