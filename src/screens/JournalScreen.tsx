import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
} from "react-native";
import { Image } from 'expo-image';
import { getJournalEntries, deleteJournalEntry } from "../services/journal";
import { getAllPlants } from "../services/plants";
import {
  JournalEntry,
  JournalEntryType,
  Plant,
} from "../types/database.types";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { sanitizeAlphaNumericSpaces } from "../utils/textSanitizer";

const { width } = Dimensions.get("window");

export default function JournalScreen({ navigation, route }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<JournalEntryType | null>(
    null
  );
  const [dateFilter, setDateFilter] = useState<
    "all" | "week" | "month" | "year"
  >("month");

  // View mode state
  const [viewMode, setViewMode] = useState<"list" | "gallery">("list");

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

  const getPlantName = useCallback((plantId: string | null) => {
    if (!plantId) return null;
    const plant = plants.find((p) => p.id === plantId);
    return plant?.name;
  }, [plants]);

  const getEntryTypeIcon = (type: JournalEntryType) => {
    const iconMap: Record<JournalEntryType, string> = {
      [JournalEntryType.Observation]: "eye",
      [JournalEntryType.Harvest]: "basket",
      [JournalEntryType.Issue]: "alert-circle",
      [JournalEntryType.Milestone]: "flag",
      [JournalEntryType.Other]: "document-text",
    };
    const iconName = iconMap[type] || iconMap[JournalEntryType.Other];
    return (
      <View style={styles.typeIconBadge}>
        <Ionicons
          name={iconName as any}
          size={12}
          color={theme.primary}
        />
      </View>
    );
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalHarvests = entries.filter(
      (e) => e.entry_type === JournalEntryType.Harvest
    ).length;
    const totalIssues = entries.filter(
      (e) => e.entry_type === JournalEntryType.Issue
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
      (a, b) => b[1] - a[1]
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
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return filtered;
  }, [entries, searchQuery, selectedType, dateFilter, getPlantName]);

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
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={16}
              color={theme.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={(text) =>
                setSearchQuery(sanitizeAlphaNumericSpaces(text))
              }
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.viewToggle,
                viewMode === "list" && styles.viewToggleActive,
              ]}
              onPress={() => setViewMode("list")}
            >
              <Ionicons
                name="list"
                size={20}
                color={viewMode === "list" ? theme.primary : theme.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggle,
                viewMode === "gallery" && styles.viewToggleActive,
              ]}
              onPress={() => setViewMode("gallery")}
            >
              <Ionicons
                name="grid"
                size={20}
                color={viewMode === "gallery" ? theme.primary : theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {/* Statistics Dashboard */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsScroll}
          contentContainerStyle={styles.statsScrollContent}
        >
          <View style={styles.statCard}>
            <Ionicons name="document-text" size={20} color={theme.primary} />
            <Text style={styles.statNumber}>{stats.totalEntries}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              Entries
            </Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="basket" size={20} color={theme.warning} />
            <Text style={styles.statNumber}>{stats.totalHarvests}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              Harvests
            </Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="scale" size={20} color={theme.success} />
            <Text style={styles.statNumber}>{stats.totalWeight}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              kg Total
            </Text>
          </View>
          {stats.topPlant && (
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={20} color={theme.warning} />
              <Text style={styles.statNumber}>{stats.topPlantCount}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                {stats.topPlant}
              </Text>
            </View>
          )}
          <View style={styles.statCard}>
            <Ionicons name="alert-circle" size={20} color={theme.error} />
            <Text style={styles.statNumber}>{stats.totalIssues}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              Issues
            </Text>
          </View>
        </ScrollView>

        {/* Search Bar and Filters in One Row */}
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
                    : JournalEntryType.Harvest
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
                    : JournalEntryType.Observation
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
                    : JournalEntryType.Issue
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
                    : JournalEntryType.Milestone
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

        {viewMode === "list" ? (
          <View style={styles.entriesContainer}>
            {filteredEntries.map((entry) => {
              const plantName = getPlantName(entry.plant_id);
              const date = new Date(entry.created_at).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              );

              return (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate("JournalForm", { entry })}
                >
                  {entry.photo_urls && entry.photo_urls.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.photosScroll}
                    >
                      {entry.photo_urls.map((photoUrl, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => setSelectedImage(photoUrl)}
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
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <View style={styles.headerLeft}>
                        <Text style={styles.date}>{date}</Text>
                        {getEntryTypeIcon(entry.entry_type)}
                      </View>
                      <View style={styles.headerRight}>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            navigation.navigate("JournalForm", { entry });
                          }}
                          style={styles.iconButton}
                        >
                          <Ionicons
                            name="pencil-outline"
                            size={20}
                            color={theme.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDelete(entry.id);
                          }}
                          style={styles.iconButton}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color={theme.error}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {plantName && (
                      <View style={styles.plantTag}>
                        <Ionicons name="leaf" size={12} color={theme.primary} />
                        <Text style={styles.plantTagText}>{plantName}</Text>
                      </View>
                    )}

                    {/* Harvest Details */}
                    {entry.entry_type === JournalEntryType.Harvest &&
                      entry.harvest_quantity && (
                        <View style={styles.harvestDetails}>
                          <View style={styles.harvestBadge}>
                            <Ionicons
                              name="scale-outline"
                              size={16}
                              color={theme.warning}
                            />
                            <Text style={styles.harvestText}>
                              {entry.harvest_quantity}{" "}
                              {entry.harvest_unit || "units"}
                            </Text>
                          </View>
                          {entry.harvest_quality && (
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

                    <Text style={styles.contentText}>{entry.content}</Text>
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
                      {searchQuery ? (
                        `No results for "${searchQuery}"`
                      ) : dateFilter !== "all" ? (
                        `No entries in ${dateFilter === "week" ? "the past week" : dateFilter === "month" ? "this month" : "this year"}`
                      ) : selectedType ? (
                        `No ${selectedType} entries found`
                      ) : (
                        "Try adjusting your filters"
                      )}
                    </Text>
                    <TouchableOpacity
                      style={styles.clearFiltersButton}
                      onPress={() => {
                        setSearchQuery("");
                        setSelectedType(null);
                        setDateFilter("month");
                      }}
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
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("JournalForm")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

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
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    viewToggle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    viewToggleActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    fab: {
      position: "absolute",
      right: 20,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    statsScroll: {
      marginTop: 12,
      marginBottom: 10,
    },
    statsScrollContent: {
      paddingHorizontal: 12,
      gap: 3,
      alignItems: "stretch",
    },
    statCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      width: 88,
      minHeight: 88,
      paddingVertical: 8,
      paddingHorizontal: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    statNumber: {
      fontSize: 16,
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
      marginTop: 10,
      marginBottom: 12,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 12,
      flex: 1,
      minWidth: 0,
    },
    searchIcon: {
      marginRight: 6,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
      padding: 0,
      minWidth: 0,
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
      borderRadius: 12,
      marginBottom: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    photosScroll: {
      maxHeight: 200,
    },
    photo: {
      width: 300,
      height: 200,
      marginRight: 8,
      backgroundColor: theme.primaryLight,
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
      alignSelf: "flex-start",
      backgroundColor: theme.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 8,
    },
    plantTagText: {
      fontSize: 12,
      color: theme.primary,
      marginLeft: 4,
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
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    harvestText: {
      fontSize: 12,
      color: theme.warning,
      fontWeight: "600",
    },
    qualityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
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
      fontSize: 10,
      fontWeight: "bold",
      color: theme.textSecondary,
    },
    contentText: {
      fontSize: 15,
      color: theme.text,
      lineHeight: 22,
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
