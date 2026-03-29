import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, FAB, Card, useTheme } from 'react-native-paper';
import { apiClient } from '../../api/client';

export const MyCarsScreen = () => {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={{ textAlign: 'center', marginTop: 20 }}>Cars List coming soon...</Text>
    </View>
  );
};
const styles = StyleSheet.create({ container: { flex: 1 } });
