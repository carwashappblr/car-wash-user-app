import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Text, Button, ActivityIndicator, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { carService, Car } from '../../services/carService';
import { subscriptionService, Subscription, SubscriptionPlan } from '../../services/subscriptionService';
import { UserStackParamList, UserTabsParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<UserStackParamList>;

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

const formatDate = (value?: string | null) => {
  if (!value) return 'Not scheduled yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled yet';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

export const BookWashScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<any>();
  const [cars, setCars] = useState<Car[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [successSubscription, setSuccessSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [carsResponse, plansResponse] = await Promise.all([
        carService.getCars(),
        subscriptionService.getPlans(),
      ]);

      const activePlans = plansResponse.data.filter((plan) => plan.isActive);
      setCars(carsResponse.data);
      setPlans(activePlans);

      const routeCarId = (route.params as UserTabsParamList['BookWash'])?.carId;
      const preselectedCar = carsResponse.data.find((car) => car.id === routeCarId) ?? null;
      if (preselectedCar) {
        setSelectedCar(preselectedCar);
      } else if (carsResponse.data.length === 1) {
        setSelectedCar(carsResponse.data[0]);
      }
    } catch (e: any) {
      setError(getErrorMessage(e.response?.data ?? e.message ?? 'Failed to load subscription details.'));
    } finally {
      setLoading(false);
    }
  }, [route.params]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubscribe = async () => {
    if (!selectedCar || !selectedPlan) return;

    try {
      setSubscribing(true);
      setError(null);
      const response = await subscriptionService.createSubscription({
        planId: selectedPlan.id,
        carId: selectedCar.id,
      });
      setSuccessSubscription(response.data);

      try {
        await subscriptionService.getMySubscriptions();
      } catch {
        // Best-effort refresh for future subscription history UI.
      }
    } catch (e: any) {
      setError(getErrorMessage(e.response?.data ?? e.message ?? 'Subscription failed. Please try again.'));
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  if (successSubscription) {
    const successPlan = successSubscription.plan ?? selectedPlan;
    const successCar = successSubscription.car ?? selectedCar;
    const carLabel = [successCar?.make, successCar?.model].filter(Boolean).join(' ').trim() || 'Your car';

    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="check-circle" size={72} color="#059669" />
          </View>
          <Text style={styles.successTitle}>Subscription Active</Text>
          <Text style={styles.successSub}>
            {successPlan?.name ?? 'Plan'} is now active for{' '}
            <Text style={styles.successSubHighlight}>
              {successCar?.plateNumber ?? successCar?.licensePlate ?? 'your car'}
            </Text>
            .
          </Text>

          <Surface style={styles.successSummary} elevation={1}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Plan</Text>
              <Text style={styles.summaryValue}>{successPlan?.name ?? '—'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Car</Text>
              <Text style={styles.summaryValue}>
                {carLabel} · {successCar?.plateNumber ?? successCar?.licensePlate ?? '—'}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Washes Used</Text>
              <Text style={styles.summaryValue}>{successSubscription.washesUsed}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Next Wash</Text>
              <Text style={styles.summaryValue}>{formatDate(successSubscription.nextWashOn)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Starts</Text>
              <Text style={styles.summaryValue}>{formatDate(successSubscription.startDate)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ends</Text>
              <Text style={styles.summaryValue}>{formatDate(successSubscription.endDate)}</Text>
            </View>
          </Surface>

          <Button
            mode="contained"
            buttonColor="#1E40AF"
            style={styles.successButton}
            contentStyle={{ paddingVertical: 6 }}
            onPress={() => {
              setSuccessSubscription(null);
              setSelectedCar(cars.length === 1 ? cars[0] : null);
              setSelectedPlan(null);
            }}
          >
            Subscribe Another Car
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Subscriptions</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Surface style={styles.infoBanner} elevation={1}>
          <MaterialCommunityIcons name="credit-card-clock-outline" size={22} color="#1E40AF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Online payment will be added later.</Text>
            <Text style={styles.infoSub}>
              For now, subscriptions activate immediately after you choose a plan and car.
            </Text>
          </View>
        </Surface>

        <Text style={styles.stepTitle}>Step 1: Choose a Plan</Text>
        {plans.length === 0 ? (
          <Surface style={styles.emptyBanner} elevation={1}>
            <MaterialCommunityIcons name="tag-off-outline" size={28} color="#94A3B8" />
            <Text style={styles.emptyText}>No subscription plans are available right now.</Text>
          </Surface>
        ) : (
          plans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.optionCard,
                selectedPlan?.id === plan.id && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedPlan(plan)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.optionIconWrap,
                  { backgroundColor: selectedPlan?.id === plan.id ? '#1E40AF' : '#EFF6FF' },
                ]}
              >
                <MaterialCommunityIcons
                  name="calendar-star"
                  size={24}
                  color={selectedPlan?.id === plan.id ? '#FFFFFF' : '#1E40AF'}
                />
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, selectedPlan?.id === plan.id && styles.optionTitleSelected]}>
                  {plan.name}
                </Text>
                <Text style={styles.optionDesc}>{plan.description}</Text>
                <Text style={styles.optionMeta}>
                  {plan.washCount} washes · {plan.durationDays} days
                </Text>
              </View>
              <Text style={[styles.optionPrice, selectedPlan?.id === plan.id && styles.optionTitleSelected]}>
                {formatCurrency(plan.price)}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.stepTitle}>Step 2: Select Your Car</Text>
        {cars.length === 0 ? (
          <Surface style={styles.emptyBanner} elevation={1}>
            <MaterialCommunityIcons name="car-off" size={28} color="#94A3B8" />
            <View style={styles.emptyContent}>
              <Text style={styles.emptyText}>No cars registered. Add a car first.</Text>
              <Button
                mode="text"
                compact
                onPress={() => navigation.navigate('AddCar')}
                textColor="#1E40AF"
                style={styles.addCarButton}
              >
                Add Car
              </Button>
            </View>
          </Surface>
        ) : (
          cars.map((car) => {
            const displayModel = [car.make, car.model].filter(Boolean).join(' ').trim() || 'Vehicle';
            return (
              <TouchableOpacity
                key={car.id}
                style={[
                  styles.optionCard,
                  selectedCar?.id === car.id && styles.optionCardSelected,
                ]}
                onPress={() => setSelectedCar(car)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.optionIconWrap,
                    { backgroundColor: selectedCar?.id === car.id ? '#1E40AF' : '#EFF6FF' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="car"
                    size={24}
                    color={selectedCar?.id === car.id ? '#FFFFFF' : '#1E40AF'}
                  />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionTitle, selectedCar?.id === car.id && styles.optionTitleSelected]}>
                    {displayModel}
                  </Text>
                  <Text style={styles.optionDesc}>{car.licensePlate}</Text>
                  <Text style={styles.optionMeta}>
                    Slot: {car.defaultSlotNumber?.trim() || 'Not set'}
                  </Text>
                </View>
                {selectedCar?.id === car.id && (
                  <MaterialCommunityIcons name="check-circle" size={22} color="#1E40AF" />
                )}
              </TouchableOpacity>
            );
          })
        )}

        {error && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {selectedCar && selectedPlan && (
          <Surface style={styles.summary} elevation={2}>
            <Text style={styles.summaryTitle}>Subscription Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Plan</Text>
              <Text style={styles.summaryValue}>{selectedPlan.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Description</Text>
              <Text style={styles.summaryValue}>{selectedPlan.description}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Price</Text>
              <Text style={[styles.summaryValue, styles.summaryAccent]}>{formatCurrency(selectedPlan.price)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Washes per Month</Text>
              <Text style={styles.summaryValue}>{selectedPlan.washCount}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{selectedPlan.durationDays} days</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Car</Text>
              <Text style={styles.summaryValue}>
                {[selectedCar.make, selectedCar.model].filter(Boolean).join(' ').trim() || 'Vehicle'} · {selectedCar.licensePlate}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Default Slot</Text>
              <Text style={styles.summaryValue}>{selectedCar.defaultSlotNumber?.trim() || 'Not set'}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryLastRow]}>
              <Text style={styles.summaryLabel}>Payment</Text>
              <Text style={styles.summaryValue}>Will be added later</Text>
            </View>
          </Surface>
        )}

        <Button
          mode="contained"
          onPress={handleSubscribe}
          loading={subscribing}
          disabled={!selectedCar || !selectedPlan || subscribing || plans.length === 0 || cars.length === 0}
          style={styles.primaryButton}
          buttonColor="#1E40AF"
          contentStyle={styles.primaryButtonContent}
          labelStyle={styles.primaryButtonLabel}
        >
          Subscribe
        </Button>

        <View style={styles.footerNote}>
          <MaterialCommunityIcons name="information-outline" size={16} color="#64748B" />
          <Text style={styles.footerNoteText}>
            This layout is ready for a future payment step before final confirmation.
          </Text>
        </View>

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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    gap: 10,
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 14, fontWeight: '700', color: '#1E3A8A' },
  infoSub: { fontSize: 12, color: '#334155', marginTop: 4, lineHeight: 18 },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E40AF',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  optionCard: {
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
  optionCardSelected: {
    borderColor: '#1E40AF',
    backgroundColor: '#EFF6FF',
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  optionTitleSelected: { color: '#1E40AF' },
  optionDesc: { fontSize: 12, color: '#64748B', marginTop: 2 },
  optionMeta: { fontSize: 12, color: '#475569', marginTop: 6, fontWeight: '600' },
  optionPrice: { fontSize: 16, fontWeight: '800', color: '#334155' },
  emptyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    backgroundColor: '#F1F5F9',
    gap: 10,
  },
  emptyContent: { flex: 1 },
  emptyText: { fontSize: 14, color: '#64748B', fontWeight: '600', flex: 1 },
  addCarButton: { alignSelf: 'flex-start', marginTop: 6, marginLeft: -8 },
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
    gap: 12,
  },
  summaryLastRow: { marginBottom: 0 },
  summaryLabel: { fontSize: 14, color: '#64748B', flex: 1 },
  summaryValue: { fontSize: 14, fontWeight: '700', color: '#0F172A', flex: 1, textAlign: 'right' },
  summaryAccent: { color: '#059669' },
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
  primaryButton: { marginHorizontal: 16, marginTop: 16, borderRadius: 14 },
  primaryButtonContent: { paddingVertical: 6 },
  primaryButtonLabel: { fontSize: 16, fontWeight: '800' },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  footerNoteText: { flex: 1, fontSize: 12, color: '#64748B', lineHeight: 18 },
  successContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 28, fontWeight: '900', color: '#0F172A', textAlign: 'center' },
  successSub: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  successSubHighlight: { fontWeight: '800', color: '#0F172A' },
  successSummary: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginTop: 24,
  },
  successButton: { borderRadius: 12, marginTop: 24, width: '100%' },
});
