import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { taskService, Task } from '../../services/taskService';
import { useAuth } from '../../store/AuthContext';
import { TaskCard } from '../../components/TaskCard';

const isToday = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
};

export const MachineDashboardScreen = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      const res = await taskService.getMyTasks();
      setTasks(res.data);
    } catch (e: any) {
      setError('Failed to load tasks. Pull to retry.');
      console.error('[MachineDashboard]', e);
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
    } catch (e) {
      console.error('[MachineDashboard] start task error', e);
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
    } catch (e) {
      console.error('[MachineDashboard] complete task error', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const todayTasks = tasks.filter((t) => isToday(t.createdAt));
  const pendingCount = todayTasks.filter((t) => t.status === 'PENDING').length;
  const inProgressCount = todayTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedCount = todayTasks.filter((t) => t.status === 'COMPLETED').length;
  const activeTasks = todayTasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: '#0F0A30' }]}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1B4B" />
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.machineIconWrap}>
              <MaterialCommunityIcons name="robot" size={28} color="#C4B5FD" />
            </View>
            <View>
              <Text style={styles.machineLabel}>MACHINE PORTAL</Text>
              <Text style={styles.machineName}>{user?.email}</Text>
            </View>
          </View>
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>

        {/* Date Banner */}
        <View style={styles.dateBanner}>
          <MaterialCommunityIcons name="calendar-today" size={16} color="#A78BFA" />
          <Text style={styles.dateText}>{today}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <MachineStatCard
            icon="clock-outline"
            label="Pending"
            value={pendingCount}
            bg="#FEF3C7"
            color="#D97706"
          />
          <MachineStatCard
            icon="play-circle-outline"
            label="In Progress"
            value={inProgressCount}
            bg="#DBEAFE"
            color="#1D4ED8"
          />
          <MachineStatCard
            icon="check-circle-outline"
            label="Done"
            value={completedCount}
            bg="#D1FAE5"
            color="#059669"
          />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={{ color: '#DC2626', fontSize: 13, marginLeft: 6, flex: 1 }}>{error}</Text>
          </View>
        )}

        {/* Active Tasks */}
        <Text style={styles.sectionTitle}>
          {activeTasks.length > 0
            ? `Active Tasks (${activeTasks.length})`
            : "Today's Queue"}
        </Text>

        {activeTasks.length === 0 ? (
          <View style={styles.emptyToday}>
            <MaterialCommunityIcons name="check-all" size={40} color="#6EE7B7" />
            <Text style={styles.emptyTodayTitle}>All Clear!</Text>
            <Text style={styles.emptyTodaySub}>No pending tasks for today.</Text>
          </View>
        ) : (
          activeTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              showActions
              onStartTask={handleStartTask}
              onCompleteTask={handleCompleteTask}
              isUpdating={updatingId === task.id}
            />
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const MachineStatCard = ({
  icon,
  label,
  value,
  bg,
  color,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: number;
  bg: string;
  color: string;
}) => (
  <Surface style={[styles.statCard, { backgroundColor: bg }]} elevation={0}>
    <MaterialCommunityIcons name={icon} size={22} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={[styles.statLabel, { color }]}>{label}</Text>
  </Surface>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1E1B4B' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#1E1B4B',
    padding: 20,
    paddingBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  machineIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(124,58,237,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  machineLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A78BFA',
    letterSpacing: 2,
  },
  machineName: { fontSize: 14, color: '#E0E7FF', fontWeight: '600', marginTop: 2 },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  onlineText: { fontSize: 12, color: '#6EE7B7', fontWeight: '700' },
  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  dateText: { fontSize: 13, fontWeight: '700', color: '#5B21B6' },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: { fontSize: 22, fontWeight: '900', marginTop: 4 },
  statLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    margin: 16,
  },
  emptyToday: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyTodayTitle: { fontSize: 18, fontWeight: '800', color: '#059669', marginTop: 10 },
  emptyTodaySub: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
});
