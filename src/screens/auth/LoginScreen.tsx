import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';

const { width } = Dimensions.get('window');

type LoginMode = 'user' | 'machine';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

const schema = yup
  .object({
    email: yup.string().email('Invalid email').required('Email is required'),
    password: yup.string().required('Password is required'),
  })
  .required();

export const LoginScreen = ({ navigation }: Props) => {
  const { login, machineLogin } = useAuth();
  const theme = useTheme();
  const [mode, setMode] = useState<LoginMode>('user');
  const [showPassword, setShowPassword] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    setError,
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
  });

  const switchMode = (newMode: LoginMode) => {
    if (newMode === mode) return;
    Animated.spring(slideAnim, {
      toValue: newMode === 'user' ? 0 : 1,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
    setMode(newMode);
    reset();
  };

  const onSubmit = async (data: any) => {
    try {
      console.log("Login attempt");
      
      if (mode === 'user') {
        await login(data.email, data.password);
      } else {
        await machineLogin(data.email, data.password);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('root.serverError', {
          type: 'server',
          message: 'Invalid credentials. Please try again.',
        });
      } else if (err.response?.status === 400) {
        const msgs = err.response.data?.message;
        setError('root.serverError', {
          type: 'server',
          message: Array.isArray(msgs) ? msgs.join(', ') : 'Bad request',
        });
      } else if (err.message?.includes('Network')) {
        setError('root.serverError', {
          type: 'server',
          message: 'Network error. Check your connection.',
        });
      } else {
        setError('root.serverError', {
          type: 'server',
          message: 'Something went wrong. Please try again.',
        });
      }
    }
  };

  const toggleX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, (width - 64) / 2],
  });

  const isUser = mode === 'user';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: '#F8FAFC' }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Header */}
        <View style={styles.logoSection}>
          <View style={[styles.logoCircle, { backgroundColor: isUser ? '#1E40AF' : '#4C1D95' }]}>
            <MaterialCommunityIcons
              name={isUser ? 'water-outline' : 'robot'}
              size={40}
              color="#FFFFFF"
            />
          </View>
          <Text style={styles.appName}>Clean Cart</Text>
          <Text style={styles.tagline}>
            {isUser ? 'Book your next premium wash' : 'Machine Device Portal'}
          </Text>
        </View>

        {/* Role Toggle */}
        <View style={styles.toggleWrapper}>
          <View style={styles.toggleContainer}>
            <Animated.View
              style={[
                styles.toggleSlider,
                {
                  transform: [{ translateX: toggleX }],
                  width: (width - 68) / 2,
                  backgroundColor: isUser ? '#1E40AF' : '#4C1D95',
                },
              ]}
            />
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => switchMode('user')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="account"
                size={16}
                color={isUser ? '#FFFFFF' : '#94A3B8'}
              />
              <Text style={[styles.toggleText, isUser && styles.toggleTextActive]}>
                User Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => switchMode('machine')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="robot"
                size={16}
                color={!isUser ? '#FFFFFF' : '#94A3B8'}
              />
              <Text style={[styles.toggleText, !isUser && styles.toggleTextActive]}>
                Machine Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.formTitle}>
            {isUser ? 'Welcome Back!' : 'Device Authentication'}
          </Text>
          <Text style={styles.formSubtitle}>
            {isUser
              ? 'Sign in to manage your car washes'
              : 'Enter machine credentials to access dashboard'}
          </Text>

          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label={isUser ? 'Email Address' : 'Machine Email'}
                mode="outlined"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={!!errors.email}
                style={styles.input}
                left={<TextInput.Icon icon={isUser ? 'email-outline' : 'identifier'} />}
                outlineColor="#E2E8F0"
                activeOutlineColor={isUser ? '#1E40AF' : '#4C1D95'}
              />
            )}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

          {/* Password */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Password"
                mode="outlined"
                secureTextEntry={!showPassword}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.password}
                style={styles.input}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
                outlineColor="#E2E8F0"
                activeOutlineColor={isUser ? '#1E40AF' : '#4C1D95'}
              />
            )}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

          {/* Server Error */}
          {errors.root?.serverError && (
            <View style={styles.serverErrorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
              <Text style={styles.serverErrorText}>{errors.root.serverError.message}</Text>
            </View>
          )}

          {/* Submit */}
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            disabled={!isValid || isSubmitting}
            style={[styles.button, { backgroundColor: isUser ? '#1E40AF' : '#4C1D95' }]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {isUser ? 'Sign In' : 'Authenticate Machine'}
          </Button>

          {/* Register link (users only) */}
          {isUser && (
            <Button
              mode="text"
              onPress={() => navigation.navigate('Register')}
              style={styles.linkButton}
              textColor="#1E40AF"
            >
              Don't have an account? Sign up
            </Button>
          )}

          {!isUser && (
            <Text style={styles.machineNote}>
              Machine credentials are provisioned by an administrator.
            </Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  toggleWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 2,
    width: width - 64,
    position: 'relative',
    height: 46,
    alignItems: 'center',
  },
  toggleSlider: {
    position: 'absolute',
    height: 40,
    borderRadius: 12,
    top: 3,
    left: 0,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  serverErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  serverErrorText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
    marginLeft: 6,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  linkButton: {
    marginTop: 8,
  },
  machineNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 16,
    fontStyle: 'italic',
  },
});
