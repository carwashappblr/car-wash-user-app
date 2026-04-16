import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { carService } from '../../services/carService';
import { UserStackParamList } from '../../navigation/types';

type AddCarNavProp = NativeStackNavigationProp<UserStackParamList, 'AddCar'>;
type AddCarFormValues = {
  make: string;
  model: string;
  plateNumber: string;
  color: string;
  defaultSlotId: string;
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

const schema = yup.object({
  make: yup.string().trim().required('Car make is required'),
  plateNumber: yup
    .string()
    .min(2, 'Enter a valid plate')
    .required('Plate number is required'),
  model: yup.string().required('Car model is required'),
  color: yup.string().required('Color is required'),
  defaultSlotId: yup.string().trim().required('Default slot is required'),
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

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<AddCarFormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: {
      make: '',
      model: '',
      plateNumber: '',
      color: '',
      defaultSlotId: '',
    },
  });

  const selectedColor = watch('color');

  const onSubmit = async (data: AddCarFormValues) => {
    try {
      setSubmitError(null);
      await carService.addCar({
        make: data.make.trim(),
        plateNumber: data.plateNumber.toUpperCase().trim(),
        model: data.model.trim(),
        color: data.color.trim(),
        defaultSlotId: data.defaultSlotId.toUpperCase().trim(),
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
          <MaterialCommunityIcons name="car-settings" size={48} color="#1E40AF" />
          <Text style={styles.heroText}>Register your vehicle and set its default slot to start booking washes</Text>
        </View>

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
        <Text style={styles.colorLabel}>Car Color *</Text>
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
          name="defaultSlotId"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextInput
              label="Default Slot ID *"
              mode="outlined"
              onBlur={onBlur}
              onChangeText={(t) => onChange(t.toUpperCase())}
              value={value}
              autoCapitalize="characters"
              error={!!errors.defaultSlotId}
              style={styles.input}
              placeholder="e.g. 33F"
              left={<TextInput.Icon icon="map-marker-path" />}
            />
          )}
        />
        {errors.defaultSlotId && <Text style={styles.errorText}>{errors.defaultSlotId.message}</Text>}

        {/* Server Error */}
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
          disabled={!isValid || isSubmitting}
          style={styles.button}
          contentStyle={styles.buttonContent}
          buttonColor="#1E40AF"
          labelStyle={{ fontSize: 15, fontWeight: '700' }}
        >
          Add Car
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 4 }}
          textColor="#64748B"
        >
          Cancel
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { padding: 20, paddingBottom: 40 },
  hero: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    gap: 10,
  },
  heroText: {
    fontSize: 14,
    color: '#1E40AF',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  input: { marginBottom: 4, backgroundColor: '#FFFFFF' },
  errorText: { color: '#DC2626', fontSize: 12, marginBottom: 12, marginLeft: 4 },
  colorLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
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
    borderColor: '#1E40AF',
  },
  colorChipText: {
    fontSize: 12,
    fontWeight: '700',
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
  serverErrorText: { color: '#DC2626', fontSize: 13, flex: 1, marginLeft: 4 },
  button: { borderRadius: 12, marginTop: 16 },
  buttonContent: { paddingVertical: 6 },
});
