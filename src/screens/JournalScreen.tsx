import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { Image } from "expo-image";
import { getJournalEntries, deleteJournalEntry } from "../services/journal";
import { getAllPlants } from "../services/plants";
import { JournalEntry, JournalEntryType, Plant } from "../types/database.types";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { sanitizeAlphaNumericSpaces } from "../utils/textSanitizer";
import {
  useTabBarScroll,
  TAB_BAR_HEIGHT,
  AnimatedFAB,
} from "../components/FloatingTabBar";

const { width } = Dimensions.get("window");

export default function JournalScreen({ navigation, route }: any) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { onScroll: onTabBarScroll, resetTabBar } = useTabBarScroll();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const [selectedType, setSelectedType] = useState<JournalEntryType | null>(
    null,
  );
  const [dateFilter, setDateFilter] = useState<
    "all" | "week" | "month" | "year"
  >("month");

  // View mode state
  const [viewMode, setViewMode] = useState<"list" | "gallery">("list");

  // Collapsible filter state
  const [showFilters, setShowFilters] = useState(false);

  // Gallery modal state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadData = async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const [entriesData, plantsData] = await Promise.all([
        getJournalEntries(),
        getAllPlants(),
      ]);
      setEntries(entriesData);
      setPlants(plantsData);
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

  useEffect(() => {
    let isMounted = true;

    // Load data on mount
    loadData();

    const unsubscribe = navigation.addListener("focus", () => {
      if (isMounted) {
        // Reset scroll and refresh data so imported image URIs render immediately.
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
        resetTabBar();
        void loadData({ silent: true });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigation]);

  // Listen for refresh param from child screens (after add/edit/delete)
  useEffect(() => {
    const refreshParam = route?.params?.refresh;
    if (refreshParam) {
      loadData();
      navigation.setParams({ refresh: undefined });
    }
  }, [route?.params?.refresh, navigation]);

  const getPlantName = useCallback(
    (plantId: string | null) => {
      if (!plantId) return null;
      const plant = plants.find((p) => p.id === plantId);
      return plant?.name;
    },
    [plants],
  );

  const getEntryTypeIcon = (type: JournalEntryType) => {
    const iconMap: Record<JournalEntryType, string> = {
      [JournalEntryType.Observation]: "eye",
      [JournalEntryType.Harvest]: "basket",
      [JournalEntryType.Issue]: "alert-circle",
      [JournalEntryType.Milestone]: "flag",
      [JournalEntryType.Other]: "document-text",
    };
    const colorMap: Record<JournalEntryType, string> = {
      [JournalEntryType.Observation]: theme.primary,
      [JournalEntryType.Harvest]: theme.warning,
      [JournalEntryType.Issue]: theme.error,
      [JournalEntryType.Milestone]: theme.success,
      [JournalEntryType.Other]: theme.textSecondary,
    };
    const iconName = iconMap[type] || iconMap[JournalEntryType.Other];
    const color = colorMap[type] || theme.textSecondary;
    return { iconName, color };
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalHarvests = entries.filter(
      (e) => e.entry_type === JournalEntryType.Harvest,
    ).length;
    const totalIssues = entries.filter(
      (e) => e.entry_type === JournalEntryType.Issue,
    ).length;

    const harvestsByPlant: Record<string, number> = {};
    let totalWeight = 0;

    entries.forEach((entry) => {
      if (entry.entry_type === JournalEntryType.Harvest) {
        const plantName = getPlantName(entry.plant_id) || "Unknown";
        harvestsByPlant[plantName] = (harvestsByPlant[plantName] || 0) + 1;

        if (entry.harvest_quantity) {
          // Convert to kg for totals
          let weight = entry.harvest_quantity;
          if (entry.harvest_unit === "g") weight = weight / 1000;
          else if (entry.harvest_unit === "lbs") weight = weight * 0.453592;
          totalWeight += weight;
        }
      }
    });

    const topPlant = Object.entries(harvestsByPlant).sort(
      (a, b) => b[1] - a[1],
    )[0];

    return {
      totalEntries: entries.length,
      totalHarvests,
      totalIssues,
      totalWeight: Math.round(totalWeight * 10) / 10,
      topPlant: topPlant ? topPlant[0] : null,
      topPlantCount: topPlant ? topPlant[1] : 0,
    };
  }, [entries, getPlantName]);

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry) => {
        const plantName = getPlantName(entry.plant_id)?.toLowerCase() || "";
        const content = entry.content.toLowerCase();
        return plantName.includes(query) || content.includes(query);
      });
    }

    // Type filter
    if (selectedType) {
      filtered = filtered.filter((e) => e.entry_type === selectedType);
    }

    // Plant filter
    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      if (dateFilter === "week") {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateFilter === "month") {
        filterDate.setMonth(now.getMonth() - 1);
      } else if (dateFilter === "year") {
        filterDate.setFullYear(now.getFullYear() - 1);
      }

      filtered = filtered.filter((e) => new Date(e.created_at) >= filterDate);
    }

    // Sort by newest first
    filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return filtered;
  }, [entries, searchQuery, selectedType, dateFilter, getPlantName]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateFilter !== "month") count++; // 'month' is default, so only count non-default
    if (selectedType) count++;
    return count;
  }, [dateFilter, selectedType]);

  const toggleFilters = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((prev) => !prev);
  };

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (dateFilter === "week")
      chips.push({
        key: "date",
        label: "📅 This Week",
        onRemove: () => setDateFilter("month"),
      });
    if (dateFilter === "year")
      chips.push({
        key: "date",
        label: "📅 This Year",
        onRemove: () => setDateFilter("month"),
      });
    if (dateFilter === "all")
      chips.push({
        key: "date",
        label: "📅 All Time",
        onRemove: () => setDateFilter("month"),
      });
    if (selectedType === JournalEntryType.Harvest)
      chips.push({
        key: "type",
        label: "🧺 Harvest",
        onRemove: () => setSelectedType(null),
      });
    if (selectedType === JournalEntryType.Observation)
      chips.push({
        key: "type",
        label: "👁️ Observation",
        onRemove: () => setSelectedType(null),
      });
    if (selectedType === JournalEntryType.Issue)
      chips.push({
        key: "type",
        label: "⚠️ Issue",
        onRemove: () => setSelectedType(null),
      });
    if (selectedType === JournalEntryType.Milestone)
      chips.push({
        key: "type",
        label: "🏁 Milestone",
        onRemove: () => setSelectedType(null),
      });
    return chips;
  }, [dateFilter, selectedType]);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedType(null);
    setDateFilter("month");
  };

  // Get all photos for gallery view
  const allPhotos = useMemo(() => {
    const photos: { uri: string; entryId: string; date: string }[] = [];
    filteredEntries.forEach((entry) => {
      entry.photo_urls?.forEach((uri) => {
        photos.push({
          uri,
          entryId: entry.id,
          date: entry.created_at,
        });
      });
    });
    return photos;
  }, [filteredEntries]);

  const handleDelete = async (id: string) => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this journal entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteJournalEntry(id);
              loadData();
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          {searchActive ? (
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
                  placeholder="Search journal..."
                  placeholderTextColor={theme.inputPlaceholder}
                  value={searchQuery}
                  onChangeText={(text) =>
                    setSearchQuery(sanitizeAlphaNumericSpaces(text))
                  }
                  autoFocus
                  returnKeyType="search"
                />
                {searchQuery !== "" && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.headerTitle}>Journal</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.searchIconBtn}
                  onPress={() => setSearchActive(true)}
                >
                  <Ionicons name="search" size={20} color={theme.primary} />
                  {searchQuery !== "" && <View style={styles.searchActiveDot} />}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterToggleButton,
                    showFilters && styles.filterToggleButtonActive,
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
                      <Text style={styles.filterBadgeText}>
                        {activeFilterCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.viewToggle}
                  onPress={() => setViewMode(v => v === "list" ? "gallery" : "list")}
                >
                  <Ionicons
                    name={viewMode === "list" ? "grid" : "list"}
                    size={20}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 48) + 16 }}
        onScroll={onTabBarScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {/* Statistics Dashboard */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="document-text" size={18} color={theme.primary} />
            <Text style={styles.statNumber}>{stats.totalEntries}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              Entries
            </Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="basket" size={18} color={theme.warning} />
            <Text style={styles.statNumber}>{stats.totalHarvests}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              Harvests
            </Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="scale" size={18} color={theme.success} />
            <Text style={styles.statNumber}>{stats.totalWeight}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              kg Total
            </Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="alert-circle" size={18} color={theme.error} />
            <Text style={styles.statNumber}>{stats.totalIssues}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              Issues
            </Text>
          </View>
        </View>

        {/* Active filter pills (shown when filter panel is collapsed) */}
        {!showFilters && activeFilterChips.length > 0 && (
          <View style={styles.activeFiltersRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeFiltersScroll}
            >
              {activeFilterChips.map((chip) => (
                <TouchableOpacity
                  key={chip.key}
                  style={styles.activeFilterPill}
                  onPress={chip.onRemove}
                >
                  <Text style={styles.activeFilterPillText}>{chip.label}</Text>
                  <Ionicons name="close" size={12} color={theme.primary} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={clearAllFilters}
                style={styles.clearAllPill}
              >
                <Text style={styles.clearAllPillText}>Clear all</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <View style={styles.searchFilterRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filtersScroll}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  dateFilter === "week" && styles.filterChipActive,
                ]}
                onPress={() =>
                  setDateFilter(dateFilter === "week" ? "all" : "week")
                }
              >
                <Text
                  style={[
                    styles.filterChipText,
                    dateFilter === "week" && styles.filterChipTextActive,
                  ]}
                >
                  This Week
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  dateFilter === "month" && styles.filterChipActive,
                ]}
                onPress={() =>
                  setDateFilter(dateFilter === "month" ? "all" : "month")
                }
              >
                <Text
                  style={[
                    styles.filterChipText,
                    dateFilter === "month" && styles.filterChipTextActive,
                  ]}
                >
                  This Month
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedType === JournalEntryType.Harvest &&
                    styles.filterChipActive,
                ]}
                onPress={() =>
                  setSelectedType(
                    selectedType === JournalEntryType.Harvest
                      ? null
                      : JournalEntryType.Harvest,
                  )
                }
              >
                <Ionicons
                  name="basket"
                  size={14}
                  color={
                    selectedType === JournalEntryType.Harvest
                      ? theme.primary
                      : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.filterChipText,
                    selectedType === JournalEntryType.Harvest &&
                      styles.filterChipTextActive,
                  ]}
                >
                  Harvest
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedType === JournalEntryType.Observation &&
                    styles.filterChipActive,
                ]}
                onPress={() =>
                  setSelectedType(
                    selectedType === JournalEntryType.Observation
                      ? null
                      : JournalEntryType.Observation,
                  )
                }
              >
                <Ionicons
                  name="eye"
                  size={14}
                  color={
                    selectedType === JournalEntryType.Observation
                      ? theme.primary
                      : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.filterChipText,
                    selectedType === JournalEntryType.Observation &&
                      styles.filterChipTextActive,
                  ]}
                >
                  Observation
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedType === JournalEntryType.Issue &&
                    styles.filterChipActive,
                ]}
                onPress={() =>
                  setSelectedType(
                    selectedType === JournalEntryType.Issue
                      ? null
                      : JournalEntryType.Issue,
                  )
                }
              >
                <Ionicons
                  name="alert-circle"
                  size={14}
                  color={
                    selectedType === JournalEntryType.Issue
                      ? theme.primary
                      : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.filterChipText,
                    selectedType === JournalEntryType.Issue &&
                      styles.filterChipTextActive,
                  ]}
                >
                  Issue
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedType === JournalEntryType.Milestone &&
                    styles.filterChipActive,
                ]}
                onPress={() =>
                  setSelectedType(
                    selectedType === JournalEntryType.Milestone
                      ? null
                      : JournalEntryType.Milestone,
                  )
                }
              >
                <Ionicons
                  name="flag"
                  size={14}
                  color={
                    selectedType === JournalEntryType.Milestone
                      ? theme.primary
                      : theme.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.filterChipText,
                    selectedType === JournalEntryType.Milestone &&
                      styles.filterChipTextActive,
                  ]}
                >
                  Milestone
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {viewMode === "list" ? (
          <View style={styles.entriesContainer}>
            {filteredEntries.map((entry) => {
              const plantName = getPlantName(entry.plant_id);
              const entryDate = new Date(entry.created_at);
              const date = entryDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
              const year = entryDate.getFullYear();
              const time = entryDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              });
              const { iconName, color: typeColor } = getEntryTypeIcon(
                entry.entry_type,
              );
              const hasPhotos = entry.photo_urls && entry.photo_urls.length > 0;
              const entryTypeLabel =
                entry.entry_type.charAt(0).toUpperCase() +
                entry.entry_type.slice(1);

              return (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate("JournalForm", { entry })}
                >
                  {/* Accent bar */}
                  <View
                    style={[styles.cardAccent, { backgroundColor: typeColor }]}
                  />

                  <View style={styles.cardBody}>
                    {/* Top row: type icon + date + actions */}
                    <View style={styles.cardTopRow}>
                      <View
                        style={[
                          styles.typeIconCircle,
                          { backgroundColor: typeColor + "18" },
                        ]}
                      >
                        <Ionicons
                          name={iconName as any}
                          size={16}
                          color={typeColor}
                        />
                      </View>
                      <View style={styles.cardMeta}>
                        <Text style={styles.entryTypeLabel}>
                          {entryTypeLabel}
                        </Text>
                        <Text style={styles.dateText}>
                          {date}, {year} · {time}
                        </Text>
                      </View>
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            navigation.navigate("JournalForm", { entry });
                          }}
                          style={styles.actionBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="create-outline"
                            size={18}
                            color={theme.textSecondary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDelete(entry.id);
                          }}
                          style={styles.actionBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={theme.error}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Plant tag + harvest details */}
                    {(plantName ||
                      (entry.entry_type === JournalEntryType.Harvest &&
                        entry.harvest_quantity)) && (
                      <View style={styles.tagsRow}>
                        {plantName && (
                          <View style={styles.plantTag}>
                            <Ionicons
                              name="leaf"
                              size={11}
                              color={theme.primary}
                            />
                            <Text style={styles.plantTagText}>{plantName}</Text>
                          </View>
                        )}
                        {entry.entry_type === JournalEntryType.Harvest &&
                          entry.harvest_quantity && (
                            <View style={styles.harvestBadge}>
                              <Ionicons
                                name="scale-outline"
                                size={11}
                                color={theme.warning}
                              />
                              <Text style={styles.harvestText}>
                                {entry.harvest_quantity}{" "}
                                {entry.harvest_unit || "units"}
                              </Text>
                            </View>
                          )}
                        {entry.entry_type === JournalEntryType.Harvest &&
                          entry.harvest_quality && (
                            <View
                              style={[
                                styles.qualityBadge,
                                styles[`quality${entry.harvest_quality}`],
                              ]}
                            >
                              <Text style={styles.qualityText}>
                                {entry.harvest_quality.toUpperCase()}
                              </Text>
                            </View>
                          )}
                      </View>
                    )}

                    {/* Content preview */}
                    <Text style={styles.contentText} numberOfLines={3}>
                      {entry.content}
                    </Text>

                    {/* Photos */}
                    {hasPhotos && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.photosScroll}
                        contentContainerStyle={styles.photosScrollContent}
                      >
                        {entry.photo_urls.map((photoUrl, idx) => (
                          <TouchableOpacity
                            key={idx}
                            onPress={() => setSelectedImage(photoUrl)}
                            activeOpacity={0.8}
                          >
                            <Image
                              source={{ uri: photoUrl }}
                              style={styles.photo}
                              contentFit="cover"
                              transition={200}
                              cachePolicy="memory-disk"
                              recyclingKey={`journal-${entry.id}-${idx}`}
                            />
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}

            {filteredEntries.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={64} color={theme.border} />
                {entries.length === 0 ? (
                  <>
                    <Text style={styles.emptyText}>No journal entries yet</Text>
                    <Text style={styles.emptySubtext}>
                      Start documenting your garden journey
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.emptyText}>No entries found</Text>
                    <Text style={styles.emptySubtext}>
                      {searchQuery
                        ? `No results for "${searchQuery}"`
                        : dateFilter !== "all"
                          ? `No entries in ${dateFilter === "week" ? "the past week" : dateFilter === "month" ? "this month" : "this year"}`
                          : selectedType
                            ? `No ${selectedType} entries found`
                            : "Try adjusting your filters"}
                    </Text>
                    <TouchableOpacity
                      style={styles.clearFiltersButton}
                      onPress={clearAllFilters}
                    >
                      <Text style={styles.clearFiltersText}>Clear Filters</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.galleryGrid}>
            {allPhotos.map((photo, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.galleryItem}
                onPress={() => setSelectedImage(photo.uri)}
              >
                <Image
                  source={{ uri: photo.uri }}
                  style={styles.galleryImage}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                  recyclingKey={`gallery-${idx}`}
                />
              </TouchableOpacity>
            ))}

            {allPhotos.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Ionicons
                  name="images-outline"
                  size={64}
                  color={theme.border}
                />
                <Text style={styles.emptyText}>No photos yet</Text>
                <Text style={styles.emptySubtext}>
                  Add photos to your journal entries
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <AnimatedFAB onPress={() => navigation.navigate("JournalForm")} />

      {/* Image Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={[styles.modalClose, { top: insets.top + 12 }]}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.modalImage}
              contentFit="contain"
              transition={200}
              cachePolicy="memory-disk"
              placeholder={null}
              priority="high"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundSecondary,
    },
    header: {
      backgroundColor: theme.card,
      paddingTop: 12,
      paddingHorizontal: 16,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
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
    searchIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primaryLight,
      alignItems: "center",
      justifyContent: "center",
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
      width: 40,
      height: 40,
      borderRadius: 20,
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
    viewToggle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primaryLight,
    },
    filterToggleButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primaryLight,
    },
    filterToggleButtonActive: {
      backgroundColor: theme.primary,
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
    activeFiltersRow: {
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
    statsRow: {
      flexDirection: "row",
      marginTop: 8,
      marginBottom: 4,
      marginHorizontal: 12,
      gap: 8,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 4,
      alignItems: "center",
      justifyContent: "center",
    },
    statNumber: {
      fontSize: 15,
      fontWeight: "bold",
      color: theme.text,
      marginTop: 2,
    },
    statLabel: {
      fontSize: 10,
      color: theme.textSecondary,
      marginTop: 1,
      lineHeight: 12,
      textAlign: "center",
    },
    searchFilterRow: {
      marginTop: 6,
      marginBottom: 8,
    },
    filtersScroll: {
      flex: 1,
    },
    filterChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.backgroundSecondary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 6,
      gap: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    filterChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    filterChipText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    filterChipTextActive: {
      color: theme.primary,
    },
    content: {
      flex: 1,
    },
    entriesContainer: {
      padding: 12,
      paddingBottom: 120,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 14,
      marginBottom: 12,
      overflow: "hidden",
      flexDirection: "row",
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardAccent: {
      width: 4,
    },
    cardBody: {
      flex: 1,
      padding: 12,
    },
    cardTopRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    typeIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    cardMeta: {
      flex: 1,
      marginLeft: 10,
    },
    entryTypeLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
    },
    dateText: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 1,
    },
    cardActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    actionBtn: {
      padding: 6,
      borderRadius: 8,
    },
    tagsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 8,
    },
    photosScroll: {
      marginTop: 10,
      marginHorizontal: -12,
    },
    photosScrollContent: {
      paddingHorizontal: 12,
      gap: 8,
    },
    photo: {
      width: 120,
      height: 90,
      borderRadius: 8,
      backgroundColor: theme.backgroundSecondary,
    },
    cardContent: {
      padding: 16,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    date: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    typeIconBadge: {
      backgroundColor: theme.primaryLight,
      borderRadius: 12,
      padding: 4,
    },
    iconButton: {
      padding: 4,
    },
    plantTag: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      gap: 4,
    },
    plantTagText: {
      fontSize: 11,
      color: theme.primary,
      fontWeight: "600",
    },
    harvestDetails: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 8,
    },
    harvestBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.warningLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      gap: 4,
    },
    harvestText: {
      fontSize: 11,
      color: theme.warning,
      fontWeight: "600",
    },
    qualityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    qualityexcellent: {
      backgroundColor: theme.primaryLight,
    },
    qualitygood: {
      backgroundColor: theme.primaryLight,
    },
    qualityfair: {
      backgroundColor: theme.warningLight,
    },
    qualitypoor: {
      backgroundColor: theme.errorLight,
    },
    qualityText: {
      fontSize: 9,
      fontWeight: "bold",
      color: theme.textSecondary,
    },
    contentText: {
      fontSize: 13,
      color: theme.text,
      lineHeight: 20,
      marginTop: 8,
    },
    galleryGrid: {
      flexDirection: "row",
      padding: 12,
      paddingBottom: 120,
      flexWrap: "wrap",
      gap: 4,
    },
    galleryItem: {
      width: (width - 36) / 3,
      height: (width - 36) / 3,
    },
    galleryImage: {
      width: "100%",
      height: "100%",
      backgroundColor: theme.primaryLight,
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
      textAlign: "center",
    },
    clearFiltersButton: {
      marginTop: 16,
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: theme.primary,
      borderRadius: 8,
    },
    clearFiltersText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.9)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalClose: {
      position: "absolute",
      top: 12,
      right: 16,
      zIndex: 10,
    },
    modalImage: {
      width: width,
      height: width,
    },
  });
