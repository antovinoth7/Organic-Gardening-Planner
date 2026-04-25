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
  LayoutAnimation,
  Platform,
  UIManager,
  Pressable,
} from "react-native";
import type { ImageStyle } from "react-native";
import { Image } from "expo-image";
import { getJournalEntries, deleteJournalEntry } from "../services/journal";
import { getAllPlants } from "../services/plants";
import { JournalEntry, JournalEntryType, Plant } from "../types/database.types";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { createStyles } from "../styles/journalStyles";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  JournalScreenNavigationProp,
  JournalScreenRouteProp,
} from "../types/navigation.types";
import { getErrorMessage } from "../utils/errorLogging";
import { sanitizeAlphaNumericSpaces } from "../utils/textSanitizer";
import {
  useTabBarScroll,
  TAB_BAR_HEIGHT,
  AnimatedFAB,
} from "../components/FloatingTabBar";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function JournalScreen(): React.JSX.Element {
  const navigation = useNavigation<JournalScreenNavigationProp>();
  const route = useRoute<JournalScreenRouteProp>();
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
  >("week");

  // Tag filter state
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // View mode state
  const [viewMode, setViewMode] = useState<"list" | "gallery">("list");

  // Collapsible filter state
  const [showFilters, setShowFilters] = useState(false);

  // Gallery modal state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadData = async (options?: { silent?: boolean }): Promise<void> => {
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
    } catch (error: unknown) {
      if (!options?.silent) {
        Alert.alert("Error", getErrorMessage(error));
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
  }, [navigation, resetTabBar]);

  // Listen for refresh param from child screens (after add/edit/delete)
  useEffect(() => {
    if (route.params?.refresh) {
      loadData();
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params, navigation]);

  const getPlantName = useCallback(
    (plantId: string | null) => {
      if (!plantId) return null;
      const plant = plants.find((p) => p.id === plantId);
      return plant?.name;
    },
    [plants],
  );

  const getEntryTypeIcon = (type: JournalEntryType): { iconName: React.ComponentProps<typeof Ionicons>['name']; color: string } => {
    const iconMap: Record<JournalEntryType, React.ComponentProps<typeof Ionicons>['name']> = {
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

    // Tag filter
    if (selectedTag) {
      filtered = filtered.filter(
        (e) => e.tags && e.tags.includes(selectedTag),
      );
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      let filterStart: Date;

      if (dateFilter === "week") {
        filterStart = new Date(now);
        filterStart.setDate(now.getDate() - 7);
      } else if (dateFilter === "month") {
        filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        // year
        filterStart = new Date(now.getFullYear(), 0, 1);
      }

      filtered = filtered.filter((e) => new Date(e.created_at) >= filterStart);
    }

    // Sort by newest first
    filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return filtered;
  }, [entries, searchQuery, selectedType, selectedTag, dateFilter, getPlantName]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (dateFilter !== "week") count++;
    if (selectedType) count++;
    if (selectedTag) count++;
    return count;
  }, [dateFilter, selectedType, selectedTag]);

  const toggleFilters = (): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowFilters((prev) => !prev);
  };

  const clearAllFilters = (): void => {
    setSearchQuery("");
    setSelectedType(null);
    setSelectedTag(null);
    setDateFilter("week");
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

  const handleDelete = async (id: string): Promise<void> => {
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
            } catch (error: unknown) {
              Alert.alert("Error", getErrorMessage(error));
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
                <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
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
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={theme.textTertiary}
                    />
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
                  <Ionicons name="search" size={20} color={theme.textInverse} />
                  {searchQuery !== "" && (
                    <View style={styles.searchActiveDot} />
                  )}
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
                    color={theme.textInverse}
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
                  onPress={() =>
                    setViewMode((v) => (v === "list" ? "gallery" : "list"))
                  }
                >
                  <Ionicons
                    name={viewMode === "list" ? "grid" : "list"}
                    size={20}
                    color={theme.textInverse}
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
        contentContainerStyle={{
          paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 48) + 16,
        }}
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

        {/* Collapsible Filter Menu — removed from inline, moved to overlay below */}

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
                          name={iconName}
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

                    {/* Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                      <View style={styles.tagsRow}>
                        {entry.tags.map((tag) => (
                          <View key={tag} style={styles.journalTagBadge}>
                            <Text style={styles.journalTagText}>
                              {tag.replace(/_/g, " ")}
                            </Text>
                          </View>
                        ))}
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
                              style={styles.photo as ImageStyle}
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
                  style={styles.galleryImage as ImageStyle}
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

      {/* Filter Bottom Sheet */}
      {showFilters && (
        <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
          {/* Backdrop */}
          <Pressable style={StyleSheet.absoluteFill} onPress={toggleFilters} />

          {/* Sheet */}
          <View
            style={[
              styles.sheetContainer,
              { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={toggleFilters}
              style={styles.sheetHandleArea}
            >
              <View style={styles.sheetHandle} />
            </TouchableOpacity>

            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filter Journal</Text>
              {activeFilterCount > 0 && (
                <TouchableOpacity
                  onPress={clearAllFilters}
                  style={styles.sheetClearBtn}
                >
                  <Text style={styles.sheetClearText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              bounces={false}
              nestedScrollEnabled
            >
              {/* Date Range */}
              <Text style={styles.sheetSectionTitle}>
                <Ionicons
                  name="calendar"
                  size={14}
                  color={theme.textSecondary}
                />{" "}
                Date Range
              </Text>
              <View style={styles.sheetChipWrap}>
                {(
                  [
                    ["all", "All Time"],
                    ["week", "This Week"],
                    ["month", "This Month"],
                    ["year", "This Year"],
                  ] as const
                ).map(([val, label]) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.sheetChip,
                      dateFilter === val && styles.sheetChipActive,
                    ]}
                    onPress={() => setDateFilter(val)}
                  >
                    <Text
                      style={[
                        styles.sheetChipText,
                        dateFilter === val && styles.sheetChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Entry Type */}
              <Text style={styles.sheetSectionTitle}>
                <Ionicons
                  name="document-text"
                  size={14}
                  color={theme.textSecondary}
                />{" "}
                Entry Type
              </Text>
              <View style={styles.sheetChipWrap}>
                {(
                  [
                    [null, "All"],
                    [JournalEntryType.Observation, "👁️ Observation"],
                    [JournalEntryType.Harvest, "🧺 Harvest"],
                    [JournalEntryType.Issue, "⚠️ Issue"],
                    [JournalEntryType.Milestone, "🏁 Milestone"],
                  ] as const
                ).map(([val, label]) => (
                  <TouchableOpacity
                    key={val ?? "all"}
                    style={[
                      styles.sheetChip,
                      selectedType === val && styles.sheetChipActive,
                    ]}
                    onPress={() =>
                      setSelectedType(val as JournalEntryType | null)
                    }
                  >
                    <Text
                      style={[
                        styles.sheetChipText,
                        selectedType === val && styles.sheetChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tags */}
              <Text style={styles.sheetSectionTitle}>
                <Ionicons
                  name="pricetag"
                  size={14}
                  color={theme.textSecondary}
                />{" "}
                Tag
              </Text>
              <View style={styles.sheetChipWrap}>
                {(
                  [
                    [null, "All"],
                    ["pest", "Pest"],
                    ["weather_damage", "Weather"],
                    ["harvest", "Harvest"],
                    ["soil_prep", "Soil Prep"],
                    ["growth_update", "Growth"],
                    ["experiment", "Experiment"],
                  ] as const
                ).map(([val, label]) => (
                  <TouchableOpacity
                    key={val ?? "all"}
                    style={[
                      styles.sheetChip,
                      selectedTag === val && styles.sheetChipActive,
                    ]}
                    onPress={() => setSelectedTag(val)}
                  >
                    <Text
                      style={[
                        styles.sheetChipText,
                        selectedTag === val && styles.sheetChipTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}

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
              style={styles.modalImage as ImageStyle}
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
