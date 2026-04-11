import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Text, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { taskService, Task, TaskStatus } from '../../services/taskService';
import { TaskCard } from '../../components/TaskCard';
import { EmptyState } from '../../components/EmptyState';

const FILTER_OPTIONS: { label: string; value: TaskStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

export const MyTasksScreen = () => {
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

  const filtered = filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#1E40AF" /></View>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>My Bookings</Text>
        <Text style={styles.pageCount}>{tasks.length} total</Text>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((opt) => {
          const count = opt.value === 'ALL'
            ? tasks.length
            : tasks.filter((t) => t.status === opt.value).length;
          return (
            <Chip
              key={opt.value}
              selected={filter === opt.value}
              onPress={() => setFilter(opt.value)}
              style={[
                styles.chip,
                filter === opt.value && styles.chipSelected,
              ]}
              textStyle={[
                styles.chipText,
                filter === opt.value && styles.chipTextSelected,
              ]}
              showSelectedCheck={false}
            >
              {opt.label} {count > 0 ? `(${count})` : ''}
            </Chip>
          );
        })}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1E40AF" />
        }
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-text-off-outline"
            title="No bookings found"
            subtitle={
              filter !== 'ALL'
                ? `No ${filter.replace('_', ' ').toLowerCase()} tasks`
                : 'Book your first car wash from the Book Wash tab!'
            }
          />
        }
        contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingVertical: 8, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
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
  pageTitle: { fontSize: 24, fontWeight: '900', color: '#0F172A' },
  pageCount: { fontSize: 14, color: '#94A3B8', fontWeight: '600' },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chip: {
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 0,
  },
  chipSelected: {
    backgroundColor: '#1E40AF',
  },
  chipText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
  },
});
