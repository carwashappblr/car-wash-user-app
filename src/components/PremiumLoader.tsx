import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text, Easing } from 'react-native';
import { colors } from '../theme/colors';

interface PremiumLoaderProps {
  message?: string;
}

const PulsingDot: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            friction: 3,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 0.6,
            friction: 3,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.4,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color, transform: [{ scale }], opacity },
      ]}
    />
  );
};

const SpinningRing: React.FC = () => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]} />
  );
};

export const PremiumLoader: React.FC<PremiumLoaderProps> = ({
  message = 'Loading...',
}) => {
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      {/* Spinning ring + center icon */}
      <View style={styles.loaderWrap}>
        <SpinningRing />
        <View style={styles.innerCircle}>
          <View style={styles.waterDrop} />
        </View>
      </View>

      {/* Pulsing dots */}
      <View style={styles.dotsRow}>
        <PulsingDot delay={0} color={colors.primary} />
        <PulsingDot delay={150} color={colors.onPrimaryContainer} />
        <PulsingDot delay={300} color={colors.primary} />
      </View>

      {/* Message */}
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    gap: 20,
  },
  loaderWrap: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: colors.primary,
    borderRightColor: colors.onPrimaryContainer,
  },
  innerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterDrop: {
    width: 16,
    height: 20,
    borderRadius: 10,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 8,
    backgroundColor: colors.primary,
    transform: [{ rotate: '180deg' }],
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  message: {
    fontSize: 13,
    color: colors.outline,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
