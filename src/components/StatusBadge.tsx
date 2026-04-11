import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { TaskStatus } from '../services/taskService';

const statusConfig: Record<TaskStatus, { label: string; bg: string; color: string }> = {
  PENDING: { label: 'Pending', bg: '#FEF3C7', color: '#D97706' },
  IN_PROGRESS: { label: 'In Progress', bg: '#DBEAFE', color: '#1D4ED8' },
  COMPLETED: { label: 'Completed', bg: '#D1FAE5', color: '#059669' },
  CANCELLED: { label: 'Cancelled', bg: '#FEE2E2', color: '#DC2626' },
};

interface StatusBadgeProps {
  status: TaskStatus;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const config = statusConfig[status] ?? statusConfig.PENDING;
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: config.color },
          isSmall && styles.textSmall,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: 11,
  },
});
