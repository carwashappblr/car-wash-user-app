import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().optional(),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
}).required();

export const RegisterScreen = ({ navigation }: Props) => {
  const { register: registerAction } = useAuth();
  const theme = useTheme();

  const { control, handleSubmit, formState: { errors, isValid, isSubmitting }, setError } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
  });

  const onSubmit = async (data: any) => {
    try {
      await registerAction({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone || undefined,
      });
    } catch (err: any) {
      if (err.response?.status === 400 && err.response?.data?.message) {
        const msgs = err.response.data.message as string[];
        setError('root.serverError', { type: 'server', message: msgs.join(', ') });
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <Text variant="displaySmall" style={[styles.title, { color: theme.colors.primary }]}>
            Create Account
          </Text>
          <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurface }]}>
            Join the best car wash service
          </Text>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Full Name"
                mode="outlined"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.name}
                style={styles.input}
              />
            )}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

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
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Phone (Optional)"
                mode="outlined"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                keyboardType="phone-pad"
                error={!!errors.phone}
                style={styles.input}
              />
            )}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}

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
            Sign Up
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Login')}
            style={styles.linkButton}
          >
            Already have an account? Sign in
          </Button>
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
    paddingVertical: 24,
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
