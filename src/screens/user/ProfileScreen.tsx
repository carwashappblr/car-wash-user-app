import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAuth } from '../../store/AuthContext';
import { colors } from '../../theme/colors';

export const ProfileScreen = () => {
  const { user, logout } = useAuth();

  const roleLabel = user?.role === 'ADMIN' ? 'Administrator' : 'Premium Enterprise';
  const initial = (user?.name?.[0] ?? user?.email?.[0] ?? '?').toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Top AppBar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.smallAvatar}>
            <Text style={styles.smallAvatarText}>{initial}</Text>
          </View>
          <Text style={styles.appName}>Clean Cart</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialCommunityIcons name="bell-outline" size={22} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Hero Profile Section */}
        <View style={styles.heroCard}>
          <View style={styles.heroAvatarContainer}>
            <View style={styles.heroAvatarBorder}>
              <View style={styles.heroAvatar}>
                <Text style={styles.heroAvatarText}>{initial}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton} activeOpacity={0.8}>
              <MaterialCommunityIcons name="pencil" size={16} color={colors.onSecondaryContainer} />
            </TouchableOpacity>
          </View>
          <Text style={styles.heroName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.heroRole}>Facility Manager • North Wing</Text>
        </View>

        {/* Account Information Card */}
        <View style={[styles.glassCard, { borderLeftColor: colors.primary }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="badge-account-horizontal-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Account Information</Text>
          </View>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Email Address</Text>
              <Text style={styles.infoValue}>{user?.email ?? '—'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{user?.phone ?? 'Not set'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Account Type</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{roleLabel}</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Member Since</Text>
              <Text style={styles.infoValue}>January 2023</Text>
            </View>
          </View>
        </View>

        {/* Service Status Card */}
        <View style={[styles.glassCard, { borderLeftColor: colors.secondary }]}>
          <Text style={[styles.cardTitle, { color: colors.secondary, marginBottom: 16 }]}>Service Status</Text>
          <View style={styles.statusBox}>
            <View style={styles.statusIcon}>
              <MaterialCommunityIcons name="check-circle-outline" size={24} color={colors.secondary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Compliance</Text>
              <Text style={styles.infoValue}>Verified</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.upgradeBtn} activeOpacity={0.8}>
            <Text style={styles.upgradeBtnText}>Upgrade Subscription</Text>
          </TouchableOpacity>
        </View>

        {/* Support & Settings */}
        <Text style={styles.sectionTitle}>Support & Settings</Text>
        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
          <View style={styles.actionLeft}>
            <View style={styles.actionIconBox}>
              <MaterialCommunityIcons name="help-circle-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Help & Support</Text>
              <Text style={styles.actionSubtitle}>Guides, FAQs, and contact info</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.outlineVariant} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
          <View style={styles.actionLeft}>
            <View style={styles.actionIconBox}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.actionTitle}>Terms & Privacy</Text>
              <Text style={styles.actionSubtitle}>Legal documentation</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.outlineVariant} />
        </TouchableOpacity>

        {/* Sign Out */}
        <View style={styles.signOutContainer}>
          <TouchableOpacity style={styles.signOutBtn} onPress={logout} activeOpacity={0.7}>
            <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceContainerLow },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 58, 138, 0.05)',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  smallAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallAvatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  appName: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100, // padding for bottom tabs
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 32,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 24,
  },
  heroAvatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  heroAvatarBorder: {
    padding: 4,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroAvatarText: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.primary,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.secondaryContainer,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  heroName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  heroRole: {
    fontSize: 15,
    color: colors.primaryFixedDim,
    fontWeight: '500',
  },
  glassCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    borderLeftWidth: 4,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  infoItem: {
    width: '45%',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurface,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 2,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onSecondaryContainer,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    padding: 16,
    borderRadius: 16,
    gap: 16,
    marginBottom: 20,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(8, 109, 42, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  upgradeBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 16,
    marginLeft: 8,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 35, 111, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: colors.outline,
  },
  signOutContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.error,
  },
  signOutText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '700',
  },
});
