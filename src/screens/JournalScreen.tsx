import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { getJournalEntries, deleteJournalEntry } from "../services/journal";
import { getPlants } from "../services/plants";
import { JournalEntry, Plant } from "../types/database.types";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";

const { width } = Dimensions.get("window");

export default function JournalScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const scrollViewRef = useRef<ScrollView>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<
    "all" | "week" | "month" | "year"
  >("all");

  // View mode state
  const [viewMode, setViewMode] = useState<"list" | "gallery">("list");

  // Gallery modal state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entriesData, { plants: plantsData }] = await Promise.all([
        getJournalEntries(),
        getPlants(),
      ]);
      setEntries(entriesData);
      setPlants(plantsData);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = navigation.addListener("focus", () => {
      if (isMounted) {
        // Reset scroll to top
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
        loadData();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigation]);

  const getPlantName = (plantId: string | null) => {
    if (!plantId) return null;
    const plant = plants.find((p) => p.id === plantId);
    return plant?.name;
  };

  const getEntryTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      observation: "eye",
      harvest: "basket",
      issue: "alert-circle",
      milestone: "flag",
      other: "document-text",
    };
    return (
      <View style={styles.typeIconBadge}>
        <Ionicons
          name={(iconMap[type] as any) || "document-text"}
          size={12}
          color={theme.primary}
        />
      </View>
    );
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalHarvests = entries.filter(
      (e) => e.entry_type === "harvest"
    ).length;
    const totalIssues = entries.filter((e) => e.entry_type === "issue").length;

    const harvestsByPlant: Record<string, number> = {};
    let totalWeight = 0;

    entries.forEach((entry) => {
      if (entry.entry_type === "harvest") {
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
  }, [entries, plants]);

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

    return filtered;
  }, [entries, searchQuery, selectedType, dateFilter, plants]);

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
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Garden Journal</Text>
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
                color={viewMode === "list" ? "#fff" : theme.textSecondary}
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
                color={viewMode === "gallery" ? "#fff" : theme.textSecondary}
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
        >
          <View style={styles.statCard}>
            <Ionicons name="document-text" size={20} color={theme.primary} />
            <Text style={styles.statNumber}>{stats.totalEntries}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="basket" size={20} color={theme.warning} />
            <Text style={styles.statNumber}>{stats.totalHarvests}</Text>
            <Text style={styles.statLabel}>Harvests</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="scale" size={20} color={theme.success} />
            <Text style={styles.statNumber}>{stats.totalWeight}</Text>
            <Text style={styles.statLabel}>kg Total</Text>
          </View>
          {stats.topPlant && (
            <View style={styles.statCard}>
              <Ionicons name="trophy" size={20} color={theme.warning} />
              <Text style={styles.statNumber}>{stats.topPlantCount}</Text>
              <Text style={styles.statLabel}>{stats.topPlant}</Text>
            </View>
          )}
          <View style={styles.statCard}>
            <Ionicons name="alert-circle" size={20} color={theme.error} />
            <Text style={styles.statNumber}>{stats.totalIssues}</Text>
            <Text style={styles.statLabel}>Issues</Text>
          </View>
        </ScrollView>

        {/* Search Bar and Filters in One Row */}
        <View style={styles.searchFilterRow}>
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={20}
              color={theme.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search entries..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>

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
                selectedType === "harvest" && styles.filterChipActive,
              ]}
              onPress={() =>
                setSelectedType(selectedType === "harvest" ? null : "harvest")
              }
            >
              <Ionicons
                name="basket"
                size={14}
                color={
                  selectedType === "harvest" ? "#fff" : theme.textSecondary
                }
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === "harvest" && styles.filterChipTextActive,
                ]}
              >
                Harvest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === "observation" && styles.filterChipActive,
              ]}
              onPress={() =>
                setSelectedType(
                  selectedType === "observation" ? null : "observation"
                )
              }
            >
              <Ionicons
                name="eye"
                size={14}
                color={
                  selectedType === "observation" ? "#fff" : theme.textSecondary
                }
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === "observation" && styles.filterChipTextActive,
                ]}
              >
                Observation
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === "issue" && styles.filterChipActive,
              ]}
              onPress={() =>
                setSelectedType(selectedType === "issue" ? null : "issue")
              }
            >
              <Ionicons
                name="alert-circle"
                size={14}
                color={selectedType === "issue" ? "#fff" : theme.textSecondary}
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === "issue" && styles.filterChipTextActive,
                ]}
              >
                Issue
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === "milestone" && styles.filterChipActive,
              ]}
              onPress={() =>
                setSelectedType(
                  selectedType === "milestone" ? null : "milestone"
                )
              }
            >
              <Ionicons
                name="flag"
                size={14}
                color={
                  selectedType === "milestone" ? "#fff" : theme.textSecondary
                }
              />
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === "milestone" && styles.filterChipTextActive,
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
                    {entry.entry_type === "harvest" &&
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
                <Text style={styles.emptyText}>
                  {searchQuery ||
                  selectedType || dateFilter !== "all"
                    ? "No entries match your filters"
                    : "No journal entries yet"}
                </Text>
                <Text style={styles.emptySubtext}>
                  {searchQuery ||
                  selectedType || dateFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Start documenting your garden journey"}
                </Text>
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
            style={styles.modalClose}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.modalImage}
              resizeMode="contain"
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
      paddingTop: 48,
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
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.text,
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
    },
    viewToggleActive: {
      backgroundColor: theme.primary,
    },
    fab: {
      position: "absolute",
      right: 20,
      bottom: 20,
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
    statCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      padding: 8,
      marginRight: 8,
      alignItems: "center",
      minWidth: 70,
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
      textAlign: "center",
    },
    searchFilterRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 10,
      marginBottom: 12,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      width: 120,
    },
    searchIcon: {
      marginRight: 6,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
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
    },
    filterChipActive: {
      backgroundColor: theme.primary,
    },
    filterChipText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    filterChipTextActive: {
      color: "#fff",
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
    },
    modalContainer: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.9)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalClose: {
      position: "absolute",
      top: 48,
      right: 16,
      zIndex: 10,
    },
    modalImage: {
      width: width,
      height: width,
    },
  });
