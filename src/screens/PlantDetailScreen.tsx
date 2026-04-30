import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ImageStyle } from "react-native";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  StatusBar,
  Dimensions,
  Animated,
} from "react-native";
import {
  PinchGestureHandler,
  PanGestureHandler,
  TapGestureHandler,
  GestureHandlerRootView,
  State,
  PinchGestureHandlerEventPayload,
  PanGestureHandlerEventPayload,
  TapGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import type { HandlerStateChangeEvent } from "react-native-gesture-handler";
import { Image } from 'expo-image';
import { getPlant, pinGrowthStage, unpinGrowthStage } from "../services/plants";
import { getTaskTemplates } from "../services/tasks";
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
import {
  getCompanionSuggestions,
  getIncompatiblePlants,
  calculateExpectedHarvestDate,
  getCoconutAgeInfo,
  getCoconutNutrientDeficiencies,
  getEffectiveGrowthStage,
} from "../utils/plantHelpers";
import { getPlantCareProfile } from "../utils/plantCareDefaults";
import GrowthStageTimeline from "../components/GrowthStageTimeline";
import type { GrowthStage } from "../types/database.types";
import PestDiseaseHistorySection from "../components/PestDiseaseHistorySection";
import HarvestHistorySection from "../components/HarvestHistorySection";
import { DetailQuickInfoSection } from "../components/DetailQuickInfoSection";
import { DetailNutritionSection } from "../components/DetailNutritionSection";
import { DetailCareGuidanceSection } from "../components/DetailCareGuidanceSection";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  PlantDetailScreenNavigationProp,
  PlantDetailScreenRouteProp,
} from "../types/navigation.types";
import { getErrorMessage } from "../utils/errorLogging";

const SCREEN = Dimensions.get("window");

const GROWTH_STAGES: GrowthStage[] = [
  "seedling", "vegetative", "flowering", "fruiting", "dormant", "mature",
];

const GROWTH_STAGE_ICONS: Record<GrowthStage, string> = {
  seedling: "leaf-outline",
  vegetative: "nutrition-outline",
  flowering: "flower-outline",
  fruiting: "basket-outline",
  dormant: "moon-outline",
  mature: "checkmark-circle-outline",
};

