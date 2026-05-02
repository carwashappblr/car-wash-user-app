import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onComplete: () => void;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({ onComplete }) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-width)).current;
  const bgOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start shimmer loop
    const shimmerLoop = Animated.loop(
      Animated.timing(shimmerX, {
        toValue: width * 2,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    shimmerLoop.start();

    // Main sequence
    Animated.sequence([
      // 1. Logo pops in with spring
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // 2. Brand name fades up
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(brandTranslateY, {
          toValue: 0,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
      // 3. Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        delay: 100,
        useNativeDriver: true,
      }),
      // 4. Hold for 1.2 seconds
      Animated.delay(1200),
      // 5. Fade out everything
      Animated.timing(bgOpacity, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      shimmerLoop.stop();
      onComplete();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: bgOpacity }]}>
      {/* Background gradient effect using layered views */}
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      {/* Decorative circles */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoWrap,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          {/* Shimmer overlay */}
          <Animated.View
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerX }] },
            ]}
          />
        </View>
      </Animated.View>

      {/* Brand Name */}
      <Animated.Text
        style={[
          styles.brandName,
          {
            opacity: brandOpacity,
            transform: [{ translateY: brandTranslateY }],
          },
        ]}
      >
        Clean Cart
      </Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Premium Car Wash, Simplified.
      </Animated.Text>

      {/* Loading dots */}
      <Animated.View style={[styles.dotsRow, { opacity: taglineOpacity }]}>
        <LoadingDot delay={0} />
        <LoadingDot delay={200} />
        <LoadingDot delay={400} />
      </Animated.View>
    </Animated.View>
  );
};

// Animated loading dot component
const LoadingDot: React.FC<{ delay: number }> = ({ delay }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return <Animated.View style={[styles.dot, { opacity }]} />;
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a1628',
    zIndex: 999,
  },
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#0d1f4a',
  },
  bgBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#07101e',
  },
  circleTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(30, 58, 138, 0.25)',
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -100,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(30, 58, 138, 0.15)',
  },
  logoWrap: {
    marginBottom: 32,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  logo: {
    width: 90,
    height: 90,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    transform: [{ skewX: '-20deg' }],
  },
  brandName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5,
    fontWeight: '500',
    marginBottom: 48,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    position: 'absolute',
    bottom: 80,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
});
