import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../../store/AuthContext';

export const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const roleLabel = user?.role === 'ADMIN' ? 'Administrator' : 'Customer';
  const roleColor = user?.role === 'ADMIN' ? '#7C3AED' : '#1E40AF';

  const initial = (user?.name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1E40AF" />
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'User'}</Text>
        <View style={[styles.roleBadge, { backgroundColor: `${roleColor}22` }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <Surface style={styles.infoCard} elevation={1}>
          <InfoRow icon="email-outline" label="Email" value={user?.email ?? '—'} />
          <InfoDivider />
          <InfoRow icon="phone-outline" label="Phone" value={user?.phone ?? 'Not set'} />
          <InfoDivider />
          <InfoRow
            icon="shield-account-outline"
            label="Account Type"
            value={roleLabel}
          />
        </Surface>

        {/* Account Actions */}
        <Text style={styles.sectionTitle}>Account</Text>
        <Surface style={styles.actionsCard} elevation={1}>
          <Button
            mode="text"
            icon="help-circle-outline"
            style={styles.actionBtn}
            textColor="#334155"
            contentStyle={styles.actionBtnContent}
            onPress={() => {}}
          >
            Help & Support
          </Button>
          <View style={styles.divider} />
          <Button
            mode="text"
            icon="file-document-outline"
            style={styles.actionBtn}
            textColor="#334155"
            contentStyle={styles.actionBtnContent}
            onPress={() => {}}
          >
            Terms & Privacy
          </Button>
        </Surface>

        {/* Logout */}
        <Button
          mode="outlined"
          icon="logout"
          onPress={logout}
          style={styles.logoutBtn}
          textColor="#DC2626"
          contentStyle={styles.logoutContent}
        >
          Sign Out
        </Button>

        <Text style={styles.version}>Clean Cart v1.0.0 · Partnered with ZENVORA</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <View style={infoStyles.row}>
    <MaterialCommunityIcons name={icon as any} size={20} color="#1E40AF" />
    <View style={infoStyles.textWrap}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={infoStyles.value}>{value}</Text>
    </View>
  </View>
);

const InfoDivider = () => <View style={infoStyles.divider} />;

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  textWrap: { flex: 1, marginLeft: 4 },
  label: { fontSize: 12, color: '#94A3B8', fontWeight: '600', marginBottom: 2 },
  value: { fontSize: 15, color: '#0F172A', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#1E40AF',
    paddingTop: 16,
    paddingBottom: 32,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  name: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleText: { fontSize: 13, fontWeight: '700' },
  scroll: { flex: 1, marginTop: -16 },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  actionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  actionBtn: {
    borderRadius: 0,
    justifyContent: 'flex-start',
  },
  actionBtnContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    borderColor: '#FCA5A5',
  },
  logoutContent: { paddingVertical: 4 },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#CBD5E1',
    marginTop: 16,
  },
});
