import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { useAuth } from '../../store/AuthContext';

export const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium">Profile</Text>
      <Text variant="bodyLarge" style={{ marginVertical: 10 }}>Email: {user?.email}</Text>
      <Text variant="bodyLarge" style={{ marginVertical: 10 }}>Name: {user?.name}</Text>
      
      <Button mode="outlined" onPress={logout} style={{ marginTop: 20 }}>
        Logout
      </Button>
    </View>
  );
};
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' } });
