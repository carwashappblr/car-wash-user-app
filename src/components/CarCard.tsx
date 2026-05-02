import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Car } from '../services/carService';
import { colors } from '../theme/colors';

interface CarCardProps {
  car: Car;
  onPress?: (car: Car) => void;
}

export const CarCard: React.FC<CarCardProps> = ({ car, onPress }) => {
  const displayModel = [car.make, car.model].filter(Boolean).join(' ').trim() || 'Vehicle';
  const displayColor = car.color?.trim() || 'Not set';
  const slotLabel = car.defaultSlotNumber?.trim() || 'Not set';

  // Dynamically fetch an image based on the car's color, make, and model
  const prompt = `A professional, high quality, cinematic photo of a ${car.color || ''} ${car.make || ''} ${car.model || ''} car parked in a premium, brightly lit garage.`;
  const carImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=600&nologo=true`;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.card}
      onPress={() => onPress?.(car)}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: carImageUrl }} 
          style={styles.carImage} 
          resizeMode="cover"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>READY</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <Text style={styles.modelName}>{displayModel}</Text>
            <Text style={styles.colorName}>{displayColor}</Text>
          </View>
          <View style={styles.plateBadge}>
            <Text style={styles.plateText}>{car.licensePlate}</Text>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="door-open" size={20} color={colors.primary} />
            <View>
              <Text style={styles.detailLabel}>SLOT</Text>
              <Text style={styles.detailValue}>{slotLabel}</Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="history" size={20} color={colors.primary} />
            <View>
              <Text style={styles.detailLabel}>LAST WASH</Text>
              <Text style={styles.detailValue}>—</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    marginBottom: 24,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  imageContainer: {
    height: 160,
    backgroundColor: colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contentContainer: {
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  modelName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
    lineHeight: 28,
  },
  colorName: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    fontWeight: '400',
  },
  plateBadge: {
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  plateText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
  },
  detailsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 35, 111, 0.05)',
    paddingTop: 16,
    gap: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurface,
  },
});
