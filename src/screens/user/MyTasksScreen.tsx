import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Image,
  ScrollView
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { taskService, Task, TaskStatus } from '../../services/taskService';
import { TaskCard } from '../../components/TaskCard';
import { EmptyState } from '../../components/EmptyState';
import { UserStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { PremiumLoader } from '../../components/PremiumLoader';

const FILTER_OPTIONS: { label: string; value: TaskStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

type NavigationProp = NativeStackNavigationProp<UserStackParamList>;

export const MyTasksScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      const res = await taskService.getMyTasks();
      setTasks(res.data);
    } catch (e: any) {
      setError('Failed to load tasks.');
      console.error('[MyTasksScreen]', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };

  if (loading) {
    return <PremiumLoader message="Syncing your records..." />;
  }

  const filtered = filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* TopAppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Wash History</Text>
        </View>
        <View style={styles.profilePicContainer}>
          <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
        </View>
      </View>

      {/* Segmented Filter Pills */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTER_OPTIONS.map((opt) => {
            const isSelected = filter === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.filterPill,
                  isSelected ? styles.filterPillSelected : styles.filterPillInactive
                ]}
                onPress={() => setFilter(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterPillText,
                  isSelected ? styles.filterPillTextSelected : styles.filterPillTextInactive
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={{ color: '#DC2626', fontSize: 13 }}>{error}</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskCard task={item} showActions={false} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="car-wash"
            title="No bookings found"
            subtitle={
              filter !== 'ALL'
                ? `No ${filter.replace('_', ' ').toLowerCase()} tasks`
                : 'Book your first car wash by tapping the + button!'
            }
          />
        }
        contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingVertical: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('UserTabs', { screen: 'BookWash' })}
      >
        <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceContainerLow },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceContainerLow },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: colors.primary,
    letterSpacing: -0.5,
  },
  profilePicContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  filterScroll: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterPillSelected: {
    backgroundColor: colors.primary,
  },
  filterPillInactive: {
    backgroundColor: '#FFFFFF',
  },
  filterPillText: {
    fontSize: 15,
    fontWeight: '600',
  },
  filterPillTextSelected: {
    color: '#FFFFFF',
  },
  filterPillTextInactive: {
    color: colors.onSurfaceVariant,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    marginHorizontal: 24,
    marginTop: 8,
    borderRadius: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB', // blue-600
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#BFDBFE', // blue-200
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  }
});
