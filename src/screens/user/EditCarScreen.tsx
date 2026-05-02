import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Button, Menu, Text, TextInput } from 'react-native-paper';

import { Community, Tower, carService } from '../../services/carService';
import { UserStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';

type EditCarNavProp = NativeStackNavigationProp<UserStackParamList, 'EditCar'>;
type EditCarRouteProp = NativeStackScreenProps<UserStackParamList, 'EditCar'>['route'];
type EditCarFormValues = {
  communityId: string;
  towerId: string;
  make: string;
  model: string;
  plateNumber: string;
  color?: string;
  defaultSlotNumber?: string;
};

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

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (Array.isArray(error)) return error.map((item) => getErrorMessage(item)).join(', ');
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    if ('message' in record) return getErrorMessage(record.message);
    if ('error' in record) return getErrorMessage(record.error);
    try {
      return JSON.stringify(record);
    } catch {
      return 'Something went wrong. Please try again.';
    }
  }
  return 'Something went wrong. Please try again.';
};

const schema: yup.ObjectSchema<EditCarFormValues> = yup.object({
  communityId: yup.string().trim().required('Community is required'),
  towerId: yup.string().trim().required('Tower is required'),
  make: yup.string().trim().required('Car make is required'),
  plateNumber: yup.string().trim().min(2, 'Enter a valid plate').required('Plate number is required'),
  model: yup.string().trim().required('Car model is required'),
  color: yup.string().trim().optional(),
  defaultSlotNumber: yup.string().trim().optional(),
}).required();

