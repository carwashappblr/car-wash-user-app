import React, { useState, useEffect, useCallback } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, Surface, Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { StatusBadge } from '../../components/StatusBadge';
import { PremiumLoader } from '../../components/PremiumLoader';
import {
  instantWashService,
  InstantWash,
  InstantWashPricing,
  CarType,
  WashType,
  PaymentStatus,
  TaskStatus,
} from '../../services/instantWashService';
import { useAuth } from '../../store/AuthContext';

const formatScheduledDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

const formatCompletedDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

export const InstantWashScreen = () => {
  const { user } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('list');

  // Form State
  const [plateNumber, setPlateNumber] = useState('');
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carType, setCarType] = useState<CarType>('HATCHBACK');
  const [washType, setWashType] = useState<WashType>('EXTERIOR');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('UNPAID');
  const [notes, setNotes] = useState('');

  // UI state
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // List State
  const [washes, setWashes] = useState<InstantWash[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  // Pricing configurations loaded from backend
  const [pricings, setPricings] = useState<InstantWashPricing[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  const loadWashes = useCallback(async () => {
    try {
      setListError(null);
      const res = await instantWashService.getMyTowerWashes();
      setWashes(res.data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setListError('This machine is not assigned to a tower.');
      } else {
        setListError(
          err.response?.data?.message || err.message || 'Failed to load washes.'
        );
      }
      console.error('[InstantWashScreen] Load washes error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Pricing Options
  const fetchPricing = useCallback(async () => {
    setLoadingPricing(true);
    setPricingError(null);
    try {
      const res = await instantWashService.getPricingOptions();
      setPricings(res.data);

      if (res.data.length > 0) {
        // Find first available carType and its washType to prevent invalid combinations
        const first = res.data[0];
        setCarType(first.carType);
        setWashType(first.washType);
      }
    } catch (err: any) {
      setPricingError(
        err.response?.data?.message || err.message || 'Failed to load pricing options.'
      );
      console.error('[InstantWashScreen] Fetch pricing error', err);
    } finally {
      setLoadingPricing(false);
    }
  }, []);

  // Load pricing on mount, washes on active list tab change
  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  useEffect(() => {
    if (activeTab === 'list') {
      setLoading(true);
      loadWashes();
    }
  }, [activeTab, loadWashes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadWashes(), fetchPricing()]);
    setRefreshing(false);
  };

  const handleCarTypeChange = (type: CarType) => {
    setCarType(type);
    // Find valid pricings for this new car type
    const valid = pricings.filter((p) => p.carType === type);
    if (valid.length > 0) {
      // Check if current washType is valid for this new car type
      const currentIsValid = valid.some((p) => p.washType === washType);
      if (!currentIsValid) {
        setWashType(valid[0].washType);
      }
    }
  };

  const handleSubmit = async () => {
    if (!plateNumber.trim()) {
      setFormError('Plate number is required');
      return;
    }
    setFormError(null);
    setIsSubmitting(true);
    try {
      await instantWashService.createInstantWash({
        plateNumber: plateNumber.toUpperCase().trim(),
        carType,
        washType,
        carMake: carMake.trim() || undefined,
        carModel: carModel.trim() || undefined,
        paymentStatus,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setPlateNumber('');
      setCarMake('');
      setCarModel('');
      setCarType('HATCHBACK');
      setWashType('EXTERIOR');
      setPaymentStatus('UNPAID');
      setNotes('');

      // Redirect to list
      setActiveTab('list');
    } catch (err: any) {
      setFormError(
        err.response?.data?.message || err.message || 'Failed to create instant wash task.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: TaskStatus) => {
    setUpdatingId(id);
    try {
      const res = await instantWashService.updateInstantWash(id, { status });
      setWashes((prev) => prev.map((w) => (w.id === id ? res.data : w)));
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdatePayment = async (id: string, currentStatus: PaymentStatus) => {
    setUpdatingId(id);
    const nextPaymentStatus: PaymentStatus = currentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    try {
      const res = await instantWashService.updateInstantWash(id, { paymentStatus: nextPaymentStatus });
      setWashes((prev) => prev.map((w) => (w.id === id ? res.data : w)));
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to update payment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper validation methods for Form selection
  const isCarTypeEnabled = (type: CarType) => pricings.some((p) => p.carType === type);
  const isWashTypeEnabled = (type: WashType) =>
    pricings.some((p) => p.carType === carType && p.washType === type);

  const getCarTypeDisplayPrice = (type: CarType) => {
    const exactMatch = pricings.find((p) => p.carType === type && p.washType === washType);
    if (exactMatch) return exactMatch.price;
    const firstAvailable = pricings.find((p) => p.carType === type);
    return firstAvailable?.price;
  };

  const getWashTypeDisplayPrice = (type: WashType) => {
    const match = pricings.find((p) => p.carType === carType && p.washType === type);
    return match?.price;
  };

  const activePricing = pricings.find((p) => p.carType === carType && p.washType === washType);
  const noPlansAvailable = pricings.length === 0;

  if (loading && activeTab === 'list') {
    return <PremiumLoader message="Loading instant washes..." />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryContainer} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="car-wash" size={24} color={colors.onPrimaryFixed} />
          </View>
          <View>
            <Text style={styles.headerLabel}>INSTANT WASH</Text>
            <Text style={styles.headerSub}>{user?.email}</Text>
          </View>
        </View>
        <View style={styles.tabButtons}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'list' && styles.tabButtonActive]}
            onPress={() => setActiveTab('list')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'list' && styles.tabButtonTextActive]}>
              Active
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'form' && styles.tabButtonActive,
              noPlansAvailable && !loadingPricing && styles.tabButtonDisabled,
            ]}
            onPress={() => {
              if (!noPlansAvailable) {
                setActiveTab('form');
              }
            }}
            disabled={noPlansAvailable && !loadingPricing}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'form' && styles.tabButtonTextActive,
                noPlansAvailable && !loadingPricing && styles.tabButtonTextDisabled,
              ]}
            >
              New Wash
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'list' ? (
        <ScrollView
          style={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          showsVerticalScrollIndicator={false}
        >
          {listError && (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{listError}</Text>
            </View>
          )}

          {noPlansAvailable && !loadingPricing && (
            <View style={[styles.warningBox, { marginHorizontal: 16, marginTop: 12, marginBottom: 6 }]}>
              <MaterialCommunityIcons name="alert" size={20} color="#B45309" />
              <Text style={styles.warningText}>
                No instant wash pricing plans have been configured by the administrator for this community. Bookings are temporarily disabled.
              </Text>
            </View>
          )}

          {washes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="car-wash" size={50} color={colors.outline} />
              <Text style={styles.emptyTitle}>No Instant Washes Yet</Text>
              <Text style={styles.emptySub}>
                Use the 'New Wash' tab to create a walk-in wash ticket for this community.
              </Text>
            </View>
          ) : (
            washes.map((wash) => {
              const carName = [wash.carMake, wash.carModel].filter(Boolean).join(' ').trim() || 'Guest Car';
              const canStart = wash.status === 'PENDING';
              const canComplete = wash.status === 'IN_PROGRESS';
              const isUpdating = updatingId === wash.id;

              return (
                <Surface key={wash.id} style={styles.card} elevation={1}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleRow}>
                      <MaterialCommunityIcons name="car" size={20} color={colors.primary} />
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {carName}
                      </Text>
                    </View>
                    <StatusBadge status={wash.status} size="small" />
                  </View>

                  <View style={styles.cardRow}>
                    <Text style={styles.plateNumber}>{wash.plateNumber}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceText}>₹{wash.price}</Text>
                      <TouchableOpacity
                        style={[
                          styles.paymentBadge,
                          wash.paymentStatus === 'PAID' ? styles.paymentPaid : styles.paymentUnpaid,
                        ]}
                        onPress={() => handleUpdatePayment(wash.id, wash.paymentStatus)}
                        disabled={isUpdating}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.paymentText,
                            wash.paymentStatus === 'PAID' ? styles.paymentPaidText : styles.paymentUnpaidText,
                          ]}
                        >
                          {wash.paymentStatus}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.metaInfo}>
                    <View style={styles.metaRow}>
                      <MaterialCommunityIcons name="car-info" size={14} color={colors.outline} />
                      <Text style={styles.metaText}>{wash.carType} • {wash.washType.replace('_', ' ')}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color={colors.outline} />
                      <Text style={styles.metaText}>
                        {wash.status === 'COMPLETED'
                          ? `Completed ${formatCompletedDate(wash.completedOn || wash.scheduledDate)}`
                          : `Scheduled ${formatScheduledDate(wash.scheduledDate)}`}
                      </Text>
                    </View>
                    {wash.notes ? (
                      <View style={styles.notesBox}>
                        <Text style={styles.notesText}>{wash.notes}</Text>
                      </View>
                    ) : null}
                  </View>

                  {wash.status !== 'COMPLETED' && wash.status !== 'CANCELLED' && (
                    <View style={styles.cardActions}>
                      {canStart && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.startBtn]}
                          onPress={() => handleUpdateStatus(wash.id, 'IN_PROGRESS')}
                          disabled={isUpdating}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons name="play" size={16} color={colors.onPrimary} />
                          <Text style={styles.actionBtnText}>{isUpdating ? 'Starting...' : 'Start Wash'}</Text>
                        </TouchableOpacity>
                      )}
                      {canComplete && (
                        <TouchableOpacity
                          style={[styles.actionBtn, styles.completeBtn]}
                          onPress={() => handleUpdateStatus(wash.id, 'COMPLETED')}
                          disabled={isUpdating}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons name="check" size={16} color={colors.onSecondary} />
                          <Text style={styles.actionBtnText}>{isUpdating ? 'Completing...' : 'Mark Completed'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </Surface>
              );
            })
          )}
          <View style={{ height: 24 }} />
        </ScrollView>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.formScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {loadingPricing ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Fetching community plan pricing...</Text>
              </View>
            ) : pricingError ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={styles.errorText}>{pricingError}</Text>
              </View>
            ) : noPlansAvailable ? (
              <View style={styles.warningBox}>
                <MaterialCommunityIcons name="alert" size={20} color="#B45309" />
                <Text style={styles.warningText}>
                  No instant wash pricing plans have been configured by the administrator for this community. Bookings are temporarily disabled.
                </Text>
              </View>
            ) : null}

            {formError && (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            {/* License Plate */}
            <TextInput
              disabled={noPlansAvailable || loadingPricing}
              label="License Plate Number *"
              mode="outlined"
              value={plateNumber}
              onChangeText={(text) => setPlateNumber(text.toUpperCase())}
              autoCapitalize="characters"
              placeholder="e.g. KA01AB1234"
              style={styles.input}
              left={<TextInput.Icon icon="card-text-outline" />}
            />

            {/* Vehicle Details */}
            <View style={styles.rowInputs}>
              <TextInput
                disabled={noPlansAvailable || loadingPricing}
                label="Make (Optional)"
                mode="outlined"
                value={carMake}
                onChangeText={setCarMake}
                placeholder="e.g. Maruti"
                style={[styles.input, { flex: 1, marginRight: 8 }]}
                left={<TextInput.Icon icon="factory" />}
              />
              <TextInput
                disabled={noPlansAvailable || loadingPricing}
                label="Model (Optional)"
                mode="outlined"
                value={carModel}
                onChangeText={setCarModel}
                placeholder="e.g. Swift"
                style={[styles.input, { flex: 1 }]}
                left={<TextInput.Icon icon="car-outline" />}
              />
            </View>

            {/* Car Type Selector */}
            <Text style={styles.fieldLabel}>Car Type *</Text>
            <View style={styles.chipGrid}>
              {(['HATCHBACK', 'SEDAN', 'SUV'] as const).map((type) => {
                const isSelected = carType === type;
                const isEnabled = isCarTypeEnabled(type) && !noPlansAvailable && !loadingPricing;
                const icon = type === 'HATCHBACK' ? 'car-hatchback' : type === 'SEDAN' ? 'car-sports' : 'car-suv';
                const priceValue = getCarTypeDisplayPrice(type);
                return (
                  <TouchableOpacity
                    key={type}
                    disabled={!isEnabled}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                      !isEnabled && styles.chipDisabled,
                    ]}
                    onPress={() => handleCarTypeChange(type)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={icon as any}
                      size={20}
                      color={isSelected ? '#FFFFFF' : (isEnabled ? colors.primary : '#94A3B8')}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                        !isEnabled && styles.chipTextDisabled,
                      ]}
                    >
                      {type}
                    </Text>
                    {isEnabled && priceValue !== undefined && (
                      <Text
                        style={[
                          styles.chipPrice,
                          isSelected ? styles.chipPriceSelected : styles.chipPriceNormal,
                        ]}
                      >
                        ₹{priceValue}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Wash Type Selector */}
            <Text style={styles.fieldLabel}>Wash Type *</Text>
            <View style={styles.chipGrid}>
              {(['EXTERIOR', 'EXTERIOR_INTERIOR', 'PREMIUM'] as const).map((type) => {
                const isSelected = washType === type;
                const isEnabled = isWashTypeEnabled(type) && !noPlansAvailable && !loadingPricing;
                const label = type === 'EXTERIOR' ? 'Exterior' : type === 'EXTERIOR_INTERIOR' ? 'Ext & Int' : 'Premium';
                const priceValue = getWashTypeDisplayPrice(type);
                return (
                  <TouchableOpacity
                    key={type}
                    disabled={!isEnabled}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                      !isEnabled && styles.chipDisabled,
                    ]}
                    onPress={() => setWashType(type)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={type === 'PREMIUM' ? 'crown-outline' : 'water-outline'}
                      size={20}
                      color={isSelected ? '#FFFFFF' : (isEnabled ? colors.primary : '#94A3B8')}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                        !isEnabled && styles.chipTextDisabled,
                      ]}
                    >
                      {label}
                    </Text>
                    {isEnabled && priceValue !== undefined && (
                      <Text
                        style={[
                          styles.chipPrice,
                          isSelected ? styles.chipPriceSelected : styles.chipPriceNormal,
                        ]}
                      >
                        ₹{priceValue}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Payment Status Selector */}
            <Text style={styles.fieldLabel}>Payment Status *</Text>
            <View style={styles.chipGrid}>
              {(['UNPAID', 'PAID'] as const).map((status) => {
                const isSelected = paymentStatus === status;
                const isEnabled = !noPlansAvailable && !loadingPricing;
                return (
                  <TouchableOpacity
                    key={status}
                    disabled={!isEnabled}
                    style={[
                      styles.chip,
                      isSelected && (status === 'PAID' ? styles.chipPaidSelected : styles.chipUnpaidSelected),
                      !isEnabled && styles.chipDisabled,
                    ]}
                    onPress={() => setPaymentStatus(status)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={status === 'PAID' ? 'cash-check' : 'cash-remove'}
                      size={18}
                      color={
                        isSelected
                          ? '#FFFFFF'
                          : isEnabled
                          ? status === 'PAID'
                            ? colors.secondary
                            : colors.error
                          : '#94A3B8'
                      }
                    />
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                        !isSelected && isEnabled && { color: status === 'PAID' ? colors.secondary : colors.error },
                        !isEnabled && styles.chipTextDisabled,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Notes */}
            <TextInput
              disabled={noPlansAvailable || loadingPricing}
              label="Notes / Instructions (Optional)"
              mode="outlined"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              placeholder="e.g. wash tires thoroughly"
              style={styles.input}
              left={<TextInput.Icon icon="note-text-outline" />}
            />

            {/* Price Summary */}
            {activePricing && (
              <Surface style={styles.priceSummaryCard} elevation={1}>
                <View style={styles.priceSummaryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.priceSummaryLabel}>Total Price</Text>
                    <Text style={styles.priceSummarySubText}>
                      Flat rate for {carType} • {washType.replace('_', ' ')}
                    </Text>
                  </View>
                  <Text style={styles.priceSummaryValue}>₹{activePricing.price}</Text>
                </View>
              </Surface>
            )}

            {/* Submit Button */}
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || !plateNumber.trim() || noPlansAvailable || !activePricing || loadingPricing}
              style={styles.submitBtn}
              contentStyle={styles.submitBtnContent}
              buttonColor={colors.primary}
            >
              Register & Start Task
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primaryContainer,
  },
  header: {
    backgroundColor: colors.primaryContainer,
    padding: 18,
    flexDirection: 'column',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onPrimaryContainer,
    letterSpacing: 2,
  },
  headerSub: {
    fontSize: 13,
    color: colors.onPrimary,
    fontWeight: '600',
    marginTop: 1,
  },
  tabButtons: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#1E1B4B',
  },
  tabButtonDisabled: {
    opacity: 0.4,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  tabButtonTextDisabled: {
    color: '#64748B',
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  formScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onSurface,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: colors.outline,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    maxWidth: 280,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    gap: 6,
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
    flex: 1,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 8,
  },
  warningText: {
    color: '#B45309',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    flex: 1,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
  card: {
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: colors.surfaceContainerLowest,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.onSurface,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  plateNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.onSurface,
  },
  paymentBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  paymentPaid: {
    backgroundColor: '#D1FAE5',
  },
  paymentUnpaid: {
    backgroundColor: '#FEE2E2',
  },
  paymentText: {
    fontSize: 10,
    fontWeight: '800',
  },
  paymentPaidText: {
    color: '#059669',
  },
  paymentUnpaidText: {
    color: '#DC2626',
  },
  metaInfo: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainerHigh,
    paddingTop: 8,
    gap: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: colors.outline,
  },
  notesBox: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  notesText: {
    fontSize: 12,
    color: colors.onSurfaceVariant,
    lineHeight: 16,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 6,
  },
  startBtn: {
    backgroundColor: colors.primary,
  },
  completeBtn: {
    backgroundColor: colors.secondary,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    marginBottom: 12,
    backgroundColor: colors.surfaceContainerLowest,
  },
  rowInputs: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.outline,
    marginTop: 4,
    marginBottom: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surfaceContainerLowest,
    gap: 4,
  },
  chipPrice: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 1,
  },
  chipPriceNormal: {
    color: colors.primary,
  },
  chipPriceSelected: {
    color: '#E0E7FF',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipPaidSelected: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  chipUnpaidSelected: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  chipDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.45,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onSurface,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  chipTextDisabled: {
    color: '#94A3B8',
  },
  priceSummaryCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    marginBottom: 20,
  },
  priceSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceSummaryLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#312E81',
  },
  priceSummarySubText: {
    fontSize: 11,
    color: '#4338CA',
    marginTop: 2,
    fontWeight: '600',
  },
  priceSummaryValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E1B4B',
  },
  submitBtn: {
    borderRadius: 10,
    marginTop: 4,
  },
  submitBtnContent: {
    paddingVertical: 6,
  },
});
