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
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { taskService, Task, TaskStatus } from '../../services/taskService';
import { TaskCard } from '../../components/TaskCard';
import { EmptyState } from '../../components/EmptyState';

const FILTER_OPTIONS: { label: string; value: TaskStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
];

export const MachineTasksScreen = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      const res = await taskService.getMyTasks();
      setTasks(res.data);
    } catch (e: any) {
      setError('Failed to load tasks. Pull down to retry.');
      console.error('[MachineTasksScreen]', e);
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

  const handleStartTask = async (task: Task) => {
    try {
      setUpdatingId(task.id);
      await taskService.updateTaskStatus(task.id, 'IN_PROGRESS');
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'IN_PROGRESS' } : t))
      );
    } catch (e: any) {
      const msg = e.response?.data?.message ?? 'Failed to update task';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCompleteTask = async (task: Task) => {
    try {
      setUpdatingId(task.id);
      await taskService.updateTaskStatus(task.id, 'COMPLETED');
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: 'COMPLETED' } : t))
      );
    } catch (e: any) {
      const msg = e.response?.data?.message ?? 'Failed to update task';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: '#1E1B4B' }]}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Task Queue</Text>
          <Text style={styles.pageCount}>{tasks.length} assigned task{tasks.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerBadge}>
          <MaterialCommunityIcons name="robot" size={18} color="#7C3AED" />
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((opt) => {
          const count =
            opt.value === 'ALL'
              ? tasks.length
              : tasks.filter((t) => t.status === opt.value).length;
          return (
            <Chip
              key={opt.value}
              selected={filter === opt.value}
              onPress={() => setFilter(opt.value)}
              style={[styles.chip, filter === opt.value && styles.chipSelected]}
              textStyle={[styles.chipText, filter === opt.value && styles.chipTextSelected]}
              showSelectedCheck={false}
            >
              {opt.label} {count > 0 ? `(${count})` : ''}
            </Chip>
          );
        })}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#DC2626" />
          <Text style={{ color: '#DC2626', fontSize: 12, marginLeft: 6, flex: 1 }}>{error}</Text>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            showActions
            onStartTask={handleStartTask}
            onCompleteTask={handleCompleteTask}
            isUpdating={updatingId === item.id}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-text-off-outline"
            title="No Tasks Found"
            subtitle={
              filter !== 'ALL'
                ? `No ${filter.replace('_', ' ').toLowerCase()} tasks at the moment`
                : 'No tasks have been assigned to this machine yet.'
            }
          />
        }
        contentContainerStyle={
          filtered.length === 0 ? { flex: 1 } : { paddingVertical: 8, paddingBottom: 24 }
        }
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
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pageTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  pageCount: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  chip: { borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 0 },
  chipSelected: { backgroundColor: '#7C3AED' },
  chipText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  chipTextSelected: { color: '#FFFFFF' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    margin: 10,
    borderRadius: 10,
    padding: 10,
  },
});
