import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Task } from '../services/taskService';
import { StatusBadge } from './StatusBadge';

const serviceLabels: Record<string, string> = {
  BASIC: '🚿 Basic Wash',
  PREMIUM: '✨ Premium Wash',
  DELUXE: '💎 Deluxe Detail',
};

interface TaskCardProps {
  task: Task;
  /** Show action buttons for machine operators */
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
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <Surface style={styles.card} elevation={1}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.carInfo}>
          <MaterialCommunityIcons name="car" size={18} color="#1E40AF" />
          <Text style={styles.plateText}>{task.car?.licensePlate ?? '—'}</Text>
        </View>
        <StatusBadge status={task.status} size="small" />
      </View>

      {/* Car model row */}
      {task.car?.model && (
        <Text style={styles.modelText}>{task.car.model} · {task.car.color}</Text>
      )}

      {/* Service type */}
      <View style={styles.serviceRow}>
        <Text style={styles.serviceLabel}>
          {serviceLabels[task.serviceType] ?? task.serviceType}
        </Text>
        <Text style={styles.timeText}>{dateStr}, {timeStr}</Text>
      </View>

      {/* Machine assigned (visible for user) */}
      {!showActions && task.machine && (
        <View style={styles.machineRow}>
          <MaterialCommunityIcons name="robot" size={14} color="#6366F1" />
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
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  carInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  plateText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
    marginLeft: 6,
  },
  modelText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  serviceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  machineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  machineText: {
    fontSize: 12,
    color: '#6366F1',
    marginLeft: 4,
  },
  actions: {
    marginTop: 12,
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
