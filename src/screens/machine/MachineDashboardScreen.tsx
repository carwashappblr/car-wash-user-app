import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { taskService, PendingTowerTask, TaskStatus } from '../../services/taskService';
import { useAuth } from '../../store/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { colors } from '../../theme/colors';

const ACTIVE_TASK_STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS'];
const SCHEDULE_WINDOW_DAYS = 3;

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

const isScheduledWithinNextDays = (value: string, days: number) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + days);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
};

export const MachineDashboardScreen = () => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<PendingTowerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | null>(null);

  const loadTasks = useCallback(async (status: TaskStatus | null) => {
    try {
      setError(null);
      const statuses = status ? [status] : ACTIVE_TASK_STATUSES;
      const res = await taskService.getMyTowerTasks(statuses);
      const filtered = res.data.filter((task) => {
        if (task.status === 'PENDING') {
          return isScheduledWithinNextDays(task.scheduledDate, SCHEDULE_WINDOW_DAYS);
        }
        return task.status !== 'CANCELLED';
      });

      const sorted = [...filtered].sort((a, b) => {
        if (a.status === 'COMPLETED' && b.status === 'COMPLETED') {
          return (
            new Date(b.completedOn ?? b.createdAt).getTime() -
            new Date(a.completedOn ?? a.createdAt).getTime()
          );
        }

        if (a.status === 'COMPLETED') return 1;
        if (b.status === 'COMPLETED') return -1;

        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      });

      setTasks(sorted);
    } catch (e: any) {
      if (e.response?.status === 403) {
        setError('This machine is not assigned to a tower.');
      } else if (e.response?.status === 404) {
        setError('Machine not found. Please try again or contact support.');
      } else {
        setError(getErrorMessage(e.response?.data ?? e.message ?? 'Failed to load pending tasks.'));
      }
      console.error('[MachineDashboard]', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTasks(null); }, [loadTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTasks(selectedStatus);
    setRefreshing(false);
  };

  const shouldKeepTaskInList = useCallback(
    (task: PendingTowerTask) => {
      if (task.status === 'PENDING') {
        return isScheduledWithinNextDays(task.scheduledDate, SCHEDULE_WINDOW_DAYS);
      }
      if (selectedStatus) return task.status === selectedStatus;
      return ACTIVE_TASK_STATUSES.includes(task.status);
    },
    [selectedStatus]
  );

  const replaceOrRemoveTask = useCallback(
    (updatedTask: PendingTowerTask) => {
      setTasks((prev) => {
        if (!shouldKeepTaskInList(updatedTask)) {
          return prev.filter((task) => task.id !== updatedTask.id);
        }
        return prev.map((task) => (task.id === updatedTask.id ? updatedTask : task));
      });
    },
    [shouldKeepTaskInList]
  );

  const handleStartTask = async (task: PendingTowerTask) => {
    try {
      setUpdatingId(task.id);
      setError(null);
      const response = await taskService.updateTaskStatus<PendingTowerTask>(task.id, 'IN_PROGRESS');
      replaceOrRemoveTask(response.data);
    } catch (e: any) {
      if (e.response?.status === 403) {
        setError('This task was already started by another machine.');
      } else {
        setError(getErrorMessage(e.response?.data ?? e.message ?? 'Failed to start this task.'));
      }
      console.error('[MachineDashboard] start task error', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCompleteTask = async (task: PendingTowerTask) => {
    try {
      setUpdatingId(task.id);
      setError(null);
      const response = await taskService.updateTaskStatus<PendingTowerTask>(task.id, 'COMPLETED');
      replaceOrRemoveTask(response.data);
    } catch (e: any) {
      setError(getErrorMessage(e.response?.data ?? e.message ?? 'Failed to complete this task.'));
      console.error('[MachineDashboard] complete task error', e);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCall = useCallback(async (phone?: string | null) => {
    if (!phone) return;
    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  }, []);

  const handleStatusTilePress = useCallback(
    async (status: TaskStatus) => {
      const nextStatus = selectedStatus === status ? null : status;
      setSelectedStatus(nextStatus);
      setLoading(true);
      await loadTasks(nextStatus);
    },
    [loadTasks, selectedStatus]
  );

  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const visibleTasks = tasks.filter((task) => task.status !== 'CANCELLED');
  const sectionTitle = selectedStatus
    ? `${selectedStatus.replace('_', ' ')} Tasks (${visibleTasks.length})`
    : `Active Tasks (${visibleTasks.length})`;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryContainer} />
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.machineIconWrap}>
              <MaterialCommunityIcons name="robot" size={28} color={colors.onPrimaryFixed} />
            </View>
            <View>
              <Text style={styles.machineLabel}>MACHINE PORTAL</Text>
              <Text style={styles.machineName}>{user?.email}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
              <MaterialCommunityIcons name="logout" size={16} color={colors.onErrorContainer} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Banner */}
        <View style={styles.dateBanner}>
          <MaterialCommunityIcons name="calendar-today" size={16} color={colors.primary} />
          <Text style={styles.dateText}>{today}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <MachineStatCard
            icon="clock-outline"
            label="Pending"
            value={pendingCount}
            bg={colors.surfaceContainerHighest}
            color={colors.primary}
            selected={selectedStatus === 'PENDING'}
            onPress={() => handleStatusTilePress('PENDING')}
          />
          <MachineStatCard
            icon="play-circle-outline"
            label="In Progress"
            value={inProgressCount}
            bg={colors.primaryFixed}
            color={colors.onPrimaryFixedVariant}
            selected={selectedStatus === 'IN_PROGRESS'}
            onPress={() => handleStatusTilePress('IN_PROGRESS')}
          />
          <MachineStatCard
            icon="check-circle-outline"
            label="Done"
            value={completedCount}
            bg={colors.secondaryContainer}
            color={colors.secondary}
            selected={selectedStatus === 'COMPLETED'}
            onPress={() => handleStatusTilePress('COMPLETED')}
          />
        </View>

        {error && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={{ color: colors.error, fontSize: 13, marginLeft: 6, flex: 1 }}>{error}</Text>
          </View>
        )}

        {/* Active Tasks */}
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>

        {visibleTasks.length === 0 ? (
          <View style={styles.emptyToday}>
            <MaterialCommunityIcons name="check-all" size={40} color={colors.secondary} />
            <Text style={styles.emptyTodayTitle}>All Clear!</Text>
            <Text style={styles.emptyTodaySub}>
              {selectedStatus
                ? `No ${selectedStatus.replace('_', ' ').toLowerCase()} tasks found.`
                : 'No pending or in-progress tasks found.'}
            </Text>
          </View>
        ) : (
          visibleTasks.map((task) => (
            <MachineTaskCard
              key={task.id}
              task={task}
              onStartTask={handleStartTask}
              onCompleteTask={handleCompleteTask}
              onCall={handleCall}
              isUpdating={updatingId === task.id}
              currentMachineId={user?.machineId}
            />
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const MachineTaskCard = ({
  task,
  onStartTask,
  onCompleteTask,
  onCall,
  isUpdating,
  currentMachineId,
}: {
  task: PendingTowerTask;
  onStartTask: (task: PendingTowerTask) => void;
  onCompleteTask: (task: PendingTowerTask) => void;
  onCall: (phone?: string | null) => void;
  isUpdating: boolean;
  currentMachineId?: string;
}) => {
  const title = [task.car.make, task.car.model].filter(Boolean).join(' ').trim() || 'Vehicle';
  const isAssignedToCurrentMachine =
    !!task.machineId && !!currentMachineId && task.machineId === currentMachineId;
  const canStart = task.status === 'PENDING';
  const canComplete = task.status === 'IN_PROGRESS' && isAssignedToCurrentMachine;

  return (
    <Surface style={styles.taskCard} elevation={1}>
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleRow}>
          <MaterialCommunityIcons name="car" size={18} color={colors.primary} />
          <Text style={styles.taskTitle} numberOfLines={1}>{title}</Text>
        </View>
        {task.isSubscriptionTask && (
          <View style={styles.subscriptionBadge}>
            <MaterialCommunityIcons name="repeat" size={11} color={colors.onTertiaryFixedVariant} />
            <Text style={styles.subscriptionBadgeText}>Subscription</Text>
          </View>
        )}
      </View>

      <View style={styles.plateRow}>
        <Text style={styles.plateText}>{task.car.plateNumber}</Text>
        <StatusBadge status={task.status} size="small" />
      </View>

      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="account-outline" size={14} color={colors.outline} />
        <Text style={styles.metaText}>
          {task.user.name} {task.user.phone ? `- ${task.user.phone}` : ''}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="parking" size={14} color={colors.outline} />
        <Text style={styles.metaText}>Slot {task.slotId}</Text>
      </View>

      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.outline} />
        <Text style={styles.metaText}>
          {task.status === 'COMPLETED'
            ? `Completed ${formatCompletedDate(task.completedOn ?? task.scheduledDate)}`
            : `Scheduled ${formatScheduledDate(task.scheduledDate)}`}
        </Text>
      </View>

      {task.notes ? <Text style={styles.notesText}>{task.notes}</Text> : null}

      {task.machine ? (
        <View style={styles.assignedRow}>
          <MaterialCommunityIcons name="robot" size={14} color={colors.onPrimaryFixed} />
          <Text style={styles.assignedText}>Assigned to {task.machine.name}</Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        {canStart && (
          <TouchableOpacity
            style={[styles.actionButton, styles.startButton]}
            onPress={() => onStartTask(task)}
            disabled={isUpdating}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="play" size={16} color={colors.onPrimary} />
            <Text style={styles.actionButtonText}>{isUpdating ? 'Starting...' : 'Start Washing'}</Text>
          </TouchableOpacity>
        )}

        {canComplete && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => onCompleteTask(task)}
            disabled={isUpdating}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="check" size={16} color={colors.onSecondary} />
            <Text style={styles.actionButtonText}>{isUpdating ? 'Completing...' : 'Mark Complete'}</Text>
          </TouchableOpacity>
        )}

        {!!task.user.phone && (
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={() => onCall(task.user.phone)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="phone-outline" size={16} color={colors.primary} />
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </Surface>
  );
};

const MachineStatCard = ({
  icon,
  label,
  value,
  bg,
  color,
  selected,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: number;
  bg: string;
  color: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.statCardWrap} onPress={onPress} activeOpacity={0.82}>
    <Surface
      style={[
        styles.statCard,
        { backgroundColor: bg, borderColor: selected ? color : 'transparent' },
        selected && styles.statCardSelected,
      ]}
      elevation={selected ? 2 : 0}
    >
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </Surface>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryContainer },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1, backgroundColor: colors.surface },
  header: {
    backgroundColor: colors.primaryContainer,
    padding: 20,
    paddingBottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerActions: { alignItems: 'flex-end', gap: 8 },
  machineIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  machineLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onPrimaryContainer,
    letterSpacing: 2,
  },
  machineName: { fontSize: 14, color: colors.onPrimary, fontWeight: '600', marginTop: 2 },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
  },
  onlineText: { fontSize: 12, color: colors.onSecondaryContainer, fontWeight: '700' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.errorContainer,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onErrorContainer,
  },
  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHighest,
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  dateText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  statCardWrap: {
    flex: 1,
  },
  statCard: {
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 12,
    borderWidth: 2,
  },
  statCardSelected: {
    transform: [{ translateY: -2 }],
  },
  statValue: { fontSize: 22, fontWeight: '900', marginTop: 4 },
  statLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.onSurface,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    borderRadius: 10,
    padding: 12,
    margin: 16,
  },
  emptyToday: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyTodayTitle: { fontSize: 18, fontWeight: '800', color: colors.secondary, marginTop: 10 },
  emptyTodaySub: { fontSize: 13, color: colors.outline, marginTop: 4 },
  taskCard: {
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: colors.surfaceContainerLowest,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  taskTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.onSurface,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.tertiaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  subscriptionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onTertiaryFixedVariant,
  },
  plateText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    fontSize: 13,
    color: colors.onSurfaceVariant,
    flex: 1,
  },
  notesText: {
    marginTop: 10,
    fontSize: 12,
    color: colors.outline,
    lineHeight: 18,
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryFixed,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 12,
  },
  assignedText: {
    flex: 1,
    fontSize: 12,
    color: colors.onPrimaryFixed,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  actionButton: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  startButton: {
    backgroundColor: colors.primary,
  },
  completeButton: {
    backgroundColor: colors.secondary,
  },
  actionButtonText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  callButton: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  callButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
