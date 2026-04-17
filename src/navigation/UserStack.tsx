import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

import { UserStackParamList, UserTabsParamList } from './types';
import { HomeScreen } from '../screens/user/HomeScreen';
import { MyCarsScreen } from '../screens/user/MyCarsScreen';
import { AddCarScreen } from '../screens/user/AddCarScreen';
import { EditCarScreen } from '../screens/user/EditCarScreen';
import { BookWashScreen } from '../screens/user/BookWashScreen';
import { MyTasksScreen } from '../screens/user/MyTasksScreen';
import { ProfileScreen } from '../screens/user/ProfileScreen';

const Tab = createBottomTabNavigator<UserTabsParamList>();
const Stack = createNativeStackNavigator<UserStackParamList>();

const UserTabs = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<keyof UserTabsParamList, keyof typeof MaterialCommunityIcons.glyphMap> = {
            Home: 'home-variant',
            MyCars: 'car',
            BookWash: 'water-plus',
            MyTasks: 'clipboard-list',
            Profile: 'account-circle',
          };
          return (
            <MaterialCommunityIcons
              name={icons[route.name as keyof UserTabsParamList]}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="MyCars" component={MyCarsScreen} options={{ title: 'My Cars' }} />
      <Tab.Screen name="BookWash" component={BookWashScreen} options={{ title: 'Book Wash' }} />
      <Tab.Screen name="MyTasks" component={MyTasksScreen} options={{ title: 'My Tasks' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};

export const UserStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="UserTabs" component={UserTabs} />
      <Stack.Screen
        name="AddCar"
        component={AddCarScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Add New Car',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#1E40AF',
        }}
      />
      <Stack.Screen
        name="EditCar"
        component={EditCarScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Edit Car',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#1E40AF',
        }}
      />
    </Stack.Navigator>
  );
};
