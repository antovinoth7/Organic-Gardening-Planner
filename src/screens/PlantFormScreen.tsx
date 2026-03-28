import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import ThemedDropdown from "../components/ThemedDropdown";
import FloatingLabelInput from "../components/FloatingLabelInput";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getPlant,
  getAllPlants,
  createPlant,
  updatePlant,
  savePlantImage,
} from "../services/plants";
import { getFilenameFromUri } from "../lib/imageStorage";
import { syncCareTasksForPlant } from "../services/tasks";
import {
  SpaceType,
  Plant,
  PlantType,
  SunlightLevel,
  SoilType,
  WaterRequirement,
  HealthStatus,
  FertiliserType,
  PestDiseaseRecord,
  GrowthStage,
} from "../types/database.types";
import { Ionicons } from "@expo/vector-icons";
import {
  calculateExpectedHarvestDate,
  getDefaultHarvestSeason,
  getCompanionSuggestions,
  getIncompatiblePlants,
  getCoconutAgeInfo,
  CoconutAgeInfo,
} from "../utils/plantHelpers";
import {
  getPlantCareProfile,
  hasPlantCareProfile,
  getPruningTechniques,
} from "../utils/plantCareDefaults";
import { useTheme } from "../theme";
import { createStyles } from "../styles/plantFormStyles";
import CollapsibleSection from "../components/CollapsibleSection";
import PhotoSourceModal from "../components/PhotoSourceModal";
import DiscardChangesModal from "../components/DiscardChangesModal";
import PestDiseaseModal from "../components/PestDiseaseModal";
import { getLocationConfig } from "../services/locations";
import { usePlantFormData } from "../hooks/usePlantFormData";
import {
  sanitizeAlphaNumericSpaces,
  sanitizeLandmarkText,
} from "../utils/textSanitizer";
import { toLocalDateString, formatDateDisplay } from "../utils/dateHelpers";

const NOTES_MAX_LENGTH = 500;
type FormMode = "quick" | "advanced";
type FormSectionKey = "basic" | "location" | "care" | "health" | "harvest" | "coconut" | "notesHistory" | "pestDisease";
const sanitizeNumberText = (value: string) => value.replace(/[^0-9]/g, "");
/**
 * Builds the base portion of an auto-generated plant name.
 *
 * Rules (in order):
 * 1. Anti-redundancy: if the sub-variety name already contains the parent
 *    variety word (e.g. variety="Tall Coconut", plantVariety="Coconut"),
 *    use just the sub-variety — avoids "Coconut - Tall Coconut".
 * 2. For trees (fruit_tree / timber_tree / coconut_tree) with a planting
 *    date, append the two-digit year — primary disambiguator for a grove
 *    where you track multiple trees planted in different years.
 *    e.g. "Tall Coconut '95", "Dwarf Coconut '21"
 * 3. If a parentLocation is provided, append the configured short name
 *    (or a short location token as fallback).
 *    e.g. "Tomato (MNG)", "Tall Coconut '95 (VLH)"
 */
