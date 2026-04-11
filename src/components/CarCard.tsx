import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Car } from '../services/carService';

const colorMap: Record<string, string> = {
  white: '#F1F5F9',
  black: '#1E293B',
  red: '#FEE2E2',
  blue: '#DBEAFE',
  silver: '#E2E8F0',
  grey: '#E2E8F0',
  gray: '#E2E8F0',
  green: '#D1FAE5',
  yellow: '#FEF3C7',
  orange: '#FFEDD5',
};

const getColorDot = (color: string) => {
  const key = color.toLowerCase();
  return colorMap[key] ?? '#E2E8F0';
};

interface CarCardProps {
  car: Car;
  onPress?: (car: Car) => void;
}

export const CarCard: React.FC<CarCardProps> = ({ car, onPress }) => {
  return (
    <Surface
      style={styles.card}
      elevation={1}
      onTouchEnd={() => onPress?.(car)}
    >
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="car-side" size={36} color="#1E40AF" />
      </View>
      <View style={styles.info}>
        <Text style={styles.plateText}>{car.licensePlate}</Text>
        <Text style={styles.modelText}>{car.model}</Text>
        <View style={styles.colorRow}>
          <View
            style={[
              styles.colorDot,
              {
                backgroundColor: getColorDot(car.color),
                borderWidth: car.color.toLowerCase() === 'white' ? 1 : 0,
                borderColor: '#CBD5E1',
              },
            ]}
          />
          <Text style={styles.colorText}>{car.color}</Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#CBD5E1" />
    </Surface>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  plateText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
  },
  modelText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  colorText: {
    fontSize: 12,
    color: '#94A3B8',
    textTransform: 'capitalize',
  },
});
