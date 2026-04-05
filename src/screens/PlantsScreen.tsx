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
  Animated,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
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
import { useNavigation, useRoute, NavigationProp, ParamListBase } from "@react-navigation/native";
import { useTheme } from "../theme";
import { createStyles } from "../styles/plantsStyles";
import { logger } from "../utils/logger";
import { getErrorMessage } from "../utils/errorLogging";
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

const SORT_LABELS: Record<SortOption, string> = {
  name: "A–Z",
  newest: "Newest",
  oldest: "Oldest",
  health: "Health",
  age: "Age",
};

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function PlantsScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route = useRoute();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const loadMoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { onScroll: onTabBarScroll, resetTabBar } = useTabBarScroll();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; plant: Plant; index: number } | null>(null);
  const undoProgress = useRef(new Animated.Value(1)).current;
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openSwipeableRef = useRef<Swipeable | null>(null);

  // searchInput: raw controlled value; searchQuery: debounced, drives filtering
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const [sortBy, setSortBy] = useState<SortOption>("newest");
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

  const handleSearchChange = useCallback((text: string) => {
    setSearchInput(text);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(text);
    }, 300);
  }, []);

  const loadPlants = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const data = await getAllPlants();
      setPlants(data);
      if (!options?.silent) {
        setDisplayCount(ITEMS_PER_PAGE);
      }
    } catch (error: unknown) {
      if (!options?.silent) {
        Alert.alert("Error", getErrorMessage(error));
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  const loadLocations = useCallback(async () => {
    try {
      const config = await getLocationConfig();
      setParentLocations(config.parentLocations);
      setChildLocations(config.childLocations);
    } catch (error) {
      logger.error("Error loading locations", error as Error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
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
      if (loadMoreTimeoutRef.current) clearTimeout(loadMoreTimeoutRef.current);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, [navigation, loadPlants, loadLocations, resetTabBar]);

  useEffect(() => {
    const params = route.params as Record<string, unknown> | undefined;
    if (params?.refresh) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      resetTabBar();
      loadPlants();
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params, navigation, loadPlants, resetTabBar]);

  useEffect(() => {
    const params = route.params as Record<string, unknown> | undefined;
    const healthFilter = params?.healthFilter;
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
      setShowFilters(false);
      navigation.setParams({ healthFilter: undefined });
    }
  }, [route.params, navigation]);

  const commitDelete = useCallback(async (id: string) => {
    try {
      await deletePlant(id);
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error));
      void loadPlants();
    }
  }, [loadPlants]);

  const handleDelete = useCallback((id: string) => {
    const index = plants.findIndex((p) => p.id === id);
    if (index === -1) return;
    const plant = plants[index];

    // Cancel any in-flight undo for the previous pending delete
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      if (pendingDelete) {
        void commitDelete(pendingDelete.id);
      }
    }

    // Optimistic remove
    setPlants((prev) => prev.filter((p) => p.id !== id));
    setPendingDelete({ id, plant, index });

    // Animate progress bar from full → empty over 4 seconds
    undoProgress.setValue(1);
    Animated.timing(undoProgress, {
      toValue: 0,
      duration: 4000,
      useNativeDriver: false,
    }).start();

    undoTimerRef.current = setTimeout(() => {
      setPendingDelete(null);
      undoTimerRef.current = null;
      void commitDelete(id);
    }, 4000);
  }, [plants, pendingDelete, commitDelete, undoProgress]);

  const handleUndo = useCallback(() => {
    if (!pendingDelete) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    undoProgress.stopAnimation();
    // Restore plant at original index
    setPlants((prev) => {
      const next = [...prev];
      next.splice(pendingDelete.index, 0, pendingDelete.plant);
      return next;
    });
    setPendingDelete(null);
  }, [pendingDelete, undoProgress]);

  // Per-category counts from unfiltered plants for chip display
  const plantCounts = useMemo(() => {
    const type: Record<string, number> = {};
    const health: Record<string, number> = {};
    const space: Record<string, number> = {};
    const sunlight: Record<string, number> = {};
    const water: Record<string, number> = {};
    let pestActive = 0;

    plants.forEach((p) => {
      type[p.plant_type] = (type[p.plant_type] || 0) + 1;
      const h = p.health_status || "healthy";
      health[h] = (health[h] || 0) + 1;
      if (p.space_type) space[p.space_type] = (space[p.space_type] || 0) + 1;
      if (p.sunlight) sunlight[p.sunlight] = (sunlight[p.sunlight] || 0) + 1;
      if (p.water_requirement) water[p.water_requirement] = (water[p.water_requirement] || 0) + 1;
      if ((p.pest_disease_history || []).some((r) => !r.resolved)) pestActive++;
    });

    return { type, health, space, sunlight, water, pestActive, pestNone: plants.length - pestActive };
  }, [plants]);

  const getFilteredPlants = useCallback(() => {
    if (!plants || plants.length === 0) return [];
    let filtered = [...plants];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p &&
          p.name &&
          (p.name.toLowerCase().includes(query) ||
            (p.plant_variety && p.plant_variety.toLowerCase().includes(query)) ||
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
        const activeIssues = (p.pest_disease_history || []).filter((r) => !r.resolved).length;
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
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          );
        case "oldest":
          return sorted.sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );
        case "health": {
          const healthOrder = { healthy: 0, recovering: 1, stressed: 2, sick: 3 };
          return sorted.sort((a, b) => {
            const aHealth = a.health_status || "healthy";
            const bHealth = b.health_status || "healthy";
            return healthOrder[aHealth] - healthOrder[bHealth];
          });
        }
        case "age":
          return sorted.sort((a, b) => {
            const aDate = a.planting_date ? new Date(a.planting_date).getTime() : 0;
            const bDate = b.planting_date ? new Date(b.planting_date).getTime() : 0;
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
    setSearchInput("");
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
    if (loadMoreTimeoutRef.current) clearTimeout(loadMoreTimeoutRef.current);
    setLoadingMore(true);
    loadMoreTimeoutRef.current = setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredPlants.length));
      setLoadingMore(false);
      loadMoreTimeoutRef.current = null;
    }, 300);
  };

  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE);
  }, [filters, searchQuery, sortBy]);

  const plantKeyExtractor = useCallback((item: Plant) => item.id, []);

  const handleSwipeableOpen = useCallback((ref: Swipeable) => {
    if (openSwipeableRef.current && openSwipeableRef.current !== ref) {
      openSwipeableRef.current.close();
    }
    openSwipeableRef.current = ref;
  }, []);

  const renderPlantItem = useCallback(
    ({ item }: { item: Plant }) => (
      <PlantCard
        plant={item}
        compact={viewMode === "grid"}
        searchQuery={searchQuery}
        onSwipeableOpen={handleSwipeableOpen}
        onPress={() => navigation.navigate("PlantDetail", { plantId: item.id })}
        onEdit={() => navigation.navigate("PlantForm", { plantId: item.id })}
        onDelete={() => handleDelete(item.id)}
      />
    ),
    [viewMode, navigation, handleDelete, searchQuery, handleSwipeableOpen],
  );

  const renderUndoToast = () => {
    if (!pendingDelete) return null;
    const progressWidth = undoProgress.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    });
    return (
      <View
        style={{
          position: "absolute",
          bottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) + 8,
          left: 16,
          right: 16,
          backgroundColor: theme.backgroundSecondary,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 4,
          elevation: 6,
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.16,
          shadowRadius: 8,
          zIndex: 100,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
            <Text style={{ fontSize: 14, color: theme.text, fontWeight: "500" }}>
              {pendingDelete.plant.name} deleted
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleUndo}
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 4 }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: theme.primary }}>Undo</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 3, backgroundColor: theme.border, borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
          <Animated.View style={{ height: 3, width: progressWidth, backgroundColor: theme.primary, borderRadius: 2 }} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {searchActive ? (
          <View style={styles.searchExpandedRow}>
            <TouchableOpacity
              style={styles.searchBackBtn}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSearchActive(false);
                if (!searchInput.trim()) {
                  setSearchInput("");
                  setSearchQuery("");
                }
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
                value={searchInput}
                onChangeText={handleSearchChange}
                placeholderTextColor={theme.inputPlaceholder}
                autoFocus
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                  setSearchQuery(searchInput);
                }}
              />
              {searchInput.trim() !== "" && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchInput("");
                    setSearchQuery("");
                  }}
                >
                  <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.headerTitle}>Plants</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSearchActive(true);
              }}
              >
                <Ionicons name="search" size={20} color={theme.primary} />
                {searchInput.trim() !== "" && <View style={styles.searchActiveDot} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => navigation.navigate("ArchivedPlants")}
              >
                <Ionicons name="archive" size={20} color={theme.primary} />
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
            </View>
          </>
        )}
      </View>

      {/* ── Filter + Sort Bottom Sheet ── */}
      {showFilters && (
        <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={toggleFilters} />
          <View style={[styles.sheetContainer, { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity activeOpacity={0.6} onPress={toggleFilters} style={styles.sheetHandleArea}>
              <View style={styles.sheetHandle} />
            </TouchableOpacity>

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Sort & Filter</Text>
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
              {/* Sort By */}
              <Text style={styles.sheetSectionTitle}>
                <Ionicons name="swap-vertical" size={14} color={theme.textSecondary} /> Sort By
              </Text>
              <View style={styles.sheetChipWrap}>
                {([
                  ["newest", "🕐 Newest"],
                  ["oldest", "⌛ Oldest"],
                  ["name", "A–Z"],
                  ["health", "❤️ Health"],
                  ["age", "🌱 Age"],
                ] as const).map(([val, label]) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.sheetChip, sortBy === val && styles.sheetChipActive]}
                    onPress={() => setSortBy(val)}
                  >
                    <Text style={[styles.sheetChipText, sortBy === val && styles.sheetChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Plant Type */}
              <Text style={styles.sheetSectionTitle}>
                <Ionicons name="apps" size={14} color={theme.textSecondary} /> Plant Type
              </Text>
              <View style={styles.sheetChipWrap}>
                {([
                  ["all", "All"],
                  ["vegetable", "🥕 Vegetable"],
                  ["fruit_tree", "🍇 Fruit"],
                  ["coconut_tree", "🥥 Coconut"],
                  ["herb", "🌿 Herb"],
                  ["timber_tree", "🌳 Timber"],
                  ["flower", "🌸 Flower"],
                  ["shrub", "🪴 Shrub"],
                ] as const).map(([val, label]) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.sheetChip, filters.type === val && styles.sheetChipActive]}
                    onPress={() => updateFilter("type", val as FilterType)}
                  >
                    <Text style={[styles.sheetChipText, filters.type === val && styles.sheetChipTextActive]}>
                      {label}{val !== "all" && plantCounts.type[val] ? ` (${plantCounts.type[val]})` : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Health */}
              <Text style={styles.sheetSectionTitle}>
                <Ionicons name="fitness" size={14} color={theme.textSecondary} /> Health
              </Text>
              <View style={styles.sheetChipWrap}>
                {([
                  ["all", "All"],
                  ["healthy", "✅ Healthy"],
                  ["stressed", "⚠️ Stressed"],
                  ["recovering", "🔄 Recovering"],
                  ["sick", "❌ Sick"],
                ] as const).map(([val, label]) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.sheetChip, filters.health === val && styles.sheetChipActive]}
                    onPress={() => updateFilter("health", val as HealthStatus | "all")}
                  >
                    <Text style={[styles.sheetChipText, filters.health === val && styles.sheetChipTextActive]}>
                      {label}{val !== "all" && plantCounts.health[val] ? ` (${plantCounts.health[val]})` : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Space */}
              <Text style={styles.sheetSectionTitle}>
                <Ionicons name="cube" size={14} color={theme.textSecondary} /> Space Type
              </Text>
              <View style={styles.sheetChipWrap}>
                {([
                  ["all", "All"],
                  ["pot", "Pot"],
                  ["bed", "Bed"],
                  ["ground", "Ground"],
                ] as const).map(([val, label]) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.sheetChip, filters.space === val && styles.sheetChipActive]}
                    onPress={() => updateFilter("space", val as SpaceType | "all")}
                  >
                    <Text style={[styles.sheetChipText, filters.space === val && styles.sheetChipTextActive]}>
                      {label}{val !== "all" && plantCounts.space[val] ? ` (${plantCounts.space[val]})` : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sunlight */}
              <Text style={styles.sheetSectionTitle}>
                <Ionicons name="sunny" size={14} color={theme.textSecondary} /> Sunlight
              </Text>
              <View style={styles.sheetChipWrap}>
                {([
                  ["all", "All"],
                  ["full_sun", "☀️ Full Sun"],
                  ["partial_sun", "⛅ Partial"],
                  ["shade", "🌤️ Shade"],
                ] as const).map(([val, label]) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.sheetChip, filters.sunlight === val && styles.sheetChipActive]}
                    onPress={() => updateFilter("sunlight", val as SunlightLevel | "all")}
                  >
                    <Text style={[styles.sheetChipText, filters.sunlight === val && styles.sheetChipTextActive]}>
                      {label}{val !== "all" && plantCounts.sunlight[val] ? ` (${plantCounts.sunlight[val]})` : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Water */}
              <Text style={styles.sheetSectionTitle}>
                <Ionicons name="water" size={14} color={theme.textSecondary} /> Water Requirement
              </Text>
              <View style={styles.sheetChipWrap}>
                {([
                  ["all", "All"],
                  ["low", "💧 Low"],
                  ["medium", "💧💧 Medium"],
                  ["high", "💧💧💧 High"],
                ] as const).map(([val, label]) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.sheetChip, filters.water === val && styles.sheetChipActive]}
                    onPress={() => updateFilter("water", val as WaterRequirement | "all")}
                  >
                    <Text style={[styles.sheetChipText, filters.water === val && styles.sheetChipTextActive]}>
                      {label}{val !== "all" && plantCounts.water[val] ? ` (${plantCounts.water[val]})` : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Pest Status */}
              <Text style={styles.sheetSectionTitle}>
                <Ionicons name="bug" size={14} color={theme.textSecondary} /> Pest & Disease
              </Text>
              <View style={styles.sheetChipWrap}>
                {([
                  ["all", "All"],
                  ["active_issues", "🐛 Active Issues"],
                  ["no_issues", "✅ No Issues"],
                ] as const).map(([val, label]) => (
                  <TouchableOpacity
                    key={val}
                    style={[styles.sheetChip, filters.pestStatus === val && styles.sheetChipActive]}
                    onPress={() => updateFilter("pestStatus", val)}
                  >
                    <Text style={[styles.sheetChipText, filters.pestStatus === val && styles.sheetChipTextActive]}>
                      {label}
                      {val === "active_issues" && plantCounts.pestActive > 0 ? ` (${plantCounts.pestActive})` : ""}
                      {val === "no_issues" && plantCounts.pestNone > 0 ? ` (${plantCounts.pestNone})` : ""}
                    </Text>
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
                    {childLocations.filter((loc) => loc.trim()).map((loc) => (
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

      {/* ── Results & Toolbar Bar ── */}
      <View style={styles.resultsHeader}>
        <View style={styles.resultsLeft}>
          <Ionicons name="leaf" size={14} color={theme.primary} />
          <Text style={styles.resultsCount}>{filteredPlants.length}</Text>
          {hasActiveFilters ? (
            <>
              <Text style={styles.resultsLabel}>of {plants.length} {plants.length === 1 ? "Plant" : "Plants"}</Text>
              <View style={styles.resultsFilteredBadge}>
                <Text style={styles.resultsFilteredText}>filtered</Text>
              </View>
            </>
          ) : (
            <Text style={styles.resultsLabel}>
              {filteredPlants.length === 1 ? "Plant" : "Plants"}
            </Text>
          )}
        </View>
        <View style={styles.resultsRight}>
          <TouchableOpacity style={styles.sortPill} onPress={toggleFilters}>
            <Ionicons name="swap-vertical" size={13} color={theme.textSecondary} />
            <Text style={styles.sortPillText}>{SORT_LABELS[sortBy]}</Text>
            <Ionicons name="chevron-down" size={12} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewToggleBtn}
            onPress={() => setViewMode((v) => (v === "list" ? "grid" : "list"))}
          >
            <Ionicons
              name={viewMode === "list" ? "grid" : "list"}
              size={16}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={displayedPlants}
        key={viewMode}
        numColumns={viewMode === "grid" ? 2 : 1}
        keyExtractor={plantKeyExtractor}
        renderItem={renderPlantItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 48) + 16 },
        ]}
        columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
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
                  plants.length === 0
                    ? "leaf-outline"
                    : homeHealthFilter === "healthy"
                      ? "happy-outline"
                      : homeHealthFilter === "sick"
                        ? "medkit-outline"
                        : homeHealthFilter === "stressed"
                          ? "warning-outline"
                          : "search-outline"
                }
                size={64}
                color={
                  plants.length === 0
                    ? theme.primary
                    : homeHealthFilter === "healthy"
                      ? theme.success
                      : homeHealthFilter === "sick"
                        ? theme.error
                        : homeHealthFilter === "stressed"
                          ? theme.warning
                          : theme.border
                }
              />
              <Text style={styles.emptyText}>
                {plants.length === 0
                  ? "Your garden is empty"
                  : homeHealthFilter === "healthy"
                    ? "No healthy plants yet"
                    : homeHealthFilter === "sick"
                      ? "No sick plants — great news!"
                      : homeHealthFilter === "stressed"
                        ? "No stressed plants — looking good!"
                        : "No plants match"}
              </Text>
              <Text style={styles.emptySubtext}>
                {plants.length === 0
                  ? "Tap + to add your first plant and start tracking your garden"
                  : homeHealthFilter === "healthy"
                    ? "Add plants and keep them thriving"
                    : homeHealthFilter === "sick"
                      ? "All your plants are doing well 🌱"
                      : homeHealthFilter === "stressed"
                        ? "Your garden is healthy and happy 🎉"
                        : "Try adjusting your filters or search"}
              </Text>
              {plants.length === 0 ? (
                <TouchableOpacity
                  style={styles.clearFiltersEmptyButton}
                  onPress={() => navigation.navigate("PlantForm")}
                >
                  <Ionicons name="add" size={16} color={theme.primary} />
                  <Text style={styles.clearFiltersEmptyText}>Add First Plant</Text>
                </TouchableOpacity>
              ) : hasActiveFilters ? (
                <TouchableOpacity
                  style={styles.clearFiltersEmptyButton}
                  onPress={clearAllFilters}
                >
                  <Ionicons name="close-circle-outline" size={16} color={theme.primary} />
                  <Text style={styles.clearFiltersEmptyText}>Clear Filters</Text>
                </TouchableOpacity>
              ) : null}
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
        updateCellsBatchingPeriod={50}
      />

      <AnimatedFAB onPress={() => navigation.navigate("PlantForm")} />
      {renderUndoToast()}
    </View>
  );
}
