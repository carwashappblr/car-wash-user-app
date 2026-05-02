import React from 'react';
import { View, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { UserStackParamList, UserTabsParamList } from './types';
import { HomeScreen } from '../screens/user/HomeScreen';
import { MyCarsScreen } from '../screens/user/MyCarsScreen';
import { AddCarScreen } from '../screens/user/AddCarScreen';
import { EditCarScreen } from '../screens/user/EditCarScreen';
import { BookWashScreen } from '../screens/user/BookWashScreen';
import { MyTasksScreen } from '../screens/user/MyTasksScreen';
import { ProfileScreen } from '../screens/user/ProfileScreen';
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator<UserTabsParamList>();
const Stack = createNativeStackNavigator<UserStackParamList>();

const UserTabs = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'BookWash') {
            return (
              <View
                style={{
                  backgroundColor: colors.primary,
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                  marginBottom: 16,
                }}
              >
                <MaterialCommunityIcons name="credit-card-outline" size={22} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800', marginTop: 2, letterSpacing: 0.5 }}>PLAN</Text>
              </View>
            );
          }

          const icons: Record<keyof UserTabsParamList, keyof typeof MaterialCommunityIcons.glyphMap> = {
            Home: 'view-grid-outline',
            MyCars: 'car',
            BookWash: 'credit-card-outline',
            MyTasks: 'history',
            Profile: 'cog-outline',
          };
          return (
            <MaterialCommunityIcons
              name={icons[route.name as keyof UserTabsParamList]}
              size={24}
              color={focused ? colors.primary : '#9ca3af'}
            />
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#9ca3af',
        tabBarShowLabel: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: insets.bottom > 0 ? insets.bottom : 20,
          left: 16,
          right: 16,
          backgroundColor: '#ffffff',
          borderRadius: 24,
          borderWidth: 0,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 10,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.5,
          marginTop: -4,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="MyCars" component={MyCarsScreen} options={{ title: 'Cars' }} />
      <Tab.Screen 
        name="BookWash" 
        component={BookWashScreen} 
        options={{ 
          title: 'Plan',
          tabBarLabel: () => null, // We render the label inside the custom circular icon
        }} 
      />
      <Tab.Screen name="MyTasks" component={MyTasksScreen} options={{ title: 'Records' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Menu' }} />
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
          title: 'Add New Vehicle',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
        }}
      />
      <Stack.Screen
        name="EditCar"
        component={EditCarScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Edit Vehicle',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
        }}
      />
    </Stack.Navigator>
  );
};
