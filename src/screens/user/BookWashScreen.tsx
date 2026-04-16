import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Text, Button, ActivityIndicator, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { carService, Car } from '../../services/carService';
import { taskService, ServiceType } from '../../services/taskService';

const SERVICE_OPTIONS: { type: ServiceType; label: string; desc: string; price: string; icon: string }[] = [
  {
    type: 'BASIC',
    label: 'Basic Wash',
    desc: 'Exterior rinse & dry',
    price: '₹199',
    icon: 'water-outline',
  },
  {
    type: 'PREMIUM',
    label: 'Premium Wash',
    desc: 'Exterior + interior clean',
    price: '₹399',
    icon: 'star-outline',
  },
  {
    type: 'DELUXE',
    label: 'Deluxe Detail',
    desc: 'Full detail + wax & polish',
    price: '₹799',
    icon: 'diamond-outline',
  },
];

export const BookWashScreen = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCars = useCallback(async () => {
    try {
      const res = await carService.getCars();
      setCars(res.data);
      if (res.data.length === 1) setSelectedCar(res.data[0]);
    } catch (e) {
      setError('Failed to load cars');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCars(); }, [loadCars]);

  const handleBook = async () => {
    if (!selectedCar || !selectedService) return;
    try {
      setBooking(true);
      setError(null);
      await taskService.createTask({ carId: selectedCar.id, serviceType: selectedService });
      setSuccess(true);
    } catch (e: any) {
      const msg = e.response?.data?.message ?? 'Booking failed. Please try again.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1E40AF" /></View>;
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="check-circle" size={72} color="#059669" />
          </View>
          <Text style={styles.successTitle}>Booking Confirmed! 🎉</Text>
          <Text style={styles.successSub}>
            Your {selectedService?.toLowerCase()} wash for{' '}
            <Text style={{ fontWeight: '800' }}>{selectedCar?.licensePlate}</Text> has been booked.
          </Text>
          <Button
            mode="contained"
            buttonColor="#1E40AF"
            style={{ borderRadius: 12, marginTop: 24, width: '100%' }}
            contentStyle={{ paddingVertical: 6 }}
            onPress={() => {
              setSuccess(false);
              setSelectedCar(cars.length === 1 ? cars[0] : null);
              setSelectedService(null);
            }}
          >
            Book Another Wash
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Book a Wash</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Step 1: Select Car */}
        <Text style={styles.stepTitle}>Step 1: Select Your Car</Text>
        {cars.length === 0 ? (
          <Surface style={styles.noCarBanner} elevation={1}>
            <MaterialCommunityIcons name="car-off" size={28} color="#94A3B8" />
            <Text style={styles.noCarText}>No cars registered. Add a car first.</Text>
          </Surface>
        ) : (
          cars.map((car) => {
            const displayModel = [car.make, car.model].filter(Boolean).join(' ').trim() || 'Vehicle';
            return (
            <TouchableOpacity
              key={car.id}
              style={[
                styles.carOption,
                selectedCar?.id === car.id && styles.carOptionSelected,
              ]}
              onPress={() => setSelectedCar(car)}
              activeOpacity={0.8}
            >
              <View style={styles.carOptionLeft}>
                <MaterialCommunityIcons
                  name="car"
                  size={24}
                  color={selectedCar?.id === car.id ? '#1E40AF' : '#64748B'}
                />
                <View style={{ marginLeft: 12 }}>
                  <Text
                    style={[
                      styles.carPlate,
                      selectedCar?.id === car.id && { color: '#1E40AF' },
                    ]}
                  >
                    {car.licensePlate}
                  </Text>
                  <Text style={styles.carModel}>
                    {displayModel} · {car.color}
                  </Text>
                </View>
              </View>
              {selectedCar?.id === car.id && (
                <MaterialCommunityIcons name="check-circle" size={22} color="#1E40AF" />
              )}
            </TouchableOpacity>
            );
          })
        )}

        {/* Step 2: Select Service */}
        <Text style={styles.stepTitle}>Step 2: Choose Service</Text>
        {SERVICE_OPTIONS.map((svc) => (
          <TouchableOpacity
            key={svc.type}
            style={[
              styles.serviceOption,
              selectedService === svc.type && styles.serviceOptionSelected,
            ]}
            onPress={() => setSelectedService(svc.type)}
            activeOpacity={0.8}
          >
            <View style={[
              styles.serviceIconWrap,
              { backgroundColor: selectedService === svc.type ? '#1E40AF' : '#EFF6FF' },
            ]}>
              <MaterialCommunityIcons
                name={svc.icon as any}
                size={24}
                color={selectedService === svc.type ? '#FFFFFF' : '#1E40AF'}
              />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={[
                styles.serviceLabel,
                selectedService === svc.type && { color: '#1E40AF' },
              ]}>
                {svc.label}
              </Text>
              <Text style={styles.serviceDesc}>{svc.desc}</Text>
            </View>
            <Text style={[
              styles.servicePrice,
              selectedService === svc.type && { color: '#1E40AF' },
            ]}>
              {svc.price}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Summary + Book */}
        {selectedCar && selectedService && (
          <Surface style={styles.summary} elevation={2}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Vehicle</Text>
              <Text style={styles.summaryValue}>{selectedCar.licensePlate}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service</Text>
              <Text style={styles.summaryValue}>
                {SERVICE_OPTIONS.find((s) => s.type === selectedService)?.label}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price</Text>
              <Text style={[styles.summaryValue, { color: '#059669', fontWeight: '800' }]}>
                {SERVICE_OPTIONS.find((s) => s.type === selectedService)?.price}
              </Text>
            </View>
          </Surface>
        )}

        <Button
          mode="contained"
          onPress={handleBook}
          loading={booking}
          disabled={!selectedCar || !selectedService || booking}
          style={styles.bookBtn}
          buttonColor="#1E40AF"
          contentStyle={styles.bookBtnContent}
          labelStyle={{ fontSize: 16, fontWeight: '800' }}
        >
          Confirm Booking
        </Button>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  pageHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pageTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E40AF',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  carOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  carOptionSelected: {
    borderColor: '#1E40AF',
    backgroundColor: '#EFF6FF',
  },
  carOptionLeft: { flexDirection: 'row', alignItems: 'center' },
  carPlate: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  carModel: { fontSize: 12, color: '#64748B', marginTop: 2 },
  noCarBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    backgroundColor: '#F1F5F9',
    gap: 10,
  },
  noCarText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  serviceOptionSelected: {
    borderColor: '#1E40AF',
    backgroundColor: '#EFF6FF',
  },
  serviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceInfo: { flex: 1 },
  serviceLabel: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  serviceDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  servicePrice: { fontSize: 16, fontWeight: '800', color: '#334155' },
  summary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
  },
  summaryTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 14, color: '#64748B' },
  summaryValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  errorText: { color: '#DC2626', fontSize: 13, flex: 1, marginLeft: 4 },
  bookBtn: { marginHorizontal: 16, marginTop: 16, borderRadius: 14 },
  bookBtnContent: { paddingVertical: 8 },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A', textAlign: 'center', marginBottom: 12 },
  successSub: { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 22 },
});
