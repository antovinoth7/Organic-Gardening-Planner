import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
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
import { useNavigation, useRoute, NavigationProp } from "@react-navigation/native";
import { logger } from "../utils/logger";
import { getErrorMessage } from "../utils/errorLogging";

const NOTES_MAX_LENGTH = 500;
type FormMode = "quick" | "advanced";
type FormSectionKey =
  | "basic"
  | "location"
  | "care"
  | "health"
  | "harvest"
  | "coconut"
  | "notesHistory"
  | "pestDisease";
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

export default function PlantFormScreen() {
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const route = useRoute();
  const { plantId } = (route.params || {}) as { plantId?: string };
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

  // #4 Care profile card
  const [autoSuggestFired, setAutoSuggestFired] = useState(false);
  const [careProfileCardDismissed, setCareProfileCardDismissed] =
    useState(false);

  // #9 Auto-name inline preview
  const [showCustomNameInput, setShowCustomNameInput] = useState(false);

  // #1 More Details accordion
  const [showMoreDetails, setShowMoreDetails] = useState(false);

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

  // Main ScrollView ref (for sticky save / scroll-to-section)
  const scrollViewRef = useRef<ScrollView>(null);

  const CATEGORY_OPTIONS = useMemo(
    () => [
      { label: "🥬 Vegetable", value: "vegetable" },
      { label: "🍇 Fruit", value: "fruit_tree" },
      { label: "🥥 Coconut", value: "coconut_tree" },
      { label: "🌿 Herb", value: "herb" },
      { label: "🌲 Timber", value: "timber_tree" },
      { label: "🌸 Flower", value: "flower" },
      { label: "🌱 Shrub", value: "shrub" },
    ],
    [],
  );

  const HEALTH_OPTIONS = useMemo(
    () => [
      { label: "✅ Healthy", value: "healthy" },
      { label: "⚠️ Stressed", value: "stressed" },
      { label: "🔄 Recovering", value: "recovering" },
      { label: "❌ Sick", value: "sick" },
    ],
    [],
  );

  const GROWTH_STAGE_OPTIONS = useMemo(
    () => [
      { label: "🌱 Seedling", value: "seedling" },
      { label: "🌿 Vegetative", value: "vegetative" },
      { label: "🌸 Flowering", value: "flowering" },
      { label: "🍎 Fruiting", value: "fruiting" },
      { label: "🌳 Mature", value: "mature" },
      { label: "💤 Dormant", value: "dormant" },
    ],
    [],
  );

  const getFrequencyLabel = useCallback((days: string): string => {
    const n = parseInt(days, 10);
    if (isNaN(n) || n < 1) return "";
    if (n === 1) return "Daily";
    if (n === 7) return "Weekly";
    if (n === 14) return "Fortnightly";
    if (n === 30) return "Monthly";
    return `Every ${n} days`;
  }, []);

  const adjustFrequency = useCallback(
    (
      current: string,
      delta: number,
      setter: (value: string) => void,
    ) => {
      const n = parseInt(current, 10);
      const next = Math.max(1, (isNaN(n) ? 0 : n) + delta);
      setter(next.toString());
    },
    [],
  );

  // Estimated chip width (paddingH 14*2 + ~60 text + gap 8) ≈ 100px per chip

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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadPlant must only re-run when plantId changes
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

  const totalErrorCount = React.useMemo(
    () =>
      Object.values(validationErrors).reduce((sum, arr) => sum + arr.length, 0),
    [validationErrors],
  );

  const sectionStatuses = React.useMemo(
    () =>
      ({
        basic: plantVariety && plantType ? "complete" : "required_incomplete",
        location:
          parentLocation && childLocation ? "complete" : "required_incomplete",
        care:
          wateringFrequency && fertilisingFrequency
            ? "complete"
            : "required_incomplete",
        health: "optional",
        harvest: "optional",
        coconut: "optional",
        notesHistory: "optional",
        pestDisease: "optional",
      }) as const,
    [
      plantVariety,
      plantType,
      parentLocation,
      childLocation,
      wateringFrequency,
      fertilisingFrequency,
    ],
  );

  // #1 Phase progression — unlocks form in 3 sequential steps
  const phase1Complete = React.useMemo(
    () => !!plantVariety && !!plantType,
    [plantVariety, plantType],
  );
  const phase2Unlocked = phase1Complete;
  const phase3Unlocked = phase1Complete && !!parentLocation;

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
    setAutoSuggestFired(false);
    setCareProfileCardDismissed(false);
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
    [
      plantType,
      plantVariety,
      variety,
      plantingDate,
      parentLocation,
      locationShortNames,
    ],
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
      logger.debug(`Applying auto-suggestions for: ${plantVariety}`);
      const profile = getPlantCareProfile(
        plantVariety,
        plantType,
        plantCareProfiles,
      );

      if (profile) {
        autoSuggestApplied.current = true;
        setAutoSuggestFired(true);

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

    return {
      filled,
      total,
      percent: total > 0 ? Math.round((filled / total) * 100) : 0,
    };
  }, [
    basicFieldCount,
    locationFieldCount,
    harvestSectionFieldCount,
    notesHistoryFieldCount,
    pestDiseaseFieldCount,
    formMode,
    plantType,
    photoUri,
    name,
    plantVariety,
    variety,
    customVarietyMode,
    varietySuggestions.length,
    plantingDate,
    parentLocation,
    childLocation,
    landmarks,
    wateringFrequency,
    fertilisingFrequency,
    sunlight,
    waterRequirement,
    soilType,
    preferredFertiliser,
    mulchingUsed,
    pruningFrequency,
    pruningNotes,
    healthStatus,
    growthStage,
    harvestSeason,
    expectedHarvestDate,
    harvestStartDate,
    harvestEndDate,
    notes,
    pestDiseaseHistory.length,
    coconutFrondsCount,
    nutsPerMonth,
    lastClimbingDate,
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
    if (!plantId) return;
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
        // Show custom name input if the plant has a custom (non-generated) name
        if (!generatedName && plant.name) setShowCustomNameInput(true);
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
      }
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error));
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
      logger.warn("Camera launch failed", error as Error);
      Alert.alert("Camera Error", "Failed to open camera. Please try again.");
    }
  };

  const pickImage = () => {
    setShowPhotoSourceModal(true);
  };

  const handleSave = async (onSuccessOverride?: () => void) => {
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
      if (
        ["harvest", "health", "notesHistory"].includes(firstErrorSection) &&
        formMode === "quick"
      ) {
        setFormMode("advanced");
      }
      // If error is in a "More Details" section, open that accordion too
      if (
        [
          "health",
          "harvest",
          "coconut",
          "notesHistory",
          "pestDisease",
        ].includes(firstErrorSection)
      ) {
        setShowMoreDetails(true);
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
        logger.warn("Failed to sync care tasks for plant", error as Error);
      }

      if (onSuccessOverride) {
        onSuccessOverride();
        return;
      }

      // Trigger refresh in parent screens by setting a navigation param
      navigation.navigate({
        name: "PlantsList",
        params: { refresh: Date.now() },
        merge: true,
      });
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error));
      setHasUnsavedChanges(true); // Restore flag on error
    } finally {
      setLoading(false);
      isSaving.current = false;
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          {/* Left — back arrow */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>

          {/* Center — title + unsaved dot */}
          <View style={styles.headerCenter}>
            <Text style={styles.title}>
              {plantId ? "Edit Plant" : "Add Plant"}
            </Text>
            {hasUnsavedChanges && <View style={styles.unsavedDot} />}
          </View>

          {/* Right — close ✕ */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Segmented pill toggle + progress pill */}
          <View style={styles.segmentedRow}>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentedItem,
                  formMode === "quick" && styles.segmentedItemActive,
                ]}
                onPress={() => setFormMode("quick")}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentedLabel,
                    formMode === "quick" && styles.segmentedLabelActive,
                  ]}
                >
                  Quick Add
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentedItem,
                  formMode === "advanced" && styles.segmentedItemActive,
                ]}
                onPress={() => setFormMode("advanced")}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentedLabel,
                    formMode === "advanced" && styles.segmentedLabelActive,
                  ]}
                >
                  Advanced
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.progressPill,
                formProgress.percent === 100 && styles.progressPillComplete,
              ]}
            >
              <Text
                style={[
                  styles.progressPillText,
                  formProgress.percent === 100 && styles.progressPillTextComplete,
                ]}
              >
                {formProgress.percent === 100
                  ? "✓ Done"
                  : `${formProgress.filled}/${formProgress.total}`}
              </Text>
            </View>
          </View>

          {/* #2 Photo Hero — full-width above all sections */}
          <TouchableOpacity
            style={styles.photoHeroContainer}
            onPress={pickImage}
            activeOpacity={0.85}
          >
            {photoUri ? (
              <>
                <Image
                  source={{ uri: photoUri }}
                  style={styles.photoHeroImage}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
                <View style={styles.photoHeroEditBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                  <Text style={styles.photoHeroEditBadgeText}>
                    Change Photo
                  </Text>
                </View>
              </>
            ) : (
              <View style={styles.photoHeroPlaceholder}>
                <Ionicons
                  name="camera-outline"
                  size={40}
                  color={theme.primary}
                />
                <Text style={styles.photoHeroPlaceholderText}>
                  Tap to add a photo
                </Text>
              </View>
            )}
          </TouchableOpacity>

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
            sectionStatus={
              showValidationErrors ? undefined : sectionStatuses.basic
            }
          >
            <View style={styles.chipGrid}>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.chipGridItem,
                    plantType === cat.value && styles.chipGridItemActive,
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
                      styles.chipGridItemText,
                      plantType === cat.value && styles.chipGridItemTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedDropdown
              items={[
                { label: "Select plant type", value: "" },
                ...(specificPlantOptions.length === 0
                  ? [{ label: "No plants yet - add in More", value: "" }]
                  : specificPlantOptions.map((v) => ({ label: v, value: v }))),
              ]}
              selectedValue={plantVariety}
              onValueChange={setPlantVariety}
              label="Plant "
              placeholder="Plant"
              enabled={!!plantType}
              searchable
            />

            {formMode === "advanced" &&
              (varietySuggestions.length > 0 ? (
                <>
                  <ThemedDropdown
                    items={[
                      { label: "Select variety (optional)", value: "" },
                      ...varietySuggestions.map((s) => ({
                        label: s,
                        value: s,
                      })),
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
                  label="Variety"
                  value={variety}
                  onChangeText={(text) =>
                    setVariety(sanitizeAlphaNumericSpaces(text))
                  }
                />
              ))}

            {/* #9 Auto-Name Preview */}
            {!showCustomNameInput ? (
              <View style={styles.namePreviewRow}>
                <Text style={styles.namePreviewFloatingLabel}>Name</Text>
                {generatedPlantName ? (
                  <Text style={styles.namePreviewValue} numberOfLines={1}>
                    {generatedPlantName}
                  </Text>
                ) : (
                  <Text style={styles.namePreviewValuePending}>
                    Auto after selecting plant & location
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.namePreviewActionCustom}
                  onPress={() => {
                    setShowCustomNameInput(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.namePreviewActionTextMuted}>
                    Customise
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.nameCustomRow}>
                <Text style={styles.namePreviewFloatingLabel}>Name</Text>
                <TextInput
                  style={styles.nameCustomInput}
                  placeholder={generatedPlantName || "Enter a custom name"}
                  value={name}
                  onChangeText={(text) =>
                    setName(sanitizeAlphaNumericSpaces(text))
                  }
                  placeholderTextColor={theme.inputPlaceholder}
                  autoFocus
                />
                <View style={styles.nameCustomActions}>
                  {name.trim().length > 0 && (
                    <TouchableOpacity
                      onPress={() => setName("")}
                      accessibilityLabel="Reset to auto-generated name"
                      style={styles.nameCustomClear}
                    >
                      <Ionicons
                        name="close-circle"
                        size={20}
                        color={theme.textSecondary}
                      />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.namePreviewActionUse}
                    onPress={() => {
                      setName("");
                      setShowCustomNameInput(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.namePreviewActionText}>Use Auto ✓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

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
                      <Ionicons
                        name="calendar"
                        size={20}
                        color={theme.primary}
                      />
                    </View>
                    <View style={styles.dateCardContent}>
                      <Text style={styles.dateCardLabel}>Planting Date</Text>
                      <Text
                        style={
                          plantingDate
                            ? styles.dateCardValue
                            : styles.dateCardPlaceholder
                        }
                      >
                        {plantingDate
                          ? formatDateDisplay(plantingDate)
                          : "Tap to select date"}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={theme.textTertiary}
                    />
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

          {/* #1 Phase 2 — unlocks once a plant variety is selected */}
          {!phase2Unlocked && (
            <View style={styles.phaseLockedBanner}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={theme.textTertiary}
              />
              <Text style={styles.phaseLockedText}>
                Select a plant variety above to choose location
              </Text>
            </View>
          )}
          {phase2Unlocked && (
            <CollapsibleSection
              title="Location & Placement"
              icon="location"
              fieldCount={locationFieldCount}
              defaultExpanded={true}
              expanded={sectionExpanded.location}
              onExpandedChange={(expanded) =>
                setSectionExpandedState("location", expanded)
              }
              hasError={
                showValidationErrors && validationErrors.location.length > 0
              }
              sectionStatus={
                showValidationErrors ? undefined : sectionStatuses.location
              }
            >
              <ThemedDropdown
                items={[
                  { label: "Select Main Location", value: "" },
                  ...parentLocationOptions.map((loc) => ({
                    label: loc,
                    value: loc,
                  })),
                ]}
                selectedValue={parentLocation}
                onValueChange={(value) => {
                  setParentLocation(value);
                  if (!value) setChildLocation("");
                }}
                label="Location"
                placeholder="Location"
              />

              {parentLocation !== "" && (
                <>
                  <View style={styles.directionChipsWrapper}>
                    <Text style={styles.directionChipsFloatingLabel}>
                      Direction / Section{" "}
                    </Text>
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

                  {/* #8 Space Type Visual Cards */}
                  <View style={styles.spaceTypeCardsRow}>
                    {(
                      [
                        {
                          value: "ground" as SpaceType,
                          icon: "earth" as React.ComponentProps<typeof Ionicons>['name'],
                          emoji: "🌍",
                          label: "Ground",
                          hint: "Open soil",
                        },
                        {
                          value: "bed" as SpaceType,
                          icon: "apps" as React.ComponentProps<typeof Ionicons>['name'],
                          emoji: "🪴",
                          label: "Raised Bed",
                          hint: "Bed / Border",
                        },
                        {
                          value: "pot" as SpaceType,
                          icon: "cube-outline" as React.ComponentProps<typeof Ionicons>['name'],
                          emoji: "🪣",
                          label: "Pot",
                          hint: "Container",
                        },
                      ] as const
                    ).map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.spaceTypeCard,
                          spaceType === opt.value && styles.spaceTypeCardActive,
                        ]}
                        onPress={() => setSpaceType(opt.value)}
                        activeOpacity={0.75}
                      >
                        <Ionicons
                          name={opt.icon}
                          size={28}
                          color={
                            spaceType === opt.value
                              ? theme.primary
                              : theme.textTertiary
                          }
                          style={styles.spaceTypeCardIcon}
                        />
                        <Text
                          style={[
                            styles.spaceTypeCardLabel,
                            spaceType === opt.value &&
                              styles.spaceTypeCardLabelActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10,
                            color: theme.textTertiary,
                            marginTop: 2,
                          }}
                        >
                          {opt.hint}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {spaceType === "pot" && (
                    <FloatingLabelInput
                      label="Pot Size in inches (e.g., 12)"
                      value={potSize}
                      onChangeText={(text) =>
                        setPotSize(sanitizeNumberText(text))
                      }
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
          )}
          {/* end phase2Unlocked */}

          {/* #1 Phase 3 — unlocks once a location is selected */}
          {phase2Unlocked && !phase3Unlocked && (
            <View style={styles.phaseLockedBanner}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={theme.textTertiary}
              />
              <Text style={styles.phaseLockedText}>
                Choose a location above to set up care schedule
              </Text>
            </View>
          )}
          {phase3Unlocked && (
            <CollapsibleSection
              title="Care & Schedule"
              icon="leaf"
              fieldCount={formMode === "quick" ? 2 : 9}
              defaultExpanded={false}
              expanded={sectionExpanded.care}
              onExpandedChange={(expanded) =>
                setSectionExpandedState("care", expanded)
              }
              hasError={
                showValidationErrors && validationErrors.care.length > 0
              }
              sectionStatus={
                showValidationErrors ? undefined : sectionStatuses.care
              }
            >
              {!plantId && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.smartDefaultsToggle,
                      autoApplyCareDefaults && styles.smartDefaultsToggleActive,
                    ]}
                    onPress={() =>
                      setAutoApplyCareDefaults(!autoApplyCareDefaults)
                    }
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
                          name={
                            autoApplyCareDefaults ? "sparkles" : "leaf-outline"
                          }
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
                          autoApplyCareDefaults &&
                            styles.smartDefaultsLabelActive,
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
                  {autoSuggestFired && !careProfileCardDismissed && (
                    <View style={styles.smartDefaultsBanner}>
                      <View style={styles.smartDefaultsBannerLeft}>
                        <Ionicons
                          name="sparkles"
                          size={16}
                          color={theme.primary}
                        />
                        <View style={styles.smartDefaultsBannerTextWrap}>
                          <Text style={styles.smartDefaultsBannerTitle}>
                            Smart defaults applied for {plantVariety}
                          </Text>
                          <Text style={styles.smartDefaultsBannerSummary}>
                            💧 {wateringFrequency}d · 🌿{" "}
                            {fertilisingFrequency}d ·{" "}
                            {sunlight === "full_sun"
                              ? "☀️ Full"
                              : sunlight === "partial_sun"
                                ? "⛅ Partial"
                                : "🌤️ Shade"}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.smartDefaultsBannerDismiss}
                        onPress={() => setCareProfileCardDismissed(true)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name="close"
                          size={16}
                          color={theme.textTertiary}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
              {formMode === "advanced" && (
                <>
                  <View style={styles.groupedFieldCard}>
                    <View style={styles.groupedFieldCardAccent} />
                    <View style={styles.groupedFieldCardContent}>
                      <Text style={styles.groupedFieldCardTitle}>
                        Growing Conditions
                      </Text>

                      <Text style={styles.fieldGroupLabel}>
                        ☀️ Sunlight Needs
                      </Text>
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
                              sunlight === opt.value &&
                                styles.directionChipActive,
                            ]}
                            onPress={() =>
                              setSunlight(opt.value as SunlightLevel)
                            }
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.directionChipText,
                                sunlight === opt.value &&
                                  styles.directionChipTextActive,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {sunlight === "full_sun" && (
                        <Text style={styles.helperText}>
                          6+ hours of direct sunlight per day.
                        </Text>
                      )}
                      {sunlight === "partial_sun" && (
                        <Text style={styles.helperText}>
                          3–6 hours of direct sunlight per day.
                        </Text>
                      )}
                      {sunlight === "shade" && (
                        <Text style={styles.helperText}>
                          Less than 3 hours of direct sunlight per day.
                        </Text>
                      )}

                      <Text style={styles.fieldGroupLabel}>
                        💧 Water Needs
                      </Text>
                      <View style={styles.directionChipsContainer}>
                        {(
                          [
                            { label: "Low", value: "low", drops: 1 },
                            { label: "Medium", value: "medium", drops: 2 },
                            { label: "High", value: "high", drops: 3 },
                          ] as const
                        ).map((opt) => {
                          const isActive = waterRequirement === opt.value;
                          return (
                            <TouchableOpacity
                              key={opt.value}
                              style={[
                                styles.directionChip,
                                isActive && styles.directionChipActive,
                              ]}
                              onPress={() =>
                                setWaterRequirement(
                                  opt.value as WaterRequirement,
                                )
                              }
                              activeOpacity={0.7}
                            >
                              <View
                                style={styles.waterDropsRow}
                              >
                                {Array.from({ length: opt.drops }).map(
                                  (_, i) => (
                                    <Ionicons
                                      key={i}
                                      name="water"
                                      size={12}
                                      color={
                                        isActive
                                          ? theme.primary
                                          : theme.textTertiary
                                      }
                                    />
                                  ),
                                )}
                              </View>
                              <Text
                                style={[
                                  styles.directionChipText,
                                  isActive && styles.directionChipTextActive,
                                ]}
                              >
                                {opt.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                      {waterRequirement === "low" && (
                        <Text style={styles.helperText}>
                          Water once every 3–5 days. Suits drought-tolerant
                          plants like succulents and native shrubs.
                        </Text>
                      )}
                      {waterRequirement === "medium" && (
                        <Text style={styles.helperText}>
                          Water every 1–2 days. Suitable for most vegetables,
                          herbs, and flowering plants.
                        </Text>
                      )}
                      {waterRequirement === "high" && (
                        <Text style={styles.helperText}>
                          Water daily or twice daily. For moisture-loving plants
                          like paddy, taro, and water spinach.
                        </Text>
                      )}

                      <ThemedDropdown
                        items={[
                          { label: "Garden Soil", value: "garden_soil" },
                          { label: "Potting Mix", value: "potting_mix" },
                          { label: "Coco Peat Mix", value: "coco_peat" },
                          {
                            label: "Red Laterite (Seivaal)",
                            value: "red_laterite",
                          },
                          {
                            label: "Coastal Sandy Soil",
                            value: "coastal_sandy",
                          },
                          {
                            label: "Black Cotton Soil",
                            value: "black_cotton",
                          },
                          { label: "Alluvial Soil", value: "alluvial" },
                          { label: "Custom Mix", value: "custom" },
                        ]}
                        selectedValue={soilType}
                        onValueChange={setSoilType}
                        placeholder="Select soil type"
                        label="Soil Type"
                      />
                    </View>
                  </View>
                </>
              )}
              <View style={styles.fieldGroupDivider} />
              <Text style={styles.fieldGroupLabel}>
                📅 Watering & Feeding Schedule
              </Text>

              {/* Watering frequency stepper */}
              <View style={styles.stepperCard}>
                <View style={styles.stepperHeader}>
                  <View style={styles.stepperIconWrap}>
                    <Ionicons name="water" size={18} color={theme.primary} />
                  </View>
                  <Text style={styles.stepperLabel}>Water every</Text>
                </View>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() =>
                      adjustFrequency(
                        wateringFrequency,
                        -1,
                        setWateringFrequency,
                      )
                    }
                    activeOpacity={0.6}
                    accessibilityLabel="Decrease watering frequency"
                  >
                    <Ionicons name="remove" size={20} color={theme.primary} />
                  </TouchableOpacity>
                  <View style={styles.stepperValueWrap}>
                    <TextInput
                      style={styles.stepperValueInput}
                      value={wateringFrequency}
                      onChangeText={(text) => {
                        const cleaned = sanitizeNumberText(text);
                        setWateringFrequency(cleaned);
                      }}
                      keyboardType="numeric"
                      placeholder="—"
                      placeholderTextColor={theme.inputPlaceholder}
                      maxLength={3}
                      textAlign="center"
                    />
                    <Text style={styles.stepperUnit}>days</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() =>
                      adjustFrequency(
                        wateringFrequency,
                        1,
                        setWateringFrequency,
                      )
                    }
                    activeOpacity={0.6}
                    accessibilityLabel="Increase watering frequency"
                  >
                    <Ionicons name="add" size={20} color={theme.primary} />
                  </TouchableOpacity>
                </View>
                {wateringFrequency ? (
                  <Text style={[styles.stepperHint, { color: theme.primary }]}>
                    {getFrequencyLabel(wateringFrequency)}
                  </Text>
                ) : null}
              </View>

              {/* Feeding frequency stepper */}
              <View style={styles.stepperCard}>
                <View style={styles.stepperHeader}>
                  <View
                    style={[
                      styles.stepperIconWrap,
                      { backgroundColor: theme.accentLight },
                    ]}
                  >
                    <Ionicons name="nutrition" size={18} color={theme.accent} />
                  </View>
                  <Text style={styles.stepperLabel}>Feed every</Text>
                </View>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={[
                      styles.stepperButton,
                      { borderColor: theme.accent },
                    ]}
                    onPress={() =>
                      adjustFrequency(
                        fertilisingFrequency,
                        -1,
                        setFertilisingFrequency,
                      )
                    }
                    activeOpacity={0.6}
                    accessibilityLabel="Decrease feeding frequency"
                  >
                    <Ionicons name="remove" size={20} color={theme.accent} />
                  </TouchableOpacity>
                  <View style={styles.stepperValueWrap}>
                    <TextInput
                      style={styles.stepperValueInput}
                      value={fertilisingFrequency}
                      onChangeText={(text) => {
                        const cleaned = sanitizeNumberText(text);
                        setFertilisingFrequency(cleaned);
                      }}
                      keyboardType="numeric"
                      placeholder="—"
                      placeholderTextColor={theme.inputPlaceholder}
                      maxLength={3}
                      textAlign="center"
                    />
                    <Text style={styles.stepperUnit}>days</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.stepperButton,
                      { borderColor: theme.accent },
                    ]}
                    onPress={() =>
                      adjustFrequency(
                        fertilisingFrequency,
                        1,
                        setFertilisingFrequency,
                      )
                    }
                    activeOpacity={0.6}
                    accessibilityLabel="Increase feeding frequency"
                  >
                    <Ionicons name="add" size={20} color={theme.accent} />
                  </TouchableOpacity>
                </View>
                {fertilisingFrequency ? (
                  <Text style={[styles.stepperHint, { color: theme.accent }]}>
                    {getFrequencyLabel(fertilisingFrequency)}
                  </Text>
                ) : null}
              </View>

              {formMode === "advanced" && (
                <>
                  <View style={{ marginTop: 12 }} />
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
                    label="Preferred Fertiliser"
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
                          color={
                            mulchingUsed ? theme.primary : theme.textSecondary
                          }
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

                  {/* #6 Pruning: only show for fruit trees, shrubs, herbs */}
                  {["fruit_tree", "shrub", "herb"].includes(plantType) && (
                    <>
                      <View style={styles.fieldGroupDivider} />
                      <Text style={styles.fieldGroupLabel}>✂️ Pruning</Text>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 12,
                        }}
                      >
                        <Text
                          style={[
                            styles.frequencyCardLabel,
                            { marginBottom: 0 },
                          ]}
                        >
                          Every
                        </Text>
                        <View
                          style={[
                            styles.frequencyInputWrap,
                            { width: 70, marginBottom: 0 },
                          ]}
                        >
                          <TextInput
                            style={[styles.frequencyInput, { fontSize: 18 }]}
                            value={pruningFrequency}
                            onChangeText={(text) =>
                              setPruningFrequency(sanitizeNumberText(text))
                            }
                            keyboardType="numeric"
                            placeholder="—"
                            placeholderTextColor={theme.inputPlaceholder}
                            maxLength={3}
                          />
                        </View>
                        <Text
                          style={[
                            styles.frequencyCardLabel,
                            { marginBottom: 0 },
                          ]}
                        >
                          days
                        </Text>
                      </View>

                      {(() => {
                        const userOverride =
                          plantType && plantVariety
                            ? plantCareProfiles[plantType]?.[plantVariety]
                            : undefined;
                        const info = getPruningTechniques(
                          plantType,
                          plantVariety,
                          userOverride,
                        );
                        const hasTips =
                          info.tips.length > 0 ||
                          info.shapePruning ||
                          info.flowerPruning;
                        return hasTips ? (
                          <View
                            style={{
                              backgroundColor: theme.backgroundSecondary,
                              borderRadius: 10,
                              padding: 12,
                              borderWidth: 1,
                              borderColor: theme.borderLight,
                              marginBottom: 8,
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 6,
                                marginBottom: 8,
                              }}
                            >
                              <Ionicons
                                name="bulb-outline"
                                size={16}
                                color={theme.accent}
                              />
                              <Text
                                style={{
                                  fontSize: 12,
                                  fontWeight: "700",
                                  color: theme.textSecondary,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                }}
                              >
                                Pruning Tips
                                {plantVariety ? ` — ${plantVariety}` : ""}
                              </Text>
                            </View>
                            {info.tips.map((tip, i) => (
                              <View
                                key={i}
                                style={{
                                  flexDirection: "row",
                                  alignItems: "flex-start",
                                  gap: 6,
                                  marginBottom: 4,
                                }}
                              >
                                <Text
                                  style={{
                                    color: theme.textTertiary,
                                    fontSize: 13,
                                    lineHeight: 18,
                                  }}
                                >
                                  {"\u2022"}
                                </Text>
                                <Text
                                  style={{
                                    color: theme.text,
                                    fontSize: 13,
                                    lineHeight: 18,
                                    flex: 1,
                                  }}
                                >
                                  {tip}
                                </Text>
                              </View>
                            ))}
                            {info.shapePruning && (
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "flex-start",
                                  gap: 6,
                                  marginTop: info.tips.length > 0 ? 6 : 0,
                                  marginBottom: 4,
                                }}
                              >
                                <Text style={{ fontSize: 13, lineHeight: 18 }}>
                                  {"\u2702\uFE0F"}
                                </Text>
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={{
                                      color: theme.text,
                                      fontSize: 13,
                                      lineHeight: 18,
                                      fontWeight: "600",
                                    }}
                                  >
                                    Shape pruning
                                    <Text style={{ fontWeight: "400" }}>
                                      {" "}
                                      — {info.shapePruning.tip}
                                    </Text>
                                  </Text>
                                  <Text
                                    style={{
                                      color: theme.primary,
                                      fontSize: 12,
                                      fontWeight: "600",
                                      marginTop: 2,
                                    }}
                                  >
                                    Best: {info.shapePruning.months}
                                  </Text>
                                </View>
                              </View>
                            )}
                            {info.flowerPruning && (
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "flex-start",
                                  gap: 6,
                                  marginTop: 4,
                                }}
                              >
                                <Text style={{ fontSize: 13, lineHeight: 18 }}>
                                  {"\uD83C\uDF38"}
                                </Text>
                                <View style={{ flex: 1 }}>
                                  <Text
                                    style={{
                                      color: theme.text,
                                      fontSize: 13,
                                      lineHeight: 18,
                                      fontWeight: "600",
                                    }}
                                  >
                                    Flower pruning
                                    <Text style={{ fontWeight: "400" }}>
                                      {" "}
                                      — {info.flowerPruning.tip}
                                    </Text>
                                  </Text>
                                  <Text
                                    style={{
                                      color: theme.primary,
                                      fontSize: 12,
                                      fontWeight: "600",
                                      marginTop: 2,
                                    }}
                                  >
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
                </>
              )}
            </CollapsibleSection>
          )}
          {/* end phase3Unlocked */}

          {/* #1 More Details accordion — advanced sections grouped at bottom */}
          {formMode === "advanced" && phase3Unlocked && (
            <>
              <TouchableOpacity
                style={styles.moreDetailsTouchable}
                onPress={() => setShowMoreDetails((v) => !v)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showMoreDetails ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={theme.primary}
                />
                <Text style={styles.moreDetailsText}>
                  {showMoreDetails
                    ? "Hide Details"
                    : "More Details (Health, Harvest, Notes…)"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {formMode === "advanced" && phase3Unlocked && showMoreDetails && (
            <>
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
                sectionStatus="optional"
              >
                <Text style={styles.fieldGroupLabel}>🌿 Health Status</Text>
                <View style={styles.chipGrid}>
                  {HEALTH_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.chipGridItem,
                        healthStatus === opt.value && styles.chipGridItemActive,
                      ]}
                      onPress={() => setHealthStatus(opt.value as HealthStatus)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipGridItemText,
                          healthStatus === opt.value &&
                            styles.chipGridItemTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {healthStatus === "healthy" && (
                  <Text style={styles.helperText}>
                    Plant looks good — no visible stress, pests, or disease.
                    Growing normally.
                  </Text>
                )}
                {healthStatus === "stressed" && (
                  <Text style={styles.helperText}>
                    Early warning signs like wilting, yellowing tips, or slow
                    growth — usually from environment (sun, water, transplant
                    shock). Can recover with corrective care.
                  </Text>
                )}
                {healthStatus === "recovering" && (
                  <Text style={styles.helperText}>
                    Previously stressed or sick, now improving. May still show
                    some damage but new growth looks healthy.
                  </Text>
                )}
                {healthStatus === "sick" && (
                  <Text style={styles.helperText}>
                    Active disease, fungal infection, rot, or heavy pest
                    infestation. Needs treatment — not just adjusted conditions.
                  </Text>
                )}

                <Text style={styles.fieldGroupLabel}>🌱 Growth Stage</Text>
                <View style={styles.chipGrid}>
                  {GROWTH_STAGE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.chipGridItem,
                        growthStage === opt.value && styles.chipGridItemActive,
                      ]}
                      onPress={() => setGrowthStage(opt.value as GrowthStage)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipGridItemText,
                          growthStage === opt.value &&
                            styles.chipGridItemTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {growthStage === "seedling" && (
                  <Text style={styles.helperText}>
                    Just sprouted or recently transplanted. Needs gentle care —
                    avoid direct harsh sun and overwatering.
                  </Text>
                )}
                {growthStage === "vegetative" && (
                  <Text style={styles.helperText}>
                    Actively growing leaves and stems. Focus on regular
                    watering, feeding, and ensuring good sunlight.
                  </Text>
                )}
                {growthStage === "flowering" && (
                  <Text style={styles.helperText}>
                    Producing buds and flowers. Reduce nitrogen fertiliser;
                    support with phosphorus and potassium.
                  </Text>
                )}
                {growthStage === "fruiting" && (
                  <Text style={styles.helperText}>
                    Setting or ripening fruit. Ensure consistent watering and
                    watch for pests attracted to fruit.
                  </Text>
                )}
                {growthStage === "mature" && (
                  <Text style={styles.helperText}>
                    Fully established plant. Maintenance care — regular pruning,
                    seasonal feeding, and pest monitoring.
                  </Text>
                )}
                {growthStage === "dormant" && (
                  <Text style={styles.helperText}>
                    Resting phase — growth slows or stops. Reduce watering and
                    feeding. Normal for seasonal or perennial plants.
                  </Text>
                )}
              </CollapsibleSection>

              {/* Harvest Information — only relevant for vegetable/fruit/herb */}
              {["vegetable", "fruit_tree", "herb"].includes(plantType) && (
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
                  sectionStatus="optional"
                >
                  <View style={styles.directionChipsWrapper}>
                    <Text style={styles.directionChipsFloatingLabel}>Harvest Season</Text>
                    <View style={styles.directionChipsContainer}>
                      {harvestSeasonOptions.map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={[
                            styles.directionChip,
                            harvestSeason === s && styles.directionChipActive,
                          ]}
                          onPress={() =>
                            setHarvestSeason(harvestSeason === s ? "" : s)
                          }
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.directionChipText,
                              harvestSeason === s &&
                                styles.directionChipTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {s}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {plantType === "fruit_tree" && (
                    <>
                      <View style={styles.fieldGroupDivider} />
                      <Text style={styles.fieldGroupLabel}>
                        Harvest Date Range
                      </Text>
                      <View style={styles.dateCard}>
                        <TouchableOpacity
                          style={styles.dateCardTouchable}
                          onPress={() => setShowStartDatePicker(true)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.dateCardIconWrap}>
                            <Ionicons
                              name="play"
                              size={18}
                              color={theme.primary}
                            />
                          </View>
                          <View style={styles.dateCardContent}>
                            <Text style={styles.dateCardLabel}>Start Date</Text>
                            <Text
                              style={
                                harvestStartDate
                                  ? styles.dateCardValue
                                  : styles.dateCardPlaceholder
                              }
                            >
                              {harvestStartDate
                                ? formatDateDisplay(harvestStartDate)
                                : "Tap to select"}
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={theme.textTertiary}
                          />
                        </TouchableOpacity>
                      </View>
                      {showStartDatePicker && (
                        <DateTimePicker
                          value={
                            harvestStartDate
                              ? new Date(harvestStartDate)
                              : new Date()
                          }
                          mode="date"
                          display={
                            Platform.OS === "ios" ? "spinner" : "default"
                          }
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
                          <View
                            style={[
                              styles.dateCardIconWrap,
                              { backgroundColor: theme.accentLight },
                            ]}
                          >
                            <Ionicons
                              name="stop"
                              size={18}
                              color={theme.accent}
                            />
                          </View>
                          <View style={styles.dateCardContent}>
                            <Text style={styles.dateCardLabel}>End Date</Text>
                            <Text
                              style={
                                harvestEndDate
                                  ? styles.dateCardValue
                                  : styles.dateCardPlaceholder
                              }
                            >
                              {harvestEndDate
                                ? formatDateDisplay(harvestEndDate)
                                : "Tap to select"}
                            </Text>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={theme.textTertiary}
                          />
                        </TouchableOpacity>
                      </View>
                      {showEndDatePicker && (
                        <DateTimePicker
                          value={
                            harvestEndDate
                              ? new Date(harvestEndDate)
                              : new Date()
                          }
                          mode="date"
                          display={
                            Platform.OS === "ios" ? "spinner" : "default"
                          }
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
              {plantType === "coconut_tree" && (
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
                  sectionStatus="optional"
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
                        <Text
                          style={[styles.infoCardTitle, { color: "#8B5A2B" }]}
                        >
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
                        • Fertilise every{" "}
                        {coconutAgeInfo.fertilisingFrequencyDays} days
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
                      <View
                        style={[
                          styles.statCardIconWrap,
                          { backgroundColor: theme.primaryLight },
                        ]}
                      >
                        <Ionicons name="leaf" size={16} color={theme.primary} />
                      </View>
                      <Text style={styles.statCardLabel}>Fronds</Text>
                      <View style={styles.statCardInputWrap}>
                        <TextInput
                          style={styles.statCardInput}
                          value={coconutFrondsCount}
                          onChangeText={(text) =>
                            setCoconutFrondsCount(sanitizeNumberText(text))
                          }
                          keyboardType="numeric"
                          placeholder="—"
                          placeholderTextColor={theme.inputPlaceholder}
                          maxLength={3}
                        />
                      </View>
                    </View>
                    <View style={styles.statCard}>
                      <View
                        style={[
                          styles.statCardIconWrap,
                          { backgroundColor: theme.accentLight },
                        ]}
                      >
                        <Ionicons
                          name="ellipse"
                          size={16}
                          color={theme.accent}
                        />
                      </View>
                      <Text style={styles.statCardLabel}>Nuts/mo</Text>
                      <View style={styles.statCardInputWrap}>
                        <TextInput
                          style={styles.statCardInput}
                          value={nutsPerMonth}
                          onChangeText={(text) =>
                            setNutsPerMonth(sanitizeNumberText(text))
                          }
                          keyboardType="numeric"
                          placeholder="—"
                          placeholderTextColor={theme.inputPlaceholder}
                          maxLength={3}
                        />
                      </View>
                    </View>
                    <View style={styles.statCard}>
                      <View
                        style={[
                          styles.statCardIconWrap,
                          { backgroundColor: theme.warningLight },
                        ]}
                      >
                        <Ionicons
                          name="flower"
                          size={16}
                          color={theme.warning}
                        />
                      </View>
                      <Text style={styles.statCardLabel}>Spathes</Text>
                      <View style={styles.statCardInputWrap}>
                        <TextInput
                          style={styles.statCardInput}
                          value={spatheCount}
                          onChangeText={(text) =>
                            setSpatheCount(sanitizeNumberText(text))
                          }
                          keyboardType="numeric"
                          placeholder="—"
                          placeholderTextColor={theme.inputPlaceholder}
                          maxLength={3}
                        />
                      </View>
                    </View>
                  </View>
                  <Text style={styles.helperText}>
                    Fronds: 30–35 is healthy. Spathes: 1–2/month for bearing
                    trees.
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
                        <Ionicons
                          name="arrow-up"
                          size={18}
                          color={theme.primary}
                        />
                      </View>
                      <View style={styles.dateCardContent}>
                        <Text style={styles.dateCardLabel}>
                          Last Climbing / Harvest
                        </Text>
                        <Text
                          style={
                            lastClimbingDate
                              ? styles.dateCardValue
                              : styles.dateCardPlaceholder
                          }
                        >
                          {lastClimbingDate
                            ? formatDateDisplay(lastClimbingDate)
                            : "Tap to select"}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={theme.textTertiary}
                      />
                    </TouchableOpacity>
                  </View>
                  {showClimbingDatePicker && (
                    <DateTimePicker
                      value={
                        lastClimbingDate
                          ? new Date(lastClimbingDate)
                          : new Date()
                      }
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(_, selectedDate) => {
                        setShowClimbingDatePicker(Platform.OS === "ios");
                        if (selectedDate) {
                          setLastClimbingDate(toLocalDateString(selectedDate));
                        }
                      }}
                    />
                  )}
                  {coconutAgeInfo &&
                    coconutAgeInfo.harvestFrequencyDays > 0 && (
                      <Text style={styles.helperText}>
                        Suggested harvest cycle: every{" "}
                        {coconutAgeInfo.harvestFrequencyDays} days for this
                        stage.
                      </Text>
                    )}

                  <View style={styles.fieldGroupDivider} />
                  <Text style={styles.fieldGroupLabel}>
                    Nut Fall Monitoring
                  </Text>

                  <View style={styles.frequencyRow}>
                    <View style={styles.frequencyCard}>
                      <View
                        style={[
                          styles.frequencyIconWrap,
                          { backgroundColor: theme.errorLight },
                        ]}
                      >
                        <Ionicons
                          name="arrow-down"
                          size={18}
                          color={theme.error}
                        />
                      </View>
                      <Text style={styles.frequencyCardLabel}>Falls</Text>
                      <View style={styles.frequencyInputWrap}>
                        <TextInput
                          style={styles.frequencyInput}
                          value={nutFallCount}
                          onChangeText={(text) =>
                            setNutFallCount(sanitizeNumberText(text))
                          }
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
                    High count (&gt;10) may indicate Red Palm Weevil, water
                    stress, or boron deficiency.
                  </Text>

                  <View style={styles.dateCard}>
                    <TouchableOpacity
                      style={styles.dateCardTouchable}
                      onPress={() => setShowNutFallDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.dateCardIconWrap,
                          { backgroundColor: theme.errorLight },
                        ]}
                      >
                        <Ionicons
                          name="alert-circle"
                          size={18}
                          color={theme.error}
                        />
                      </View>
                      <View style={styles.dateCardContent}>
                        <Text style={styles.dateCardLabel}>
                          Last Nut Fall Incident
                        </Text>
                        <Text
                          style={
                            lastNutFallDate
                              ? styles.dateCardValue
                              : styles.dateCardPlaceholder
                          }
                        >
                          {lastNutFallDate
                            ? formatDateDisplay(lastNutFallDate)
                            : "Tap to select"}
                        </Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={theme.textTertiary}
                      />
                    </TouchableOpacity>
                  </View>
                  {showNutFallDatePicker && (
                    <DateTimePicker
                      value={
                        lastNutFallDate ? new Date(lastNutFallDate) : new Date()
                      }
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(_, selectedDate) => {
                        setShowNutFallDatePicker(Platform.OS === "ios");
                        if (selectedDate) {
                          setLastNutFallDate(toLocalDateString(selectedDate));
                        }
                      }}
                    />
                  )}
                </CollapsibleSection>
              )}

              {/* Notes, Pest History & Companions */}
              {
                <CollapsibleSection
                  title="Notes & History"
                  icon="document-text"
                  fieldCount={notesHistoryFieldCount}
                  defaultExpanded={false}
                  expanded={sectionExpanded.notesHistory}
                  onExpandedChange={(expanded) =>
                    setSectionExpandedState("notesHistory", expanded)
                  }
                  hasError={
                    showValidationErrors &&
                    validationErrors.notesHistory.length > 0
                  }
                  sectionStatus="optional"
                >
                  <View style={styles.notesCard}>
                    <View style={styles.notesCardHeader}>
                      <Ionicons
                        name="document-text-outline"
                        size={16}
                        color={theme.textTertiary}
                      />
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
                          <Text style={styles.infoCardTitle}>
                            Companion Plants
                          </Text>
                        </View>
                        <Text style={styles.infoCardSubtext}>
                          Good companion plants for {plantVariety}:
                        </Text>
                        <View style={styles.chipContainer}>
                          {getCompanionSuggestions(plantVariety).map(
                            (companion) => (
                              <View
                                key={companion}
                                style={styles.companionChip}
                              >
                                <Text style={styles.companionChipText}>
                                  {companion}
                                </Text>
                              </View>
                            ),
                          )}
                        </View>
                      </View>
                    )}

                  {plantVariety &&
                    getIncompatiblePlants(plantVariety).length > 0 && (
                      <View style={styles.infoCard}>
                        <View style={styles.infoCardHeader}>
                          <Ionicons name="warning" size={20} color="#f57c00" />
                          <Text style={styles.infoCardTitle}>
                            Avoid Planting With
                          </Text>
                        </View>
                        <Text style={styles.infoCardSubtext}>
                          These plants can compete with {plantVariety}:
                        </Text>
                        <View style={styles.chipContainer}>
                          {getIncompatiblePlants(plantVariety).map(
                            (incompatible) => (
                              <View
                                key={incompatible}
                                style={styles.incompatibleChip}
                              >
                                <Text style={styles.incompatibleChipText}>
                                  {incompatible}
                                </Text>
                              </View>
                            ),
                          )}
                        </View>
                      </View>
                    )}
                </CollapsibleSection>
              }

              {/* Pest & Disease Section — own collapsible */}
              {
                <CollapsibleSection
                  title="Pest & Disease"
                  icon="bug"
                  fieldCount={pestDiseaseFieldCount}
                  defaultExpanded={false}
                  expanded={sectionExpanded.pestDisease}
                  onExpandedChange={(expanded) =>
                    setSectionExpandedState("pestDisease", expanded)
                  }
                  hasError={
                    showValidationErrors &&
                    validationErrors.pestDisease.length > 0
                  }
                  sectionStatus="optional"
                >
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.fieldGroupLabel}>
                      🐛 Pest & Disease Records
                    </Text>
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
                        .sort((a, b) =>
                          a.record.resolved === b.record.resolved
                            ? 0
                            : a.record.resolved
                              ? 1
                              : -1,
                        )
                        .map(({ record, index }) => (
                          <TouchableOpacity
                            key={record.id || index}
                            style={[
                              styles.pestDiseaseCard,
                              {
                                borderLeftWidth: 3,
                                borderLeftColor: record.resolved
                                  ? "#4CAF50"
                                  : "#f44336",
                              },
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
                                name={
                                  record.type === "pest" ? "bug" : "medical"
                                }
                                size={20}
                                color={record.resolved ? "#4CAF50" : "#f44336"}
                              />
                              <Text style={styles.pestDiseaseName}>
                                {record.name}
                              </Text>
                              {record.resolved && (
                                <View style={styles.resolvedBadge}>
                                  <Text style={styles.resolvedText}>
                                    Resolved
                                  </Text>
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
                                {record.severity && record.affectedPart
                                  ? "  |  "
                                  : ""}
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
                                  pestDiseaseHistory.filter(
                                    (_, i) => i !== index,
                                  ),
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
              }
            </>
          )}
          {/* end showMoreDetails */}

          {/* Discard Changes Modal */}
          <DiscardChangesModal
            visible={showDiscardModal}
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
            editingRecord={
              editingPestIndex !== null ? currentPestDisease : null
            }
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
      </KeyboardAvoidingView>

      {/* #7 Sticky Save Button */}
      <View
        style={[
          styles.stickySaveContainer,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.stickySaveButton,
            loading && styles.stickySaveButtonDisabled,
          ]}
          onPress={() => handleSave()}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.stickySaveButtonText}>
            {loading ? "Saving..." : plantId ? "Save Changes" : "Save Plant"}
          </Text>
          {showValidationErrors && totalErrorCount > 0 && (
            <View style={styles.stickySaveErrorBadge}>
              <Text style={styles.stickySaveErrorBadgeText}>
                {totalErrorCount} issue{totalErrorCount > 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <PhotoSourceModal
        visible={showPhotoSourceModal}
        onClose={() => setShowPhotoSourceModal(false)}
        onCamera={openCamera}
        onLibrary={openImageLibrary}
      />
    </View>
  );
}