const buildGeneratedPlantNameBase = (
  plantType: PlantType | string,
  plantVariety: string,
  variety: string,
  plantingDate?: string,
  parentLocation?: string,
  locationShortName?: string,
): string => {
  const pv = plantVariety.trim();
  const v = variety.trim();
  if (!pv) return "";

  // 1. Build the plant-name portion, avoiding redundancy.
  let base: string;
  if (!v) {
    base = pv;
  } else if (v.toLowerCase().includes(pv.toLowerCase())) {
    // Sub-variety already contains parent word — use the sub-variety alone.
    base = v;
  } else {
    base = `${pv} - ${v}`;
  }

  // 2. For trees: append abbreviated planting year.
  const isTree = ["fruit_tree", "timber_tree", "coconut_tree"].includes(
    plantType as string,
  );
  if (isTree && plantingDate) {
    const d = new Date(plantingDate);
    if (!isNaN(d.getTime())) {
      base = `${base} '${String(d.getFullYear()).slice(2)}`;
    }
  }

  // 3. Append short location name (configured) or fallback to first word.
  const loc = parentLocation?.trim();
  if (loc) {
    const token = locationShortName?.trim() || loc.split(/\s+/)[0].slice(0, 10);
    if (token) base = `${base} (${token})`;
  }

  return base;
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isGeneratedPlantName = (value: string, baseName: string): boolean => {
  const normalizedValue = value.trim();
  const normalizedBase = baseName.trim();
  if (!normalizedValue || !normalizedBase) return false;
  const pattern = new RegExp(
    `^${escapeRegExp(normalizedBase)}(?: #(\\d+))?$`,
    "i",
  );
  return pattern.test(normalizedValue);
};

const buildGeneratedPlantName = (
  baseName: string,
  existingPlants: Plant[],
  currentPlantId?: string,
  currentGeneratedName?: string,
): string => {
  const normalizedBase = baseName.trim();
  if (!normalizedBase) return "";

  if (
    currentPlantId &&
    currentGeneratedName &&
    isGeneratedPlantName(currentGeneratedName, normalizedBase)
  ) {
    return currentGeneratedName;
  }

  const pattern = new RegExp(
    `^${escapeRegExp(normalizedBase)}(?: #(\\d+))?$`,
    "i",
  );
  let baseTaken = false;
  const usedSuffixes = new Set<number>();

  existingPlants.forEach((plant) => {
    if (plant.id === currentPlantId) return;
    const match = plant.name?.trim().match(pattern);
    if (!match) return;
    if (!match[1]) {
      baseTaken = true;
    } else {
      const suffix = parseInt(match[1], 10);
      if (!Number.isNaN(suffix)) usedSuffixes.add(suffix);
    }
  });

  if (!baseTaken) return normalizedBase;

  // Find the first available suffix starting at #2 (gap-filling).
  let next = 2;
  while (usedSuffixes.has(next)) next++;
  return `${normalizedBase} #${next}`;
};

export default function PlantFormScreen({ route, navigation }: any) {
  const { plantId } = route.params || {};
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isCompactScreen = screenWidth <= 380;

  const [name, setName] = useState("");
  const [loadedGeneratedName, setLoadedGeneratedName] = useState("");
  const [plantType, setPlantType] = useState<PlantType>("vegetable");
  const [plantVariety, setPlantVariety] = useState("");
  const [spaceType, setSpaceType] = useState<SpaceType>("ground");
  const [location, setLocation] = useState("");
  const [parentLocation, setParentLocation] = useState("");
  const [childLocation, setChildLocation] = useState("");
  const [landmarks, setLandmarks] = useState("");
  const [bedName, setBedName] = useState("");
  const [potSize, setPotSize] = useState("");
  const [variety, setVariety] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [harvestSeason, setHarvestSeason] = useState("");
  const [formMode, setFormMode] = useState<FormMode>("quick");
  const [customVarietyMode, setCustomVarietyMode] = useState(false);

  const {
    existingPlants,
    setExistingPlants,
    plantCareProfiles,
    careProfilesLoaded,
    locationShortNames,
    parentLocationOptions,
    childLocationOptions,
    specificPlantOptions,
    varietySuggestions,
    harvestSeasonOptions,
    basicFieldCount,
    locationFieldCount,
    harvestSectionFieldCount,
    notesHistoryFieldCount,
  } = usePlantFormData({
    plantType,
    plantVariety,
    parentLocation,
    childLocation,
    harvestSeason,
    formMode,
    customVarietyMode,
  });

  const [harvestStartDate, setHarvestStartDate] = useState("");
  const [harvestEndDate, setHarvestEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoFilename, setPhotoFilename] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPlantingDatePicker, setShowPlantingDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  // New fields
  const [sunlight, setSunlight] = useState<SunlightLevel>("full_sun");
  const [soilType, setSoilType] = useState<SoilType>("garden_soil");
  const [waterRequirement, setWaterRequirement] =
    useState<WaterRequirement>("medium");
  const [wateringFrequency, setWateringFrequency] = useState("");
  const [fertilisingFrequency, setFertilisingFrequency] = useState("");
  const [preferredFertiliser, setPreferredFertiliser] =
    useState<FertiliserType>("compost");
  const [mulchingUsed, setMulchingUsed] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("healthy");

  // New features
  const [expectedHarvestDate, setExpectedHarvestDate] = useState("");
  const [pestDiseaseHistory, setPestDiseaseHistory] = useState<
    PestDiseaseRecord[]
  >([]);
  const [showPestDiseaseModal, setShowPestDiseaseModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [sectionExpanded, setSectionExpanded] = useState<
    Record<FormSectionKey, boolean>
  >({
    basic: true,
    location: true,
    care: true,
    health: false,
    harvest: false,
    coconut: false,
    notesHistory: false,
    pestDisease: false,
  });
  const [autoApplyCareDefaults, setAutoApplyCareDefaults] = useState(true);
  const [currentPestDisease, setCurrentPestDisease] =
    useState<PestDiseaseRecord>({
      type: "pest",
      name: "",
      occurredAt: toLocalDateString(new Date()),
      severity: "medium",
      resolved: false,
    });
  const [editingPestIndex, setEditingPestIndex] = useState<number | null>(null);
  const [pestPhotoUri, setPestPhotoUri] = useState<string | null>(null);

  // PHASE 1: Growth Stage & Pruning
  const [growthStage, setGrowthStage] = useState<GrowthStage>("seedling");
  const [pruningFrequency, setPruningFrequency] = useState("");
  const [pruningNotes, setPruningNotes] = useState("");

  // Coconut-specific tracking (Kanyakumari)
  const [coconutFrondsCount, setCoconutFrondsCount] = useState("");
  const [nutsPerMonth, setNutsPerMonth] = useState("");
  const [lastClimbingDate, setLastClimbingDate] = useState("");
  const [showClimbingDatePicker, setShowClimbingDatePicker] = useState(false);
  const [spatheCount, setSpatheCount] = useState("");
  const [nutFallCount, setNutFallCount] = useState("");
  const [lastNutFallDate, setLastNutFallDate] = useState("");
  const [showNutFallDatePicker, setShowNutFallDatePicker] = useState(false);
  const [coconutAgeInfo, setCoconutAgeInfo] = useState<CoconutAgeInfo | null>(
    null,
  );

  // Track if form has been modified
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialDataLoaded = useRef(false);
  const isSaving = useRef(false);
  const isDiscarding = useRef(false);
  const autoSuggestApplied = useRef(false);

  // Refs for horizontal chip ScrollViews (auto-scroll to selected on edit)
  const categoryChipsRef = useRef<ScrollView>(null);
  const waterNeedsChipsRef = useRef<ScrollView>(null);
  const healthChipsRef = useRef<ScrollView>(null);
  const growthStageChipsRef = useRef<ScrollView>(null);

  const CATEGORY_OPTIONS = useMemo(() => [
    { label: "🥬 Vegetable", value: "vegetable" },
    { label: "🍇 Fruit", value: "fruit_tree" },
    { label: "🥥 Coconut", value: "coconut_tree" },
    { label: "🌿 Herb", value: "herb" },
    { label: "🌲 Timber", value: "timber_tree" },
    { label: "🌸 Flower", value: "flower" },
    { label: "🌱 Shrub", value: "shrub" },
  ], []);

  const WATER_NEEDS_OPTIONS = useMemo(() => [
    { label: "Low", value: "low", drops: 1 },
    { label: "Medium", value: "medium", drops: 2 },
    { label: "High", value: "high", drops: 3 },
  ] as const, []);

  const HEALTH_OPTIONS = useMemo(() => [
    { label: "✅ Healthy", value: "healthy" },
    { label: "⚠️ Stressed", value: "stressed" },
    { label: "🔄 Recovering", value: "recovering" },
    { label: "❌ Sick", value: "sick" },
  ], []);

  const GROWTH_STAGE_OPTIONS = useMemo(() => [
    { label: "🌱 Seedling", value: "seedling" },
    { label: "🌿 Vegetative", value: "vegetative" },
    { label: "🌸 Flowering", value: "flowering" },
    { label: "🍎 Fruiting", value: "fruiting" },
    { label: "🌳 Mature", value: "mature" },
    { label: "💤 Dormant", value: "dormant" },
  ], []);

  // Estimated chip width (paddingH 14*2 + ~60 text + gap 8) ≈ 100px per chip
  const scrollChipsToIndex = useCallback((ref: React.RefObject<ScrollView | null>, index: number) => {
    if (index > 0) {
      // Each chip ≈ 100px wide + 8px gap
      const offset = Math.max(0, index * 108 - 40);
      setTimeout(() => {
        ref.current?.scrollTo({ x: offset, animated: false });
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (plantId) {
      setFormMode("advanced");
      loadPlant();
    } else {
      // For new plants, mark as loaded after delay to allow auto-suggest
      const timeoutId = setTimeout(() => {
        initialDataLoaded.current = true;
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [plantId]);

  const setSectionExpandedState = (
    section: FormSectionKey,
    expanded: boolean,
  ) => {
    setSectionExpanded((prev) => ({ ...prev, [section]: expanded }));
  };

  const getValidationErrors = React.useCallback(() => {
    const errors: Record<FormSectionKey, string[]> = {
      basic: [],
      location: [],
      care: [],
      health: [],
      harvest: [],
      coconut: [],
      notesHistory: [],
      pestDisease: [],
    };

    if (!plantVariety.trim()) {
      errors.basic.push("Please select a specific plant type");
    }

    if (!parentLocation.trim()) {
      errors.location.push("Please select a main location");
    }

    if (!childLocation.trim()) {
      errors.location.push("Please select a direction/section");
    }

    if (
      !wateringFrequency.trim() ||
      Number.isNaN(parseInt(wateringFrequency, 10)) ||
      parseInt(wateringFrequency, 10) < 1
    ) {
      errors.care.push(
        "Please enter a valid watering frequency (number of days)",
      );
    }

    if (
      !fertilisingFrequency.trim() ||
      Number.isNaN(parseInt(fertilisingFrequency, 10)) ||
      parseInt(fertilisingFrequency, 10) < 1
    ) {
      errors.care.push(
        "Please enter a valid fertilising frequency (number of days)",
      );
    }

    if (notes.length > NOTES_MAX_LENGTH) {
      errors.notesHistory.push(
        `Notes must be ${NOTES_MAX_LENGTH} characters or less`,
      );
    }

    return errors;
  }, [
    plantVariety,
    parentLocation,
    childLocation,
    wateringFrequency,
    fertilisingFrequency,
    notes,
  ]);

  const validationErrors = React.useMemo(
    () => getValidationErrors(),
    [getValidationErrors],
  );

  // Detect form changes
  useEffect(() => {
    if (initialDataLoaded.current) {
      setHasUnsavedChanges(true);
    }
  }, [
    name,
    plantType,
    plantVariety,
    spaceType,
    location,
    parentLocation,
    childLocation,
    landmarks,
    bedName,
    potSize,
    variety,
    plantingDate,
    harvestSeason,
    harvestStartDate,
    harvestEndDate,
    notes,
    photoUri,
    sunlight,
    soilType,
    waterRequirement,
    wateringFrequency,
    fertilisingFrequency,
    preferredFertiliser,
    mulchingUsed,
    healthStatus,
    expectedHarvestDate,
    pestDiseaseHistory,
    growthStage,
    pruningFrequency,
    pruningNotes,
    coconutFrondsCount,
    nutsPerMonth,
    lastClimbingDate,
  ]);

  // Auto-calculate expected harvest date when plant variety or planting date changes
  useEffect(() => {
    if (plantVariety && plantingDate) {
      const calculatedDate = calculateExpectedHarvestDate(
        plantVariety,
        plantingDate,
        plantType,
      );
      if (calculatedDate) {
        setExpectedHarvestDate(calculatedDate);
      }
    }
  }, [plantVariety, plantingDate, plantType]);

  // Auto-apply care defaults based on coconut tree age from planting date
  useEffect(() => {
    if (plantType === "coconut_tree" && plantingDate) {
      const info = getCoconutAgeInfo(plantingDate);
      setCoconutAgeInfo(info);
      // On new plant only: auto-apply stage, watering, fertilising from age
      if (info && !plantId) {
        setGrowthStage(info.growthStage);
        setWateringFrequency(info.wateringFrequencyDays.toString());
        setFertilisingFrequency(info.fertilisingFrequencyDays.toString());
        setPruningFrequency(info.pruningFrequencyDays.toString());
      }
    } else {
      setCoconutAgeInfo(null);
    }
  }, [plantType, plantingDate, plantId]);

  // Reset auto-suggest flag when plant variety changes
  useEffect(() => {
    autoSuggestApplied.current = false;
    setCustomVarietyMode(false);
  }, [plantVariety]);

  const generatedPlantNameBase = React.useMemo(
    () =>
      buildGeneratedPlantNameBase(
        plantType,
        plantVariety,
        variety,
        plantingDate,
        parentLocation,
        locationShortNames[parentLocation],
      ),
    [plantType, plantVariety, variety, plantingDate, parentLocation, locationShortNames],
  );

  const generatedPlantName = React.useMemo(
    () =>
      buildGeneratedPlantName(
        generatedPlantNameBase,
        existingPlants,
        plantId,
        loadedGeneratedName,
      ),
    [existingPlants, generatedPlantNameBase, loadedGeneratedName, plantId],
  );

  // AUTO-SUGGEST: Apply smart defaults when plant variety is selected
  useEffect(() => {
    if (
      !plantId &&
      plantVariety &&
      autoApplyCareDefaults &&
      careProfilesLoaded &&
      hasPlantCareProfile(plantVariety, plantType, plantCareProfiles) &&
      !autoSuggestApplied.current
    ) {
      console.log("🌱 Applying auto-suggestions for:", plantVariety);
      const profile = getPlantCareProfile(
        plantVariety,
        plantType,
        plantCareProfiles,
      );

      if (profile) {
        autoSuggestApplied.current = true;

        // Apply ALL fields unconditionally
        setWateringFrequency(profile.wateringFrequencyDays.toString());
        setFertilisingFrequency(profile.fertilisingFrequencyDays.toString());
        if (profile.pruningFrequencyDays) {
          setPruningFrequency(profile.pruningFrequencyDays.toString());
        }

        // Apply basic care settings
        setSunlight(profile.sunlight);
        setSoilType(profile.soilType);
        setWaterRequirement(profile.waterRequirement);
        setPreferredFertiliser(profile.preferredFertiliser);

        // Phase 1: Growth
        setGrowthStage(profile.initialGrowthStage);

        const defaultHarvestSeason = getDefaultHarvestSeason(
          plantVariety,
          plantType,
        );
        if (defaultHarvestSeason) {
          setHarvestSeason(defaultHarvestSeason);
        }
      }
    }
  }, [
    plantVariety,
    plantId,
    plantType,
    autoApplyCareDefaults,
    careProfilesLoaded,
    plantCareProfiles,
  ]);

  // Combine parent and child locations
  useEffect(() => {
    if (parentLocation && childLocation) {
      setLocation(`${parentLocation} - ${childLocation}`);
    } else {
      setLocation("");
    }
  }, [parentLocation, childLocation]);

  useEffect(() => {
    if (formMode === "quick") {
      setSectionExpanded((prev) => ({
        ...prev,
        basic: true,
        location: true,
        care: true,
        health: false,
        harvest: false,
        coconut: false,
        notesHistory: false,
      }));
    }
  }, [formMode]);

  const pestDiseaseFieldCount = React.useMemo(() => {
    return Math.max(1, pestDiseaseHistory.length);
  }, [pestDiseaseHistory.length]);

  // Form completion progress — derived from section field counts, checks actual values
  const formProgress = React.useMemo(() => {
    const careFieldCount = formMode === "quick" ? 2 : 9;

    // Total uses the same field counts shown in section headers
    let total = basicFieldCount + locationFieldCount + careFieldCount;
    if (formMode === "advanced") {
      total += 2; // Health section (fieldCount={2})
      total += harvestSectionFieldCount;
      total += notesHistoryFieldCount;
      total += pestDiseaseFieldCount;
      if (plantType === "coconut_tree") {
        total += 3; // Coconut section (fieldCount={3})
      }
    }

    // Dynamically check each field's actual value
    let filled = 0;

    // — Basic Information —
    if (photoUri) filled += 1;
    if (name || plantVariety) filled += 1; // display name auto-generates from variety
    if (plantType) filled += 1;
    if (plantVariety) filled += 1;
    if (formMode === "advanced") {
      if (customVarietyMode || variety) filled += 1; // variety chip selection
      if (plantingDate) filled += 1;
      if (varietySuggestions.length > 0 && customVarietyMode && variety) {
        filled += 1; // custom variety text input
      }
    }

    // — Location & Placement —
    if (parentLocation) filled += 1;
    if (parentLocation && childLocation) filled += 1; // only visible when parent is set
    if (formMode === "advanced" && landmarks) filled += 1;

    // — Care & Schedule —
    if (wateringFrequency) filled += 1;
    if (fertilisingFrequency) filled += 1;
    if (formMode === "advanced") {
      if (sunlight) filled += 1;
      if (waterRequirement) filled += 1;
      if (soilType) filled += 1;
      if (preferredFertiliser) filled += 1;
      if (typeof mulchingUsed === "boolean") filled += 1; // toggle always has a value
      if (pruningFrequency) filled += 1;
      if (pruningNotes) filled += 1;
    }

    if (formMode === "advanced") {
      // — Plant Health —
      if (healthStatus) filled += 1;
      if (growthStage) filled += 1;

      // — Harvest —
      if (harvestSeason) filled += 1;
      if (expectedHarvestDate) filled += 1;
      if (plantType === "fruit_tree") {
        if (harvestStartDate) filled += 1;
        if (harvestEndDate) filled += 1;
      }

      // — Notes & History —
      if (notes) filled += 1;

      // — Pest & Disease —
      filled += pestDiseaseHistory.length; // each record counts as filled

      // — Coconut Tracking —
      if (plantType === "coconut_tree") {
        if (coconutFrondsCount) filled += 1;
        if (nutsPerMonth) filled += 1;
        if (lastClimbingDate) filled += 1;
      }
    }

    return { filled, total, percent: total > 0 ? Math.round((filled / total) * 100) : 0 };
  }, [
    basicFieldCount, locationFieldCount, harvestSectionFieldCount,
    notesHistoryFieldCount, pestDiseaseFieldCount, formMode, plantType,
    photoUri, name, plantVariety, variety, customVarietyMode,
    varietySuggestions.length, plantingDate,
    parentLocation, childLocation, landmarks,
    wateringFrequency, fertilisingFrequency, sunlight, waterRequirement,
    soilType, preferredFertiliser, mulchingUsed, pruningFrequency, pruningNotes,
    healthStatus, growthStage,
    harvestSeason, expectedHarvestDate, harvestStartDate, harvestEndDate,
    notes, pestDiseaseHistory.length,
    coconutFrondsCount, nutsPerMonth, lastClimbingDate,
  ]);

  // Handle back button press
  useEffect(() => {
    const backAction = () => {
      if (hasUnsavedChanges && !isSaving.current) {
        handleBackPress();
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    // Handle navigation back button
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
      if (!hasUnsavedChanges || isSaving.current || isDiscarding.current) {
        return;
      }

      e.preventDefault();
      handleBackPress();
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, [hasUnsavedChanges, navigation]);

  const handleBackPress = () => {
    if (isSaving.current) {
      return; // Don't show alert if save is in progress
    }
    setShowDiscardModal(true);
  };

  const loadPlant = async () => {
    try {
      const plant = await getPlant(plantId);
      if (plant) {
        // Load short names for name detection
        let loadedShortNames = locationShortNames;
        if (Object.keys(loadedShortNames).length === 0) {
          try {
            const config = await getLocationConfig();
            loadedShortNames = config.parentLocationShortNames ?? {};
          } catch {}
        }

        // Derive the parent location from the stored composite location string.
        const locationParts = plant.location?.split(" - ") || [];
        const existingParentLoc =
          locationParts.length >= 1 ? locationParts[0] : "";

        // Try to recognise the saved name as auto-generated using the NEW rich
        // base (includes year + location token). If that fails, also try the
        // OLD simple base (plant variety only) for backward compatibility with
        // plants saved before this naming logic was introduced.
        const richBase = buildGeneratedPlantNameBase(
          plant.plant_type,
          plant.plant_variety || "",
          plant.variety || "",
          plant.planting_date || undefined,
          existingParentLoc || undefined,
          loadedShortNames[existingParentLoc] || undefined,
        );
        // Also try with no short name (old style first-word token) for backward compat
        const richBaseOld = buildGeneratedPlantNameBase(
          plant.plant_type,
          plant.plant_variety || "",
          plant.variety || "",
          plant.planting_date || undefined,
          existingParentLoc || undefined,
          undefined,
        );
        const simpleBase = buildGeneratedPlantNameBase(
          plant.plant_type,
          plant.plant_variety || "",
          plant.variety || "",
        );
        const generatedName = isGeneratedPlantName(plant.name, richBase)
          ? plant.name
          : isGeneratedPlantName(plant.name, richBaseOld)
            ? plant.name
            : isGeneratedPlantName(plant.name, simpleBase)
              ? plant.name
              : "";

        setName(generatedName ? "" : plant.name);
        setLoadedGeneratedName(generatedName);
        setPlantType(plant.plant_type);
        setPlantVariety(plant.plant_variety || "");
        setSpaceType(plant.space_type);
        setLocation(plant.location);

        // Parse location into parent and child
        if (locationParts.length === 2) {
          setParentLocation(locationParts[0]);
          setChildLocation(locationParts[1]);
        } else if (locationParts.length === 1 && locationParts[0]) {
          setParentLocation(locationParts[0]);
          setChildLocation("");
        } else {
          setParentLocation("");
          setChildLocation("");
        }

        setBedName(plant.bed_name || "");
        setPotSize(plant.pot_size || "");
        setVariety(plant.variety || "");
        setCustomVarietyMode(false);
        setLandmarks(plant.landmarks || "");
        setPlantingDate(plant.planting_date || "");
        setHarvestSeason(plant.harvest_season || "");
        setHarvestStartDate(plant.harvest_start_date || "");
        setHarvestEndDate(plant.harvest_end_date || "");
        setNotes(plant.notes || "");
        setPhotoUri(plant.photo_url);
        setPhotoFilename(
          plant.photo_filename ?? getFilenameFromUri(plant.photo_url ?? ""),
        );
        // Load new fields
        setSunlight(plant.sunlight || "full_sun");
        setSoilType(plant.soil_type || "potting_mix");
        setWaterRequirement(plant.water_requirement || "medium");
        setWateringFrequency(plant.watering_frequency_days?.toString() || "3");
        setFertilisingFrequency(
          plant.fertilising_frequency_days?.toString() || "14",
        );
        setPreferredFertiliser(plant.preferred_fertiliser || "compost");
        setMulchingUsed(plant.mulching_used || false);
        setHealthStatus(plant.health_status || "healthy");

        // Load expected harvest & pest history
        setExpectedHarvestDate(plant.expected_harvest_date || "");
        setPestDiseaseHistory(plant.pest_disease_history || []);

        // Load Phase 1 fields
        setGrowthStage(plant.growth_stage || "seedling");
        setPruningFrequency(plant.pruning_frequency_days?.toString() || "");
        setPruningNotes(plant.pruning_notes || "");

        // Load coconut tracking fields
        setCoconutFrondsCount(plant.coconut_fronds_count?.toString() || "");
        setNutsPerMonth(plant.nuts_per_month?.toString() || "");
        setLastClimbingDate(plant.last_climbing_date || "");
        setSpatheCount(plant.spathe_count_per_month?.toString() || "");
        setNutFallCount(plant.nut_fall_count?.toString() || "");
        setLastNutFallDate(plant.last_nut_fall_date || "");

        // Auto-expand advanced sections that already have data
        if (formMode === "advanced") {
          setSectionExpanded((prev) => ({
            ...prev,
            health:
              prev.health ||
              (plant.health_status !== undefined &&
                plant.health_status !== "healthy"),
            notesHistory:
              prev.notesHistory ||
              !!plant.notes ||
              (plant.pest_disease_history?.length ?? 0) > 0,
          }));
        }

        // Mark initial data as loaded
        setTimeout(() => {
          initialDataLoaded.current = true;
        }, 500);

        // Auto-scroll horizontal chip rows to show the selected value
        const catIdx = CATEGORY_OPTIONS.findIndex(c => c.value === plant.plant_type);
        scrollChipsToIndex(categoryChipsRef, catIdx);

        const waterIdx = WATER_NEEDS_OPTIONS.findIndex(w => w.value === (plant.water_requirement || "medium"));
        scrollChipsToIndex(waterNeedsChipsRef, waterIdx);

        const healthIdx = HEALTH_OPTIONS.findIndex(h => h.value === (plant.health_status || "healthy"));
        scrollChipsToIndex(healthChipsRef, healthIdx);

        const growthIdx = GROWTH_STAGE_OPTIONS.findIndex(g => g.value === (plant.growth_stage || "seedling"));
        scrollChipsToIndex(growthStageChipsRef, growthIdx);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const openImageLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: Platform.OS === "ios",
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setPhotoFilename(null);
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your camera");
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing: false,
        quality: 0.8,
        cameraType: ImagePicker.CameraType.back,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
        setPhotoFilename(null);
      }
    } catch (error) {
      console.warn("Camera launch failed:", error);
      Alert.alert("Camera Error", "Failed to open camera. Please try again.");
    }
  };

  const pickImage = () => {
    setShowPhotoSourceModal(true);
  };

  const handleSave = async () => {
    setShowValidationErrors(true);
    const sectionOrder: FormSectionKey[] = [
      "basic",
      "location",
      "care",
      "health",
      "harvest",
      "coconut",
      "notesHistory",
    ];
    const firstErrorSection = sectionOrder.find(
      (section) => validationErrors[section].length > 0,
    );
    if (firstErrorSection) {
      if (["harvest", "health", "notesHistory"].includes(firstErrorSection) && formMode === "quick") {
        setFormMode("advanced");
      }
      setSectionExpandedState(firstErrorSection, true);
      Alert.alert("Validation Error", validationErrors[firstErrorSection][0]);
      return;
    }

    if (loading || isSaving.current) {
      return; // Prevent multiple saves
    }

    setLoading(true);
    isSaving.current = true;
    setHasUnsavedChanges(false); // Clear flag immediately to prevent navigation alert
    try {
      const nickname = name.trim();
      let resolvedPhotoFilename = photoFilename;
      const combinedLocation = `${parentLocation.trim()} - ${childLocation.trim()}`;
      const shouldUseLoadedPlants =
        Boolean(nickname) || existingPlants.length > 0;
      const plantsForNaming = shouldUseLoadedPlants
        ? existingPlants
        : await getAllPlants();
      const finalPlantName =
        nickname ||
        buildGeneratedPlantName(
          generatedPlantNameBase,
          plantsForNaming,
          plantId,
          loadedGeneratedName,
        );

      // Save new photo if needed
      if (photoUri) {
        if (!resolvedPhotoFilename) {
          const saved = await savePlantImage(photoUri);
          resolvedPhotoFilename =
            saved.filename ?? getFilenameFromUri(saved.uri);
        }
      } else {
        resolvedPhotoFilename = null;
      }

      const plantData: any = {
        name: finalPlantName,
        plant_type: plantType,
        plant_variety: plantVariety.trim() || null,
        space_type: spaceType,
        location: combinedLocation,
        bed_name: spaceType === "bed" ? bedName.trim() || null : null,
        pot_size:
          spaceType === "pot" ? sanitizeNumberText(potSize) || null : null,
        variety: variety.trim() || null,
        landmarks: landmarks.trim() || null,
        planting_date: plantingDate.trim() || null,
        harvest_season: harvestSeason.trim() || null,
        notes: notes.trim() || null,
        photo_filename: resolvedPhotoFilename ?? null,
        // New care fields
        sunlight: sunlight,
        soil_type: soilType,
        water_requirement: waterRequirement,
        watering_frequency_days: parseInt(wateringFrequency, 10) || null,
        fertilising_frequency_days: parseInt(fertilisingFrequency, 10) || null,
        preferred_fertiliser: preferredFertiliser,
        mulching_used: mulchingUsed,
        health_status: healthStatus,
        // Pest history and expected harvest info
        expected_harvest_date: expectedHarvestDate || null,
        pest_disease_history:
          pestDiseaseHistory.length > 0 ? pestDiseaseHistory : null,
        // Phase 1: Growth & Pruning
        growth_stage: growthStage,
        pruning_frequency_days: pruningFrequency
          ? parseInt(pruningFrequency, 10)
          : null,
        pruning_notes: pruningNotes.trim() || null,
      };

      // Add harvest dates only for fruit trees
      if (plantType === "fruit_tree") {
        plantData.harvest_start_date = harvestStartDate.trim() || null;
        plantData.harvest_end_date = harvestEndDate.trim() || null;
      }

      // Add coconut tracking fields only for coconut trees
      if (plantType === "coconut_tree") {
        plantData.coconut_fronds_count = coconutFrondsCount
          ? parseInt(coconutFrondsCount, 10)
          : null;
        plantData.nuts_per_month = nutsPerMonth
          ? parseInt(nutsPerMonth, 10)
          : null;
        plantData.last_climbing_date = lastClimbingDate || null;
        plantData.spathe_count_per_month = spatheCount
          ? parseInt(spatheCount, 10)
          : null;
        plantData.nut_fall_count = nutFallCount
          ? parseInt(nutFallCount, 10)
          : null;
        plantData.last_nut_fall_date = lastNutFallDate || null;
      }

      const savedPlant = plantId
        ? await updatePlant(plantId, plantData)
        : await createPlant(plantData);

      setLoadedGeneratedName(nickname ? "" : finalPlantName);
      setExistingPlants((prev) => {
        const nextPlants = prev.filter((plant) => plant.id !== savedPlant.id);
        return [...nextPlants, savedPlant];
      });

      try {
        await syncCareTasksForPlant(savedPlant);
      } catch (error) {
        console.warn("Failed to sync care tasks for plant:", error);
      }

      // Trigger refresh in parent screens by setting a navigation param
      navigation.navigate({
        name: "PlantsList",
        params: { refresh: Date.now() },
        merge: true,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
      setHasUnsavedChanges(true); // Restore flag on error
    } finally {
      setLoading(false);
      isSaving.current = false;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>
            {plantId ? "Edit Plant" : "Add Plant"}
          </Text>
          {hasUnsavedChanges && <View style={styles.unsavedDot} />}
        </View>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
          <Text style={[styles.saveText, loading && styles.saveTextDisabled]}>
            {loading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity
            style={[
              styles.modeToggleButton,
              formMode === "quick" && styles.modeToggleButtonActive,
            ]}
            onPress={() => setFormMode("quick")}
          >
            <Text
              style={[
                styles.modeToggleText,
                formMode === "quick" && styles.modeToggleTextActive,
              ]}
            >
              Quick Add
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeToggleButton,
              formMode === "advanced" && styles.modeToggleButtonActive,
            ]}
            onPress={() => setFormMode("advanced")}
          >
            <Text
              style={[
                styles.modeToggleText,
                formMode === "advanced" && styles.modeToggleTextActive,
              ]}
            >
              Advanced
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${formProgress.percent}%`,
                  backgroundColor:
                    formProgress.percent === 100
                      ? "#4CAF50"
                      : theme.primary,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {formProgress.filled} of {formProgress.total} fields filled
          </Text>
        </View>

        <CollapsibleSection
          title="Basic Information"
          icon="information-circle"
          fieldCount={basicFieldCount}
          defaultExpanded={true}
          expanded={sectionExpanded.basic}
          onExpandedChange={(expanded) =>
            setSectionExpandedState("basic", expanded)
          }
          hasError={showValidationErrors && validationErrors.basic.length > 0}
        >
          <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={styles.photo}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={32} color="#999" />
                <Text style={styles.photoText}>Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.fieldGroupLabel}>Plant Category *</Text>
          <ScrollView
            ref={categoryChipsRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryChipsScroll}
            contentContainerStyle={styles.categoryChipsContent}
          >
            {CATEGORY_OPTIONS.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.categoryChip,
                  plantType === cat.value && styles.categoryChipActive,
                ]}
                onPress={() => {
                  setPlantType(cat.value as PlantType);
                  setPlantVariety("");
                  setVariety("");
                  setCustomVarietyMode(false);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    plantType === cat.value && styles.categoryChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ThemedDropdown
            items={[
              { label: "Select plant type", value: "" },
              ...(specificPlantOptions.length === 0
                ? [{ label: "No plants yet - add in More", value: "" }]
                : specificPlantOptions.map((v) => ({ label: v, value: v }))),
            ]}
            selectedValue={plantVariety}
            onValueChange={setPlantVariety}
            label="Specific Plant *"
            placeholder="Specific Plant"
            enabled={!!plantType}
            searchable
          />

          {formMode === "advanced" &&
            (varietySuggestions.length > 0 ? (
              <>
                <ThemedDropdown
                  items={[
                    { label: "Select variety (optional)", value: "" },
                    ...varietySuggestions.map((s) => ({ label: s, value: s })),
                    { label: "Other (enter manually)", value: "__custom__" },
                  ]}
                  selectedValue={customVarietyMode ? "__custom__" : variety}
                  onValueChange={(value) => {
                    if (value === "__custom__") {
                      setCustomVarietyMode(true);
                      setVariety("");
                      return;
                    }
                    setCustomVarietyMode(false);
                    setVariety(value);
                  }}
                  label="Variety"
                  placeholder="Variety"
                  enabled={varietySuggestions.length > 0}
                  searchable
                />
                {customVarietyMode && (
                  <FloatingLabelInput
                    label="Enter custom variety"
                    value={variety}
                    onChangeText={(text) =>
                      setVariety(sanitizeAlphaNumericSpaces(text))
                    }
                  />
                )}
              </>
            ) : (
              <FloatingLabelInput
                label="Variety (e.g., Alphonso, Dwarf)"
                value={variety}
                onChangeText={(text) =>
                  setVariety(sanitizeAlphaNumericSpaces(text))
                }
              />
            ))}

          <View style={styles.displayNameCard}>
            <View style={styles.displayNameHeader}>
              <View style={styles.displayNameLabelRow}>
                <Ionicons name="pricetag-outline" size={16} color={theme.textTertiary} />
                <Text style={styles.displayNameLabel}>Display Name</Text>
              </View>
              {!name.trim() && (
                <View style={styles.autoGenBadge}>
                  <Ionicons name="sparkles" size={12} color={theme.primary} />
                  <Text style={styles.autoGenBadgeText}>Auto</Text>
                </View>
              )}
            </View>
            <View style={styles.nicknameInputWrapper}>
              <TextInput
                style={styles.nicknameInput}
                placeholder={
                  generatedPlantName || "Auto-generated from plant type"
                }
                value={name}
                onChangeText={(text) => setName(sanitizeAlphaNumericSpaces(text))}
                placeholderTextColor={theme.inputPlaceholder}
              />
              {name.trim().length > 0 && (
                <TouchableOpacity
                  onPress={() => setName("")}
                  style={styles.nicknameClearButton}
                  accessibilityLabel="Reset to auto-generated name"
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.displayNameHelper}>
              {name.trim()
                ? `Auto-generated: "${generatedPlantName || "pending selection"}"`
                : "Auto-generated from plant type and location. Tap to customise."}
            </Text>
          </View>

          {formMode === "advanced" && (
            <>
              <View style={styles.fieldGroupDivider} />
              <View style={styles.dateCard}>
                <TouchableOpacity
                  style={styles.dateCardTouchable}
                  onPress={() => setShowPlantingDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dateCardIconWrap}>
                    <Ionicons name="calendar" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.dateCardContent}>
                    <Text style={styles.dateCardLabel}>Planting Date</Text>
                    <Text
                      style={
                        plantingDate ? styles.dateCardValue : styles.dateCardPlaceholder
                      }
                    >
                      {plantingDate ? formatDateDisplay(plantingDate) : "Tap to select date"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
                </TouchableOpacity>
              </View>
              {showPlantingDatePicker && (
                <DateTimePicker
                  value={plantingDate ? new Date(plantingDate) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    setShowPlantingDatePicker(Platform.OS === "ios");
                    if (selectedDate) {
                      setPlantingDate(toLocalDateString(selectedDate));
                    }
                  }}
                />
              )}
            </>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Location & Placement"
          icon="location"
          fieldCount={locationFieldCount}
          defaultExpanded={true}
          expanded={sectionExpanded.location}
          onExpandedChange={(expanded) =>
            setSectionExpandedState("location", expanded)
          }
          hasError={showValidationErrors && validationErrors.location.length > 0}
        >
          <Text style={styles.fieldGroupLabel}>Location *</Text>

          <ThemedDropdown
            items={[
              { label: "Select Main Location", value: "" },
              ...parentLocationOptions.map((loc) => ({ label: loc, value: loc })),
            ]}
            selectedValue={parentLocation}
            onValueChange={(value) => {
              setParentLocation(value);
              if (!value) setChildLocation("");
            }}
            placeholder="Location"
          />

          {parentLocation !== "" && (
            <>
              <Text style={styles.fieldGroupLabel}>Direction / Section *</Text>
              <View style={styles.directionChipsContainer}>
                {childLocationOptions.map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[
                      styles.directionChip,
                      childLocation === loc && styles.directionChipActive,
                    ]}
                    onPress={() => setChildLocation(loc)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="compass-outline"
                      size={14}
                      color={
                        childLocation === loc
                          ? theme.primary
                          : theme.textTertiary
                      }
                    />
                    <Text
                      style={[
                        styles.directionChipText,
                        childLocation === loc &&
                          styles.directionChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {location && (
            <View style={styles.locationPreview}>
              <Ionicons name="location" size={16} color={theme.primary} />
              <Text style={styles.locationPreviewText}>{location}</Text>
            </View>
          )}

          {formMode === "advanced" && (
            <>
              <FloatingLabelInput
                label="Nearby landmark or reference point"
                value={landmarks}
                onChangeText={(text) =>
                  setLandmarks(sanitizeLandmarkText(text))
                }
              />

              <View style={styles.fieldGroupDivider} />
              <Text style={styles.fieldGroupLabel}>🪴 Growing Space</Text>

              <View
                style={[
                  styles.spaceTypeContainer,
                  isCompactScreen && styles.spaceTypeContainerCompact,
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.spaceTypeButton,
                    isCompactScreen && styles.spaceTypeButtonCompact,
                    spaceType === "ground" && styles.spaceTypeActive,
                  ]}
                  onPress={() => setSpaceType("ground")}
                >
                  <Ionicons
                    name="earth"
                    size={isCompactScreen ? 18 : 20}
                    color={spaceType === "ground" ? "#2e7d32" : "#999"}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.spaceTypeText,
                      isCompactScreen && styles.spaceTypeTextCompact,
                      spaceType === "ground" && styles.spaceTypeTextActive,
                    ]}
                  >
                    Ground
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.spaceTypeButton,
                    isCompactScreen && styles.spaceTypeButtonCompact,
                    spaceType === "bed" && styles.spaceTypeActive,
                  ]}
                  onPress={() => setSpaceType("bed")}
                >
                  <Ionicons
                    name="apps"
                    size={isCompactScreen ? 18 : 20}
                    color={spaceType === "bed" ? "#2e7d32" : "#999"}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.spaceTypeText,
                      isCompactScreen && styles.spaceTypeTextCompact,
                      spaceType === "bed" && styles.spaceTypeTextActive,
                    ]}
                  >
                    Bed
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.spaceTypeButton,
                    isCompactScreen && styles.spaceTypeButtonCompact,
                    spaceType === "pot" && styles.spaceTypeActive,
                  ]}
                  onPress={() => setSpaceType("pot")}
                >
                  <Ionicons
                    name="cube-outline"
                    size={isCompactScreen ? 18 : 20}
                    color={spaceType === "pot" ? "#2e7d32" : "#999"}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.spaceTypeText,
                      isCompactScreen && styles.spaceTypeTextCompact,
                      spaceType === "pot" && styles.spaceTypeTextActive,
                    ]}
                  >
                    Pot
                  </Text>
                </TouchableOpacity>
              </View>

              {spaceType === "pot" && (
                <FloatingLabelInput
                  label="Pot Size in inches (e.g., 12)"
                  value={potSize}
                  onChangeText={(text) => setPotSize(sanitizeNumberText(text))}
                  keyboardType="numeric"
                />
              )}
              {spaceType === "bed" && (
                <FloatingLabelInput
                  label="Bed Name (e.g., Veggie Bed 1)"
                  value={bedName}
                  onChangeText={(text) =>
                    setBedName(sanitizeAlphaNumericSpaces(text))
                  }
                />
              )}
            </>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Care & Schedule"
          icon="leaf"
          fieldCount={formMode === "quick" ? 2 : 9}
          defaultExpanded={false}
          expanded={sectionExpanded.care}
          onExpandedChange={(expanded) =>
            setSectionExpandedState("care", expanded)
          }
          hasError={showValidationErrors && validationErrors.care.length > 0}
        >
          {!plantId && (
            <>
              <TouchableOpacity
                style={[
                  styles.smartDefaultsToggle,
                  autoApplyCareDefaults && styles.smartDefaultsToggleActive,
                ]}
                onPress={() => setAutoApplyCareDefaults(!autoApplyCareDefaults)}
                activeOpacity={0.85}
                accessibilityRole="switch"
                accessibilityState={{ checked: autoApplyCareDefaults }}
              >
                <View style={styles.smartDefaultsLeft}>
                  <View
                    style={[
                      styles.smartDefaultsIconWrap,
                      autoApplyCareDefaults &&
                        styles.smartDefaultsIconWrapActive,
                    ]}
                  >
                    <Ionicons
                      name={autoApplyCareDefaults ? "sparkles" : "leaf-outline"}
                      size={18}
                      color={
                        autoApplyCareDefaults
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.smartDefaultsLabel,
                      isCompactScreen && styles.smartDefaultsLabelCompact,
                      autoApplyCareDefaults && styles.smartDefaultsLabelActive,
                    ]}
                    numberOfLines={2}
                  >
                    Apply smart care 
                  </Text>
                </View>
                <View
                  style={[
                    styles.smartDefaultsSwitchTrack,
                    autoApplyCareDefaults &&
                      styles.smartDefaultsSwitchTrackActive,
                  ]}
                >
                  <View
                    style={[
                      styles.smartDefaultsSwitchThumb,
                      autoApplyCareDefaults &&
                        styles.smartDefaultsSwitchThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
              <Text style={styles.helperText}>
                Auto-fills watering, fertilising, pruning, and sunlight
                settings.
              </Text>
            </>
          )}
          {formMode === "advanced" && (
            <>
              <Text style={styles.fieldGroupLabel}>☀️ Sunlight</Text>
              <View style={styles.directionChipsContainer}>
                {[
                  { label: "☀️ Full Sun", value: "full_sun" },
                  { label: "⛅ Partial", value: "partial_sun" },
                  { label: "🌤️ Shade", value: "shade" },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.directionChip,
                      sunlight === opt.value && styles.directionChipActive,
                    ]}
                    onPress={() => setSunlight(opt.value as SunlightLevel)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.directionChipText,
                        sunlight === opt.value && styles.directionChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {sunlight === "full_sun" && (
                <Text style={styles.helperText}>6+ hours of direct sunlight per day.</Text>
              )}
              {sunlight === "partial_sun" && (
                <Text style={styles.helperText}>3–6 hours of direct sunlight per day.</Text>
              )}
              {sunlight === "shade" && (
                <Text style={styles.helperText}>Less than 3 hours of direct sunlight per day.</Text>
              )}

              <Text style={styles.fieldGroupLabel}>🟤 Soil Type</Text>
              <ThemedDropdown
                items={[
                  { label: "Garden Soil", value: "garden_soil" },
                  { label: "Potting Mix", value: "potting_mix" },
                  { label: "Coco Peat Mix", value: "coco_peat" },
                  { label: "Red Laterite (Seivaal)", value: "red_laterite" },
                  { label: "Coastal Sandy Soil", value: "coastal_sandy" },
                  { label: "Black Cotton Soil", value: "black_cotton" },
                  { label: "Alluvial Soil", value: "alluvial" },
                  { label: "Custom Mix", value: "custom" },
                ]}
                selectedValue={soilType}
                onValueChange={setSoilType}
                placeholder="Select soil type"
              />

              <Text style={styles.fieldGroupLabel}>💧 Water Needs</Text>
              <ScrollView
                ref={waterNeedsChipsRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryChipsScroll}
                contentContainerStyle={styles.categoryChipsContent}
              >
                {([
                  { label: "Low", value: "low", drops: 1 },
                  { label: "Medium", value: "medium", drops: 2 },
                  { label: "High", value: "high", drops: 3 },
                ] as const).map((opt) => {
                  const isActive = waterRequirement === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.categoryChip,
                        { flexDirection: "row", alignItems: "center", gap: 4 },
                        isActive && styles.categoryChipActive,
                      ]}
                      onPress={() => setWaterRequirement(opt.value as WaterRequirement)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: "row", gap: 1 }}>
                        {Array.from({ length: opt.drops }).map((_, i) => (
                          <Ionicons
                            key={i}
                            name="water"
                            size={12}
                            color={isActive ? theme.primary : theme.textTertiary}
                          />
                        ))}
                      </View>
                      <Text
                        style={[
                          styles.categoryChipText,
                          isActive && styles.categoryChipTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {waterRequirement === "low" && (
                <Text style={styles.helperText}>Water once every 3–5 days. Suits drought-tolerant plants like succulents and native shrubs.</Text>
              )}
              {waterRequirement === "medium" && (
                <Text style={styles.helperText}>Water every 1–2 days. Suitable for most vegetables, herbs, and flowering plants.</Text>
              )}
              {waterRequirement === "high" && (
                <Text style={styles.helperText}>Water daily or twice daily. For moisture-loving plants like paddy, taro, and water spinach.</Text>
              )}
            </>
          )}

          <View style={styles.fieldGroupDivider} />
          <Text style={styles.fieldGroupLabel}>📅 Watering & Feeding Schedule</Text>

          <View style={styles.frequencyRow}>
            <View style={styles.frequencyCard}>
              <View style={styles.frequencyIconWrap}>
                <Ionicons name="water" size={18} color={theme.primary} />
              </View>
              <Text style={styles.frequencyCardLabel}>Water</Text>
              <View style={styles.frequencyInputWrap}>
                <TextInput
                  style={styles.frequencyInput}
                  value={wateringFrequency}
                  onChangeText={(text) => setWateringFrequency(sanitizeNumberText(text))}
                  keyboardType="numeric"
                  placeholder="—"
                  placeholderTextColor={theme.inputPlaceholder}
                  maxLength={3}
                />
              </View>
              <Text style={styles.frequencyUnit}>days</Text>
            </View>
            <View style={styles.frequencyCard}>
              <View style={[styles.frequencyIconWrap, { backgroundColor: theme.accentLight }]}>
                <Ionicons name="nutrition" size={18} color={theme.accent} />
              </View>
              <Text style={styles.frequencyCardLabel}>Feed</Text>
              <View style={styles.frequencyInputWrap}>
                <TextInput
                  style={styles.frequencyInput}
                  value={fertilisingFrequency}
                  onChangeText={(text) => setFertilisingFrequency(sanitizeNumberText(text))}
                  keyboardType="numeric"
                  placeholder="—"
                  placeholderTextColor={theme.inputPlaceholder}
                  maxLength={3}
                />
              </View>
              <Text style={styles.frequencyUnit}>days</Text>
            </View>
          </View>

          {formMode === "advanced" && (
            <>
              <ThemedDropdown
                items={[
                  { label: "Compost", value: "compost" },
                  { label: "Vermicompost", value: "vermicompost" },
                  { label: "Cow Dung Slurry", value: "cow_dung_slurry" },
                  { label: "Neem Cake", value: "neem_cake" },
                  { label: "Panchagavya", value: "panchagavya" },
                  { label: "Jeevamrutham", value: "jeevamrutham" },
                  { label: "Groundnut Cake", value: "groundnut_cake" },
                  { label: "Fish Emulsion", value: "fish_emulsion" },
                  { label: "Seaweed Extract", value: "seaweed" },
                  { label: "Other", value: "other" },
                ]}
                selectedValue={preferredFertiliser}
                onValueChange={setPreferredFertiliser}
                label="Preferred Organic Fertiliser"
                placeholder="Preferred Fertiliser"
              />

              <TouchableOpacity
                style={[
                  styles.settingToggle,
                  mulchingUsed && styles.settingToggleActive,
                ]}
                onPress={() => setMulchingUsed(!mulchingUsed)}
                activeOpacity={0.85}
                accessibilityRole="switch"
                accessibilityState={{ checked: mulchingUsed }}
              >
                <View style={styles.settingToggleLeft}>
                  <View
                    style={[
                      styles.settingToggleIconWrap,
                      mulchingUsed && styles.settingToggleIconWrapActive,
                    ]}
                  >
                    <Ionicons
                      name={mulchingUsed ? "layers" : "layers-outline"}
                      size={18}
                      color={mulchingUsed ? theme.primary : theme.textSecondary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.settingToggleLabel,
                      mulchingUsed && styles.settingToggleLabelActive,
                    ]}
                  >
                    Mulching Used
                  </Text>
                </View>
                <View
                  style={[
                    styles.settingSwitchTrack,
                    mulchingUsed && styles.settingSwitchTrackActive,
                  ]}
                >
                  <View
                    style={[
                      styles.settingSwitchThumb,
                      mulchingUsed && styles.settingSwitchThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>

              <View style={styles.fieldGroupDivider} />
              <Text style={styles.fieldGroupLabel}>✂️ Pruning</Text>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <Text style={[styles.frequencyCardLabel, { marginBottom: 0 }]}>Every</Text>
                <View style={[styles.frequencyInputWrap, { width: 70, marginBottom: 0 }]}>
                  <TextInput
                    style={[styles.frequencyInput, { fontSize: 18 }]}
                    value={pruningFrequency}
                    onChangeText={(text) => setPruningFrequency(sanitizeNumberText(text))}
                    keyboardType="numeric"
                    placeholder="—"
                    placeholderTextColor={theme.inputPlaceholder}
                    maxLength={3}
                  />
                </View>
                <Text style={[styles.frequencyCardLabel, { marginBottom: 0 }]}>days</Text>
              </View>

              {(() => {
                const userOverride = plantType && plantVariety
                  ? plantCareProfiles[plantType]?.[plantVariety]
                  : undefined;
                const info = getPruningTechniques(plantType, plantVariety, userOverride);
                const hasTips = info.tips.length > 0 || info.shapePruning || info.flowerPruning;
                return hasTips ? (
                  <View style={{
                    backgroundColor: theme.backgroundSecondary,
                    borderRadius: 10,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: theme.borderLight,
                    marginBottom: 8,
                  }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Ionicons name="bulb-outline" size={16} color={theme.accent} />
                      <Text style={{ fontSize: 12, fontWeight: "700", color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Pruning Tips{plantVariety ? ` — ${plantVariety}` : ""}
                      </Text>
                    </View>
                    {info.tips.map((tip, i) => (
                      <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                        <Text style={{ color: theme.textTertiary, fontSize: 13, lineHeight: 18 }}>{"\u2022"}</Text>
                        <Text style={{ color: theme.text, fontSize: 13, lineHeight: 18, flex: 1 }}>{tip}</Text>
                      </View>
                    ))}
                    {info.shapePruning && (
                      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: info.tips.length > 0 ? 6 : 0, marginBottom: 4 }}>
                        <Text style={{ fontSize: 13, lineHeight: 18 }}>{"\u2702\uFE0F"}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: theme.text, fontSize: 13, lineHeight: 18, fontWeight: "600" }}>
                            Shape pruning
                            <Text style={{ fontWeight: "400" }}> — {info.shapePruning.tip}</Text>
                          </Text>
                          <Text style={{ color: theme.primary, fontSize: 12, fontWeight: "600", marginTop: 2 }}>
                            Best: {info.shapePruning.months}
                          </Text>
                        </View>
                      </View>
                    )}
                    {info.flowerPruning && (
                      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 4 }}>
                        <Text style={{ fontSize: 13, lineHeight: 18 }}>{"\uD83C\uDF38"}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: theme.text, fontSize: 13, lineHeight: 18, fontWeight: "600" }}>
                            Flower pruning
                            <Text style={{ fontWeight: "400" }}> — {info.flowerPruning.tip}</Text>
                          </Text>
                          <Text style={{ color: theme.primary, fontSize: 12, fontWeight: "600", marginTop: 2 }}>
                            Best: {info.flowerPruning.months}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                ) : null;
              })()}
            </>
          )}
        </CollapsibleSection>

        {formMode === "advanced" && (
          <CollapsibleSection
            title="Plant Health"
            icon="fitness"
            fieldCount={2}
            defaultExpanded={false}
            expanded={sectionExpanded.health}
            onExpandedChange={(expanded) =>
              setSectionExpandedState("health", expanded)
            }
            hasError={false}
          >
            <Text style={styles.fieldGroupLabel}>🌿 Health Status</Text>
            <ScrollView
              ref={healthChipsRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryChipsScroll}
              contentContainerStyle={styles.categoryChipsContent}
            >
              {HEALTH_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.categoryChip,
                    healthStatus === opt.value && styles.categoryChipActive,
                  ]}
                  onPress={() => setHealthStatus(opt.value as HealthStatus)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      healthStatus === opt.value && styles.categoryChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {healthStatus === "healthy" && (
              <Text style={styles.helperText}>Plant looks good — no visible stress, pests, or disease. Growing normally.</Text>
            )}
            {healthStatus === "stressed" && (
              <Text style={styles.helperText}>Early warning signs like wilting, yellowing tips, or slow growth — usually from environment (sun, water, transplant shock). Can recover with corrective care.</Text>
            )}
            {healthStatus === "recovering" && (
              <Text style={styles.helperText}>Previously stressed or sick, now improving. May still show some damage but new growth looks healthy.</Text>
            )}
            {healthStatus === "sick" && (
              <Text style={styles.helperText}>Active disease, fungal infection, rot, or heavy pest infestation. Needs treatment — not just adjusted conditions.</Text>
            )}

            <Text style={styles.fieldGroupLabel}>🌱 Growth Stage</Text>
            <ScrollView
              ref={growthStageChipsRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryChipsScroll}
              contentContainerStyle={styles.categoryChipsContent}
            >
              {GROWTH_STAGE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.categoryChip,
                    growthStage === opt.value && styles.categoryChipActive,
                  ]}
                  onPress={() => setGrowthStage(opt.value as GrowthStage)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      growthStage === opt.value && styles.categoryChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {growthStage === "seedling" && (
              <Text style={styles.helperText}>Just sprouted or recently transplanted. Needs gentle care — avoid direct harsh sun and overwatering.</Text>
            )}
            {growthStage === "vegetative" && (
              <Text style={styles.helperText}>Actively growing leaves and stems. Focus on regular watering, feeding, and ensuring good sunlight.</Text>
            )}
            {growthStage === "flowering" && (
              <Text style={styles.helperText}>Producing buds and flowers. Reduce nitrogen fertiliser; support with phosphorus and potassium.</Text>
            )}
            {growthStage === "fruiting" && (
              <Text style={styles.helperText}>Setting or ripening fruit. Ensure consistent watering and watch for pests attracted to fruit.</Text>
            )}
            {growthStage === "mature" && (
              <Text style={styles.helperText}>Fully established plant. Maintenance care — regular pruning, seasonal feeding, and pest monitoring.</Text>
            )}
            {growthStage === "dormant" && (
              <Text style={styles.helperText}>Resting phase — growth slows or stops. Reduce watering and feeding. Normal for seasonal or perennial plants.</Text>
            )}
          </CollapsibleSection>
        )}

        {/* Harvest Information */}
        {formMode === "advanced" && (
          <CollapsibleSection
            title="Harvest"
            icon="calendar"
            fieldCount={harvestSectionFieldCount}
            defaultExpanded={false}
            expanded={sectionExpanded.harvest}
            onExpandedChange={(expanded) =>
              setSectionExpandedState("harvest", expanded)
            }
            hasError={
              showValidationErrors && validationErrors.harvest.length > 0
            }
          >
            <Text style={styles.fieldGroupLabel}>Harvest Season</Text>
            <View style={styles.directionChipsContainer}>
              {harvestSeasonOptions.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.directionChip,
                    harvestSeason === s && styles.directionChipActive,
                  ]}
                  onPress={() => setHarvestSeason(harvestSeason === s ? "" : s)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.directionChipText,
                      harvestSeason === s && styles.directionChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {plantType === "fruit_tree" && (
              <>
                <View style={styles.fieldGroupDivider} />
                <Text style={styles.fieldGroupLabel}>Harvest Date Range</Text>
                <View style={styles.dateCard}>
                  <TouchableOpacity
                    style={styles.dateCardTouchable}
                    onPress={() => setShowStartDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dateCardIconWrap}>
                      <Ionicons name="play" size={18} color={theme.primary} />
                    </View>
                    <View style={styles.dateCardContent}>
                      <Text style={styles.dateCardLabel}>Start Date</Text>
                      <Text
                        style={
                          harvestStartDate ? styles.dateCardValue : styles.dateCardPlaceholder
                        }
                      >
                        {harvestStartDate ? formatDateDisplay(harvestStartDate) : "Tap to select"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
                  </TouchableOpacity>
                </View>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={
                      harvestStartDate ? new Date(harvestStartDate) : new Date()
                    }
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(Platform.OS === "ios");
                      if (selectedDate) {
                        setHarvestStartDate(
                          toLocalDateString(selectedDate),
                        );
                      }
                    }}
                  />
                )}

                <View style={styles.dateCard}>
                  <TouchableOpacity
                    style={styles.dateCardTouchable}
                    onPress={() => setShowEndDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.dateCardIconWrap, { backgroundColor: theme.accentLight }]}>
                      <Ionicons name="stop" size={18} color={theme.accent} />
                    </View>
                    <View style={styles.dateCardContent}>
                      <Text style={styles.dateCardLabel}>End Date</Text>
                      <Text
                        style={
                          harvestEndDate ? styles.dateCardValue : styles.dateCardPlaceholder
                        }
                      >
                        {harvestEndDate ? formatDateDisplay(harvestEndDate) : "Tap to select"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
                  </TouchableOpacity>
                </View>
                {showEndDatePicker && (
                  <DateTimePicker
                    value={
                      harvestEndDate ? new Date(harvestEndDate) : new Date()
                    }
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      setShowEndDatePicker(Platform.OS === "ios");
                      if (selectedDate) {
                        setHarvestEndDate(
                          toLocalDateString(selectedDate),
                        );
                      }
                    }}
                  />
                )}
              </>
            )}

            {/* Expected Harvest Date */}
            {expectedHarvestDate && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name="calendar" size={20} color="#FF9800" />
                  <Text style={styles.infoCardTitle}>
                    Expected Harvest Date
                  </Text>
                </View>
                <Text style={styles.infoCardText}>
                  {new Date(expectedHarvestDate).toLocaleDateString()}
                </Text>
                <Text style={styles.infoCardSubtext}>
                  Auto-calculated based on plant variety and planting date
                </Text>
              </View>
            )}
          </CollapsibleSection>
        )}

        {/* Coconut Tracking (Kanyakumari-specific) */}
        {formMode === "advanced" && plantType === "coconut_tree" && (
          <CollapsibleSection
            title="Coconut Tracking"
            icon="analytics"
            fieldCount={3}
            defaultExpanded={false}
            expanded={sectionExpanded.coconut}
            onExpandedChange={(expanded) =>
              setSectionExpandedState("coconut", expanded)
            }
            hasError={false}
          >
            {/* Age-stage info card — auto-derived from planting date */}
            {coconutAgeInfo && (
              <View
                style={[
                  styles.infoCard,
                  {
                    marginBottom: 16,
                    borderLeftColor: "#8B5A2B",
                    borderLeftWidth: 4,
                  },
                ]}
              >
                <View style={styles.infoCardHeader}>
                  <Ionicons name="leaf" size={16} color="#8B5A2B" />
                  <Text style={[styles.infoCardTitle, { color: "#8B5A2B" }]}>
                    Age-based Care — {coconutAgeInfo.ageLabel}
                  </Text>
                </View>
                <Text style={styles.infoCardText}>
                  Stage: {coconutAgeInfo.stageLabel}
                </Text>
                <Text style={styles.infoCardText}>
                  Expected yield: {coconutAgeInfo.expectedNutsPerYear}
                </Text>
                <Text
                  style={[
                    styles.infoCardText,
                    { marginTop: 6, fontWeight: "600" },
                  ]}
                >
                  Suggested schedule:
                </Text>
                <Text style={styles.infoCardText}>
                  • Water every {coconutAgeInfo.wateringFrequencyDays} day
                  {coconutAgeInfo.wateringFrequencyDays !== 1 ? "s" : ""}
                </Text>
                <Text style={styles.infoCardText}>
                  • Fertilise every {coconutAgeInfo.fertilisingFrequencyDays}{" "}
                  days
                </Text>
                <Text
                  style={[
                    styles.infoCardText,
                    { marginTop: 6, fontWeight: "600" },
                  ]}
                >
                  Care tips for this stage:
                </Text>
                {coconutAgeInfo.careTips.map((tip, i) => (
                  <Text key={i} style={styles.infoCardText}>
                    • {tip}
                  </Text>
                ))}
              </View>
            )}

            <Text style={styles.fieldGroupLabel}>Tree Metrics</Text>
            <View style={styles.statCardsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statCardIconWrap, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="leaf" size={16} color={theme.primary} />
                </View>
                <Text style={styles.statCardLabel}>Fronds</Text>
                <View style={styles.statCardInputWrap}>
                  <TextInput
                    style={styles.statCardInput}
                    value={coconutFrondsCount}
                    onChangeText={(text) => setCoconutFrondsCount(sanitizeNumberText(text))}
                    keyboardType="numeric"
                    placeholder="—"
                    placeholderTextColor={theme.inputPlaceholder}
                    maxLength={3}
                  />
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statCardIconWrap, { backgroundColor: theme.accentLight }]}>
                  <Ionicons name="ellipse" size={16} color={theme.accent} />
                </View>
                <Text style={styles.statCardLabel}>Nuts/mo</Text>
                <View style={styles.statCardInputWrap}>
                  <TextInput
                    style={styles.statCardInput}
                    value={nutsPerMonth}
                    onChangeText={(text) => setNutsPerMonth(sanitizeNumberText(text))}
                    keyboardType="numeric"
                    placeholder="—"
                    placeholderTextColor={theme.inputPlaceholder}
                    maxLength={3}
                  />
                </View>
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statCardIconWrap, { backgroundColor: theme.warningLight }]}>
                  <Ionicons name="flower" size={16} color={theme.warning} />
                </View>
                <Text style={styles.statCardLabel}>Spathes</Text>
                <View style={styles.statCardInputWrap}>
                  <TextInput
                    style={styles.statCardInput}
                    value={spatheCount}
                    onChangeText={(text) => setSpatheCount(sanitizeNumberText(text))}
                    keyboardType="numeric"
                    placeholder="—"
                    placeholderTextColor={theme.inputPlaceholder}
                    maxLength={3}
                  />
                </View>
              </View>
            </View>
            <Text style={styles.helperText}>
              Fronds: 30–35 is healthy. Spathes: 1–2/month for bearing trees.
            </Text>

            <View style={styles.fieldGroupDivider} />
            <Text style={styles.fieldGroupLabel}>Harvest Tracking</Text>

            <View style={styles.dateCard}>
              <TouchableOpacity
                style={styles.dateCardTouchable}
                onPress={() => setShowClimbingDatePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.dateCardIconWrap}>
                  <Ionicons name="arrow-up" size={18} color={theme.primary} />
                </View>
                <View style={styles.dateCardContent}>
                  <Text style={styles.dateCardLabel}>Last Climbing / Harvest</Text>
                  <Text
                    style={
                      lastClimbingDate ? styles.dateCardValue : styles.dateCardPlaceholder
                    }
                  >
                    {lastClimbingDate ? formatDateDisplay(lastClimbingDate) : "Tap to select"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>
            {showClimbingDatePicker && (
              <DateTimePicker
                value={
                  lastClimbingDate ? new Date(lastClimbingDate) : new Date()
                }
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, selectedDate) => {
                  setShowClimbingDatePicker(Platform.OS === "ios");
                  if (selectedDate) {
                    setLastClimbingDate(
                      toLocalDateString(selectedDate),
                    );
                  }
                }}
              />
            )}
            {coconutAgeInfo && coconutAgeInfo.harvestFrequencyDays > 0 && (
              <Text style={styles.helperText}>
                Suggested harvest cycle: every{" "}
                {coconutAgeInfo.harvestFrequencyDays} days for this stage.
              </Text>
            )}

            <View style={styles.fieldGroupDivider} />
            <Text style={styles.fieldGroupLabel}>Nut Fall Monitoring</Text>

            <View style={styles.frequencyRow}>
              <View style={styles.frequencyCard}>
                <View style={[styles.frequencyIconWrap, { backgroundColor: theme.errorLight }]}>
                  <Ionicons name="arrow-down" size={18} color={theme.error} />
                </View>
                <Text style={styles.frequencyCardLabel}>Falls</Text>
                <View style={styles.frequencyInputWrap}>
                  <TextInput
                    style={styles.frequencyInput}
                    value={nutFallCount}
                    onChangeText={(text) => setNutFallCount(sanitizeNumberText(text))}
                    keyboardType="numeric"
                    placeholder="—"
                    placeholderTextColor={theme.inputPlaceholder}
                    maxLength={3}
                  />
                </View>
                <Text style={styles.frequencyUnit}>nuts</Text>
              </View>
            </View>
            <Text style={styles.helperText}>
              High count (&gt;10) may indicate Red Palm Weevil, water stress, or boron deficiency.
            </Text>

            <View style={styles.dateCard}>
              <TouchableOpacity
                style={styles.dateCardTouchable}
                onPress={() => setShowNutFallDatePicker(true)}
                activeOpacity={0.7}
              >
                <View style={[styles.dateCardIconWrap, { backgroundColor: theme.errorLight }]}>
                  <Ionicons name="alert-circle" size={18} color={theme.error} />
                </View>
                <View style={styles.dateCardContent}>
                  <Text style={styles.dateCardLabel}>Last Nut Fall Incident</Text>
                  <Text
                    style={
                      lastNutFallDate ? styles.dateCardValue : styles.dateCardPlaceholder
                    }
                  >
                    {lastNutFallDate ? formatDateDisplay(lastNutFallDate) : "Tap to select"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>
            {showNutFallDatePicker && (
              <DateTimePicker
                value={lastNutFallDate ? new Date(lastNutFallDate) : new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, selectedDate) => {
                  setShowNutFallDatePicker(Platform.OS === "ios");
                  if (selectedDate) {
                    setLastNutFallDate(
                      toLocalDateString(selectedDate),
                    );
                  }
                }}
              />
            )}
          </CollapsibleSection>
        )}

        {/* Notes, Pest History & Companions */}
        {formMode === "advanced" && (
          <CollapsibleSection
            title="Notes & History"
            icon="document-text"
            fieldCount={notesHistoryFieldCount}
            defaultExpanded={false}
            expanded={sectionExpanded.notesHistory}
            onExpandedChange={(expanded) =>
              setSectionExpandedState("notesHistory", expanded)
            }
            hasError={showValidationErrors && validationErrors.notesHistory.length > 0}
          >
            <View style={styles.notesCard}>
              <View style={styles.notesCardHeader}>
                <Ionicons name="document-text-outline" size={16} color={theme.textTertiary} />
                <Text style={styles.fieldGroupLabel}>Notes</Text>
              </View>
              <TextInput
                style={styles.notesCardInput}
                value={notes}
                onChangeText={(text) =>
                  setNotes(sanitizeAlphaNumericSpaces(text))
                }
                multiline
                numberOfLines={4}
                maxLength={NOTES_MAX_LENGTH}
                placeholder="Add any notes about this plant..."
                placeholderTextColor={theme.inputPlaceholder}
              />
              <Text style={styles.noteCounter}>
                {notes.length}/{NOTES_MAX_LENGTH}
              </Text>
            </View>

            {plantVariety &&
              getCompanionSuggestions(plantVariety).length > 0 && (
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <Ionicons name="leaf" size={20} color="#4CAF50" />
                    <Text style={styles.infoCardTitle}>Companion Plants</Text>
                  </View>
                  <Text style={styles.infoCardSubtext}>
                    Good companion plants for {plantVariety}:
                  </Text>
                  <View style={styles.chipContainer}>
                    {getCompanionSuggestions(plantVariety).map((companion) => (
                      <View key={companion} style={styles.companionChip}>
                        <Text style={styles.companionChipText}>
                          {companion}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

            {plantVariety && getIncompatiblePlants(plantVariety).length > 0 && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name="warning" size={20} color="#f57c00" />
                  <Text style={styles.infoCardTitle}>Avoid Planting With</Text>
                </View>
                <Text style={styles.infoCardSubtext}>
                  These plants can compete with {plantVariety}:
                </Text>
                <View style={styles.chipContainer}>
                  {getIncompatiblePlants(plantVariety).map((incompatible) => (
                    <View key={incompatible} style={styles.incompatibleChip}>
                      <Text style={styles.incompatibleChipText}>
                        {incompatible}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

          </CollapsibleSection>
        )}

        {/* Pest & Disease Section — own collapsible */}
        {formMode === "advanced" && (
          <CollapsibleSection
            title="Pest & Disease"
            icon="bug"
            fieldCount={pestDiseaseFieldCount}
            defaultExpanded={false}
            expanded={sectionExpanded.pestDisease}
            onExpandedChange={(expanded) =>
              setSectionExpandedState("pestDisease", expanded)
            }
            hasError={showValidationErrors && validationErrors.pestDisease.length > 0}
          >
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.fieldGroupLabel}>🐛 Pest & Disease Records</Text>
              <TouchableOpacity
                style={styles.addPestButtonPill}
                onPress={() => {
                  setEditingPestIndex(null);
                  setPestPhotoUri(null);
                  setCurrentPestDisease({
                    type: "pest",
                    name: "",
                    occurredAt: toLocalDateString(new Date()),
                    severity: "medium",
                    resolved: false,
                  });
                  setShowPestDiseaseModal(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color={theme.primary} />
                <Text style={styles.addPestButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {pestDiseaseHistory.length > 0 ? (
              <View style={styles.pestDiseaseList}>
                {/* Active (unresolved) records first */}
                {pestDiseaseHistory
                  .map((record, index) => ({ record, index }))
                  .sort((a, b) => (a.record.resolved === b.record.resolved ? 0 : a.record.resolved ? 1 : -1))
                  .map(({ record, index }) => (
                  <TouchableOpacity
                    key={record.id || index}
                    style={[
                      styles.pestDiseaseCard,
                      { borderLeftWidth: 3, borderLeftColor: record.resolved ? "#4CAF50" : "#f44336" },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setEditingPestIndex(index);
                      setCurrentPestDisease({ ...record });
                      setPestPhotoUri(record.photo_filename || null);
                      setShowPestDiseaseModal(true);
                    }}
                  >
                    <View style={styles.pestDiseaseHeader}>
                      <Ionicons
                        name={record.type === "pest" ? "bug" : "medical"}
                        size={20}
                        color={record.resolved ? "#4CAF50" : "#f44336"}
                      />
                      <Text style={styles.pestDiseaseName}>{record.name}</Text>
                      {record.resolved && (
                        <View style={styles.resolvedBadge}>
                          <Text style={styles.resolvedText}>Resolved</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.pestDiseaseDate}>
                      Occurred:{" "}
                      {new Date(record.occurredAt).toLocaleDateString()}
                    </Text>
                    {(record.severity || record.affectedPart) && (
                      <Text style={styles.pestDiseaseMetaText}>
                        {record.severity
                          ? `Severity: ${record.severity.toUpperCase()}`
                          : ""}
                        {record.severity && record.affectedPart ? "  |  " : ""}
                        {record.affectedPart
                          ? `Affected Part: ${record.affectedPart}`
                          : ""}
                      </Text>
                    )}
                    {record.treatment && (
                      <Text style={styles.pestDiseaseTreatment}>
                        Treatment: {record.treatment}
                      </Text>
                    )}
                    {record.notes && (
                      <Text style={styles.pestDiseaseNotes}>
                        {record.notes}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={styles.deletePestButton}
                      onPress={() => {
                        setPestDiseaseHistory(
                          pestDiseaseHistory.filter((_, i) => i !== index),
                        );
                      }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#f44336"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.noPestHistory}>
                No pest or disease records yet
              </Text>
            )}
          </CollapsibleSection>
        )}

        {/* Discard Changes Modal */}
        <DiscardChangesModal
          visible={showDiscardModal}
          theme={theme}
          styles={styles}
          onKeepEditing={() => setShowDiscardModal(false)}
          onDiscard={() => {
            setShowDiscardModal(false);
            isDiscarding.current = true;
            setHasUnsavedChanges(false);
            navigation.goBack();
          }}
        />

        {/* Pest/Disease Modal */}
        <PestDiseaseModal
          visible={showPestDiseaseModal}
          editingIndex={editingPestIndex}
          editingRecord={editingPestIndex !== null ? currentPestDisease : null}
          initialPhotoUri={pestPhotoUri}
          pestDiseaseHistory={pestDiseaseHistory}
          plantType={plantType}
          plantVariety={plantVariety}
          plantId={plantId}
          healthStatus={healthStatus}
          styles={styles}
          theme={theme}
          bottomInset={insets.bottom}
          onClose={() => {
            setEditingPestIndex(null);
            setShowPestDiseaseModal(false);
          }}
          onSave={(updatedHistory) => {
            setPestDiseaseHistory(updatedHistory);
            setEditingPestIndex(null);
            setShowPestDiseaseModal(false);
          }}
          onHealthStatusChange={(status) => setHealthStatus(status)}
        />
      </ScrollView>

      <PhotoSourceModal
        visible={showPhotoSourceModal}
        onClose={() => setShowPhotoSourceModal(false)}
        onCamera={openCamera}
        onLibrary={openImageLibrary}
      />
    </KeyboardAvoidingView>
  );
}

