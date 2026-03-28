import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  StatusBar,
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
import { createStyles } from "../styles/plantDetailStyles";
import { getYearsOld, formatTimestampDisplay, formatDateDisplay } from "../utils/dateHelpers";
import { getSeasonalPestAlerts } from "../utils/seasonHelpers";
import {
  getCompanionSuggestions,
  getIncompatiblePlants,
  calculateExpectedHarvestDate,
  getCoconutAgeInfo,
  getCoconutNutrientDeficiencies,
  getCommonPests,
  getCommonDiseases,
} from "../utils/plantHelpers";
import PestDiseaseHistorySection from "../components/PestDiseaseHistorySection";
import HarvestHistorySection from "../components/HarvestHistorySection";

export default function PlantDetailScreen({ route, navigation }: any) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { plantId } = route.params || {};
  const [plant, setPlant] = useState<Plant | null>(null);
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [harvestEntries, setHarvestEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomVisible, setZoomVisible] = useState(false);
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
  const seasonalPestAlerts = getSeasonalPestAlerts(plant.plant_type);
  const companions = getCompanionSuggestions(plant.plant_variety || plant.name);
  const incompatible = getIncompatiblePlants(plant.plant_variety || plant.name);
  const computedHarvestDate = calculateExpectedHarvestDate(plant.plant_variety || plant.name, plant.planting_date, plant.plant_type);
  const coconutAge = plant.plant_type === "coconut_tree" ? getCoconutAgeInfo(plant.planting_date) : null;
  const coconutDeficiencies = plant.plant_type === "coconut_tree" ? getCoconutNutrientDeficiencies() : [];
  const commonPests = getCommonPests(plant.plant_type, plant.plant_variety);
  const commonDiseases = getCommonDiseases(plant.plant_type, plant.plant_variety);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 48) + 16 }}>
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
        <TouchableOpacity activeOpacity={0.9} onPress={() => setZoomVisible(true)}>
          <Image 
            source={{ uri: plant.photo_url }} 
            style={styles.photo}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            priority="high"
          />
        </TouchableOpacity>
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name="leaf" size={64} color={theme.primary} />
        </View>
      )}

      {/* Fullscreen Image Zoom Modal */}
      <Modal visible={zoomVisible} transparent animationType="fade" onRequestClose={() => setZoomVisible(false)}>
        <StatusBar barStyle="light-content" />
        <View style={styles.zoomOverlay}>
          <TouchableOpacity style={[styles.zoomClose, { top: insets.top + 16 }]} onPress={() => setZoomVisible(false)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <ScrollView
            maximumZoomScale={4}
            minimumZoomScale={1}
            contentContainerStyle={{ flex: 1, justifyContent: "center", alignItems: "center" }}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            bouncesZoom
          >
            <Image
              source={{ uri: plant.photo_url! }}
              style={styles.zoomImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
          </ScrollView>
        </View>
      </Modal>

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
                Planted: {formatDateDisplay(plant.planting_date)} (
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
          {(plant.expected_harvest_date || computedHarvestDate) && (
            <View style={styles.infoRow}>
              <Ionicons name="hourglass" size={20} color={theme.textSecondary} />
              <Text style={styles.infoText}>
                Expected Harvest: {formatDateDisplay(plant.expected_harvest_date || computedHarvestDate!)}
              </Text>
            </View>
          )}
          {plant.mature_height && (
            <View style={styles.infoRow}>
              <Ionicons name="resize" size={20} color={theme.textSecondary} />
              <Text style={styles.infoText}>
                Mature Height: {plant.mature_height}
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

        {/* Last Care Summary */}
        {(plant.last_watered_date || plant.last_fertilised_date || plant.last_pruned_date) && (
          <View style={styles.careSection}>
            <Text style={styles.sectionTitle}>📋 Last Care</Text>
            <View style={styles.lastCareGrid}>
              {plant.last_watered_date && (
                <View style={styles.lastCareItem}>
                  <Ionicons name="water" size={22} color="#2196F3" />
                  <Text style={styles.lastCareLabel}>Watered</Text>
                  <Text style={styles.lastCareDate}>{formatTimestampDisplay(plant.last_watered_date)}</Text>
                </View>
              )}
              {plant.last_fertilised_date && (
                <View style={styles.lastCareItem}>
                  <Ionicons name="nutrition" size={22} color="#FF9800" />
                  <Text style={styles.lastCareLabel}>Fertilised</Text>
                  <Text style={styles.lastCareDate}>{formatTimestampDisplay(plant.last_fertilised_date)}</Text>
                </View>
              )}
              {plant.last_pruned_date && (
                <View style={styles.lastCareItem}>
                  <Ionicons name="cut" size={22} color="#795548" />
                  <Text style={styles.lastCareLabel}>Pruned</Text>
                  <Text style={styles.lastCareDate}>{formatTimestampDisplay(plant.last_pruned_date)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Coconut-Specific Metrics */}
        {plant.plant_type === "coconut_tree" && (
          (plant.coconut_fronds_count || plant.nuts_per_month || plant.spathe_count_per_month || plant.last_climbing_date || plant.nut_fall_count) ? (
          <View style={styles.careSection}>
            <Text style={styles.sectionTitle}>🥥 Coconut Metrics</Text>
            <View style={styles.metricsGrid}>
              {plant.coconut_fronds_count != null && (
                <View style={styles.metricCard}>
                  <Ionicons name="leaf" size={22} color="#4CAF50" />
                  <Text style={styles.metricValue}>{plant.coconut_fronds_count}</Text>
                  <Text style={styles.metricLabel}>Fronds</Text>
                  {(plant.coconut_fronds_count < 30 || plant.coconut_fronds_count > 35) && (
                    <Text style={styles.metricWarning}>
                      {plant.coconut_fronds_count < 30 ? "Below healthy (30-35)" : "Above typical (30-35)"}
                    </Text>
                  )}
                </View>
              )}
              {plant.nuts_per_month != null && (
                <View style={styles.metricCard}>
                  <Ionicons name="ellipse" size={22} color="#8B4513" />
                  <Text style={styles.metricValue}>{plant.nuts_per_month}</Text>
                  <Text style={styles.metricLabel}>Nuts / Month</Text>
                </View>
              )}
              {plant.spathe_count_per_month != null && (
                <View style={styles.metricCard}>
                  <Ionicons name="flower" size={22} color="#FF9800" />
                  <Text style={styles.metricValue}>{plant.spathe_count_per_month}</Text>
                  <Text style={styles.metricLabel}>Spathes / Month</Text>
                </View>
              )}
              {plant.nut_fall_count != null && (
                <View style={styles.metricCard}>
                  <Ionicons name="arrow-down-circle" size={22} color="#f44336" />
                  <Text style={styles.metricValue}>{plant.nut_fall_count}</Text>
                  <Text style={styles.metricLabel}>Nut Falls</Text>
                  {plant.last_nut_fall_date && (
                    <Text style={styles.metricLabel}>Last: {plant.last_nut_fall_date}</Text>
                  )}
                </View>
              )}
            </View>
            {plant.last_climbing_date && (
              <View style={[styles.infoRow, { marginTop: 12 }]}>
                <Ionicons name="calendar" size={20} color={theme.textSecondary} />
                <Text style={styles.infoText}>Last Climbing: {plant.last_climbing_date}</Text>
              </View>
            )}
          </View>
          ) : null
        )}

        {/* Coconut Age Care Guidance */}
        {coconutAge && (
          <View style={styles.careSection}>
            <Text style={styles.sectionTitle}>🌴 Coconut Age Guidance</Text>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color={theme.primary} />
              <Text style={styles.infoText}>{coconutAge.ageLabel} — {coconutAge.stageLabel}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="analytics" size={20} color={theme.textSecondary} />
              <Text style={styles.infoText}>Expected Yield: {coconutAge.expectedNutsPerYear}</Text>
            </View>
            {coconutAge.careTips.map((tip, i) => (
              <View key={i} style={styles.careTipItem}>
                <Text style={styles.careTipBullet}>•</Text>
                <Text style={styles.careTipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Pest & Disease History + Seasonal Alerts */}
        <PestDiseaseHistorySection
          records={plant.pest_disease_history || []}
          seasonalAlerts={seasonalPestAlerts}
          styles={styles}
        />

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

        {/* Companion Planting */}
        {(companions.length > 0 || incompatible.length > 0) && (
          <View style={styles.careSection}>
            <Text style={styles.sectionTitle}>🤝 Companion Planting</Text>
            {companions.length > 0 && (
              <>
                <Text style={styles.subsectionTitle}>Good Companions</Text>
                <View style={styles.companionRow}>
                  {companions.map((c) => (
                    <View key={c} style={styles.companionChip}>
                      <Text style={styles.companionChipText}>{c}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            {incompatible.length > 0 && (
              <>
                <Text style={styles.subsectionTitle}>Avoid Planting With</Text>
                <View style={styles.companionRow}>
                  {incompatible.map((c) => (
                    <View key={c} style={styles.incompatibleChip}>
                      <Text style={styles.incompatibleChipText}>{c}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Common Pests & Diseases Awareness */}
        {(commonPests.length > 0 || commonDiseases.length > 0) && (
          <View style={styles.careSection}>
            <Text style={styles.sectionTitle}>🔍 Common Pests & Diseases</Text>
            {commonPests.length > 0 && (
              <>
                <Text style={styles.subsectionTitle}>Pests to Watch</Text>
                <View style={styles.awarenessRow}>
                  {commonPests.map((p) => (
                    <View key={p} style={styles.awarenessChip}>
                      <Text style={styles.awarenessChipText}>🐛 {p}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            {commonDiseases.length > 0 && (
              <>
                <Text style={styles.subsectionTitle}>Diseases to Watch</Text>
                <View style={styles.awarenessRow}>
                  {commonDiseases.map((d) => (
                    <View key={d} style={styles.awarenessChip}>
                      <Text style={styles.awarenessChipText}>🦠 {d}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Coconut Nutrient Deficiency Guide */}
        {coconutDeficiencies.length > 0 && (
          <View style={styles.careSection}>
            <Text style={styles.sectionTitle}>🧪 Nutrient Deficiency Guide</Text>
            {coconutDeficiencies.map((def) => (
              <View
                key={def.nutrient}
                style={[
                  styles.nutrientCard,
                  { borderLeftColor: def.urgency === "high" ? "#f44336" : def.urgency === "medium" ? "#FF9800" : "#4CAF50" },
                ]}
              >
                <Text style={styles.nutrientName}>{def.nutrient}</Text>
                <Text style={styles.nutrientSubTitle}>Symptoms</Text>
                {def.symptoms.slice(0, 3).map((s, i) => (
                  <Text key={i} style={styles.nutrientSymptom}>• {s}</Text>
                ))}
                <Text style={styles.nutrientSubTitle}>Organic Correction</Text>
                {def.organicCorrection.slice(0, 2).map((c, i) => (
                  <Text key={i} style={styles.nutrientCorrection}>✓ {c}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {plant.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{plant.notes}</Text>
          </View>
        )}

        {/* Harvest History Section */}
        <HarvestHistorySection
          plantType={plant.plant_type}
          harvestEntries={harvestEntries}
          styles={styles}
          theme={theme}
          onRecordHarvest={openHarvestForm}
          onViewAll={() => navigation.navigate("Journal")}
        />

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

