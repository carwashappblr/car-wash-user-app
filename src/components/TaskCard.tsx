import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Task } from '../services/taskService';
import { colors } from '../theme/colors';

const serviceLabels: Record<string, string> = {
  BASIC: 'Basic Wash',
  PREMIUM: 'Premium Wash',
  DELUXE: 'Deluxe Detail',
};

interface TaskCardProps {
  task: Task;
  showActions?: boolean;
  onStartTask?: (task: Task) => void;
  onCompleteTask?: (task: Task) => void;
  isUpdating?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  showActions = false,
  onStartTask,
  onCompleteTask,
  isUpdating = false,
}) => {
  const date = new Date(task.createdAt);
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  // Status Styles
  let statusBg = colors.tertiaryFixed;
  let statusText = colors.onTertiaryFixedVariant;
  let borderLeft = colors.onTertiaryContainer;
  let statusLabel = 'Pending';

  if (task.status === 'IN_PROGRESS') {
    statusBg = colors.primaryFixed;
    statusText = colors.onPrimaryFixedVariant;
    borderLeft = colors.primary;
    statusLabel = 'In Progress';
  } else if (task.status === 'COMPLETED') {
    statusBg = colors.secondaryContainer;
    statusText = colors.onSecondaryContainer;
    borderLeft = colors.secondary;
    statusLabel = 'Completed';
  }

  return (
    <View style={[styles.card, { borderLeftColor: borderLeft }]}>
      {/* Top Row: Car Image & Info + Badge */}
      <View style={styles.headerRow}>
        <View style={styles.carInfoContainer}>
          <View style={styles.imagePlaceholder}>
            <MaterialCommunityIcons name="car-side" size={28} color={colors.primary} />
          </View>
          <View style={styles.carTextContent}>
            <Text style={styles.carTitle}>{task.car?.model || 'Unknown Car'}</Text>
            <Text style={styles.carSubtitle}>
              {task.car?.color || 'No color'} • {serviceLabels[task.serviceType] ?? task.serviceType}
            </Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: statusBg }]}>
          <Text style={[styles.badgeText, { color: statusText }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        {/* License Plate Row */}
        <View style={styles.licenseRow}>
          <MaterialCommunityIcons name="card-account-details-outline" size={18} color={colors.primary} />
          <Text style={styles.licenseText}>{task.car?.licensePlate ?? '—'}</Text>
        </View>

        {/* Date and Time Row */}
        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeItem}>
            <MaterialCommunityIcons name="calendar-month-outline" size={18} color={colors.onSurfaceVariant} />
            <Text style={styles.dateTimeText}>{dateStr}</Text>
          </View>
          <View style={styles.dateTimeItem}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={colors.onSurfaceVariant} />
            <Text style={styles.dateTimeText}>{timeStr}</Text>
          </View>
        </View>
      </View>

      {/* Machine assigned (visible for user if assigned) */}
      {!showActions && task.machine && (
        <View style={styles.machineRow}>
          <MaterialCommunityIcons name="robot" size={16} color={colors.primary} />
          <Text style={styles.machineText}>Assigned: {task.machine.name}</Text>
        </View>
      )}

      {/* Action buttons (visible for machine) */}
      {showActions && (
        <View style={styles.actions}>
          {task.status === 'PENDING' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.startBtn]}
              onPress={() => onStartTask?.(task)}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="play-circle" size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Start</Text>
            </TouchableOpacity>
          )}
          {task.status === 'IN_PROGRESS' && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.completeBtn]}
              onPress={() => onCompleteTask?.(task)}
              disabled={isUpdating}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="check-circle" size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Complete</Text>
            </TouchableOpacity>
          )}
          {task.status === 'COMPLETED' && (
            <View style={[styles.actionBtn, styles.doneBtn]}>
              <MaterialCommunityIcons name="check-all" size={16} color="#059669" />
              <Text style={[styles.actionBtnText, { color: '#059669' }]}>Done</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 24,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  carInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carTextContent: {
    flex: 1,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  carSubtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsContainer: {
    gap: 12,
  },
  licenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(197, 197, 211, 0.3)',
  },
  licenseText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.primary,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    fontWeight: '500',
  },
  machineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: colors.surfaceContainerLow,
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  machineText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  actions: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  startBtn: {
    backgroundColor: '#1D4ED8',
  },
  completeBtn: {
    backgroundColor: '#059669',
  },
  doneBtn: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 4,
  },
});
