import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, useTheme, ActivityIndicator, Menu } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AuthStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import { apiClient } from '../../api/client';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

interface Tower {
  id: string;
  name: string;
}

interface Community {
  id: string;
  name: string;
  towers: Tower[];
}

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  communityId: yup.string().required('Community is required'),
  towerId: yup.string().required('Tower is required'),
}).required();

export const RegisterScreen = ({ navigation }: Props) => {
  const { register: registerAction } = useAuth();
  const theme = useTheme();

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [communityMenuVisible, setCommunityMenuVisible] = useState(false);
  const [towerMenuVisible, setTowerMenuVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    formState: { errors, isValid, isSubmitting },
    setError,
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      communityId: '',
      towerId: '',
    },
  });

  const selectedCommunityId = watch('communityId');
  const selectedTowerId = watch('towerId');

  const selectedCommunity = useMemo(
    () => communities.find((c) => c.id === selectedCommunityId) ?? null,
    [communities, selectedCommunityId]
  );
  const towers = selectedCommunity?.towers ?? [];
  const selectedTower = useMemo(
    () => towers.find((t) => t.id === selectedTowerId) ?? null,
    [towers, selectedTowerId]
  );

  useEffect(() => {
    const loadCommunities = async () => {
      try {
        const response = await apiClient.get<Community[]>('/auth/communities');
        setCommunities(response.data);
      } catch (e) {
        console.error('Failed to load communities for registration', e);
      } finally {
        setLoadingCommunities(false);
      }
    };
    loadCommunities();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      await registerAction({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        communityId: data.communityId,
        towerId: data.towerId,
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
                label="Full Name *"
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
                label="Email Address *"
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
                label="Phone Number *"
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
                label="Password *"
                mode="outlined"
                secureTextEntry={!showPassword}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                error={!!errors.password}
                style={styles.input}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />
            )}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

          {/* Community Menu */}
          <Text style={styles.fieldLabel}>Community *</Text>
          <Menu
            visible={communityMenuVisible}
            onDismiss={() => setCommunityMenuVisible(false)}
            anchor={
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.selectField,
                  errors.communityId ? styles.selectFieldError : null,
                ]}
                onPress={() => {
                  if (!loadingCommunities && communities.length > 0) {
                    setCommunityMenuVisible(true);
                  }
                }}
                disabled={loadingCommunities || communities.length === 0}
              >
                <View style={styles.selectFieldLeft}>
                  <MaterialCommunityIcons name="home-city-outline" size={20} color="#64748B" />
                  <Text style={[styles.selectFieldText, !selectedCommunity ? styles.placeholderText : null]}>
                    {selectedCommunity?.name ?? (loadingCommunities ? 'Loading communities...' : 'Select a community')}
                  </Text>
                </View>
                {loadingCommunities ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
                )}
              </TouchableOpacity>
            }
          >
            {communities.map((community) => (
              <Menu.Item
                key={community.id}
                onPress={() => {
                  setValue('communityId', community.id, { shouldValidate: true });
                  setValue('towerId', '', { shouldValidate: true });
                  clearErrors(['communityId', 'towerId']);
                  setCommunityMenuVisible(false);
                }}
                title={community.name}
              />
            ))}
          </Menu>
          {errors.communityId && <Text style={styles.errorText}>{errors.communityId.message}</Text>}

          {/* Tower Menu */}
          <Text style={styles.fieldLabel}>Tower *</Text>
          <Menu
            visible={towerMenuVisible}
            onDismiss={() => setTowerMenuVisible(false)}
            anchor={
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.selectField,
                  errors.towerId ? styles.selectFieldError : null,
                  !selectedCommunity ? styles.selectFieldDisabled : null,
                ]}
                onPress={() => {
                  if (selectedCommunity && towers.length > 0) {
                    setTowerMenuVisible(true);
                  }
                }}
                disabled={!selectedCommunity || towers.length === 0}
              >
                <View style={styles.selectFieldLeft}>
                  <MaterialCommunityIcons name="office-building-outline" size={20} color="#64748B" />
                  <Text style={[styles.selectFieldText, !selectedTower ? styles.placeholderText : null]}>
                    {!selectedCommunity
                      ? 'Select a community first'
                      : selectedTower?.name ?? (towers.length > 0 ? 'Select a tower' : 'No towers available')}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#64748B" />
              </TouchableOpacity>
            }
          >
            {towers.map((tower) => (
              <Menu.Item
                key={tower.id}
                onPress={() => {
                  setValue('towerId', tower.id, { shouldValidate: true });
                  clearErrors('towerId');
                  setTowerMenuVisible(false);
                }}
                title={tower.name}
              />
            ))}
          </Menu>
          {errors.towerId && <Text style={styles.errorText}>{errors.towerId.message}</Text>}

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
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.8,
  },
  input: {
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 6,
    color: '#334155',
  },
  selectField: {
    minHeight: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectFieldLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  selectFieldText: {
    color: '#0F172A',
    fontSize: 14,
    flex: 1,
  },
  placeholderText: {
    color: '#94A3B8',
  },
  selectFieldDisabled: {
    backgroundColor: '#F1F5F9',
  },
  selectFieldError: {
    borderColor: '#EF4444',
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
