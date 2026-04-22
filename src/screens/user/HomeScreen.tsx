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

type NavProp = NativeStackNavigationProp<UserStackParamList>;

export const HomeScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<NavProp>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [carCount, setCarCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
          <StatCard icon="car" label="My Cars" value={carCount} color="#0EA5E9" />
          <StatCard icon="clock-outline" label="Pending" value={pendingCount} color="#F59E0B" />
          <StatCard icon="check-circle" label="Done" value={completedCount} color="#10B981" />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsRow}>
          <QuickAction
            icon="car-arrow-right"
            label="Add Car"
            color="#EFF6FF"
            iconColor="#1E40AF"
            onPress={() => navigation.navigate('AddCar')}
          />
          <QuickAction
            icon="water-plus"
            label="Book Wash"
            color="#F0FDF4"
            iconColor="#059669"
            onPress={() => navigation.navigate('UserTabs', { screen: 'BookWash' } as any)}
          />
          <QuickAction
            icon="clipboard-list"
            label="My Washes"
            color="#FFF7ED"
            iconColor="#D97706"
            onPress={() => navigation.navigate('UserTabs', { screen: 'MyTasks' } as any)}
          />
        </View>

        {/* In Progress Task Banner */}
        {inProgressCount > 0 && (
          <Surface style={styles.inProgressBanner} elevation={2}>
            <View style={styles.inProgressLeft}>
              <MaterialCommunityIcons name="car-wash" size={28} color="#1D4ED8" />
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
          <Text style={styles.sectionTitle}>Recent Activity</Text>
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
            <MaterialCommunityIcons name="water-off-outline" size={36} color="#CBD5E1" />
            <Text style={styles.emptyRecentText}>No recent activity</Text>
            <Text style={styles.emptyRecentSub}>Book your first wash to get started!</Text>
          </View>
        ) : (
          recentTasks.map((task) => (
            <TaskCard key={task.id} task={task} showActions={false} />
          ))
        )}

        <View style={{ height: 24 }} />
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
  <Surface style={styles.statCard} elevation={1}>
    <MaterialCommunityIcons name={icon} size={22} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Surface>
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
    <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
    <Text style={[styles.quickActionLabel, { color: iconColor }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#1E40AF' },
  scroll: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#1E40AF',
    padding: 24,
    paddingBottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: { fontSize: 16, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  userName: { fontSize: 26, color: '#FFFFFF', fontWeight: '900', marginTop: 2 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  avatarBtn: { marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: -20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  statValue: { fontSize: 22, fontWeight: '900', marginTop: 4 },
  statLabel: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '600' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  seeAll: { fontSize: 13, color: '#1E40AF', fontWeight: '600' },
  actionsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
  },
  quickAction: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  inProgressBanner: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  inProgressLeft: { flexDirection: 'row', alignItems: 'center' },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: '#1D4ED8' },
  bannerSub: { fontSize: 12, color: '#3B82F6', marginTop: 2 },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
  },
  emptyRecent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyRecentText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 10,
  },
  emptyRecentSub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
});
