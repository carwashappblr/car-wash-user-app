import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Surface, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { taskService, UserTask, TaskStatus } from '../../services/taskService';
import { StatusBadge } from '../../components/StatusBadge';
import { colors } from '../../theme/colors';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatScheduledDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ── UserTaskCard ──────────────────────────────────────────────────────────────

interface UserTaskCardProps {
  task: UserTask;
}

const UserTaskCard: React.FC<UserTaskCardProps> = ({ task }) => {
  const isSubscription = task.isSubscriptionTask;

  return (
    <Surface style={styles.card} elevation={1}>
      {/* ── Header ── */}
      <View style={styles.cardHeader}>
        <View style={styles.carLabelRow}>
          <MaterialCommunityIcons name="car" size={16} color={colors.primary} />
          <Text style={styles.makeModel} numberOfLines={1}>
            {task.car.make} {task.car.model}
          </Text>
        </View>
        <StatusBadge status={task.status} size="small" />
      </View>

      {/* ── Plate & Slot row ── */}
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="card-text-outline" size={13} color={colors.outline} />
          <Text style={styles.metaText}>{task.car.plateNumber}</Text>
        </View>
        <View style={styles.metaDot} />
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="parking" size={13} color={colors.outline} />
          <Text style={styles.metaText}>Slot {task.slotId}</Text>
        </View>
      </View>

      {/* ── Date row ── */}
      <View style={styles.footerRow}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="calendar-clock" size={14} color={colors.secondary} />
          <Text style={styles.dateText}>{formatScheduledDate(task.scheduledDate)}</Text>
        </View>

        {isSubscription && (
          <View style={styles.subBadge}>
            <MaterialCommunityIcons name="repeat" size={11} color={colors.onTertiaryFixedVariant} />
            <Text style={styles.subBadgeText}>Subscription</Text>
          </View>
        )}
      </View>

      {/* ── Notes ── */}
      {task.notes ? (
        <Text style={styles.notes} numberOfLines={2}>
          {task.notes}
        </Text>
      ) : null}
    </Surface>
  );
};

// ── Skeleton Loader ───────────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => (
  <Surface style={[styles.card, styles.skeleton]} elevation={1}>
    <View style={[styles.skeletonLine, { width: '60%', height: 14, marginBottom: 10 }]} />
    <View style={[styles.skeletonLine, { width: '40%', height: 11, marginBottom: 8 }]} />
    <View style={[styles.skeletonLine, { width: '30%', height: 11 }]} />
  </Surface>
);

// ── Main Screen ───────────────────────────────────────────────────────────────

export const MyTasksScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [allTasks, setAllTasks] = useState<UserTask[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard against concurrent calls
  const loadingRef = useRef(false);

  const fetchTasks = useCallback(
    async (page: number, isRefresh = false) => {
      if (loadingRef.current) return;
      if (!isRefresh && !hasNextPage && page > 1) return;

      loadingRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const res = await taskService.getMyTasksPaginated(page);
        const { data, pagination } = res.data;

        if (page === 1) {
          setAllTasks(data);
        } else {
          setAllTasks((prev) => [...prev, ...data]);
        }

        setHasNextPage(pagination.hasNextPage);
        setCurrentPage(page);
      } catch (e) {
        setError('Could not load your washes. Please try again.');
      } finally {
        setIsLoading(false);
        setIsFirstLoad(false);
        setIsRefreshing(false);
        loadingRef.current = false;
      }
    },
    [hasNextPage]
  );

  // Initial load
  useEffect(() => {
    fetchTasks(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pull-to-refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setHasNextPage(true); // reset before fetch so guard doesn't block
    fetchTasks(1, true);
  }, [fetchTasks]);

  // Infinite scroll trigger
  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isLoading) {
      fetchTasks(currentPage + 1);
    }
  }, [hasNextPage, isLoading, currentPage, fetchTasks]);

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: UserTask }) => <UserTaskCard task={item} />,
    []
  );

  const keyExtractor = useCallback((item: UserTask) => item.id, []);

  const ListFooter = () => {
    if (isLoading && !isFirstLoad) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      );
    }
    if (!hasNextPage && allTasks.length > 0) {
      return (
        <View style={styles.footer}>
          <MaterialCommunityIcons name="check-all" size={16} color={colors.outline} />
          <Text style={styles.footerText}>No more washes to show</Text>
        </View>
      );
    }
    return null;
  };

  const ListEmpty = () => {
    if (isFirstLoad) return null; // skeleton handles this
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <MaterialCommunityIcons name="car-wash" size={60} color={colors.outlineVariant} />
        </View>
        <Text style={styles.emptyTitle}>No washes yet</Text>
        <Text style={styles.emptySubtitle}>
          Your upcoming and past car wash sessions will appear here.
        </Text>
      </View>
    );
  };

  // ── Error banner (non-blocking) ─────────────────────────────────────────────
  const ErrorBanner = () =>
    error ? (
      <View style={styles.errorBanner}>
        <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          onPress={() => fetchTasks(isFirstLoad ? 1 : currentPage)}
          style={styles.retryBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    ) : null;

  // ── Full-screen skeleton on first load ──────────────────────────────────────
  if (isFirstLoad && isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>My Washes</Text>
        </View>
        {[1, 2, 3, 4].map((k) => (
          <SkeletonCard key={k} />
        ))}
      </View>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {/* Sticky header */}
      <View style={[styles.headerBar, { paddingTop: insets.top > 0 ? 0 : 8 }]}>
        <Text style={styles.headerTitle}>My Washes</Text>
        {allTasks.length > 0 && (
          <View style={styles.countChip}>
            <Text style={styles.countText}>{allTasks.length}</Text>
          </View>
        )}
      </View>

      <ErrorBanner />

      <FlatList
        data={allTasks}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={[
          styles.listContent,
          allTasks.length === 0 && styles.listContentEmpty,
          { paddingBottom: insets.bottom + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  // Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.onSurface,
    letterSpacing: -0.5,
    flex: 1,
  },
  countChip: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
  },

  // List
  listContent: {
    paddingTop: 4,
  },
  listContentEmpty: {
    flexGrow: 1,
  },

  // Task card
  card: {
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  carLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  makeModel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
  },
  metaText: {
    fontSize: 13,
    color: colors.outline,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '600',
  },
  subBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.tertiaryFixed,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  subBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onTertiaryFixedVariant,
  },
  notes: {
    marginTop: 8,
    fontSize: 12,
    color: colors.outline,
    fontStyle: 'italic',
    lineHeight: 17,
  },

  // Skeleton
  skeleton: {
    opacity: 0.6,
  },
  skeletonLine: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 6,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: colors.outline,
    fontStyle: 'italic',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.outline,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorContainer,
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
  },
  retryBtn: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.onError,
  },
});
