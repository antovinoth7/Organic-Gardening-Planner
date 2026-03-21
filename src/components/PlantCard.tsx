import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Plant } from '../types/database.types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { getYearsOld } from '../utils/dateHelpers';

interface PlantCardProps {
  plant: Plant;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean;
}

export default function PlantCard({ plant, onPress, onEdit, onDelete, compact = false }: PlantCardProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [imageError, setImageError] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    setImageError(false);
    return () => { isMountedRef.current = false; };
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
      fruit_tree: 'Fruit',
      timber_tree: 'Timber Tree',
      coconut_tree: 'Coconut Tree',
      shrub: 'Shrub',
    };
    return labels[plant.plant_type] || 'Plant';
  };

  const getPlantTypeBg = (): string => {
    const bgs: Record<string, string> = {
      vegetable: '#e8f5e9',
      herb: '#e0f2f1',
      flower: '#fce4ec',
      fruit_tree: '#fff3e0',
      timber_tree: '#e8eaf6',
      coconut_tree: '#efebe9',
      shrub: '#f1f8e9',
    };
    return bgs[plant.plant_type] || '#e8f5e9';
  };

  const isTree = ['fruit_tree', 'timber_tree', 'coconut_tree'].includes(plant.plant_type);
  const age = getYearsOld(plant.planting_date ?? null);

  const getHealthColor = () => {
    const colors: Record<string, string> = {
      healthy: '#4caf50',
      stressed: '#ff9800',
      recovering: '#2196f3',
      sick: '#f44336',
    };
    return plant.health_status ? colors[plant.health_status] : '#ccc';
  };

  const getDaysSinceWatered = (): number | null => {
    if (!plant.last_watered_date) return null;
    const diff = Date.now() - new Date(plant.last_watered_date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const handleImageError = () => {
    if (isMountedRef.current) setImageError(true);
  };

  const daysSinceWatered = getDaysSinceWatered();
  const isOverdueWater = daysSinceWatered !== null &&
    plant.watering_frequency_days != null &&
    daysSinceWatered > plant.watering_frequency_days;

  // ── Compact Grid Card ──
  if (compact) {
    return (
      <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.7}>
        {/* Health dot */}
        <View style={[styles.healthDot, { backgroundColor: getHealthColor() }]} />

        {/* Image */}
        {plant.photo_url && !imageError ? (
          <Image
            source={{ uri: plant.photo_url }}
            style={styles.compactImage}
            contentFit="cover"
            transition={200}
            onError={handleImageError}
            recyclingKey={plant.id}
            cachePolicy="memory-disk"
            priority="normal"
          />
        ) : (
          <View style={[styles.compactImage, styles.compactPlaceholder, { backgroundColor: getPlantTypeBg() }]}>
            <Text style={styles.compactEmoji}>{getPlantTypeIcon()}</Text>
          </View>
        )}

        {/* Water badge */}
        {daysSinceWatered !== null && (
          <View style={[styles.waterBadge, isOverdueWater && styles.waterBadgeOverdue]}>
            <Ionicons name="water" size={10} color={isOverdueWater ? '#f44336' : '#2196f3'} />
            <Text style={[styles.waterBadgeText, isOverdueWater && styles.waterBadgeTextOverdue]}>
              {daysSinceWatered}d
            </Text>
          </View>
        )}

        {/* Bottom info */}
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>{plant.name}</Text>
          <Text style={styles.compactMeta} numberOfLines={1}>
            {plant.plant_variety || getPlantTypeLabel()}
          </Text>
          <Text style={styles.compactLocation} numberOfLines={1}>
            {plant.location}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.compactActions}>
          <TouchableOpacity style={styles.compactActionBtn} onPress={onEdit}>
            <Ionicons name="create-outline" size={15} color={theme.primaryDark} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.compactActionBtn, styles.compactDeleteBtn]} onPress={onDelete}>
            <Ionicons name="trash-outline" size={15} color={theme.error} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  // ── Standard List Card ──
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
          {/* Image with health dot overlay */}
          <View style={styles.imageContainer}>
            {plant.photo_url && !imageError ? (
              <Image
                source={{ uri: plant.photo_url }}
                style={styles.image}
                contentFit="cover"
                transition={200}
                onError={handleImageError}
                recyclingKey={plant.id}
                cachePolicy="memory-disk"
                priority="normal"
              />
            ) : (
              <View style={[styles.image, styles.placeholder, { backgroundColor: getPlantTypeBg() }]}>
                <Text style={styles.emoji}>{getPlantTypeIcon()}</Text>
                {plant.photo_url && imageError && (
                  <View style={styles.missingImageBadge}>
                    <Ionicons name="camera" size={12} color="#999" />
                  </View>
                )}
              </View>
            )}
            {/* Health indicator dot */}
            <View style={[styles.healthIndicator, { backgroundColor: getHealthColor() }]} />
          </View>

          {/* Content */}
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

            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Ionicons
                  name={plant.space_type === 'pot' ? 'cube-outline' : plant.space_type === 'bed' ? 'apps' : 'earth'}
                  size={12}
                  color={theme.textTertiary}
                />
                <Text style={styles.metaText}>
                  {plant.space_type === 'pot' ? plant.pot_size || 'Pot' : plant.space_type === 'bed' ? plant.bed_name || 'Bed' : 'Ground'}
                </Text>
              </View>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText} numberOfLines={1}>{plant.location}</Text>

              {isTree && age !== null && age > 0 && (
                <>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.ageText}>{age}y</Text>
                </>
              )}
            </View>

            {/* Bottom row: water indicator + health label */}
            <View style={styles.statusRow}>
              {daysSinceWatered !== null && (
                <View style={[styles.statusChip, isOverdueWater && styles.statusChipOverdue]}>
                  <Ionicons
                    name="water"
                    size={12}
                    color={isOverdueWater ? '#f44336' : '#2196f3'}
                  />
                  <Text style={[styles.statusChipText, isOverdueWater && styles.statusChipTextOverdue]}>
                    {daysSinceWatered === 0 ? 'Today' : `${daysSinceWatered}d ago`}
                  </Text>
                </View>
              )}
              {plant.health_status && plant.health_status !== 'healthy' && (
                <View style={[styles.statusChip, { backgroundColor: getHealthColor() + '18', borderColor: getHealthColor() + '40' }]}>
                  <View style={[styles.statusDot, { backgroundColor: getHealthColor() }]} />
                  <Text style={[styles.statusChipText, { color: getHealthColor() }]}>
                    {plant.health_status.charAt(0).toUpperCase() + plant.health_status.slice(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>

      {/* Action buttons */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.cardActionBtn} onPress={onEdit}>
          <Ionicons name="create-outline" size={18} color={theme.primaryDark} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.cardActionBtn, styles.cardDeleteBtn]} onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color={theme.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  // ── Standard Card ──
  card: {
    flexDirection: 'row',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 10,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 32,
  },
  missingImageBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: theme.backgroundSecondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  badge: {
    fontSize: 9,
    color: theme.accent,
    backgroundColor: theme.accentLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    maxWidth: 110,
    overflow: 'hidden',
  },
  variety: {
    fontSize: 12,
    color: theme.textSecondary,
    fontStyle: 'italic',
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    minWidth: 0,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    color: theme.textTertiary,
    flexShrink: 1,
  },
  metaDot: {
    fontSize: 12,
    color: theme.border,
    marginHorizontal: 5,
  },
  ageText: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  statusChipOverdue: {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
  },
  statusChipText: {
    fontSize: 11,
    color: '#2196f3',
    fontWeight: '600',
  },
  statusChipTextOverdue: {
    color: '#f44336',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cardActions: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 6,
  },
  cardActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDeleteBtn: {
    backgroundColor: theme.errorLight,
  },

  // ── Compact Grid Card ──
  compactCard: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    margin: 4,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  healthDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: theme.backgroundSecondary,
    zIndex: 2,
  },
  compactImage: {
    width: '100%',
    aspectRatio: 1.3,
  },
  compactPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactEmoji: {
    fontSize: 36,
  },
  waterBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    zIndex: 2,
  },
  waterBadgeOverdue: {
    backgroundColor: 'rgba(255,235,238,0.95)',
  },
  waterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2196f3',
  },
  waterBadgeTextOverdue: {
    color: '#f44336',
  },
  compactInfo: {
    padding: 8,
    paddingTop: 6,
  },
  compactName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.text,
  },
  compactMeta: {
    fontSize: 11,
    color: theme.textTertiary,
    marginTop: 1,
  },
  compactLocation: {
    fontSize: 10,
    color: theme.textSecondary,
    marginTop: 2,
  },
  compactActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  compactActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactDeleteBtn: {
    backgroundColor: theme.errorLight,
  },
});
