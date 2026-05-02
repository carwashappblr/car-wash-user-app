import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput, Button, ActivityIndicator, Menu } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { carService, Community, Tower } from '../../services/carService';
import { UserStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type AddCarNavProp = NativeStackNavigationProp<UserStackParamList, 'AddCar'>;
type AddCarFormValues = {
  communityId: string;
  towerId: string;
  make: string;
  model: string;
  plateNumber: string;
  color?: string;
  defaultSlotNumber?: string;
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (Array.isArray(error)) {
    return error.map((item) => getErrorMessage(item)).join(', ');
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;

    if ('message' in record) {
      return getErrorMessage(record.message);
    }

    if ('error' in record) {
      return getErrorMessage(record.error);
    }

    try {
      return JSON.stringify(record);
    } catch {
      return 'Something went wrong. Please try again.';
    }
  }

  return 'Something went wrong. Please try again.';
};

const schema: yup.ObjectSchema<AddCarFormValues> = yup.object({
  communityId: yup.string().trim().required('Community is required'),
  towerId: yup.string().trim().required('Tower is required'),
  make: yup.string().trim().required('Car make is required'),
  plateNumber: yup
    .string()
    .min(2, 'Enter a valid plate')
    .required('Plate number is required'),
  model: yup.string().required('Car model is required'),
  color: yup.string().trim().optional(),
  defaultSlotNumber: yup.string().trim().optional(),
}).required();

const COLOR_OPTIONS = [
  { label: 'White', value: 'White', hex: '#F1F5F9' },
  { label: 'Black', value: 'Black', hex: '#1E293B' },
  { label: 'Silver', value: 'Silver', hex: '#CBD5E1' },
  { label: 'Red', value: 'Red', hex: '#FCA5A5' },
  { label: 'Blue', value: 'Blue', hex: '#93C5FD' },
  { label: 'Grey', value: 'Grey', hex: '#94A3B8' },
  { label: 'Green', value: 'Green', hex: '#6EE7B7' },
  { label: 'Yellow', value: 'Yellow', hex: '#FDE68A' },
];

export const AddCarScreen = () => {
  const navigation = useNavigation<AddCarNavProp>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [communityError, setCommunityError] = useState<string | null>(null);
  const [communityMenuVisible, setCommunityMenuVisible] = useState(false);
  const [towerMenuVisible, setTowerMenuVisible] = useState(false);

  const {
    control,
    handleSubmit,
    clearErrors,
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<AddCarFormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      communityId: '',
      towerId: '',
      make: '',
      model: '',
      plateNumber: '',
      color: '',
      defaultSlotNumber: '',
    },
  });

  const selectedColor = watch('color') ?? '';
  const selectedCommunityId = watch('communityId');
  const selectedTowerId = watch('towerId');
  const selectedCommunity = useMemo(
    () => communities.find((community) => community.id === selectedCommunityId) ?? null,
    [communities, selectedCommunityId]
  );
  const towers = selectedCommunity?.towers ?? [];
  const selectedTower = useMemo(
    () => towers.find((tower) => tower.id === selectedTowerId) ?? null,
    [towers, selectedTowerId]
  );

  useEffect(() => {
    const loadCommunities = async () => {
      try {
        setCommunityError(null);
        const response = await carService.getCommunities();
        setCommunities(response.data);
      } catch (e: any) {
        setCommunityError(
          getErrorMessage(e.response?.data ?? e.message ?? 'Failed to load communities. Please try again.')
        );
      } finally {
        setLoadingCommunities(false);
      }
    };

    loadCommunities();
  }, []);

  const onSubmit = async (data: AddCarFormValues) => {
    try {
      setSubmitError(null);
      await carService.addCar({
        towerId: data.towerId,
        make: data.make.trim(),
        plateNumber: data.plateNumber.toUpperCase().trim(),
        model: data.model.trim(),
        color: data.color?.trim() || undefined,
        defaultSlotNumber: data.defaultSlotNumber?.toUpperCase().trim() || undefined,
      });
      navigation.goBack();
    } catch (e: any) {
      const msg = getErrorMessage(
        e.response?.data ?? e.response?.data?.message ?? e.message ?? 'Failed to add car. Please try again.'
      );
      setSubmitError(msg);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Icon hero */}
        <View style={styles.hero}>
          <MaterialCommunityIcons name="car-settings" size={48} color={colors.primary} />
          <Text style={styles.heroText}>Register your vehicle, choose its tower, and optionally add a default slot</Text>
        </View>

        {loadingCommunities ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading communities...</Text>
          </View>
        ) : communityError ? (
          <View style={styles.serverErrorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.serverErrorText}>{communityError}</Text>
          </View>
        ) : null}

        {/* Community */}
        <Text style={styles.fieldLabel}>Community *</Text>
        <Menu
          visible={communityMenuVisible}
          onDismiss={() => setCommunityMenuVisible(false)}
          anchor={
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.selectField,
                errors.communityId && styles.selectFieldError,
                loadingCommunities && styles.selectFieldDisabled,
              ]}
              onPress={() => {
                if (!loadingCommunities && communities.length > 0) {
                  setCommunityMenuVisible(true);
                }
              }}
              disabled={loadingCommunities || communities.length === 0}
            >
              <View style={styles.selectFieldLeft}>
                <MaterialCommunityIcons name="home-city-outline" size={20} color={colors.outline} />
                <Text style={[styles.selectFieldText, !selectedCommunity && styles.placeholderText]}>
                  {selectedCommunity?.name ?? (loadingCommunities ? 'Loading communities...' : 'Select a community')}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.outline} />
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

        {/* Tower */}
        <Text style={styles.fieldLabel}>Tower *</Text>
        <Menu
          visible={towerMenuVisible}
          onDismiss={() => setTowerMenuVisible(false)}
          anchor={
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.selectField,
                errors.towerId && styles.selectFieldError,
                !selectedCommunity && styles.selectFieldDisabled,
              ]}
              onPress={() => {
                if (selectedCommunity && towers.length > 0) {
                  setTowerMenuVisible(true);
                }
              }}
              disabled={!selectedCommunity || towers.length === 0}
            >
              <View style={styles.selectFieldLeft}>
                <MaterialCommunityIcons name="office-building-outline" size={20} color={colors.outline} />
                <Text style={[styles.selectFieldText, !selectedTower && styles.placeholderText]}>
                  {!selectedCommunity
                    ? 'Select a community first'
                    : selectedTower?.name ?? (towers.length > 0 ? 'Select a tower' : 'No towers available')}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.outline} />
            </TouchableOpacity>
          }
        >
          {towers.map((tower: Tower) => (
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

        {/* Make */}
        <Controller
          control={control}
          name="make"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Make *"
              mode="outlined"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={!!errors.make}
              style={styles.input}
              placeholder="e.g. Toyota"
              left={<TextInput.Icon icon="factory" />}
            />
          )}
        />
        {errors.make && <Text style={styles.errorText}>{errors.make.message}</Text>}

        {/* Model */}
        <Controller
          control={control}
          name="model"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Car Model *"
              mode="outlined"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={!!errors.model}
              style={styles.input}
              placeholder="e.g. Honda City, Maruti Swift"
              left={<TextInput.Icon icon="car-outline" />}
            />
          )}
        />
        {errors.model && <Text style={styles.errorText}>{errors.model.message}</Text>}

        {/* Plate Number */}
        <Controller
          control={control}
          name="plateNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Plate Number *"
              mode="outlined"
              onBlur={onBlur}
              onChangeText={(t) => onChange(t.toUpperCase())}
              value={value}
              autoCapitalize="characters"
              error={!!errors.plateNumber}
              style={styles.input}
              placeholder="e.g. KA01AB1234"
              left={<TextInput.Icon icon="card-text-outline" />}
            />
          )}
        />
        {errors.plateNumber && <Text style={styles.errorText}>{errors.plateNumber.message}</Text>}

        {/* Color Picker */}
        <Text style={styles.colorLabel}>Car Color</Text>
        <View style={styles.colorGrid}>
          {COLOR_OPTIONS.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[
                styles.colorChip,
                { backgroundColor: c.hex },
                selectedColor === c.value && styles.colorChipSelected,
              ]}
              onPress={() => setValue('color', c.value, { shouldValidate: true })}
              activeOpacity={0.8}
            >
              {selectedColor === c.value && (
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color={c.value === 'White' || c.value === 'Silver' || c.value === 'Yellow' ? '#1E293B' : '#FFFFFF'}
                />
              )}
              <Text
                style={[
                  styles.colorChipText,
                  {
                    color:
                      c.value === 'White' || c.value === 'Silver' || c.value === 'Yellow'
                        ? '#1E293B'
                        : '#FFFFFF',
                  },
                ]}
              >
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Controller
          control={control}
          name="color"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Color"
              mode="outlined"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={!!errors.color}
              style={styles.input}
              placeholder="Type a color if it's not listed above"
              left={<TextInput.Icon icon="palette-outline" />}
            />
          )}
        />
        {errors.color && <Text style={styles.errorText}>{errors.color.message}</Text>}

        {/* Default Slot */}
        <Controller
          control={control}
          name="defaultSlotNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Default Slot Number"
              mode="outlined"
              onBlur={onBlur}
              onChangeText={(t) => onChange(t.toUpperCase())}
              value={value}
              autoCapitalize="characters"
              error={!!errors.defaultSlotNumber}
              style={styles.input}
              placeholder="e.g. 33F"
              left={<TextInput.Icon icon="map-marker-path" />}
            />
          )}
        />
        {errors.defaultSlotNumber && <Text style={styles.errorText}>{errors.defaultSlotNumber.message}</Text>}

        {/* Server Error */}
        {submitError && (
          <View style={styles.serverErrorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.serverErrorText}>{submitError}</Text>
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={!isValid || isSubmitting || loadingCommunities || !!communityError}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor={colors.primary}
          labelStyle={{ fontSize: 15, fontWeight: '700' }}
        >
          Add Car
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 4 }}
          textColor={colors.outline}
        >
          Cancel
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: 20, paddingBottom: 40 },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    gap: 10,
  },
  heroText: {
    fontSize: 14,
    color: colors.onPrimaryContainer,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  input: { marginBottom: 4, backgroundColor: colors.surfaceContainerLowest },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 10,
  },
  selectField: {
    minHeight: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
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
    color: colors.onSurface,
    fontSize: 14,
    flex: 1,
  },
  placeholderText: {
    color: colors.outline,
  },
  selectFieldDisabled: {
    backgroundColor: colors.surfaceContainerLow,
  },
  selectFieldError: {
    borderColor: colors.error,
  },
  errorText: { color: colors.error, fontSize: 12, marginBottom: 12, marginLeft: 4 },
  colorLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 10,
    marginTop: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  colorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorChipSelected: {
    borderColor: colors.primary,
  },
  colorChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  serverErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  serverErrorText: { color: colors.error, fontSize: 13, flex: 1, marginLeft: 4 },
  button: { borderRadius: 12, marginTop: 16 },
  buttonContent: { paddingVertical: 6 },
});
