import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { getPlants, deletePlant } from '../services/plants';
import { Plant, PlantType, SpaceType, HealthStatus, SunlightLevel, WaterRequirement } from '../types/database.types';
import PlantCard from '../components/PlantCard';
import { Ionicons } from '@expo/vector-icons';

type FilterCategory = 'type' | 'health' | 'space' | 'sunlight' | 'water';
type FilterType = 'all' | 'crops' | 'trees';

interface ActiveFilters {
  type: FilterType;
  health: HealthStatus | 'all';
  space: SpaceType | 'all';
  sunlight: SunlightLevel | 'all';
  water: WaterRequirement | 'all';
}

const ITEMS_PER_PAGE = 20;

export default function PlantsScreen({ navigation }: any) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('type');
  const [filters, setFilters] = useState<ActiveFilters>({
    type: 'all',
    health: 'all',
    space: 'all',
    sunlight: 'all',
    water: 'all',
  });

  const loadPlants = async () => {
    try {
      const { plants: data } = await getPlants();
      setPlants(data);
      setDisplayCount(ITEMS_PER_PAGE);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadPlants();
    });
    return unsubscribe;
  }, [navigation]);

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Plant',
      'Are you sure you want to delete this plant?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlant(id);
              loadPlants();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const getFilteredPlants = () => {
    let filtered = [...plants];

    if (filters.type === 'crops') {
      filtered = filtered.filter(p => ['vegetable', 'herb', 'flower'].includes(p.plant_type));
    } else if (filters.type === 'trees') {
      filtered = filtered.filter(p => ['fruit_tree', 'timber_tree', 'coconut_tree'].includes(p.plant_type));
    }

    if (filters.health !== 'all') {
      filtered = filtered.filter(p => p.health_status === filters.health);
    }

    if (filters.space !== 'all') {
      filtered = filtered.filter(p => p.space_type === filters.space);
    }

    if (filters.sunlight !== 'all') {
      filtered = filtered.filter(p => p.sunlight === filters.sunlight);
    }

    if (filters.water !== 'all') {
      filtered = filtered.filter(p => p.water_requirement === filters.water);
    }

    return filtered;
  };

  const updateFilter = <K extends keyof ActiveFilters>(category: K, value: ActiveFilters[K]) => {
    setFilters(prev => ({ ...prev, [category]: value }));
  };

  const hasActiveFilters = () => {
    return filters.type !== 'all' || filters.health !== 'all' || 
           filters.space !== 'all' || filters.sunlight !== 'all' || filters.water !== 'all';
  };

  const clearAllFilters = () => {
    setFilters({
      type: 'all',
      health: 'all',
      space: 'all',
      sunlight: 'all',
      water: 'all',
    });
    setDisplayCount(ITEMS_PER_PAGE);
  };

  const filteredPlants = useMemo(() => getFilteredPlants(), [plants, filters]);
  
  const displayedPlants = useMemo(() => {
    return filteredPlants.slice(0, displayCount);
  }, [filteredPlants, displayCount]);

  const hasMore = displayCount < filteredPlants.length;

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredPlants.length));
      setLoadingMore(false);
    }, 300);
  };

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [filters]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Plants</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('PlantForm')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity 
            style={[styles.categoryChip, activeCategory === 'type' && styles.categoryChipActive]}
            onPress={() => setActiveCategory('type')}
          >
            <Ionicons name="apps" size={16} color={activeCategory === 'type' ? '#2e7d32' : '#666'} />
            <Text style={[styles.categoryText, activeCategory === 'type' && styles.categoryTextActive]}>Type</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.categoryChip, activeCategory === 'health' && styles.categoryChipActive]}
            onPress={() => setActiveCategory('health')}
          >
            <Ionicons name="fitness" size={16} color={activeCategory === 'health' ? '#2e7d32' : '#666'} />
            <Text style={[styles.categoryText, activeCategory === 'health' && styles.categoryTextActive]}>Health</Text>
            {filters.health !== 'all' && <View style={styles.activeDot} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.categoryChip, activeCategory === 'space' && styles.categoryChipActive]}
            onPress={() => setActiveCategory('space')}
          >
            <Ionicons name="cube" size={16} color={activeCategory === 'space' ? '#2e7d32' : '#666'} />
            <Text style={[styles.categoryText, activeCategory === 'space' && styles.categoryTextActive]}>Space</Text>
            {filters.space !== 'all' && <View style={styles.activeDot} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.categoryChip, activeCategory === 'sunlight' && styles.categoryChipActive]}
            onPress={() => setActiveCategory('sunlight')}
          >
            <Ionicons name="sunny" size={16} color={activeCategory === 'sunlight' ? '#2e7d32' : '#666'} />
            <Text style={[styles.categoryText, activeCategory === 'sunlight' && styles.categoryTextActive]}>Sunlight</Text>
            {filters.sunlight !== 'all' && <View style={styles.activeDot} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.categoryChip, activeCategory === 'water' && styles.categoryChipActive]}
            onPress={() => setActiveCategory('water')}
          >
            <Ionicons name="water" size={16} color={activeCategory === 'water' ? '#2e7d32' : '#666'} />
            <Text style={[styles.categoryText, activeCategory === 'water' && styles.categoryTextActive]}>Water</Text>
            {filters.water !== 'all' && <View style={styles.activeDot} />}
          </TouchableOpacity>
          {hasActiveFilters() && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearAllFilters}
            >
              <Ionicons name="close-circle" size={16} color="#f44336" />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <View style={styles.filterOptionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {activeCategory === 'type' && (
            <>
              <TouchableOpacity 
                style={[styles.filterChip, filters.type === 'all' && styles.filterChipActive]}
                onPress={() => updateFilter('type', 'all')}
              >
                <Text style={[styles.filterText, filters.type === 'all' && styles.filterTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.type === 'crops' && styles.filterChipActive]}
                onPress={() => updateFilter('type', 'crops')}
              >
                <Text style={[styles.filterText, filters.type === 'crops' && styles.filterTextActive]}>🥕 Crops</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.type === 'trees' && styles.filterChipActive]}
                onPress={() => updateFilter('type', 'trees')}
              >
                <Text style={[styles.filterText, filters.type === 'trees' && styles.filterTextActive]}>🌳 Trees</Text>
              </TouchableOpacity>
            </>
          )}

          {activeCategory === 'health' && (
            <>
              <TouchableOpacity 
                style={[styles.filterChip, filters.health === 'all' && styles.filterChipActive]}
                onPress={() => updateFilter('health', 'all')}
              >
                <Text style={[styles.filterText, filters.health === 'all' && styles.filterTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.health === 'healthy' && styles.filterChipActive]}
                onPress={() => updateFilter('health', 'healthy')}
              >
                <Text style={[styles.filterText, filters.health === 'healthy' && styles.filterTextActive]}>✅ Healthy</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.health === 'stressed' && styles.filterChipActive]}
                onPress={() => updateFilter('health', 'stressed')}
              >
                <Text style={[styles.filterText, filters.health === 'stressed' && styles.filterTextActive]}>⚠️ Stressed</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.health === 'recovering' && styles.filterChipActive]}
                onPress={() => updateFilter('health', 'recovering')}
              >
                <Text style={[styles.filterText, filters.health === 'recovering' && styles.filterTextActive]}>🔄 Recovering</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.health === 'sick' && styles.filterChipActive]}
                onPress={() => updateFilter('health', 'sick')}
              >
                <Text style={[styles.filterText, filters.health === 'sick' && styles.filterTextActive]}>❌ Sick</Text>
              </TouchableOpacity>
            </>
          )}

          {activeCategory === 'space' && (
            <>
              <TouchableOpacity 
                style={[styles.filterChip, filters.space === 'all' && styles.filterChipActive]}
                onPress={() => updateFilter('space', 'all')}
              >
                <Text style={[styles.filterText, filters.space === 'all' && styles.filterTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.space === 'pot' && styles.filterChipActive]}
                onPress={() => updateFilter('space', 'pot')}
              >
                <Ionicons name="cube-outline" size={14} color={filters.space === 'pot' ? '#2e7d32' : '#666'} />
                <Text style={[styles.filterText, filters.space === 'pot' && styles.filterTextActive]}> Pot</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.space === 'bed' && styles.filterChipActive]}
                onPress={() => updateFilter('space', 'bed')}
              >
                <Ionicons name="apps" size={14} color={filters.space === 'bed' ? '#2e7d32' : '#666'} />
                <Text style={[styles.filterText, filters.space === 'bed' && styles.filterTextActive]}> Bed</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.space === 'ground' && styles.filterChipActive]}
                onPress={() => updateFilter('space', 'ground')}
              >
                <Ionicons name="earth" size={14} color={filters.space === 'ground' ? '#2e7d32' : '#666'} />
                <Text style={[styles.filterText, filters.space === 'ground' && styles.filterTextActive]}> Ground</Text>
              </TouchableOpacity>
            </>
          )}

          {activeCategory === 'sunlight' && (
            <>
              <TouchableOpacity 
                style={[styles.filterChip, filters.sunlight === 'all' && styles.filterChipActive]}
                onPress={() => updateFilter('sunlight', 'all')}
              >
                <Text style={[styles.filterText, filters.sunlight === 'all' && styles.filterTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.sunlight === 'full_sun' && styles.filterChipActive]}
                onPress={() => updateFilter('sunlight', 'full_sun')}
              >
                <Text style={[styles.filterText, filters.sunlight === 'full_sun' && styles.filterTextActive]}>☀️ Full Sun</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.sunlight === 'partial_sun' && styles.filterChipActive]}
                onPress={() => updateFilter('sunlight', 'partial_sun')}
              >
                <Text style={[styles.filterText, filters.sunlight === 'partial_sun' && styles.filterTextActive]}>⛅ Partial</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.sunlight === 'shade' && styles.filterChipActive]}
                onPress={() => updateFilter('sunlight', 'shade')}
              >
                <Text style={[styles.filterText, filters.sunlight === 'shade' && styles.filterTextActive]}>🌤️ Shade</Text>
              </TouchableOpacity>
            </>
          )}

          {activeCategory === 'water' && (
            <>
              <TouchableOpacity 
                style={[styles.filterChip, filters.water === 'all' && styles.filterChipActive]}
                onPress={() => updateFilter('water', 'all')}
              >
                <Text style={[styles.filterText, filters.water === 'all' && styles.filterTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.water === 'low' && styles.filterChipActive]}
                onPress={() => updateFilter('water', 'low')}
              >
                <Text style={[styles.filterText, filters.water === 'low' && styles.filterTextActive]}>💧 Low</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.water === 'medium' && styles.filterChipActive]}
                onPress={() => updateFilter('water', 'medium')}
              >
                <Text style={[styles.filterText, filters.water === 'medium' && styles.filterTextActive]}>💧💧 Medium</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.water === 'high' && styles.filterChipActive]}
                onPress={() => updateFilter('water', 'high')}
              >
                <Text style={[styles.filterText, filters.water === 'high' && styles.filterTextActive]}>💧💧💧 High</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {displayedPlants.length} of {filteredPlants.length} plants
        </Text>
      </View>

      <FlatList
        data={displayedPlants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlantCard
            plant={item}
            onPress={() => navigation.navigate('PlantDetail', { plantId: item.id })}
            onEdit={() => navigation.navigate('PlantForm', { plantId: item.id })}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadPlants} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="leaf-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No plants found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters or add a new plant</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#2e7d32" />
              <Text style={styles.loadingText}>Loading more plants...</Text>
            </View>
          ) : hasMore && displayedPlants.length > 0 ? (
            <TouchableOpacity style={styles.loadMoreButton} onPress={loadMore}>
              <Text style={styles.loadMoreText}>Load More</Text>
              <Ionicons name="chevron-down" size={16} color="#2e7d32" />
            </TouchableOpacity>
          ) : null
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 48,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2e7d32',
    marginLeft: 4,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
    marginLeft: 4,
    gap: 4,
  },
  clearText: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: '600',
  },
  filterOptionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fafafa',
  },
  resultsText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginVertical: 8,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 48,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
