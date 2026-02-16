import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Image } from 'expo-image';
import { getPlant } from "../services/plants";
import { getTaskTemplates, getSeasonalCareReminder } from "../services/tasks";
import { getJournalEntries } from "../services/journal";
import {
  Plant,
  TaskTemplate,
  JournalEntry,
  JournalEntryType,
} from "../types/database.types";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { getYearsOld } from "../utils/dateHelpers";

export default function PlantDetailScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const { plantId } = route.params || {};
  const [plant, setPlant] = useState<Plant | null>(null);
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [harvestEntries, setHarvestEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = React.useRef(true);

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    if (isMountedRef.current && !options?.silent) {
      setLoading(true);
    }
    try {
      const [plantData, allTasks, allJournalEntries] = await Promise.all([
        getPlant(plantId),
        getTaskTemplates(),
        getJournalEntries(),
      ]);

      if (!isMountedRef.current) return;

      setPlant(plantData);
      setTasks(allTasks.filter((t) => t.plant_id === plantId));
      const plantHarvests = allJournalEntries
        .filter(
          (e) =>
            e.plant_id === plantId &&
            e.entry_type === JournalEntryType.Harvest
        )
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      setHarvestEntries(plantHarvests);
    } catch (error: any) {
      if (!isMountedRef.current) return;
      if (!options?.silent) {
        Alert.alert("Error", error.message);
      }
    } finally {
      if (isMountedRef.current && !options?.silent) {
        setLoading(false);
      }
    }
  }, [plantId]);

  const openHarvestForm = useCallback(() => {
    navigation.navigate("Journal", {
      screen: "JournalForm",
      params: {
        initialEntryType: JournalEntryType.Harvest,
        initialPlantId: plantId,
      },
    });
  }, [navigation, plantId]);

  useEffect(() => {
    isMountedRef.current = true;
    if (plantId) {
      loadData();
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [plantId, loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (isMountedRef.current && plantId) {
        void loadData({ silent: true });
      }
    });

    return unsubscribe;
  }, [navigation, plantId, loadData]);

  if (!plantId) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Plant not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!plant) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Plant not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const seasonalReminder = getSeasonalCareReminder(plant);

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { top: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("PlantForm", { plantId })}
          style={styles.editButton}
        >
          <Ionicons name="pencil" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {plant.photo_url ? (
        <Image 
          source={{ uri: plant.photo_url }} 
          style={styles.photo}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          priority="high"
        />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name="leaf" size={64} color={theme.primary} />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.name}>{plant.name}</Text>
        {plant.variety && <Text style={styles.variety}>{plant.variety}</Text>}

        <View style={styles.infoSection}>
          {plant.plant_variety && (
            <View style={styles.infoRow}>
              <Ionicons name="leaf" size={20} color={theme.textSecondary} />
              <Text style={styles.infoText}>Type: {plant.plant_variety}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color={theme.textSecondary} />
            <Text style={styles.infoText}>{plant.location}</Text>
          </View>
          {plant.landmarks && (
            <View style={styles.infoRow}>
              <Ionicons name="flag" size={20} color={theme.textSecondary} />
              <Text style={styles.infoText}>
                Landmark: {plant.landmarks}
              </Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons
              name={
                plant.space_type === "pot"
                  ? "cube-outline"
                  : plant.space_type === "bed"
                  ? "apps"
                  : "earth"
              }
              size={20}
              color={theme.textSecondary}
            />
            <Text style={styles.infoText}>
              {plant.space_type === "pot"
                ? plant.pot_size || "Pot"
                : plant.space_type === "bed"
                ? plant.bed_name || "Bed"
                : "Ground"}
            </Text>
          </View>
          {plant.planting_date && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color={theme.textSecondary} />
              <Text style={styles.infoText}>
                Planted {plant.planting_date} (
                {getYearsOld(plant.planting_date) ?? 0} years old)
              </Text>
            </View>
          )}
          {plant.harvest_season && (
            <View style={styles.infoRow}>
              <Ionicons name="sunny" size={20} color={theme.textSecondary} />
              <Text style={styles.infoText}>
                Harvest: {plant.harvest_season}
              </Text>
            </View>
          )}
          {(plant.harvest_start_date || plant.harvest_end_date) && (
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={theme.textSecondary}
              />
              <Text style={styles.infoText}>
                {plant.harvest_start_date || ""}
                {plant.harvest_end_date ? ` - ${plant.harvest_end_date}` : ""}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.careSection}>
          <Text style={styles.sectionTitle}>🌱 Care Information</Text>
          {plant.sunlight && (
            <View style={styles.infoRow}>
              <Ionicons name="sunny" size={20} color="#FFA500" />
              <Text style={styles.infoText}>
                {plant.sunlight === "full_sun"
                  ? "☀️ Full Sun"
                  : plant.sunlight === "partial_sun"
                  ? "⛅ Partial Sun"
                  : "🌤️ Shade"}
              </Text>
            </View>
          )}
          {plant.soil_type && (
            <View style={styles.infoRow}>
              <Ionicons name="layers" size={20} color="#8B4513" />
              <Text style={styles.infoText}>
                Soil:{" "}
                {plant.soil_type
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </View>
          )}
          {plant.water_requirement && (
            <View style={styles.infoRow}>
              <Ionicons name="water" size={20} color="#2196F3" />
              <Text style={styles.infoText}>
                Water Need:{" "}
                {plant.water_requirement.charAt(0).toUpperCase() +
                  plant.water_requirement.slice(1)}
              </Text>
            </View>
          )}
          {plant.watering_frequency_days && (
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color="#2196F3" />
              <Text style={styles.infoText}>
                Water every {plant.watering_frequency_days} days
              </Text>
            </View>
          )}
          {plant.fertilising_frequency_days && (
            <View style={styles.infoRow}>
              <Ionicons name="nutrition" size={20} color="#FF9800" />
              <Text style={styles.infoText}>
                Fertilise every {plant.fertilising_frequency_days} days
              </Text>
            </View>
          )}
          {plant.preferred_fertiliser && (
            <View style={styles.infoRow}>
              <Ionicons name="leaf" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>
                Fertiliser:{" "}
                {plant.preferred_fertiliser
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </View>
          )}
          {plant.mulching_used && (
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>Mulching applied</Text>
            </View>
          )}
          {plant.health_status && (
            <View style={styles.infoRow}>
              <Ionicons
                name={
                  plant.health_status === "healthy"
                    ? "checkmark-circle"
                    : plant.health_status === "sick"
                    ? "close-circle"
                    : "alert-circle"
                }
                size={20}
                color={
                  plant.health_status === "healthy"
                    ? "#4CAF50"
                    : plant.health_status === "sick"
                    ? "#f44336"
                    : "#FF9800"
                }
              />
              <Text
                style={[
                  styles.infoText,
                  {
                    color:
                      plant.health_status === "healthy"
                        ? "#4CAF50"
                        : plant.health_status === "sick"
                        ? "#f44336"
                        : "#FF9800",
                    fontWeight: "600",
                  },
                ]}
              >
                {plant.health_status.charAt(0).toUpperCase() +
                  plant.health_status.slice(1)}
              </Text>
            </View>
          )}
          {seasonalReminder && (
            <View style={styles.seasonBox}>
              <Text style={styles.seasonTitle}>Seasonal Tip</Text>
              <Text style={styles.seasonText}>{seasonalReminder}</Text>
            </View>
          )}
        </View>

        {/* PHASE 1: Growth & Pruning Section */}
        {(plant.growth_stage ||
          plant.pruning_frequency_days ||
          plant.pruning_notes) && (
          <View style={styles.careSection}>
            <Text style={styles.sectionTitle}>🌱 Growth & Pruning</Text>
            {plant.growth_stage && (
              <View style={styles.infoRow}>
                <Ionicons name="trending-up" size={20} color="#9C27B0" />
                <Text style={styles.infoText}>
                  Stage:{" "}
                  {plant.growth_stage.charAt(0).toUpperCase() +
                    plant.growth_stage.slice(1)}
                </Text>
              </View>
            )}
            {plant.pruning_frequency_days && (
              <View style={styles.infoRow}>
                <Ionicons name="cut" size={20} color="#795548" />
                <Text style={styles.infoText}>
                  Prune every {plant.pruning_frequency_days} days
                </Text>
              </View>
            )}
            {plant.pruning_notes && (
              <View style={styles.infoRow}>
                <Ionicons
                  name="document-text"
                  size={20}
                  color={theme.textSecondary}
                />
                <Text style={styles.infoText}>{plant.pruning_notes}</Text>
              </View>
            )}
          </View>
        )}

        {plant.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{plant.notes}</Text>
          </View>
        )}

        {/* Harvest History Section */}
        {(plant.plant_type === "fruit_tree" ||
          plant.plant_type === "coconut_tree") && (
          <View style={styles.harvestSection}>
            <View style={styles.harvestHeader}>
              <Text style={styles.sectionTitle}>🧺 Harvest History</Text>
              {harvestEntries.length > 0 && (
                <TouchableOpacity onPress={openHarvestForm}>
                  <Ionicons name="add-circle" size={24} color={theme.primary} />
                </TouchableOpacity>
              )}
            </View>
            {harvestEntries.length > 0 ? (
              <>
                {/* Harvest Statistics */}
                <View style={styles.harvestStats}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {harvestEntries.length}
                    </Text>
                    <Text style={styles.statLabel}>Harvests</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {harvestEntries
                        .reduce((sum, e) => sum + (e.harvest_quantity || 0), 0)
                        .toFixed(1)}
                    </Text>
                    <Text style={styles.statLabel}>
                      Total {harvestEntries[0]?.harvest_unit || "units"}
                    </Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                      {(
                        harvestEntries.reduce(
                          (sum, e) => sum + (e.harvest_quantity || 0),
                          0
                        ) / harvestEntries.length
                      ).toFixed(1)}
                    </Text>
                    <Text style={styles.statLabel}>Avg/harvest</Text>
                  </View>
                  {plant.plant_type === "coconut_tree" &&
                    harvestEntries.length > 0 &&
                    (() => {
                      const lastHarvestDate = new Date(
                        harvestEntries[0].created_at
                      );
                      const nextHarvestDate = new Date(lastHarvestDate);
                      nextHarvestDate.setMonth(nextHarvestDate.getMonth() + 2);
                      const daysUntil = Math.ceil(
                        (nextHarvestDate.getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      );
                      return (
                        <View style={styles.statCard}>
                          <Text
                            style={[
                              styles.statValue,
                              {
                                fontSize: 18,
                                color:
                                  daysUntil <= 7
                                    ? theme.success
                                    : theme.textSecondary,
                              },
                            ]}
                          >
                            {daysUntil > 0 ? `${daysUntil}d` : "Ready"}
                          </Text>
                          <Text style={styles.statLabel}>Next harvest</Text>
                        </View>
                      );
                    })()}
                </View>

                {/* Recent Harvests */}
                <Text style={styles.recentTitle}>Recent Harvests</Text>
                {harvestEntries.slice(0, 5).map((entry) => (
                  <View key={entry.id} style={styles.harvestItem}>
                    <View style={styles.harvestLeft}>
                      <Text style={styles.harvestDate}>
                        {new Date(entry.created_at).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </Text>
                      <Text style={styles.harvestQuantity}>
                        {entry.harvest_quantity} {entry.harvest_unit}
                      </Text>
                    </View>
                    <View style={styles.harvestRight}>
                      {entry.harvest_quality && (
                        <Text style={styles.qualityBadge}>
                          {entry.harvest_quality === "excellent"
                            ? "🌟"
                            : entry.harvest_quality === "good"
                            ? "👍"
                            : entry.harvest_quality === "fair"
                            ? "👌"
                            : "👎"}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}

                {harvestEntries.length > 5 && (
                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={() => navigation.navigate("Journal")}
                  >
                    <Text style={styles.viewAllText}>View All in Journal</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={theme.primary}
                    />
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.emptyHarvest}>
                <Ionicons
                  name="basket-outline"
                  size={48}
                  color={theme.border}
                />
                <Text style={styles.emptyHarvestText}>
                  No harvests recorded yet
                </Text>
                <TouchableOpacity
                  style={styles.addHarvestButton}
                  onPress={openHarvestForm}
                >
                  <Text style={styles.addHarvestButtonText}>
                    Record First Harvest
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>Tasks ({tasks.length})</Text>
          {tasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <View style={styles.taskLeft}>
                <Text style={styles.taskType}>
                  {task.task_type.charAt(0).toUpperCase() +
                    task.task_type.slice(1)}
                </Text>
                <Text style={styles.taskFrequency}>
                  Every {task.frequency_days} days
                </Text>
              </View>
              <Text
                style={[
                  styles.taskStatus,
                  !task.enabled && styles.taskDisabled,
                ]}
              >
                {task.enabled ? "Active" : "Disabled"}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      position: "absolute",
      top: 12,
      left: 0,
      right: 0,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      zIndex: 10,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.card,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    editButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.card,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    photo: {
      width: "100%",
      height: 300,
    },
    photoPlaceholder: {
      backgroundColor: theme.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      padding: 24,
    },
    name: {
      fontSize: 32,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 4,
    },
    variety: {
      fontSize: 18,
      color: theme.textSecondary,
      fontStyle: "italic",
      marginBottom: 16,
    },
    infoSection: {
      marginBottom: 24,
    },
    careSection: {
      marginBottom: 24,
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 12,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    infoText: {
      fontSize: 16,
      color: theme.textSecondary,
      marginLeft: 12,
    },
    notesSection: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 12,
    },
    notesText: {
      fontSize: 16,
      color: theme.textSecondary,
      lineHeight: 24,
    },
    // Phase 1 & 2 styles
    seasonBox: {
      backgroundColor: theme.backgroundSecondary,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    seasonTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
    },
    seasonText: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    seasonNotes: {
      fontSize: 13,
      color: theme.textTertiary,
      fontStyle: "italic",
      marginTop: 4,
    },
    tasksSection: {
      marginBottom: 24,
    },
    taskItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 8,
    },
    taskLeft: {
      flex: 1,
    },
    taskType: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    taskFrequency: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 2,
    },
    taskStatus: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.primary,
    },
    taskDisabled: {
      color: theme.textTertiary,
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    link: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: "600",
      marginTop: 16,
    },
    harvestSection: {
      backgroundColor: theme.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    harvestHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    harvestStats: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.background,
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.primary,
    },
    statLabel: {
      fontSize: 11,
      color: theme.textSecondary,
      marginTop: 4,
      textAlign: "center",
    },
    recentTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 8,
    },
    harvestItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    harvestLeft: {
      flex: 1,
    },
    harvestDate: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    harvestQuantity: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    harvestRight: {
      alignItems: "flex-end",
    },
    qualityBadge: {
      fontSize: 24,
    },
    viewAllButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      marginTop: 8,
    },
    viewAllText: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: "600",
      marginRight: 4,
    },
    emptyHarvest: {
      alignItems: "center",
      paddingVertical: 32,
    },
    emptyHarvestText: {
      fontSize: 16,
      color: theme.textTertiary,
      marginTop: 12,
      marginBottom: 16,
    },
    addHarvestButton: {
      backgroundColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    addHarvestButtonText: {
      color: theme.buttonText,
      fontSize: 14,
      fontWeight: "600",
    },
  });
