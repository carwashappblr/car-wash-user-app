import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { carService, Car } from '../../services/carService';
import { CarCard } from '../../components/CarCard';
import { EmptyState } from '../../components/EmptyState';
import { UserStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthContext';
import { colors } from '../../theme/colors';

type NavProp = NativeStackNavigationProp<UserStackParamList>;

export const MyCarsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial = (user?.name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase();

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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadCars);
    return unsubscribe;
  }, [navigation, loadCars]);

  const renderAddVehicleCard = () => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.addVehicleCard}
      onPress={() => navigation.navigate('AddCar')}
    >
      <View style={styles.addVehicleIcon}>
        <MaterialCommunityIcons name="plus" size={32} color={colors.primary} />
      </View>
      <Text style={styles.addVehicleTitle}>Add New Vehicle</Text>
      <Text style={styles.addVehicleSubtitle}>Register another car to your garage for easier bookings.</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Top AppBar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
             <MaterialCommunityIcons name="arrow-left" size={24} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={styles.appName}>My Garage</Text>
        </View>
      </View>

      <FlatList
        data={cars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CarCard
            car={item}
            onPress={() => navigation.navigate('EditCar', { carId: item.id })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={styles.pageHeader}>
            {error && (
              <View style={styles.errorBanner}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={!loading ? renderAddVehicleCard() : null}
        ListFooterComponent={cars.length > 0 && !loading ? renderAddVehicleCard() : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Floating Action Button (FAB) - Mobile Only */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('AddCar')}
      >
        <MaterialCommunityIcons name="plus" size={32} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 58, 138, 0.05)',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: -8,
  },
  pageHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  errorText: {
    color: colors.onErrorContainer,
    fontSize: 13,
    flex: 1,
    marginLeft: 6,
  },
  listContent: {
    paddingBottom: 120,
  },
  addVehicleCard: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(220, 225, 255, 0.8)', // dotted look not supported easily in pure RN without dash component, using solid soft border
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: 'rgba(220, 225, 255, 0.2)',
  },
  addVehicleIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  addVehicleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 8,
  },
  addVehicleSubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});
