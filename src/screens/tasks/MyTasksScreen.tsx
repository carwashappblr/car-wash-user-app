import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

export const MyTasksScreen = () => {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={{ textAlign: 'center', marginTop: 20 }}>Tasks List coming soon...</Text>
    </View>
  );
};
const styles = StyleSheet.create({ container: { flex: 1 } });
