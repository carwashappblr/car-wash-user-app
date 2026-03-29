import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
}).required();

export const LoginScreen = ({ navigation }: Props) => {
  const { login } = useAuth();
  const theme = useTheme();

  const { control, handleSubmit, formState: { errors, isValid, isSubmitting }, setError } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = async (data: any) => {
    try {
      console.log("email", data.email, "password", data.password);
      await login(data.email, data.password);
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.message) {
        // Map class-validator messages
        const msgs = err.response.data.message as string[];
        setError('root.serverError', { type: 'server', message: msgs.join(', ') });
      } else if (err.response?.status === 401) {
        setError('root.serverError', { type: 'server', message: 'Invalid credentials' });
      } else {
        setError('root.serverError', { type: 'server', message: 'Something went wrong' });
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.formContainer}>
        <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
          Welcome Back
        </Text>
        <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurface }]}>
          Sign in to book your next car wash
        </Text>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Email Address"
              mode="outlined"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors.email}
              style={styles.input}
            />
          )}
        />
        {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Password"
              mode="outlined"
              secureTextEntry
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={!!errors.password}
              style={styles.input}
            />
          )}
        />
        {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

        {errors.root?.serverError && (
          <Text style={[styles.errorText, { marginBottom: 12, textAlign: 'center' }]}>
            {errors.root.serverError.message}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={!isValid || isSubmitting}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Sign In
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Register')}
          style={styles.linkButton}
        >
          Don't have an account? Sign up
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  formContainer: {
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 32,
    textAlign: 'center',
    opacity: 0.8,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  linkButton: {
    marginTop: 16,
  },
});
