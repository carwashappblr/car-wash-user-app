import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabsParamList } from './types';
import { HomeScreen } from '../screens/main/HomeScreen';
import { MyCarsScreen } from '../screens/cars/MyCarsScreen';
import { BookWashScreen } from '../screens/tasks/BookWashScreen';
import { MyTasksScreen } from '../screens/tasks/MyTasksScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export const MainTabs = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap = 'help-circle-outline';

          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'MyCars') iconName = 'car';
          else if (route.name === 'BookWash') iconName = 'water';
          else if (route.name === 'MyTasks') iconName = 'format-list-bulleted';
          else if (route.name === 'Profile') iconName = 'account';

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurface,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="MyCars" component={MyCarsScreen} options={{ title: 'My Cars' }} />
      <Tab.Screen name="BookWash" component={BookWashScreen} options={{ title: 'Book Wash' }} />
      <Tab.Screen name="MyTasks" component={MyTasksScreen} options={{ title: 'My Washes' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
};