export default function PlantDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<PlantDetailScreenNavigationProp>();
  const route = useRoute<PlantDetailScreenRouteProp>();
  const { plantId } = route.params ?? {};
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [harvestEntries, setHarvestEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomVisible, setZoomVisible] = useState(false);
  const [pinStageVisible, setPinStageVisible] = useState(false);
  const isMountedRef = useRef(true);

  // Zoom gesture animated values (Expo Go compatible — no reanimated)
  const baseScale = useRef(new Animated.Value(1)).current;
  const pinchScale = useRef(new Animated.Value(1)).current;
  const composedScale = useRef(Animated.multiply(baseScale, pinchScale)).current;
  const lastScale = useRef(1);
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef({ x: 0, y: 0 });
  const pinchHandlerRef = useRef(null);
  const panHandlerRef = useRef(null);

  const resetZoomValues = useCallback(() => {
    baseScale.setValue(1);
    pinchScale.setValue(1);
    translateX.setOffset(0);
    translateX.setValue(0);
    translateY.setOffset(0);
    translateY.setValue(0);
    lastScale.current = 1;
    lastOffset.current = { x: 0, y: 0 };
  }, [baseScale, pinchScale, translateX, translateY]);

  // Reset zoom state when modal opens
  useEffect(() => {
    if (zoomVisible) resetZoomValues();
  }, [zoomVisible, resetZoomValues]);

  const onPinchEvent = useRef(
    Animated.event([{ nativeEvent: { scale: pinchScale } }], { useNativeDriver: true })
  ).current;

  const onPinchStateChange = useCallback(({ nativeEvent }: HandlerStateChangeEvent<PinchGestureHandlerEventPayload>) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      lastScale.current = Math.min(4, Math.max(1, lastScale.current * nativeEvent.scale));
      baseScale.setValue(lastScale.current);
      pinchScale.setValue(1);
    }
  }, [baseScale, pinchScale]);

  const onPanEvent = useRef(
    Animated.event(
      [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
      { useNativeDriver: true }
    )
  ).current;

  const onPanStateChange = useCallback(({ nativeEvent }: HandlerStateChangeEvent<PanGestureHandlerEventPayload>) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      lastOffset.current.x += nativeEvent.translationX;
      lastOffset.current.y += nativeEvent.translationY;
      translateX.setOffset(lastOffset.current.x);
      translateX.setValue(0);
      translateY.setOffset(lastOffset.current.y);
      translateY.setValue(0);
    }
  }, [translateX, translateY]);

  const onDoubleTap = useCallback(({ nativeEvent }: HandlerStateChangeEvent<TapGestureHandlerEventPayload>) => {
    if (nativeEvent.state === State.ACTIVE) {
      if (lastScale.current > 1) {
        // Collapse offset into value so spring animates to true 0
        translateX.setOffset(0);
        translateX.setValue(lastOffset.current.x);
        translateY.setOffset(0);
        translateY.setValue(lastOffset.current.y);
        Animated.parallel([
          Animated.spring(baseScale, { toValue: 1, useNativeDriver: true }),
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        ]).start(() => {
          lastScale.current = 1;
          lastOffset.current = { x: 0, y: 0 };
        });
      } else {
        Animated.spring(baseScale, { toValue: 2, useNativeDriver: true }).start();
        lastScale.current = 2;
      }
    }
  }, [baseScale, translateX, translateY]);

  const closeZoom = useCallback(() => {
    setZoomVisible(false);
  }, []);

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    if (isMountedRef.current && !options?.silent) {
      setLoading(true);
    }
    try {
      const [plantData, allTasks, allJournalEntries] = await Promise.all([
        getPlant(plantId ?? ""),
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
    } catch (error: unknown) {
      if (!isMountedRef.current) return;
      if (!options?.silent) {
        Alert.alert("Error", getErrorMessage(error));
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

  const companions = getCompanionSuggestions(plant.plant_variety || plant.name);
  const incompatible = getIncompatiblePlants(plant.plant_variety || plant.name);
  const computedHarvestDate = calculateExpectedHarvestDate(plant.plant_variety || plant.name, plant.planting_date, plant.plant_type);
  const coconutAge = plant.plant_type === "coconut_tree" ? getCoconutAgeInfo(plant.planting_date) : null;
  const coconutDeficiencies = plant.plant_type === "coconut_tree" ? getCoconutNutrientDeficiencies() : [];
  const careProfile = getPlantCareProfile(plant.plant_variety || "", plant.plant_type);
  const effectiveStage = careProfile
    ? getEffectiveGrowthStage(plant, careProfile)
    : null;
  const isPinned = Boolean(plant.growth_stage_pinned);

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 48) + 16 }}>
      <View style={[styles.header, { top: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
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
            style={styles.photo as ImageStyle}
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
      <Modal
        visible={zoomVisible}
        transparent
        animationType="fade"
        onRequestClose={closeZoom}
        statusBarTranslucent
      >
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={styles.zoomOverlay}>
          <TouchableOpacity
            style={[styles.zoomClose, { top: insets.top + 16 }]}
            onPress={closeZoom}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <TapGestureHandler numberOfTaps={2} onHandlerStateChange={onDoubleTap}>
            <Animated.View style={styles.zoomGestureContainer}>
              <PanGestureHandler
                ref={panHandlerRef}
                onGestureEvent={onPanEvent}
                onHandlerStateChange={onPanStateChange}
                simultaneousHandlers={[pinchHandlerRef]}
                minPointers={1}
                maxPointers={2}
              >
                <Animated.View style={styles.zoomGestureContainer}>
                  <PinchGestureHandler
                    ref={pinchHandlerRef}
                    onGestureEvent={onPinchEvent}
                    onHandlerStateChange={onPinchStateChange}
                    simultaneousHandlers={[panHandlerRef]}
                  >
                    <Animated.View
                      style={[styles.zoomGestureContainer, {
                        width: SCREEN.width,
                        height: SCREEN.height * 0.8,
                        transform: [
                          { translateX },
                          { translateY },
                          { scale: composedScale },
                        ],
                      }]}
                    >
                      <Image
                        source={{ uri: plant.photo_url! }}
                        style={{ width: SCREEN.width, height: SCREEN.height * 0.8 }}
                        contentFit="contain"
                        cachePolicy="memory-disk"
                      />
                    </Animated.View>
                  </PinchGestureHandler>
                </Animated.View>
              </PanGestureHandler>
            </Animated.View>
          </TapGestureHandler>
        </View>
        </GestureHandlerRootView>
      </Modal>

      <View style={styles.content}>
        {/* ── §1 Name & Key Info ──────────────────────────────────── */}
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
              <Text style={styles.infoText}>Landmark: {plant.landmarks}</Text>
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
                    ? theme.success
                    : plant.health_status === "sick"
                      ? theme.error
                      : theme.warning
                }
              />
              <Text
                style={[
                  styles.infoText,
                  plant.health_status === "healthy"
                    ? styles.healthStatusHealthy
                    : plant.health_status === "sick"
                      ? styles.healthStatusSick
                      : styles.healthStatusWarning,
                ]}
              >
                {plant.health_status.charAt(0).toUpperCase() +
                  plant.health_status.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {/* ── §2 Growth Stage ─────────────────────────────────────── */}
        {(effectiveStage || plant.growth_stage) && (
          <View style={styles.careSection}>
            <Text style={styles.sectionTitle}>🌱 Growth Stage</Text>
            {effectiveStage && (
              <>
                <View style={styles.infoRow}>
                  <Ionicons name="trending-up" size={20} color={theme.primary} />
                  <Text style={styles.infoText}>
                    Stage:{" "}
                    {effectiveStage.stage.charAt(0).toUpperCase() +
                      effectiveStage.stage.slice(1)}
                  </Text>
                  <View style={styles.growthStageBadge}>
                    <Text style={styles.growthStageBadgeText}>
                      {effectiveStage.source === "pinned"
                        ? "Pinned"
                        : effectiveStage.source === "coconut"
                          ? "Age-based"
                          : effectiveStage.source === "annual_cycle"
                            ? "Annual cycle"
                            : effectiveStage.source === "computed"
                              ? "Auto"
                              : "Manual"}
                    </Text>
                  </View>
                </View>
                {!isPinned && effectiveStage.source !== "coconut" && (
                  <TouchableOpacity
                    style={styles.growthStageAction}
                    onPress={() => setPinStageVisible(true)}
                  >
                    <Ionicons name="pin-outline" size={16} color={theme.primary} />
                    <Text style={styles.growthStageActionText}>Pin stage</Text>
                  </TouchableOpacity>
                )}
                {isPinned && (
                  <TouchableOpacity
                    style={styles.growthStageAction}
                    onPress={async () => {
                      await unpinGrowthStage(plantId);
                      loadData();
                    }}
                  >
                    <Ionicons name="pin" size={16} color={theme.accent} />
                    <Text style={styles.growthStageActionText}>Unpin stage</Text>
                  </TouchableOpacity>
                )}
                <GrowthStageTimeline
                  effectiveStage={effectiveStage}
                  plantingDate={plant.planting_date}
                  durations={careProfile?.growthStageDurations}
                  annualCycleDurations={careProfile?.annualCycleDurations}
                  isPinned={isPinned}
                />
              </>
            )}
            {!effectiveStage && plant.growth_stage && (
              <View style={styles.infoRow}>
                <Ionicons name="trending-up" size={20} color={theme.primary} />
                <Text style={styles.infoText}>
                  Stage:{" "}
                  {plant.growth_stage.charAt(0).toUpperCase() +
                    plant.growth_stage.slice(1)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── §3 Care & Schedule ──────────────────────────────────── */}
        <View style={styles.careSection}>
          <Text style={styles.sectionTitle}>📋 Care & Schedule</Text>
          {/* Last care dates */}
          {(plant.last_watered_date || plant.last_fertilised_date || plant.last_pruned_date) && (
            <View style={styles.lastCareGrid}>
              {plant.last_watered_date && (
                <View style={styles.lastCareItem}>
                  <Ionicons name="water" size={22} color={theme.primary} />
                  <Text style={styles.lastCareLabel}>Watered</Text>
                  <Text style={styles.lastCareDate}>{formatTimestampDisplay(plant.last_watered_date)}</Text>
                </View>
              )}
              {plant.last_fertilised_date && (
                <View style={styles.lastCareItem}>
                  <Ionicons name="nutrition" size={22} color={theme.accent} />
                  <Text style={styles.lastCareLabel}>Fertilised</Text>
                  <Text style={styles.lastCareDate}>{formatTimestampDisplay(plant.last_fertilised_date)}</Text>
                </View>
              )}
              {plant.last_pruned_date && (
                <View style={styles.lastCareItem}>
                  <Ionicons name="cut" size={22} color={theme.textSecondary} />
                  <Text style={styles.lastCareLabel}>Pruned</Text>
                  <Text style={styles.lastCareDate}>{formatTimestampDisplay(plant.last_pruned_date)}</Text>
                </View>
              )}
            </View>
          )}
          {/* Frequencies */}
          {plant.watering_frequency_days && (
            <View style={styles.infoRow}>
              <Ionicons name="water" size={20} color={theme.primary} />
              <Text style={styles.infoText}>
                Water every {plant.watering_frequency_days} days
              </Text>
            </View>
          )}
          {plant.fertilising_frequency_days && (
            <View style={styles.infoRow}>
              <Ionicons name="nutrition" size={20} color={theme.accent} />
              <Text style={styles.infoText}>
                Fertilise every {plant.fertilising_frequency_days} days
              </Text>
            </View>
          )}
          {plant.preferred_fertiliser && (
            <View style={styles.infoRow}>
              <Ionicons name="leaf" size={20} color={theme.success} />
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
              <Ionicons name="checkmark-circle" size={20} color={theme.success} />
              <Text style={styles.infoText}>Mulching applied</Text>
            </View>
          )}
          {plant.pruning_frequency_days && (
            <View style={styles.infoRow}>
              <Ionicons name="cut" size={20} color={theme.textSecondary} />
              <Text style={styles.infoText}>
                Prune every {plant.pruning_frequency_days} days
              </Text>
            </View>
          )}
        </View>

        {/* ── §4 Growing Profile ──────────────────────────────────── */}
        <DetailQuickInfoSection theme={theme} plantType={plant.plant_type} plantVariety={plant.plant_variety || ""} plantCareProfiles={{}} />

        {/* ── §5 Nutrition ────────────────────────────────────────── */}
        <DetailNutritionSection theme={theme} plantType={plant.plant_type} plantVariety={plant.plant_variety || ""} plantCareProfiles={{}} />

        {/* ── §6 Pests & Diseases (guidance + history + alerts) ──── */}
        <DetailCareGuidanceSection theme={theme} plantType={plant.plant_type} plantVariety={plant.plant_variety || ""} plantCareProfiles={{}} />

        <PestDiseaseHistorySection
          records={plant.pest_disease_history || []}
          seasonalAlerts={[]}
          styles={styles}
        />

        {/* ── §7 Companion Planting ───────────────────────────────── */}
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

        {/* ── §8 Harvest Info ─────────────────────────────────────── */}
        {(plant.harvest_season || plant.harvest_start_date || plant.harvest_end_date || plant.expected_harvest_date || computedHarvestDate) && (
          <View style={styles.careSection}>
            <Text style={styles.sectionTitle}>🍎 Harvest Info</Text>
            {plant.harvest_season && (
              <View style={styles.infoRow}>
                <Ionicons name="sunny" size={20} color={theme.textSecondary} />
                <Text style={styles.infoText}>Season: {plant.harvest_season}</Text>
              </View>
            )}
            {(plant.harvest_start_date || plant.harvest_end_date) && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                <Text style={styles.infoText}>
                  {plant.harvest_start_date || ""}
                  {plant.harvest_end_date ? ` – ${plant.harvest_end_date}` : ""}
                </Text>
              </View>
            )}
            {(plant.expected_harvest_date || computedHarvestDate) && (
              <View style={styles.infoRow}>
                <Ionicons name="hourglass" size={20} color={theme.textSecondary} />
                <Text style={styles.infoText}>
                  Expected: {formatDateDisplay(plant.expected_harvest_date || computedHarvestDate!)}
                </Text>
              </View>
            )}
          </View>
        )}

        <HarvestHistorySection
          plantType={plant.plant_type}
          harvestEntries={harvestEntries}
          styles={styles}
          onRecordHarvest={openHarvestForm}
          onViewAll={() => navigation.navigate("Journal")}
        />

        {/* ── §9 Coconut (metrics + age guidance + deficiency) ──── */}
        {plant.plant_type === "coconut_tree" && (coconutAge || plant.coconut_fronds_count || plant.nuts_per_month || plant.spathe_count_per_month || plant.last_climbing_date || plant.nut_fall_count || coconutDeficiencies.length > 0) && (
          <View style={styles.careSection}>
            <Text style={styles.sectionTitle}>🥥 Coconut</Text>
            {/* Age Guidance */}
            {coconutAge && (
              <>
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
              </>
            )}
            {/* Metrics */}
            {(plant.coconut_fronds_count != null || plant.nuts_per_month != null || plant.spathe_count_per_month != null || plant.nut_fall_count != null) && (
              <>
                {coconutAge && <View style={styles.sectionDivider} />}
                <Text style={styles.subsectionTitle}>Metrics</Text>
                <View style={styles.metricsGrid}>
                  {plant.coconut_fronds_count != null && (
                    <View style={styles.metricCard}>
                      <Ionicons name="leaf" size={22} color={theme.success} />
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
                      <Ionicons name="ellipse" size={22} color={theme.textSecondary} />
                      <Text style={styles.metricValue}>{plant.nuts_per_month}</Text>
                      <Text style={styles.metricLabel}>Nuts / Month</Text>
                    </View>
                  )}
                  {plant.spathe_count_per_month != null && (
                    <View style={styles.metricCard}>
                      <Ionicons name="flower" size={22} color={theme.accent} />
                      <Text style={styles.metricValue}>{plant.spathe_count_per_month}</Text>
                      <Text style={styles.metricLabel}>Spathes / Month</Text>
                    </View>
                  )}
                  {plant.nut_fall_count != null && (
                    <View style={styles.metricCard}>
                      <Ionicons name="arrow-down-circle" size={22} color={theme.error} />
                      <Text style={styles.metricValue}>{plant.nut_fall_count}</Text>
                      <Text style={styles.metricLabel}>Nut Falls</Text>
                      {plant.last_nut_fall_date && (
                        <Text style={styles.metricLabel}>Last: {plant.last_nut_fall_date}</Text>
                      )}
                    </View>
                  )}
                </View>
                {plant.last_climbing_date && (
                  <View style={[styles.infoRow, styles.infoRowMarginTop]}>
                    <Ionicons name="calendar" size={20} color={theme.textSecondary} />
                    <Text style={styles.infoText}>Last Climbing: {plant.last_climbing_date}</Text>
                  </View>
                )}
              </>
            )}
            {/* Nutrient Deficiency Guide */}
            {coconutDeficiencies.length > 0 && (
              <>
                <View style={styles.sectionDivider} />
                <Text style={styles.subsectionTitle}>Nutrient Deficiency Guide</Text>
                {coconutDeficiencies.map((def) => (
                  <View
                    key={def.nutrient}
                    style={[
                      styles.nutrientCard,
                      def.urgency === "high" ? styles.nutrientCardHigh : def.urgency === "medium" ? styles.nutrientCardMedium : styles.nutrientCardLow,
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
              </>
            )}
          </View>
        )}

        {/* ── §10 Notes ───────────────────────────────────────────── */}
        {plant.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{plant.notes}</Text>
          </View>
        )}
        {plant.pruning_notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Pruning Notes</Text>
            <Text style={styles.notesText}>{plant.pruning_notes}</Text>
          </View>
        )}

        {/* ── §11 Tasks ───────────────────────────────────────────── */}
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
    <Modal
      visible={pinStageVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setPinStageVisible(false)}
    >
      <View style={styles.pinModalOverlay}>
        <TouchableOpacity
          style={styles.pinModalBackdrop}
          activeOpacity={1}
          onPress={() => setPinStageVisible(false)}
        />
        <View style={styles.pinModalSheet}>
          <View style={styles.pinModalHeader}>
            <Text style={styles.pinModalTitle}>Pin Growth Stage</Text>
            <TouchableOpacity
              style={styles.pinModalCloseButton}
              onPress={() => setPinStageVisible(false)}
            >
              <Ionicons name="close" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>
          {GROWTH_STAGES.map((s, index) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.pinModalItem,
                index === GROWTH_STAGES.length - 1 && styles.pinModalItemLast,
              ]}
              onPress={async () => {
                setPinStageVisible(false);
                await pinGrowthStage(plantId, s);
                loadData();
              }}
            >
              <Ionicons
                name={GROWTH_STAGE_ICONS[s] as React.ComponentProps<typeof Ionicons>["name"]}
                size={20}
                color={theme.primary}
              />
              <Text style={styles.pinModalItemText}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
    </>
  );
}

