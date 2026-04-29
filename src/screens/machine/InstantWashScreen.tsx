import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const InstantWashScreen = () => {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.container}>
        <Surface style={styles.panel} elevation={1}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="car-wash" size={40} color="#7C3AED" />
          </View>
          <Text style={styles.title}>Instant Wash</Text>
          <Text style={styles.subtitle}>
            Walk-in wash booking for machine operators will be added here.
          </Text>
          <Button
            mode="contained"
            disabled
            buttonColor="#7C3AED"
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Coming Soon
          </Button>
        </Surface>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  panel: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8FF',
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    borderRadius: 12,
    marginTop: 22,
  },
  buttonContent: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
