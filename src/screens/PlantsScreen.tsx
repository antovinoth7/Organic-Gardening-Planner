import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { getPlants, deletePlant } from '../services/plants';
import { Plant, PlantType, SpaceType, HealthStatus, SunlightLevel, WaterRequirement } from '../types/database.types';
import PlantCard from '../components/PlantCard';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

type FilterCategory = 'type' | 'health' | 'space' | 'sunlight' | 'water' | 'location';
type FilterType = 'all' | PlantType;
type SortOption = 'name' | 'newest' | 'oldest' | 'health' | 'age';

interface ActiveFilters {
  type: FilterType;
  health: HealthStatus | 'all';
  space: SpaceType | 'all';
  sunlight: SunlightLevel | 'all';
  water: WaterRequirement | 'all';
  parentLocation: string;
  childLocation: string;
}

const ITEMS_PER_PAGE = 20;

const PARENT_LOCATIONS = ['Mangarai', 'Velliavilai Home', 'Velliavilai Near Pond', 'Palappallam'];
const CHILD_LOCATIONS = ['North', 'South', 'East', 'West', 'North-East', 'North-West', 'South-East', 'South-West', 'Center', 'Front', 'Back'];

export default function PlantsScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const flatListRef = useRef<FlatList>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('type');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filters, setFilters] = useState<ActiveFilters>({
    type: 'all',
    health: 'all',
    space: 'all',
    sunlight: 'all',
    water: 'all',
    parentLocation: '',
    childLocation: '',
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
    let isMounted = true;
    
    const unsubscribe = navigation.addListener('focus', () => {
      if (isMounted) {
        // Reset scroll to top
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        loadPlants();
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
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
    if (!plants || plants.length === 0) return [];
    let filtered = [...plants];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p && p.name && (
          p.name.toLowerCase().includes(query) ||
          (p.plant_variety && p.plant_variety.toLowerCase().includes(query)) ||
          (p.variety && p.variety.toLowerCase().includes(query)) ||
          (p.location && p.location.toLowerCase().includes(query))
        )
      );
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(p => p.plant_type === filters.type);
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

    if (filters.parentLocation) {
      filtered = filtered.filter(p => p.location?.includes(filters.parentLocation));
    }

    if (filters.childLocation) {
      filtered = filtered.filter(p => p.location?.includes(filters.childLocation));
    }

    return filtered;
  };

  const getSortedPlants = (plantsToSort: Plant[]) => {
    const sorted = [...plantsToSort];
    
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case 'health':
        const healthOrder = { healthy: 0, recovering: 1, stressed: 2, sick: 3 };
        return sorted.sort((a, b) => {
          const aHealth = a.health_status || 'healthy';
          const bHealth = b.health_status || 'healthy';
          return healthOrder[aHealth] - healthOrder[bHealth];
        });
      case 'age':
        return sorted.sort((a, b) => {
          const aDate = a.planting_date ? new Date(a.planting_date).getTime() : 0;
          const bDate = b.planting_date ? new Date(b.planting_date).getTime() : 0;
          return aDate - bDate;
        });
      default:
        return sorted;
    }
  };

  const updateFilter = <K extends keyof ActiveFilters>(category: K, value: ActiveFilters[K]) => {
    setFilters(prev => ({ ...prev, [category]: value }));
  };

  const hasActiveFilters = () => {
    return filters.type !== 'all' || filters.health !== 'all' || 
           filters.space !== 'all' || filters.sunlight !== 'all' || filters.water !== 'all' ||
           filters.parentLocation !== '' || filters.childLocation !== '' || searchQuery.trim() !== '';
  };

  const clearAllFilters = () => {
    setFilters({
      type: 'all',
      health: 'all',
      space: 'all',
      sunlight: 'all',
      water: 'all',
      parentLocation: '',
      childLocation: '',
    });
    setSearchQuery('');
    setDisplayCount(ITEMS_PER_PAGE);
  };

  const filteredPlants = useMemo(() => getSortedPlants(getFilteredPlants()), [plants, filters, searchQuery, sortBy]);
  
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
  }, [filters, searchQuery, sortBy]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Plants</Text>
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
        >
          <Ionicons name="swap-vertical" size={22} color="#2e7d32" />
        </TouchableOpacity>
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'name' && styles.sortOptionActive]}
            onPress={() => { setSortBy('name'); setShowSortMenu(false); }}
          >
            <Ionicons name="text" size={18} color={sortBy === 'name' ? '#2e7d32' : '#666'} />
            <Text style={[styles.sortText, sortBy === 'name' && styles.sortTextActive]}>Name (A-Z)</Text>
            {sortBy === 'name' && <Ionicons name="checkmark" size={18} color="#2e7d32" />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'newest' && styles.sortOptionActive]}
            onPress={() => { setSortBy('newest'); setShowSortMenu(false); }}
          >
            <Ionicons name="time" size={18} color={sortBy === 'newest' ? '#2e7d32' : '#666'} />
            <Text style={[styles.sortText, sortBy === 'newest' && styles.sortTextActive]}>Newest First</Text>
            {sortBy === 'newest' && <Ionicons name="checkmark" size={18} color="#2e7d32" />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'oldest' && styles.sortOptionActive]}
            onPress={() => { setSortBy('oldest'); setShowSortMenu(false); }}
          >
            <Ionicons name="hourglass" size={18} color={sortBy === 'oldest' ? '#2e7d32' : '#666'} />
            <Text style={[styles.sortText, sortBy === 'oldest' && styles.sortTextActive]}>Oldest First</Text>
            {sortBy === 'oldest' && <Ionicons name="checkmark" size={18} color="#2e7d32" />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'health' && styles.sortOptionActive]}
            onPress={() => { setSortBy('health'); setShowSortMenu(false); }}
          >
            <Ionicons name="fitness" size={18} color={sortBy === 'health' ? '#2e7d32' : '#666'} />
            <Text style={[styles.sortText, sortBy === 'health' && styles.sortTextActive]}>Health Status</Text>
            {sortBy === 'health' && <Ionicons name="checkmark" size={18} color="#2e7d32" />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortOption, sortBy === 'age' && styles.sortOptionActive]}
            onPress={() => { setSortBy('age'); setShowSortMenu(false); }}
          >
            <Ionicons name="trending-up" size={18} color={sortBy === 'age' ? '#2e7d32' : '#666'} />
            <Text style={[styles.sortText, sortBy === 'age' && styles.sortTextActive]}>Age (Oldest)</Text>
            {sortBy === 'age' && <Ionicons name="checkmark" size={18} color="#2e7d32" />}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {/* Search Button/Input */}
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={16} color="#666" />
            <TextInput
              style={styles.compactSearchInput}
              placeholder="Search..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.trim() !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.categoryChip, activeCategory === 'type' && styles.categoryChipActive]}
            onPress={() => setActiveCategory('type')}
          >
            <Ionicons name="apps" size={16} color={activeCategory === 'type' ? '#2e7d32' : '#666'} />
            <Text style={[styles.categoryText, activeCategory === 'type' && styles.categoryTextActive]}>Plant Type</Text>
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
          <TouchableOpacity 
            style={[styles.categoryChip, activeCategory === 'location' && styles.categoryChipActive]}
            onPress={() => setActiveCategory('location')}
          >
            <Ionicons name="location" size={16} color={activeCategory === 'location' ? '#2e7d32' : '#666'} />
            <Text style={[styles.categoryText, activeCategory === 'location' && styles.categoryTextActive]}>Location</Text>
            {(filters.parentLocation !== '' || filters.childLocation !== '') && <View style={styles.activeDot} />}
          </TouchableOpacity>
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
                style={[styles.filterChip, filters.type === 'vegetable' && styles.filterChipActive]}
                onPress={() => updateFilter('type', 'vegetable')}
              >
                <Text style={[styles.filterText, filters.type === 'vegetable' && styles.filterTextActive]}>🥕 Vegetable</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.type === 'herb' && styles.filterChipActive]}
                onPress={() => updateFilter('type', 'herb')}
              >
                <Text style={[styles.filterText, filters.type === 'herb' && styles.filterTextActive]}>🌿 Herb</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.type === 'flower' && styles.filterChipActive]}
                onPress={() => updateFilter('type', 'flower')}
              >
                <Text style={[styles.filterText, filters.type === 'flower' && styles.filterTextActive]}>🌸 Flower</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.type === 'fruit_tree' && styles.filterChipActive]}
                onPress={() => updateFilter('type', 'fruit_tree')}
              >
                <Text style={[styles.filterText, filters.type === 'fruit_tree' && styles.filterTextActive]}>🍎 Fruit Tree</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.type === 'timber_tree' && styles.filterChipActive]}
                onPress={() => updateFilter('type', 'timber_tree')}
              >
                <Text style={[styles.filterText, filters.type === 'timber_tree' && styles.filterTextActive]}>🌳 Timber Tree</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.type === 'coconut_tree' && styles.filterChipActive]}
                onPress={() => updateFilter('type', 'coconut_tree')}
              >
                <Text style={[styles.filterText, filters.type === 'coconut_tree' && styles.filterTextActive]}>🥥 Coconut Tree</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterChip, filters.type === 'shrub' && styles.filterChipActive]}
                onPress={() => updateFilter('type', 'shrub')}
              >
                <Text style={[styles.filterText, filters.type === 'shrub' && styles.filterTextActive]}>🪴 Shrub</Text>
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

          {activeCategory === 'location' && (
            <>
              <Text style={styles.filterSectionLabel}>Main Location:</Text>
              <TouchableOpacity 
                style={[styles.filterChip, filters.parentLocation === '' && styles.filterChipActive]}
                onPress={() => {
                  updateFilter('parentLocation', '');
                  updateFilter('childLocation', '');
                }}
              >
                <Text style={[styles.filterText, filters.parentLocation === '' && styles.filterTextActive]}>All</Text>
              </TouchableOpacity>
              {PARENT_LOCATIONS.map(loc => (
                <TouchableOpacity 
                  key={loc}
                  style={[styles.filterChip, filters.parentLocation === loc && styles.filterChipActive]}
                  onPress={() => {
                    updateFilter('parentLocation', loc);
                    updateFilter('childLocation', '');
                  }}
                >
                  <Text style={[styles.filterText, filters.parentLocation === loc && styles.filterTextActive]}>📍 {loc}</Text>
                </TouchableOpacity>
              ))}
              
              {filters.parentLocation !== '' && (
                <>
                  <View style={styles.filterDivider} />
                  <Text style={styles.filterSectionLabel}>Direction:</Text>
                  <TouchableOpacity 
                    style={[styles.filterChip, filters.childLocation === '' && styles.filterChipActive]}
                    onPress={() => updateFilter('childLocation', '')}
                  >
                    <Text style={[styles.filterText, filters.childLocation === '' && styles.filterTextActive]}>All</Text>
                  </TouchableOpacity>
                  {CHILD_LOCATIONS.map(loc => (
                    <TouchableOpacity 
                      key={loc}
                      style={[styles.filterChip, filters.childLocation === loc && styles.filterChipActive]}
                      onPress={() => updateFilter('childLocation', loc)}
                    >
                      <Text style={[styles.filterText, filters.childLocation === loc && styles.filterTextActive]}>🧭 {loc}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {displayedPlants.length} of {filteredPlants.length} plants
        </Text>
        {hasActiveFilters() && (
          <TouchableOpacity 
            style={styles.clearFiltersButton}
            onPress={clearAllFilters}
          >
            <Ionicons name="close-circle" size={18} color="#f44336" />
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        ref={flatListRef}
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

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('PlantForm')}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: theme.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    minWidth: 160,
    gap: 6,
  },
  compactSearchInput: {
    fontSize: 14,
    color: theme.text,
    padding: 0,
    minWidth: 80,
    maxWidth: 120,
  },
  sortMenu: {
    backgroundColor: theme.backgroundSecondary,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    gap: 12,
  },
  sortOptionActive: {
    backgroundColor: theme.background,
  },
  sortText: {
    flex: 1,
    fontSize: 15,
    color: theme.text,
  },
  sortTextActive: {
    fontWeight: '600',
    color: '#2e7d32',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
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
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
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
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#f44336',
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: '600',
  },
  filterOptionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.border,
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
  filterSectionLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.border,
    marginHorizontal: 8,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.background,
  },
  resultsText: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
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
    color: theme.textSecondary,
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
    color: theme.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
});
