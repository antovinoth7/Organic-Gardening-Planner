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
  Dimensions,
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
  const [scrolledDown, setScrolledDown] = useState(false);
  const scrollOffsetRef = useRef(0);
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
    const offsetY = e.nativeEvent.contentOffset.y;
    scrollOffsetRef.current = offsetY;
    const isDown = offsetY > 300;
    if (isDown !== scrolledDown) setScrolledDown(isDown);
  }, [onTabBarScroll, scrolledDown]);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const scrollToBottom = useCallback(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, []);

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
          <Text style={styles.resultsLabel}>
            {filteredPlants.length === 1 ? 'plant' : 'plants'}
          </Text>
          {hasActiveFilters && (
            <View style={styles.resultsFilteredBadge}>
              <Text style={styles.resultsFilteredText}>filtered</Text>
            </View>
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

      {/* Scroll navigation arrows */}
      {displayedPlants.length > 0 && (
        <View style={[styles.scrollNavContainer, { bottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) + 8 }]}>
          {scrolledDown && (
            <TouchableOpacity style={styles.scrollNavBtn} onPress={scrollToTop} activeOpacity={0.8}>
              <Ionicons name="chevron-up" size={20} color={theme.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.scrollNavBtn} onPress={scrollToBottom} activeOpacity={0.8}>
            <Ionicons name="chevron-down" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 12,
      backgroundColor: theme.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.text,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    headerIconBtnActive: {
      backgroundColor: theme.primary,
    },
    searchActiveDot: {
      position: "absolute",
      bottom: 6,
      right: 6,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.primary,
    },
    searchExpandedRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    searchBackBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: "center",
      justifyContent: "center",
    },
    searchExpandedWrapper: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      gap: 8,
    },
    searchExpandedInput: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      padding: 0,
    },
    filterBadge: {
      position: "absolute",
      top: 1,
      right: 1,
      minWidth: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 2,
    },
    filterBadgeText: {
      fontSize: 9,
      color: theme.buttonText,
      fontWeight: "700",
      lineHeight: 14,
    },
    filterToggleButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    filterToggleButtonActive: {
      backgroundColor: theme.primary,
    },
    gridRow: {
      justifyContent: "space-between",
    },
    activeFiltersRow: {
      backgroundColor: theme.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    activeFiltersScroll: {
      alignItems: "center",
      gap: 6,
    },
    activeFilterPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.primaryLight,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 4,
      gap: 4,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    activeFilterPillText: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: "600",
    },
    clearAllPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    clearAllPillText: {
      fontSize: 12,
      color: theme.error,
      fontWeight: "600",
    },
    sortMenu: {
      backgroundColor: theme.backgroundSecondary,
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sortOption: {
      flexDirection: "row",
      alignItems: "center",
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
      fontWeight: "600",
      color: theme.primary,
    },
    sheetOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
      zIndex: 1000,
      elevation: 1000,
    },
    sheetContainer: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
    },
    sheetHandleArea: {
      alignItems: "center",
      paddingTop: 10,
      paddingBottom: 8,
    },
    sheetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
    },
    sheetClearBtn: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 14,
      backgroundColor: theme.errorLight,
    },
    sheetClearText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.error,
    },
    sheetScroll: {
      paddingHorizontal: 20,
      maxHeight: Dimensions.get("window").height * 0.55,
    },
    sheetSectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: 16,
      marginBottom: 8,
    },
    sheetSubSectionTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textSecondary,
      marginTop: 8,
      marginBottom: 6,
    },
    sheetChipWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    sheetChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sheetChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    sheetChipText: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: "500",
    },
    sheetChipTextActive: {
      color: theme.primary,
      fontWeight: "600",
    },

    resultsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.background,
    },
    resultsLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    resultsCount: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
    },
    resultsLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: "500",
    },
    resultsFilteredBadge: {
      backgroundColor: theme.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    resultsFilteredText: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.primary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    resultsShowing: {
      fontSize: 12,
      color: theme.textTertiary,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 120,
    },
    loadingMore: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 20,
      gap: 8,
    },
    loadingText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    loadMoreButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 16,
      marginVertical: 8,
      backgroundColor: theme.primaryLight,
      borderRadius: 12,
      gap: 8,
    },
    loadMoreText: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: "600",
    },
    healthAlertBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.warningLight,
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    healthAlertText: {
      flex: 1,
      fontSize: 13,
      color: theme.warning,
      fontWeight: "600",
    },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      padding: 48,
      marginTop: 48,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    clearFiltersEmptyButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 20,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.primaryLight,
    },
    clearFiltersEmptyText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.primary,
    },
    scrollNavContainer: {
      position: "absolute",
      left: 12,
      flexDirection: "column",
      gap: 6,
      zIndex: 50,
    },
    scrollNavBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
    },
  });
