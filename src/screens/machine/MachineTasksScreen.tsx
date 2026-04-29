import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../../store/AuthContext';
import { EmptyState } from '../../components/EmptyState';
import { PendingTowerTask, taskService } from '../../services/taskService';

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

const PendingTaskCard = ({
  task,
  onCall,
}: {
  task: PendingTowerTask;
  onCall: (phone?: string | null) => void;
}) => {
  const title = [task.car.make, task.car.model].filter(Boolean).join(' ').trim() || 'Vehicle';

  return (
    <Surface style={styles.card} elevation={1}>
      <View style={styles.cardHeader}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="car" size={18} color="#7C3AED" />
          <Text style={styles.titleText}>{title}</Text>
        </View>
        {task.isSubscriptionTask && (
          <View style={styles.subscriptionBadge}>
            <MaterialCommunityIcons name="repeat" size={11} color="#7C3AED" />
            <Text style={styles.subscriptionBadgeText}>Subscription</Text>
          </View>
        )}
      </View>

      <Text style={styles.plateText}>{task.car.plateNumber}</Text>

      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="account-outline" size={14} color="#64748B" />
        <Text style={styles.metaText}>
          {task.user.name} {task.user.phone ? `• ${task.user.phone}` : ''}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="parking" size={14} color="#64748B" />
        <Text style={styles.metaText}>Slot {task.slotId}</Text>
      </View>

      <View style={styles.metaRow}>
        <MaterialCommunityIcons name="calendar-clock" size={14} color="#64748B" />
        <Text style={styles.metaText}>Scheduled {formatScheduledDate(task.scheduledDate)}</Text>
      </View>

      {task.notes ? <Text style={styles.notesText}>{task.notes}</Text> : null}

      {!!task.user.phone && (
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => onCall(task.user.phone)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="phone-outline" size={16} color="#FFFFFF" />
          <Text style={styles.callButtonText}>Call Customer</Text>
        </TouchableOpacity>
      )}
    </Surface>
  );
};

export const MachineTasksScreen = () => {
  const { logout } = useAuth();
  const [tasks, setTasks] = useState<PendingTowerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setError(null);
      const response = await taskService.getMyTowerTasks(['PENDING']);
      const sorted = [...response.data].sort(
        (a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      );
      setTasks(sorted);
    } catch (e: any) {
      if (e.response?.status === 403) {
        setError('This machine is not assigned to a tower.');
      } else if (e.response?.status === 404) {
        setError('Machine not found. Please try again or contact support.');
      } else {
        setError(getErrorMessage(e.response?.data ?? e.message ?? 'Failed to load pending tasks.'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTasks();
  }, [loadTasks]);

  const handleCall = useCallback(async (phone?: string | null) => {
    if (!phone) return;
    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  }, []);

  const headerSubtitle = useMemo(() => {
    return `${tasks.length} pending task${tasks.length !== 1 ? 's' : ''}`;
  }, [tasks.length]);

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

      <View style={styles.pageHeader}>
        <View>
          <Text style={styles.pageTitle}>Pending Tasks</Text>
          <Text style={styles.pageCount}>{headerSubtitle}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} activeOpacity={0.8}>
            <MaterialCommunityIcons name="refresh" size={18} color="#7C3AED" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
            <MaterialCommunityIcons name="logout" size={16} color="#7C3AED" />
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PendingTaskCard task={item} onCall={handleCall} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />
        }
        ListEmptyComponent={
          <EmptyState
            icon="clipboard-check-outline"
            title="No pending tasks for this tower"
            subtitle="New pending washes will appear here as they are assigned."
          />
        }
        contentContainerStyle={tasks.length === 0 ? styles.emptyContent : styles.listContent}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A' },
  pageCount: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginTop: 2 },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F3FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    flex: 1,
  },
  listContent: {
    paddingVertical: 10,
    paddingBottom: 24,
  },
  emptyContent: {
    flexGrow: 1,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    flexShrink: 1,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  subscriptionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  plateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
    marginTop: 10,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  notesText: {
    marginTop: 10,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  callButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