export const EditCarScreen = () => {
  const navigation = useNavigation<EditCarNavProp>();
  const route = useRoute<EditCarRouteProp>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [communityMenuVisible, setCommunityMenuVisible] = useState(false);
  const [towerMenuVisible, setTowerMenuVisible] = useState(false);

  const {
    control,
    handleSubmit,
    clearErrors,
    reset,
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<EditCarFormValues>({
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
    const loadData = async () => {
      try {
        setScreenError(null);
        const [carsResponse, communitiesResponse] = await Promise.all([
          carService.getCars(),
          carService.getCommunities(),
        ]);

        const car = carsResponse.data.find((item) => item.id === route.params.carId);
        if (!car) {
          setScreenError('Car not found or you do not have access to edit it.');
          return;
        }

        const community = communitiesResponse.data.find((item) =>
          item.towers.some((tower) => tower.id === car.towerId)
        );

        setCommunities(communitiesResponse.data);
        reset({
          communityId: community?.id ?? '',
          towerId: car.towerId ?? '',
          make: car.make ?? '',
          model: car.model ?? '',
          plateNumber: car.plateNumber ?? car.licensePlate ?? '',
          color: car.color ?? '',
          defaultSlotNumber: car.defaultSlotNumber ?? '',
        });
      } catch (e: any) {
        setScreenError(
          getErrorMessage(e.response?.data ?? e.message ?? 'Failed to load car details. Please try again.')
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [reset, route.params.carId]);

  const onSubmit = async (data: EditCarFormValues) => {
    try {
      setSubmitError(null);
      const response = await carService.updateCar(route.params.carId, {
        towerId: data.towerId,
        make: data.make.trim(),
        model: data.model.trim(),
        plateNumber: data.plateNumber.toUpperCase().trim(),
        color: data.color?.trim() || undefined,
        defaultSlotNumber: data.defaultSlotNumber?.toUpperCase().trim() || undefined,
      });

      const updatedCar = response.data;
      const community = communities.find((item) =>
        item.towers.some((tower) => tower.id === updatedCar.towerId)
      );

      reset({
        communityId: community?.id ?? data.communityId,
        towerId: updatedCar.towerId ?? data.towerId,
        make: updatedCar.make ?? data.make.trim(),
        model: updatedCar.model ?? data.model.trim(),
        plateNumber: updatedCar.plateNumber ?? updatedCar.licensePlate ?? data.plateNumber.toUpperCase().trim(),
        color: updatedCar.color ?? data.color ?? '',
        defaultSlotNumber: updatedCar.defaultSlotNumber ?? data.defaultSlotNumber ?? '',
      });
      navigation.goBack();
    } catch (e: any) {
      setSubmitError(
        getErrorMessage(e.response?.data ?? e.response?.data?.message ?? e.message ?? 'Failed to update car.')
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <MaterialCommunityIcons name="car-cog" size={48} color={colors.primary} />
          <Text style={styles.heroText}>Update your car details, tower, and parking slot information</Text>
        </View>

        {screenError && (
          <View style={styles.serverErrorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.serverErrorText}>{screenError}</Text>
          </View>
        )}

        <Text style={styles.fieldLabel}>Community *</Text>
        <Menu
          visible={communityMenuVisible}
          onDismiss={() => setCommunityMenuVisible(false)}
          anchor={
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.selectField, errors.communityId && styles.selectFieldError]}
              onPress={() => communities.length > 0 && setCommunityMenuVisible(true)}
              disabled={communities.length === 0}
            >
              <View style={styles.selectFieldLeft}>
                <MaterialCommunityIcons name="home-city-outline" size={20} color={colors.outline} />
                <Text style={[styles.selectFieldText, !selectedCommunity && styles.placeholderText]}>
                  {selectedCommunity?.name ?? 'Select a community'}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.outline} />
            </TouchableOpacity>
          }
        >
          {communities.map((community) => (
            <Menu.Item
              key={community.id}
              title={community.name}
              onPress={() => {
                setValue('communityId', community.id, { shouldValidate: true });
                setValue('towerId', '', { shouldValidate: true });
                clearErrors(['communityId', 'towerId']);
                setCommunityMenuVisible(false);
              }}
            />
          ))}
        </Menu>
        {errors.communityId && <Text style={styles.errorText}>{errors.communityId.message}</Text>}

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
              onPress={() => selectedCommunity && towers.length > 0 && setTowerMenuVisible(true)}
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
              title={tower.name}
              onPress={() => {
                setValue('towerId', tower.id, { shouldValidate: true });
                clearErrors('towerId');
                setTowerMenuVisible(false);
              }}
            />
          ))}
        </Menu>
        {errors.towerId && <Text style={styles.errorText}>{errors.towerId.message}</Text>}

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
              placeholder="e.g. Corolla Altis"
              left={<TextInput.Icon icon="car-outline" />}
            />
          )}
        />
        {errors.model && <Text style={styles.errorText}>{errors.model.message}</Text>}

        <Controller
          control={control}
          name="plateNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Plate Number *"
              mode="outlined"
              onBlur={onBlur}
              onChangeText={(text) => onChange(text.toUpperCase())}
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

        <Text style={styles.colorLabel}>Car Color</Text>
        <View style={styles.colorGrid}>
          {COLOR_OPTIONS.map((color) => (
            <TouchableOpacity
              key={color.value}
              style={[
                styles.colorChip,
                { backgroundColor: color.hex },
                selectedColor === color.value && styles.colorChipSelected,
              ]}
              onPress={() => setValue('color', color.value, { shouldValidate: true })}
              activeOpacity={0.8}
            >
              {selectedColor === color.value && (
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color={color.value === 'White' || color.value === 'Silver' || color.value === 'Yellow' ? '#1E293B' : '#FFFFFF'}
                />
              )}
              <Text
                style={[
                  styles.colorChipText,
                  {
                    color:
                      color.value === 'White' || color.value === 'Silver' || color.value === 'Yellow'
                        ? '#1E293B'
                        : '#FFFFFF',
                  },
                ]}
              >
                {color.label}
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

        <Controller
          control={control}
          name="defaultSlotNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Default Slot Number"
              mode="outlined"
              onBlur={onBlur}
              onChangeText={(text) => onChange(text.toUpperCase())}
              value={value}
              autoCapitalize="characters"
              error={!!errors.defaultSlotNumber}
              style={styles.input}
              placeholder="e.g. 44F"
              left={<TextInput.Icon icon="map-marker-path" />}
            />
          )}
        />
        {errors.defaultSlotNumber && <Text style={styles.errorText}>{errors.defaultSlotNumber.message}</Text>}

        {submitError && (
          <View style={styles.serverErrorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.serverErrorText}>{submitError}</Text>
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={!isValid || isSubmitting || !!screenError}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor={colors.primary}
          labelStyle={styles.buttonLabel}
        >
          Save Changes
        </Button>

        <Button mode="text" onPress={() => navigation.goBack()} style={styles.cancelButton} textColor={colors.outline}>
          Back
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
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
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
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
  buttonLabel: { fontSize: 15, fontWeight: '700' },
  cancelButton: { marginTop: 4 },
});
