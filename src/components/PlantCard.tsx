import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Plant } from '../types/database.types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { imageExists } from '../lib/imageStorage';

interface PlantCardProps {
  plant: Plant;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PlantCard({ plant, onPress, onEdit, onDelete }: PlantCardProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [imageAvailable, setImageAvailable] = useState(false);

  // Check if the local image file exists
  useEffect(() => {
    if (plant.photo_url) {
      imageExists(plant.photo_url).then(setImageAvailable);
    }
  }, [plant.photo_url]);

  const getPlantTypeIcon = () => {
    const icons: Record<string, string> = {
      vegetable: '🥬',
      herb: '🌿',
      flower: '🌸',
      fruit_tree: '🥭',
      timber_tree: '🌲',
      coconut_tree: '🥥',
      shrub: '🌱',
    };
    return icons[plant.plant_type] || '🌱';
  };

  const getPlantTypeLabel = () => {
    const labels: Record<string, string> = {
      vegetable: 'Vegetable',
      herb: 'Herb',
      flower: 'Flower',
      fruit_tree: 'Fruit Tree',
      timber_tree: 'Timber Tree',
      coconut_tree: 'Coconut Tree',
      shrub: 'Shrub',
    };
    return labels[plant.plant_type] || 'Plant';
  };

  const isTree = ['fruit_tree', 'timber_tree', 'coconut_tree'].includes(plant.plant_type);
  const age = plant.planting_date ? Math.floor((new Date().getTime() - new Date(plant.planting_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

  const getHealthIcon = () => {
    const icons: Record<string, string> = {
      healthy: '✅',
      stressed: '⚠️',
      recovering: '🔄',
      sick: '❌',
    };
    return plant.health_status ? icons[plant.health_status] : '';
  };

  const getHealthColor = () => {
    const colors: Record<string, string> = {
      healthy: '#4caf50',
      stressed: '#ff9800',
      recovering: '#2196f3',
      sick: '#f44336',
    };
    return plant.health_status ? colors[plant.health_status] : '#666';
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {plant.photo_url && imageAvailable ? (
        <Image 
          source={{ uri: plant.photo_url }} 
          style={styles.image}
          onError={() => setImageAvailable(false)}
        />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.emoji}>{getPlantTypeIcon()}</Text>
          {plant.photo_url && !imageAvailable && (
            <Text style={styles.missingImageText}>📷</Text>
          )}
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {plant.name}
          </Text>
          <Text style={styles.badge} numberOfLines={1} ellipsizeMode="tail">
            {plant.plant_variety || getPlantTypeLabel()}
          </Text>
        </View>
        {plant.variety && (
          <Text style={styles.variety}>{plant.variety}</Text>
        )}
        <View style={styles.info}>
          <Ionicons 
            name={plant.space_type === 'pot' ? 'cube-outline' : plant.space_type === 'bed' ? 'apps' : 'earth'} 
            size={14} 
            color={theme.textSecondary} 
          />
          <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
            {plant.space_type === 'pot' ? plant.pot_size || 'Pot' : plant.space_type === 'bed' ? plant.bed_name || 'Bed' : 'Ground'}
          </Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
            {plant.location}
          </Text>
        </View>
        {plant.health_status && (
          <View style={styles.healthContainer}>
            <Text style={styles.healthIcon}>{getHealthIcon()}</Text>
            <Text style={[styles.healthText, { color: getHealthColor() }]}>
              {plant.health_status.charAt(0).toUpperCase() + plant.health_status.slice(1)}
            </Text>
          </View>
        )}
        {isTree && age !== null && age > 0 && (
          <Text style={styles.age}>{age} {age === 1 ? 'year' : 'years'} old</Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
          <Ionicons name="pencil" size={20} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <Ionicons name="trash" size={20} color={theme.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholder: {
    backgroundColor: theme.backgroundTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    paddingRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  badge: {
    fontSize: 10,
    color: theme.accent,
    backgroundColor: theme.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    maxWidth: 120,
  },
  variety: {
    fontSize: 13,
    color: theme.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  infoText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginLeft: 4,
    flexShrink: 1,
    minWidth: 0,
  },
  separator: {
    fontSize: 14,
    color: theme.border,
    marginHorizontal: 6,
  },
  healthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  healthIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  healthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  missingImageText: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 16,
    opacity: 0.6,
  },
  age: {
    fontSize: 12,
    color: theme.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  actions: {
    justifyContent: 'center',
  },
  actionButton: {
    padding: 8,
  },
});
