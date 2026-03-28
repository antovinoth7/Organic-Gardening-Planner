import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { getAllPlants, deletePlant } from "../services/plants";
import {
  DEFAULT_CHILD_LOCATIONS,
  DEFAULT_PARENT_LOCATIONS,
  getLocationConfig,
} from "../services/locations";
import {
  Plant,
  PlantType,
  SpaceType,
  HealthStatus,
  SunlightLevel,
  WaterRequirement,
} from "../types/database.types";
import PlantCard from "../components/PlantCard";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { createStyles } from "../styles/plantsStyles";
import {
  useTabBarScroll,
  TAB_BAR_HEIGHT,
  AnimatedFAB,
} from "../components/FloatingTabBar";

type FilterType = "all" | PlantType;
type SortOption = "name" | "newest" | "oldest" | "health" | "age";

interface ActiveFilters {
  type: FilterType;
  health: HealthStatus | "all";
  space: SpaceType | "all";
  sunlight: SunlightLevel | "all";
  water: WaterRequirement | "all";
  parentLocation: string;
  childLocation: string;
  pestStatus: "all" | "active_issues" | "no_issues";
}

const ITEMS_PER_PAGE = 20;

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function PlantsScreen({ navigation, route }: any) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const loadMoreTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { onScroll: onTabBarScroll, resetTabBar } = useTabBarScroll();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');

  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [filters, setFilters] = useState<ActiveFilters>({
    type: "all",
    health: "all",
    space: "all",
    sunlight: "all",
    water: "all",
    parentLocation: "",
    childLocation: "",
    pestStatus: "all",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [homeHealthFilter, setHomeHealthFilter] = useState<string | null>(null);
  const [parentLocations, setParentLocations] = useState<string[]>(
    DEFAULT_PARENT_LOCATIONS,
  );
  const [childLocations, setChildLocations] = useState<string[]>(
    DEFAULT_CHILD_LOCATIONS,
  );

  const handleScroll = useCallback((e: any) => {
    onTabBarScroll(e);
  }, [onTabBarScroll]);

  const loadPlants = async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const data = await getAllPlants();
      setPlants(data);
      if (!options?.silent) {
        setDisplayCount(ITEMS_PER_PAGE);
      }
    } catch (error: any) {
      if (!options?.silent) {
        Alert.alert("Error", error.message);
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  const loadLocations = async () => {
    try {
      const config = await getLocationConfig();
      setParentLocations(config.parentLocations);
      setChildLocations(config.childLocations);
    } catch (error) {
      console.error("Error loading locations:", error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Load data on mount
    loadLocations();
    loadPlants();

    const unsubscribe = navigation.addListener("focus", () => {
      if (isMounted) {
        resetTabBar();
        void loadPlants({ silent: true });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      // Clear any pending loadMore timeout
      if (loadMoreTimeoutRef.current) {
        clearTimeout(loadMoreTimeoutRef.current);
      }
    };
  }, [navigation]);

  // Listen for refresh param from child screens (after add/edit/delete)
  useEffect(() => {
    const refreshParam = route?.params?.refresh;
    if (refreshParam) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      resetTabBar();
      loadPlants();
      // Clear the param to prevent repeated refreshes
      navigation.setParams({ refresh: undefined });
    }
  }, [route?.params?.refresh, navigation]);

  // Handle healthFilter param from Home screen Garden Health tiles
  useEffect(() => {
    const healthFilter = route?.params?.healthFilter;
    if (healthFilter) {
      if (healthFilter === "healthy") {
        setFilters((prev) => ({ ...prev, health: "healthy" as HealthStatus }));
        setHomeHealthFilter("healthy");
      } else if (healthFilter === "sick") {
        setFilters((prev) => ({ ...prev, health: "sick" as HealthStatus }));
        setHomeHealthFilter("sick");
      } else if (healthFilter === "stressed") {
        setFilters((prev) => ({ ...prev, health: "stressed" as HealthStatus }));
        setHomeHealthFilter("stressed");
      }
      setShowFilters(true);
      navigation.setParams({ healthFilter: undefined });
    }
  }, [route?.params?.healthFilter, navigation]);

  const handleDelete = async (id: string) => {
    Alert.alert("Delete Plant", "Are you sure you want to delete this plant?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePlant(id);
            loadPlants();
            Alert.alert("Deleted", "Plant removed successfully.");
          } catch (error: any) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  const getFilteredPlants = useCallback(() => {
    if (!plants || plants.length === 0) return [];
    let filtered = [...plants];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p &&
          p.name &&
          (p.name.toLowerCase().includes(query) ||
            (p.plant_variety &&
              p.plant_variety.toLowerCase().includes(query)) ||
            (p.variety && p.variety.toLowerCase().includes(query)) ||
            (p.location && p.location.toLowerCase().includes(query)) ||
            (p.landmarks && p.landmarks.toLowerCase().includes(query))),
      );
    }

    if (filters.type !== "all") {
      filtered = filtered.filter((p) => p.plant_type === filters.type);
    }

    if (filters.health !== "all") {
      if (filters.health === "healthy") {
        filtered = filtered.filter(
          (p) =>
            !p.health_status ||
            p.health_status === "healthy" ||
            p.health_status === "recovering",
        );
      } else {
        filtered = filtered.filter((p) => p.health_status === filters.health);
      }
    }

    if (filters.space !== "all") {
      filtered = filtered.filter((p) => p.space_type === filters.space);
    }

    if (filters.sunlight !== "all") {
      filtered = filtered.filter((p) => p.sunlight === filters.sunlight);
    }

    if (filters.water !== "all") {
      filtered = filtered.filter((p) => p.water_requirement === filters.water);
    }

    if (filters.parentLocation) {
      filtered = filtered.filter((p) =>
        p.location?.includes(filters.parentLocation),
      );
    }

    if (filters.childLocation) {
      filtered = filtered.filter((p) =>
        p.location?.includes(filters.childLocation),
      );
    }

    if (filters.pestStatus !== "all") {
      filtered = filtered.filter((p) => {
        const activeIssues = (p.pest_disease_history || []).filter(r => !r.resolved).length;
        return filters.pestStatus === "active_issues" ? activeIssues > 0 : activeIssues === 0;
      });
    }

    return filtered;
  }, [filters, plants, searchQuery]);

  const getSortedPlants = useCallback(
    (plantsToSort: Plant[]) => {
      const sorted = [...plantsToSort];

      switch (sortBy) {
        case "name":
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
        case "newest":
          return sorted.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
        case "oldest":
          return sorted.sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          );
        case "health": {
          const healthOrder = {
            healthy: 0,
            recovering: 1,
            stressed: 2,
            sick: 3,
          };
          return sorted.sort((a, b) => {
            const aHealth = a.health_status || "healthy";
            const bHealth = b.health_status || "healthy";
            return healthOrder[aHealth] - healthOrder[bHealth];
          });
        }
        case "age":
          return sorted.sort((a, b) => {
            const aDate = a.planting_date
              ? new Date(a.planting_date).getTime()
              : 0;
            const bDate = b.planting_date
              ? new Date(b.planting_date).getTime()
              : 0;
            return aDate - bDate;
          });
        default:
          return sorted;
      }
    },
    [sortBy],
  );

  const updateFilter = <K extends keyof ActiveFilters>(
    category: K,
    value: ActiveFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [category]: value }));
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.type !== "all") count++;
    if (filters.health !== "all") count++;
    if (filters.space !== "all") count++;
    if (filters.sunlight !== "all") count++;
    if (filters.water !== "all") count++;
    if (filters.parentLocation !== "") count++;
    if (filters.childLocation !== "") count++;
    if (filters.pestStatus !== "all") count++;
    return count;
  }, [filters]);

  const hasActiveFilters = useMemo(
    () => activeFilterCount > 0 || searchQuery.trim() !== "",
    [activeFilterCount, searchQuery],
  );

  const clearAllFilters = () => {
    setFilters({
      type: "all",
      health: "all",
      space: "all",
      sunlight: "all",
      water: "all",
      parentLocation: "",
      childLocation: "",
      pestStatus: "all",
    });
    setSearchQuery("");
    setHomeHealthFilter(null);
    setDisplayCount(ITEMS_PER_PAGE);
  };

  const toggleFilters = () => {
    if (!showFilters) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setShowFilters((prev) => !prev);
  };

  const filteredPlants = useMemo(
    () => getSortedPlants(getFilteredPlants()),
    [getFilteredPlants, getSortedPlants],
  );

  const displayedPlants = useMemo(() => {
    return filteredPlants.slice(0, displayCount);
  }, [filteredPlants, displayCount]);

  const hasMore = displayCount < filteredPlants.length;

  const loadMore = () => {
    if (loadingMore || !hasMore) return;

    // Clear any existing timeout
    if (loadMoreTimeoutRef.current) {
      clearTimeout(loadMoreTimeoutRef.current);
    }

    setLoadingMore(true);
    loadMoreTimeoutRef.current = setTimeout(() => {
      setDisplayCount((prev) =>
        Math.min(prev + ITEMS_PER_PAGE, filteredPlants.length),
      );
      setLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 300);
  };

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [filters, searchQuery, sortBy]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {searchActive ? (
          /* ── Expanded search bar ── */
          <View style={styles.searchExpandedRow}>
            <TouchableOpacity
              style={styles.searchBackBtn}
              onPress={() => {
                setSearchActive(false);
                if (!searchQuery.trim()) setSearchQuery("");
              }}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={styles.searchExpandedWrapper}>
              <Ionicons name="search" size={16} color={theme.textSecondary} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchExpandedInput}
                placeholder="Search plants..."
                value={searchQuery}
                onChangeText={(text) => setSearchQuery(text)}
                placeholderTextColor={theme.inputPlaceholder}
                autoFocus
                returnKeyType="search"
              />
              {searchQuery.trim() !== "" && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          /* ── Collapsed header with action icons ── */
          <>
            <Text style={styles.headerTitle}>Plants</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => setSearchActive(true)}
              >
                <Ionicons name="search" size={20} color={searchQuery.trim() ? theme.primary : theme.primary} />
                {searchQuery.trim() !== "" && <View style={styles.searchActiveDot} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => navigation.navigate("ArchivedPlants")}
              >
                <Ionicons name="archive" size={20} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}
              >
                <Ionicons
                  name={viewMode === 'list' ? 'grid' : 'list'}
                  size={20}
                  color={theme.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.headerIconBtn,
                  showFilters && styles.headerIconBtnActive,
                ]}
                onPress={toggleFilters}
              >
                <Ionicons
                  name="funnel"
                  size={20}
                  color={showFilters ? "#fff" : theme.primary}
                />
                {activeFilterCount > 0 && !showFilters && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => setShowSortMenu(!showSortMenu)}
              >
                <Ionicons name="swap-vertical" size={22} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Sort Menu */}
      {showSortMenu && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000 }]} pointerEvents="box-none">
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setShowSortMenu(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.sortMenu, { marginTop: insets.top + 68 }]}
              onPress={() => {}}
            >
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === "name" && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy("name");
                  setShowSortMenu(false);
                }}
              >
                <Ionicons
                  name="text"
                  size={18}
                  color={
                    sortBy === "name" ? theme.primary : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.sortText,
                    sortBy === "name" && styles.sortTextActive,
                  ]}
                >
                  Name (A-Z)
                </Text>
                {sortBy === "name" && (
                  <Ionicons name="checkmark" size={18} color={theme.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === "newest" && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy("newest");
                  setShowSortMenu(false);
                }}
              >
                <Ionicons
                  name="time"
                  size={18}
                  color={
                    sortBy === "newest" ? theme.primary : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.sortText,
                    sortBy === "newest" && styles.sortTextActive,
                  ]}
                >
                  Newest First
                </Text>
                {sortBy === "newest" && (
                  <Ionicons name="checkmark" size={18} color={theme.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === "oldest" && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy("oldest");
                  setShowSortMenu(false);
                }}
              >
                <Ionicons
                  name="hourglass"
                  size={18}
                  color={
                    sortBy === "oldest" ? theme.primary : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.sortText,
                    sortBy === "oldest" && styles.sortTextActive,
                  ]}
                >
                  Oldest First
                </Text>
                {sortBy === "oldest" && (
                  <Ionicons name="checkmark" size={18} color={theme.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === "health" && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy("health");
                  setShowSortMenu(false);
                }}
              >
                <Ionicons
                  name="fitness"
                  size={18}
                  color={
                    sortBy === "health" ? theme.primary : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.sortText,
                    sortBy === "health" && styles.sortTextActive,
                  ]}
                >
                  Health Status
                </Text>
                {sortBy === "health" && (
                  <Ionicons name="checkmark" size={18} color={theme.primary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortOption,
                  sortBy === "age" && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy("age");
                  setShowSortMenu(false);
                }}
              >
                <Ionicons
                  name="trending-up"
                  size={18}
                  color={sortBy === "age" ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.sortText,
                    sortBy === "age" && styles.sortTextActive,
                  ]}
                >
                  Age (Oldest)
                </Text>
                {sortBy === "age" && (
                  <Ionicons name="checkmark" size={18} color={theme.primary} />
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Bottom Sheet */}
      {showFilters && (
        <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
            {/* Backdrop - tapping closes */}
            <Pressable style={StyleSheet.absoluteFill} onPress={toggleFilters} />

            {/* Sheet content - sits at bottom, not nested inside backdrop */}
            <View style={[styles.sheetContainer, { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) }]}>
              {/* Handle bar */}
              <TouchableOpacity activeOpacity={0.6} onPress={toggleFilters} style={styles.sheetHandleArea}>
                <View style={styles.sheetHandle} />
              </TouchableOpacity>

              {/* Header */}
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Filter Plants</Text>
                {hasActiveFilters && (
                  <TouchableOpacity onPress={clearAllFilters} style={styles.sheetClearBtn}>
                    <Text style={styles.sheetClearText}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.sheetScroll}
                bounces={false}
                nestedScrollEnabled
              >
                {/* Plant Type */}
                <Text style={styles.sheetSectionTitle}>
                  <Ionicons name="apps" size={14} color={theme.textSecondary} /> Plant Type
                </Text>
                <View style={styles.sheetChipWrap}>
                  {([["all", "All"], ["vegetable", "🥕 Vegetable"], ["fruit_tree", "🍇 Fruit"], ["coconut_tree", "🥥 Coconut"], ["herb", "🌿 Herb"], ["timber_tree", "🌳 Timber"], ["flower", "🌸 Flower"], ["shrub", "🪴 Shrub"]] as const).map(([val, label]) => (
                    <TouchableOpacity
                      key={val}
                      style={[styles.sheetChip, filters.type === val && styles.sheetChipActive]}
                      onPress={() => updateFilter("type", val as FilterType)}
                    >
                      <Text style={[styles.sheetChipText, filters.type === val && styles.sheetChipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Health */}
                <Text style={styles.sheetSectionTitle}>
                  <Ionicons name="fitness" size={14} color={theme.textSecondary} /> Health
                </Text>
                <View style={styles.sheetChipWrap}>
                  {([["all", "All"], ["healthy", "✅ Healthy"], ["stressed", "⚠️ Stressed"], ["recovering", "🔄 Recovering"], ["sick", "❌ Sick"]] as const).map(([val, label]) => (
                    <TouchableOpacity
                      key={val}
                      style={[styles.sheetChip, filters.health === val && styles.sheetChipActive]}
                      onPress={() => updateFilter("health", val as HealthStatus | "all")}
                    >
                      <Text style={[styles.sheetChipText, filters.health === val && styles.sheetChipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Space */}
                <Text style={styles.sheetSectionTitle}>
                  <Ionicons name="cube" size={14} color={theme.textSecondary} /> Space Type
                </Text>
                <View style={styles.sheetChipWrap}>
                  {([["all", "All"], ["pot", "Pot"], ["bed", "Bed"], ["ground", "Ground"]] as const).map(([val, label]) => (
                    <TouchableOpacity
                      key={val}
                      style={[styles.sheetChip, filters.space === val && styles.sheetChipActive]}
                      onPress={() => updateFilter("space", val as SpaceType | "all")}
                    >
                      <Text style={[styles.sheetChipText, filters.space === val && styles.sheetChipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Sunlight */}
                <Text style={styles.sheetSectionTitle}>
                  <Ionicons name="sunny" size={14} color={theme.textSecondary} /> Sunlight
                </Text>
                <View style={styles.sheetChipWrap}>
                  {([["all", "All"], ["full_sun", "☀️ Full Sun"], ["partial_sun", "⛅ Partial"], ["shade", "🌤️ Shade"]] as const).map(([val, label]) => (
                    <TouchableOpacity
                      key={val}
                      style={[styles.sheetChip, filters.sunlight === val && styles.sheetChipActive]}
                      onPress={() => updateFilter("sunlight", val as SunlightLevel | "all")}
                    >
                      <Text style={[styles.sheetChipText, filters.sunlight === val && styles.sheetChipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Water */}
                <Text style={styles.sheetSectionTitle}>
                  <Ionicons name="water" size={14} color={theme.textSecondary} /> Water Requirement
                </Text>
                <View style={styles.sheetChipWrap}>
                  {([["all", "All"], ["low", "💧 Low"], ["medium", "💧💧 Medium"], ["high", "💧💧💧 High"]] as const).map(([val, label]) => (
                    <TouchableOpacity
                      key={val}
                      style={[styles.sheetChip, filters.water === val && styles.sheetChipActive]}
                      onPress={() => updateFilter("water", val as WaterRequirement | "all")}
                    >
                      <Text style={[styles.sheetChipText, filters.water === val && styles.sheetChipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Pest Status */}
                <Text style={styles.sheetSectionTitle}>
                  <Ionicons name="bug" size={14} color={theme.textSecondary} /> Pest & Disease
                </Text>
                <View style={styles.sheetChipWrap}>
                  {([["all", "All"], ["active_issues", "🐛 Active Issues"], ["no_issues", "✅ No Issues"]] as const).map(([val, label]) => (
                    <TouchableOpacity
                      key={val}
                      style={[styles.sheetChip, filters.pestStatus === val && styles.sheetChipActive]}
                      onPress={() => updateFilter("pestStatus", val)}
                    >
                      <Text style={[styles.sheetChipText, filters.pestStatus === val && styles.sheetChipTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Location */}
                <Text style={styles.sheetSectionTitle}>
                  <Ionicons name="location" size={14} color={theme.textSecondary} /> Location
                </Text>
                <View style={styles.sheetChipWrap}>
                  <TouchableOpacity
                    style={[styles.sheetChip, filters.parentLocation === "" && styles.sheetChipActive]}
                    onPress={() => { updateFilter("parentLocation", ""); updateFilter("childLocation", ""); }}
                  >
                    <Text style={[styles.sheetChipText, filters.parentLocation === "" && styles.sheetChipTextActive]}>All</Text>
                  </TouchableOpacity>
                  {parentLocations.map((loc) => (
                    <TouchableOpacity
                      key={loc}
                      style={[styles.sheetChip, filters.parentLocation === loc && styles.sheetChipActive]}
                      onPress={() => { updateFilter("parentLocation", loc); updateFilter("childLocation", ""); }}
                    >
                      <Text style={[styles.sheetChipText, filters.parentLocation === loc && styles.sheetChipTextActive]}>📍 {loc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {filters.parentLocation !== "" && (
                  <>
                    <Text style={styles.sheetSubSectionTitle}>Direction</Text>
                    <View style={styles.sheetChipWrap}>
                      <TouchableOpacity
                        style={[styles.sheetChip, filters.childLocation === "" && styles.sheetChipActive]}
                        onPress={() => updateFilter("childLocation", "")}
                      >
                        <Text style={[styles.sheetChipText, filters.childLocation === "" && styles.sheetChipTextActive]}>All</Text>
                      </TouchableOpacity>
                      {childLocations.filter(loc => loc.trim()).map((loc) => (
                        <TouchableOpacity
                          key={loc}
                          style={[styles.sheetChip, filters.childLocation === loc && styles.sheetChipActive]}
                          onPress={() => updateFilter("childLocation", loc)}
                        >
                          <Text style={[styles.sheetChipText, filters.childLocation === loc && styles.sheetChipTextActive]}>◉ {loc}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <View style={{ height: 12 }} />
              </ScrollView>
            </View>
        </View>
      )}

      <View style={styles.resultsHeader}>
        <View style={styles.resultsLeft}>
          <Ionicons name="leaf" size={14} color={theme.primary} />
          <Text style={styles.resultsCount}>{filteredPlants.length}</Text>
          {hasActiveFilters ? (
            <>
              <Text style={styles.resultsLabel}>of {plants.length} {plants.length === 1 ? 'Plant' : 'Plants'}</Text>
              <View style={styles.resultsFilteredBadge}>
                <Text style={styles.resultsFilteredText}>filtered</Text>
              </View>
            </>
          ) : (
            <Text style={styles.resultsLabel}>
              {filteredPlants.length === 1 ? 'Plant' : 'Plants'}
            </Text>
          )}
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={displayedPlants}
        key={viewMode}
        numColumns={viewMode === 'grid' ? 2 : 1}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlantCard
            plant={item}
            compact={viewMode === 'grid'}
            onPress={() =>
              navigation.navigate("PlantDetail", { plantId: item.id })
            }
            onEdit={() =>
              navigation.navigate("PlantForm", { plantId: item.id })
            }
            onDelete={() => handleDelete(item.id)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 48) + 16 },
        ]}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadPlants} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons
                name={
                  homeHealthFilter === "healthy"
                    ? "happy-outline"
                    : homeHealthFilter === "sick"
                      ? "medkit-outline"
                      : homeHealthFilter === "stressed"
                        ? "warning-outline"
                        : "leaf-outline"
                }
                size={64}
                color={
                  homeHealthFilter === "healthy"
                    ? theme.success
                    : homeHealthFilter === "sick"
                      ? theme.error
                      : homeHealthFilter === "stressed"
                        ? theme.warning
                        : theme.border
                }
              />
              <Text style={styles.emptyText}>
                {homeHealthFilter === "healthy"
                  ? "No healthy plants yet"
                  : homeHealthFilter === "sick"
                    ? "No sick plants — great news!"
                    : homeHealthFilter === "stressed"
                      ? "No stressed plants — looking good!"
                      : "No plants found"}
              </Text>
              <Text style={styles.emptySubtext}>
                {homeHealthFilter === "healthy"
                  ? "Add plants and keep them thriving"
                  : homeHealthFilter === "sick"
                    ? "All your plants are doing well 🌱"
                    : homeHealthFilter === "stressed"
                      ? "Your garden is healthy and happy 🎉"
                      : "Try adjusting your filters or add a new plant"}
              </Text>
              {homeHealthFilter && (
                <TouchableOpacity
                  style={styles.clearFiltersEmptyButton}
                  onPress={clearAllFilters}
                >
                  <Ionicons name="arrow-back" size={16} color={theme.primary} />
                  <Text style={styles.clearFiltersEmptyText}>Show All Plants</Text>
                </TouchableOpacity>
              )}
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
        // Memory optimization settings
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        // Critical: Prevent memory leaks from unmounting images
        updateCellsBatchingPeriod={50}
      />

      {/* Floating Action Button */}
      <AnimatedFAB onPress={() => navigation.navigate("PlantForm")} />


    </View>
  );
}

