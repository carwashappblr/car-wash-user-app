import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Text, FAB, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { carService, Car } from '../../services/carService';
import { CarCard } from '../../components/CarCard';
import { EmptyState } from '../../components/EmptyState';
import { UserStackParamList } from '../../navigation/types';

type NavProp = NativeStackNavigationProp<UserStackParamList>;

export const MyCarsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCars = useCallback(async () => {
    try {
      setError(null);
      const res = await carService.getCars();
      setCars(res.data);
    } catch (e: any) {
      console.error('[MyCarsScreen] error', e);
      setError('Failed to load cars. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCars();
  }, [loadCars]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCars();
    setRefreshing(false);
  };

  // Refresh when coming back from AddCar
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadCars);
    return unsubscribe;
  }, [navigation, loadCars]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>My Cars</Text>
        <Text style={styles.pageCount}>{cars.length} vehicle{cars.length !== 1 ? 's' : ''}</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={cars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CarCard car={item} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E40AF" />}
        ListEmptyComponent={
          <EmptyState
            icon="car-off"
            title="No Cars Yet"
            subtitle="Add your car to start booking washes. Tap the + button below."
          />
        }
        contentContainerStyle={cars.length === 0 ? { flex: 1 } : { paddingTop: 8, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddCar')}
        color="#FFFFFF"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
  },
  pageCount: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    margin: 16,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
    marginLeft: 6,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: '#1E40AF',
  },
});
