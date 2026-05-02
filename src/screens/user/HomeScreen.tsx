import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../store/AuthContext';
import { taskService, Task } from '../../services/taskService';
import { carService } from '../../services/carService';
import { TaskCard } from '../../components/TaskCard';
import { UserStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { PremiumLoader } from '../../components/PremiumLoader';

type NavProp = NativeStackNavigationProp<UserStackParamList>;

export const HomeScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [carCount, setCarCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [taskRes, carRes] = await Promise.all([
        taskService.getMyTasks(),
        carService.getCars(),
      ]);
      setTasks(taskRes.data);
      setCarCount(carRes.data.length);
    } catch (e) {
      console.error('[HomeScreen] load error', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const recentTasks = tasks.slice(0, 3);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return <PremiumLoader message="Preparing your dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{user?.name ?? 'User'} 👋</Text>
            <Text style={styles.headerSub}>Ready for a spotless ride?</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('UserTabs', { screen: 'Profile' } as any)}
          >
            <MaterialCommunityIcons name="account-circle" size={48} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard icon="car" label="My Cars" value={carCount} color={colors.secondary} />
          <StatCard icon="clock-outline" label="Pending" value={pendingCount} color={colors.onTertiaryContainer} />
          <StatCard icon="check-circle" label="Done" value={completedCount} color={colors.secondaryFixedDim} />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <QuickAction
            icon="car-arrow-right"
            label="Add Car"
            color={colors.primaryContainer}
            iconColor={colors.onPrimaryContainer}
            onPress={() => navigation.navigate('AddCar')}
          />
          <QuickAction
            icon="water-plus"
            label="Book Wash"
            color={colors.secondaryContainer}
            iconColor={colors.onSecondaryContainer}
            onPress={() => navigation.navigate('BookWash' as any)}
          />
          <QuickAction
            icon="clipboard-list"
            label="My Washes"
            color={colors.tertiaryFixed}
            iconColor={colors.onTertiaryFixedVariant}
            onPress={() => navigation.navigate('UserTabs', { screen: 'MyTasks' } as any)}
          />
        </View>

        {/* In Progress Task Banner */}
        {inProgressCount > 0 && (
          <Surface style={styles.inProgressBanner} elevation={0}>
            <View style={styles.inProgressLeft}>
              <MaterialCommunityIcons name="car-wash" size={28} color={colors.primary} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.bannerTitle}>Wash In Progress!</Text>
                <Text style={styles.bannerSub}>{inProgressCount} task(s) being processed</Text>
              </View>
            </View>
            <View style={styles.pulseDot} />
          </Surface>
        )}

        {/* Recent Tasks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleWithoutMargin}>Recent Activity</Text>
          {tasks.length > 3 && (
            <TouchableOpacity
              onPress={() => navigation.navigate('UserTabs', { screen: 'MyTasks' } as any)}
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentTasks.length === 0 ? (
          <View style={styles.emptyRecent}>
            <MaterialCommunityIcons name="water-off-outline" size={36} color={colors.outlineVariant} />
            <Text style={styles.emptyRecentText}>No recent activity</Text>
            <Text style={styles.emptyRecentSub}>Book your first wash to get started!</Text>
          </View>
        ) : (
          recentTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: number;
  color: string;
}) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <MaterialCommunityIcons name={icon} size={24} color={color} />
    <Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const QuickAction = ({
  icon,
  label,
  color,
  iconColor,
  onPress,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  color: string;
  iconColor: string;
  onPress: () => void;
}) => (
  <TouchableOpacity style={[styles.quickAction, { backgroundColor: color }]} onPress={onPress} activeOpacity={0.8}>
    <MaterialCommunityIcons name={icon} size={28} color={iconColor} style={styles.actionIcon} />
    <Text style={[styles.quickActionLabel, { color: iconColor }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primary },
  scroll: { flex: 1, backgroundColor: colors.surface },
  header: {
    backgroundColor: colors.primary,
    padding: 24,
    paddingBottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  userName: { fontSize: 26, color: colors.onPrimary, fontWeight: '900', marginTop: 2 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  avatarBtn: { marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: -20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderLeftWidth: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  statValue: { fontSize: 24, fontWeight: '900', marginTop: 8 },
  statLabel: { fontSize: 11, color: colors.onSurfaceVariant, marginTop: 4, fontWeight: '700', textTransform: 'uppercase' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
    marginHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitleWithoutMargin: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  seeAll: { fontSize: 14, color: colors.primary, fontWeight: '700' },
  actionsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  inProgressBanner: {
    marginHorizontal: 24,
    marginTop: 24,
    borderRadius: 20,
    padding: 20,
    backgroundColor: colors.primaryFixed,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inProgressLeft: { flexDirection: 'row', alignItems: 'center' },
  bannerTitle: { fontSize: 16, fontWeight: '800', color: colors.primary },
  bannerSub: { fontSize: 13, color: colors.onPrimaryFixedVariant, marginTop: 2 },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.secondary,
  },
  emptyRecent: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 24,
    marginHorizontal: 24,
    borderWidth: 2,
    borderColor: 'rgba(30, 58, 138, 0.05)',
    borderStyle: 'dashed',
  },
  emptyRecentText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.onSurfaceVariant,
    marginTop: 12,
  },
  emptyRecentSub: {
    fontSize: 14,
    color: colors.outline,
    marginTop: 8,
    textAlign: 'center',
  },
});
