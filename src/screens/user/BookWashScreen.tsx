import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image, Animated, Pressable, Easing } from 'react-native';
import { Text, Button, ActivityIndicator, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ConfettiCannon from 'react-native-confetti-cannon';

import { carService, Car } from '../../services/carService';
import { subscriptionService, Subscription, SubscriptionPlan } from '../../services/subscriptionService';
import { UserStackParamList, UserTabsParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { PremiumLoader } from '../../components/PremiumLoader';

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

  // Animation refs for success screen
  const confettiRef = useRef<any>(null);
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const summaryOpacity = useRef(new Animated.Value(0)).current;
  const summaryTranslateY = useRef(new Animated.Value(20)).current;

  // Button press animation
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 8,
    }).start();
  };

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

  // Trigger success animations when subscription succeeds
  useEffect(() => {
    if (!successSubscription) return;

    // Reset all values
    checkScale.setValue(0);
    checkOpacity.setValue(0);
    titleTranslateY.setValue(30);
    titleOpacity.setValue(0);
    summaryOpacity.setValue(0);
    summaryTranslateY.setValue(20);

    // Sequence: check -> title -> summary
    Animated.sequence([
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(summaryOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(summaryTranslateY, {
          toValue: 0,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Fire confetti after a short delay
    setTimeout(() => confettiRef.current?.start(), 200);
  }, [successSubscription]);

  if (loading) {
    return <PremiumLoader message="Loading subscription plans..." />;
  }

  if (successSubscription) {
    const successPlan = successSubscription.plan ?? selectedPlan;
    const successCar = successSubscription.car ?? selectedCar;
    const carLabel = [successCar?.make, successCar?.model].filter(Boolean).join(' ').trim() || 'Your car';

    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Confetti cannon - positioned at top center */}
        <ConfettiCannon
          ref={confettiRef}
          count={120}
          origin={{ x: 200, y: -20 }}
          autoStart={false}
          fadeOut
          colors={['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#ffffff', '#fbbf24']}
        />

        <View style={styles.successContainer}>
          {/* Animated checkmark */}
          <Animated.View
            style={[
              styles.successIcon,
              { opacity: checkOpacity, transform: [{ scale: checkScale }] },
            ]}
          >
            <MaterialCommunityIcons name="check-circle" size={72} color={colors.secondary} />
          </Animated.View>

          {/* Animated title */}
          <Animated.Text
            style={[
              styles.successTitle,
              { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] },
            ]}
          >
            Subscription Active 🎉
          </Animated.Text>

          <Animated.Text
            style={[
              styles.successSub,
              { opacity: titleOpacity },
            ]}
          >
            {successPlan?.name ?? 'Plan'} is now active for{' '}
            <Text style={styles.successSubHighlight}>
              {successCar?.plateNumber ?? successCar?.licensePlate ?? 'your car'}
            </Text>
            .
          </Animated.Text>

          {/* Animated summary card */}
          <Animated.View
            style={[
              { width: '100%', opacity: summaryOpacity, transform: [{ translateY: summaryTranslateY }] },
            ]}
          >
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
          </Animated.View>

          <Button
            mode="contained"
            buttonColor={colors.primary}
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

  const serviceFee = selectedPlan ? selectedPlan.price * 0.08 : 0;
  const totalAmount = selectedPlan ? selectedPlan.price + serviceFee : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f6fa" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <Text style={styles.titleLine1}>Experience</Text>
          <Text style={styles.titleLine2}>Pristine Perfection</Text>
          <Text style={styles.subtitle}>Premium car care, simplified.</Text>
        </View>

        {/* Plans Section */}
        {plans.length === 0 ? (
          <Surface style={styles.emptyBanner} elevation={1}>
            <MaterialCommunityIcons name="tag-off-outline" size={28} color={colors.outline} />
            <Text style={styles.emptyText}>No subscription plans are available right now.</Text>
          </Surface>
        ) : (
          <View style={styles.plansContainer}>
            {plans.map((plan, index) => {
              const isSelected = selectedPlan?.id === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={styles.planCard}
                  onPress={() => setSelectedPlan(plan)}
                  activeOpacity={0.9}
                >
                  <View style={styles.planCardContent}>
                    {/* Badge */}
                    {index === 0 && (
                      <View style={styles.bestValueBadge}>
                        <Text style={styles.bestValueText}>BEST VALUE</Text>
                      </View>
                    )}
                    
                    {/* Icon */}
                    <View style={styles.planIconContainer}>
                      <MaterialCommunityIcons name="water-outline" size={40} color="#ffffff" />
                    </View>

                    {/* Details */}
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planDesc}>{plan.description}</Text>

                    {/* Pills */}
                    <View style={styles.pillsRow}>
                      <View style={styles.pill}>
                        <MaterialCommunityIcons name="check" size={12} color={colors.primary} />
                        <Text style={styles.pillText}>MONTHLY WASHES</Text>
                      </View>
                      <View style={styles.pill}>
                        <MaterialCommunityIcons name="check" size={12} color={colors.primary} />
                        <Text style={styles.pillText}>TIRE SHINE</Text>
                      </View>
                    </View>

                    <View style={styles.planDivider} />

                    {/* Price */}
                    <View style={styles.priceRow}>
                      <Text style={styles.priceCurrency}>₹</Text>
                      <Text style={styles.priceValue}>{plan.price}</Text>
                      <Text style={styles.priceMo}>/mo</Text>
                    </View>

                    {isSelected && <Text style={styles.selectedLabel}>SELECTED</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Why Choose Section */}
        <View style={styles.whyChooseSection}>
          <Text style={styles.sectionHeader}>WHY CHOOSE WASHFLOW</Text>
          
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="speedometer" size={24} color={colors.primary} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Express Priority</Text>
              <Text style={styles.featureDesc}>Skip the lines with our member-only lanes.</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="leaf" size={24} color={colors.primary} />
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Eco-Friendly Tech</Text>
              <Text style={styles.featureDesc}>Advanced water reclamation systems.</Text>
            </View>
          </View>
        </View>

        {/* Vehicle Details */}
        <View style={styles.vehicleSection}>
          <View style={styles.vehicleHeaderRow}>
            <Text style={styles.vehicleHeader}>Vehicle Details</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddCar')}>
              <Text style={styles.addVehicleLink}>
                <MaterialCommunityIcons name="plus-circle-outline" size={14} /> ADD NEW
              </Text>
            </TouchableOpacity>
          </View>

          {cars.length === 0 ? (
            <Surface style={styles.emptyBanner} elevation={1}>
              <MaterialCommunityIcons name="car-off" size={28} color={colors.outline} />
              <View style={styles.emptyContent}>
                <Text style={styles.emptyText}>No cars registered. Add a car first.</Text>
              </View>
            </Surface>
          ) : (
            cars.map((car) => {
              const isSelected = selectedCar?.id === car.id;
              const displayModel = [car.make, car.model].filter(Boolean).join(' ').trim() || 'Vehicle';
              const prompt = `A professional, high quality photo of a ${car.color || ''} ${car.make || ''} ${car.model || ''} car.`;
              const carImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=200&height=120&nologo=true`;

              return (
                <TouchableOpacity
                  key={car.id}
                  style={[styles.carCard, isSelected && styles.carCardSelected]}
                  onPress={() => setSelectedCar(car)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: carImageUrl }} style={styles.carImageThumb} />
                  <View style={styles.carInfo}>
                    <Text style={styles.carMakeModel}>{displayModel}</Text>
                    <Text style={styles.carMeta}>
                      {car.licensePlate} • {(car.color || 'Unknown').toUpperCase()}
                    </Text>
                  </View>
                  <MaterialCommunityIcons 
                    name={isSelected ? "check-circle" : "circle-outline"} 
                    size={24} 
                    color={isSelected ? colors.primary : colors.outlineVariant} 
                  />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.orderSummarySection}>
          <Text style={styles.summaryHeader}>ORDER SUMMARY</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryItemLabel}>{selectedPlan ? `${selectedPlan.name} (Monthly)` : 'Select a plan'}</Text>
            <Text style={styles.summaryItemValue}>₹{selectedPlan ? selectedPlan.price.toFixed(2) : '0.00'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryItemLabel}>Service Fee</Text>
            <Text style={styles.summaryItemValue}>₹{serviceFee.toFixed(2)}</Text>
          </View>

          <View style={styles.totalDivider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              onPress={!selectedCar || !selectedPlan || subscribing ? undefined : handleSubscribe}
              onPressIn={handleButtonPressIn}
              onPressOut={handleButtonPressOut}
              style={[styles.animatedButton, (!selectedCar || !selectedPlan || subscribing) && styles.animatedButtonDisabled]}
            >
              {subscribing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              )}
              <Text style={styles.animatedButtonText}>
                {subscribing ? 'Processing...' : 'Complete Subscription'}
              </Text>
            </Pressable>
          </Animated.View>

          <Text style={styles.recurringText}>RECURRING BILLING. CANCEL ANYTIME.</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f6fa' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  titleLine1: { fontSize: 32, fontWeight: '400', color: colors.primary, lineHeight: 38 },
  titleLine2: { fontSize: 32, fontWeight: '700', color: colors.onSurface, lineHeight: 38 },
  subtitle: { fontSize: 16, color: colors.outline, marginTop: 8 },
  
  plansContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  planCardContent: {
    alignItems: 'center',
    width: '100%',
  },
  bestValueBadge: {
    position: 'absolute',
    top: -12,
    right: -12,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 2,
  },
  bestValueText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#1b2a75',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1b2a75',
    marginBottom: 8,
  },
  planDesc: {
    fontSize: 13,
    color: colors.outline,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
    marginBottom: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 4,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1b2a75',
  },
  planDivider: {
    width: 48,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1b2a75',
  },
  priceValue: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1b2a75',
  },
  priceMo: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.outline,
    marginLeft: 4,
  },
  selectedLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1b2a75',
    marginTop: 8,
    letterSpacing: 1,
  },

  whyChooseSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: colors.outline,
    lineHeight: 18,
  },

  vehicleSection: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginHorizontal: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  vehicleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  vehicleHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  addVehicleLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  carCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 16,
  },
  carCardSelected: {
    borderColor: '#1b2a75',
    backgroundColor: '#f8fafc',
  },
  carImageThumb: {
    width: 64,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  carInfo: {
    flex: 1,
  },
  carMakeModel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 2,
  },
  carMeta: {
    fontSize: 11,
    color: colors.outline,
    fontWeight: '500',
  },

  orderSummarySection: {
    backgroundColor: '#f8fafc',
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItemLabel: {
    fontSize: 13,
    color: '#4b5563',
  },
  summaryItemValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1b2a75',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1b2a75',
  },
  completeButton: {
    marginTop: 24,
    borderRadius: 12,
  },
  completeButtonContent: {
    paddingVertical: 10,
    flexDirection: 'row-reverse',
  },
  completeButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  recurringText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  emptyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    backgroundColor: colors.surfaceContainerLow,
    gap: 10,
    marginBottom: 16,
  },
  emptyContent: { flex: 1 },
  emptyText: { fontSize: 14, color: colors.outline, fontWeight: '600', flex: 1 },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
    gap: 8,
  },
  errorText: { color: colors.error, fontSize: 13, flex: 1, marginLeft: 4 },

  successContainer: {
    flex: 1,
    padding: 24,
    paddingBottom: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: { fontSize: 28, fontWeight: '900', color: colors.onSurface, textAlign: 'center' },
  successSub: {
    fontSize: 15,
    color: colors.outline,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  successSubHighlight: { fontWeight: '800', color: colors.onSurface },
  successSummary: {
    width: '100%',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 18,
    marginTop: 24,
  },
  summaryLabel: { fontSize: 14, color: colors.outline, flex: 1 },
  summaryValue: { fontSize: 14, fontWeight: '700', color: colors.onSurface, flex: 1, textAlign: 'right' },
  successButton: { borderRadius: 12, marginTop: 24, width: '100%' },

  animatedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
    marginTop: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  animatedButtonDisabled: {
    backgroundColor: colors.outline,
    shadowOpacity: 0,
    elevation: 0,
  },
  animatedButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
