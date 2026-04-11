import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { BackHandler, Animated, Alert, Platform, ScrollView, useWindowDimensions } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  PlantFormScreenNavigationProp,
  PlantFormScreenRouteProp,
} from "../types/navigation.types";
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
  PlantCareProfiles,
} from "../types/database.types";
import {
  calculateExpectedHarvestDate,
  getDefaultHarvestSeason,
  CoconutAgeInfo,
  getCoconutAgeInfo,
} from "../utils/plantHelpers";
import {
  getPlantCareProfile,
  hasPlantCareProfile,
} from "../utils/plantCareDefaults";
import { useTheme } from "../theme";
import type { Theme } from "../theme/colors";
import { getLocationConfig } from "../services/locations";
import { usePlantFormData } from "./usePlantFormData";
import { toLocalDateString } from "../utils/dateHelpers";
import { logger } from "../utils/logger";
import { getErrorMessage } from "../utils/errorLogging";
import type { EdgeInsets } from "react-native-safe-area-context";
import {
  buildGeneratedPlantNameBase,
  isGeneratedPlantName,
  buildGeneratedPlantName,
} from "../utils/plantNameGenerator";
import {
  NOTES_MAX_LENGTH,
  sanitizeNumberText,
  type FormSectionKey,
  CATEGORY_OPTIONS,
  HEALTH_OPTIONS,
  GROWTH_STAGE_OPTIONS,
  getFrequencyLabel,
  adjustFrequency,
} from "../utils/plantFormConstants";

// Re-export for consumers that already import from this module
export {
  NOTES_MAX_LENGTH,
  sanitizeNumberText,
  type FormSectionKey,
  CATEGORY_OPTIONS,
  HEALTH_OPTIONS,
  GROWTH_STAGE_OPTIONS,
  getFrequencyLabel,
  adjustFrequency,
};

// ─── PlantFormStateReturn interface ──────────────────────────────────────────

export interface PlantFormStateReturn {
  plantId: string | undefined;
  theme: Theme;
  insets: EdgeInsets;
  isCompactScreen: boolean;
  scrollViewRef: React.RefObject<ScrollView | null>;
  isSaving: React.MutableRefObject<boolean>;
  isDiscarding: React.MutableRefObject<boolean>;

  existingPlants: Plant[];
  setExistingPlants: React.Dispatch<React.SetStateAction<Plant[]>>;
  plantCareProfiles: Partial<PlantCareProfiles>;
  careProfilesLoaded: boolean;
  locationShortNames: Record<string, string>;
  parentLocationOptions: string[];
  childLocationOptions: string[];
  specificPlantOptions: string[];
  varietySuggestions: string[];
  harvestSeasonOptions: string[];

  name: string;
  setName: (v: string) => void;
  loadedGeneratedName: string;
  setLoadedGeneratedName: (v: string) => void;
  plantType: PlantType;
  setPlantType: (v: PlantType) => void;
  plantVariety: string;
  setPlantVariety: (v: string) => void;
  spaceType: SpaceType;
  setSpaceType: (v: SpaceType) => void;
  location: string;
  parentLocation: string;
  setParentLocation: (v: string) => void;
  childLocation: string;
  setChildLocation: (v: string) => void;
  landmarks: string;
  setLandmarks: (v: string) => void;
  bedName: string;
  setBedName: (v: string) => void;
  potSize: string;
  setPotSize: (v: string) => void;
  variety: string;
  setVariety: (v: string) => void;
  customVarietyMode: boolean;
  setCustomVarietyMode: (v: boolean) => void;
  plantingDate: string;
  setPlantingDate: (v: string) => void;
  harvestSeason: string;
  setHarvestSeason: (v: string) => void;
  harvestStartDate: string;
  setHarvestStartDate: (v: string) => void;
  harvestEndDate: string;
  setHarvestEndDate: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  photoUri: string | null;
  setPhotoUri: (v: string | null) => void;
  photoFilename: string | null;
  setPhotoFilename: (v: string | null) => void;
  sunlight: SunlightLevel;
  setSunlight: (v: SunlightLevel) => void;
  soilType: SoilType;
  setSoilType: (v: SoilType) => void;
  waterRequirement: WaterRequirement;
  setWaterRequirement: (v: WaterRequirement) => void;
  wateringFrequency: string;
  setWateringFrequency: (v: string) => void;
  fertilisingFrequency: string;
  setFertilisingFrequency: (v: string) => void;
  preferredFertiliser: FertiliserType;
  setPreferredFertiliser: (v: FertiliserType) => void;
  mulchingUsed: boolean;
  setMulchingUsed: (v: boolean) => void;
  healthStatus: HealthStatus;
  setHealthStatus: (v: HealthStatus) => void;
  expectedHarvestDate: string;
  pestDiseaseHistory: PestDiseaseRecord[];
  setPestDiseaseHistory: (v: PestDiseaseRecord[]) => void;
  growthStage: GrowthStage;
  setGrowthStage: (v: GrowthStage) => void;
  pruningFrequency: string;
  setPruningFrequency: (v: string) => void;
  pruningNotes: string;
  setPruningNotes: (v: string) => void;
  coconutFrondsCount: string;
  setCoconutFrondsCount: (v: string) => void;
  nutsPerMonth: string;
  setNutsPerMonth: (v: string) => void;
  lastClimbingDate: string;
  setLastClimbingDate: (v: string) => void;
  spatheCount: string;
  setSpatheCount: (v: string) => void;
  nutFallCount: string;
  setNutFallCount: (v: string) => void;
  lastNutFallDate: string;
  setLastNutFallDate: (v: string) => void;
  coconutAgeInfo: CoconutAgeInfo | null;

  loading: boolean;
  dataLoading: boolean;
  hasUnsavedChanges: boolean;
  showDiscardModal: boolean;
  setShowDiscardModal: (v: boolean) => void;
  showPestDiseaseModal: boolean;
  setShowPestDiseaseModal: (v: boolean) => void;
  showPhotoSourceModal: boolean;
  setShowPhotoSourceModal: (v: boolean) => void;
  showValidationErrors: boolean;
  showCustomNameInput: boolean;
  setShowCustomNameInput: (v: boolean) => void;
  autoApplyCareDefaults: boolean;
  setAutoApplyCareDefaults: (v: boolean) => void;
  autoSuggestFired: boolean;
  locationDefaultsFired: boolean;
  careProfileCardDismissed: boolean;
  setCareProfileCardDismissed: (v: boolean) => void;
  sectionExpanded: Record<FormSectionKey, boolean>;
  currentPestDisease: PestDiseaseRecord;
  setCurrentPestDisease: (v: PestDiseaseRecord) => void;
  editingPestIndex: number | null;
  setEditingPestIndex: (v: number | null) => void;
  pestPhotoUri: string | null;
  setPestPhotoUri: (v: string | null) => void;
  showPlantingDatePicker: boolean;
  setShowPlantingDatePicker: (v: boolean) => void;
  showStartDatePicker: boolean;
  setShowStartDatePicker: (v: boolean) => void;
  showEndDatePicker: boolean;
  setShowEndDatePicker: (v: boolean) => void;
  showClimbingDatePicker: boolean;
  setShowClimbingDatePicker: (v: boolean) => void;
  showNutFallDatePicker: boolean;
  setShowNutFallDatePicker: (v: boolean) => void;

  wizardStep: 1 | 2 | 3;
  slideX: Animated.Value;
  slideOpacity: Animated.Value;

  generatedPlantName: string;
  formProgress: { filled: number; total: number; percent: number };
  validationErrors: Record<FormSectionKey, string[]>;
  totalErrorCount: number;
  sectionStatuses: Record<
    FormSectionKey,
    "required_incomplete" | "complete" | "optional"
  >;
  phase2Unlocked: boolean;
  phase3Unlocked: boolean;

  handleSave: (onSuccessOverride?: () => void) => Promise<void>;
  handleBackPress: () => void;
  handleDiscard: () => void;
  setSectionExpandedState: (section: FormSectionKey, expanded: boolean) => void;
  openCamera: () => Promise<void>;
  openImageLibrary: () => Promise<void>;
  pickImage: () => void;
  runSlideTransition: (
    direction: "forward" | "back",
    newStep: 1 | 2 | 3,
  ) => void;
  getWizardStepErrors: (step: 1 | 2 | 3) => string | null;
  navigateToPlantsAfterSave: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlantFormState(): PlantFormStateReturn {
  const navigation = useNavigation<PlantFormScreenNavigationProp>();
  const route = useRoute<PlantFormScreenRouteProp>();
  const { plantId } = route.params ?? {};
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isCompactScreen = screenWidth <= 380;

  // ── Field state ────────────────────────────────────────────────────────────
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
  const [customVarietyMode, setCustomVarietyMode] = useState(false);
  const [plantingDate, setPlantingDate] = useState("");
  const [harvestSeason, setHarvestSeason] = useState("");
  const [harvestStartDate, setHarvestStartDate] = useState("");
  const [harvestEndDate, setHarvestEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoFilename, setPhotoFilename] = useState<string | null>(null);
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
  const [expectedHarvestDate, setExpectedHarvestDate] = useState("");
  const [pestDiseaseHistory, setPestDiseaseHistory] = useState<
    PestDiseaseRecord[]
  >([]);
  const [growthStage, setGrowthStage] = useState<GrowthStage>("seedling");
  const [pruningFrequency, setPruningFrequency] = useState("");
  const [pruningNotes, setPruningNotes] = useState("");
  const [coconutFrondsCount, setCoconutFrondsCount] = useState("");
  const [nutsPerMonth, setNutsPerMonth] = useState("");
  const [lastClimbingDate, setLastClimbingDate] = useState("");
  const [spatheCount, setSpatheCount] = useState("");
  const [nutFallCount, setNutFallCount] = useState("");
  const [lastNutFallDate, setLastNutFallDate] = useState("");
  const [coconutAgeInfo, setCoconutAgeInfo] = useState<CoconutAgeInfo | null>(
    null,
  );

  // ── UI state ───────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(!!plantId);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showPestDiseaseModal, setShowPestDiseaseModal] = useState(false);
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [showCustomNameInput, setShowCustomNameInput] = useState(false);
  const [autoApplyCareDefaults, setAutoApplyCareDefaults] = useState(true);
  const [autoSuggestFired, setAutoSuggestFired] = useState(false);
  const [locationDefaultsFired, setLocationDefaultsFired] = useState(false);
  const [careProfileCardDismissed, setCareProfileCardDismissed] =
    useState(false);
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
  const [showPlantingDatePicker, setShowPlantingDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showClimbingDatePicker, setShowClimbingDatePicker] = useState(false);
  const [showNutFallDatePicker, setShowNutFallDatePicker] = useState(false);

  // ── Wizard state ───────────────────────────────────────────────────────────
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const slideX = useRef(new Animated.Value(0)).current;
  const slideOpacity = useRef(new Animated.Value(1)).current;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const initialDataLoaded = useRef(false);
  const isSaving = useRef(false);
  const isDiscarding = useRef(false);
  const savedSuccessfully = useRef(false);
  const autoSuggestApplied = useRef(false);
  const locationDefaultsApplied = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const formSnapshot = useRef<string>("");
  const shouldCaptureSnapshot = useRef(false);

  // ── Data hook ──────────────────────────────────────────────────────────────
  const {
    existingPlants,
    setExistingPlants,
    plantCareProfiles,
    careProfilesLoaded,
    locationShortNames,
    locationProfiles,
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
    formMode: "advanced",
    customVarietyMode,
  });

  // ── Derived values ─────────────────────────────────────────────────────────

  const generatedPlantNameBase = useMemo(
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

  const generatedPlantName = useMemo(
    () =>
      buildGeneratedPlantName(
        generatedPlantNameBase,
        existingPlants,
        plantId,
        loadedGeneratedName,
      ),
    [existingPlants, generatedPlantNameBase, loadedGeneratedName, plantId],
  );

  const phase2Unlocked = useMemo(
    () => !!plantId || (!!plantVariety && !!plantType),
    [plantId, plantVariety, plantType],
  );
  const phase3Unlocked = useMemo(
    () => !!plantId || (phase2Unlocked && !!parentLocation),
    [plantId, phase2Unlocked, parentLocation],
  );

  const pestDiseaseFieldCount = useMemo(
    () => Math.max(1, pestDiseaseHistory.length),
    [pestDiseaseHistory.length],
  );

  const validationErrors = useMemo(() => {
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
    if (!plantVariety.trim())
      errors.basic.push("Please select a specific plant type");
    if (!parentLocation.trim())
      errors.location.push("Please select a main location");
    if (!childLocation.trim())
      errors.location.push("Please select a direction/section");
    if (
      !wateringFrequency.trim() ||
      isNaN(parseInt(wateringFrequency, 10)) ||
      parseInt(wateringFrequency, 10) < 1
    )
      errors.care.push("Please enter a valid watering frequency (number of days)");
    if (
      !fertilisingFrequency.trim() ||
      isNaN(parseInt(fertilisingFrequency, 10)) ||
      parseInt(fertilisingFrequency, 10) < 1
    )
      errors.care.push("Please enter a valid fertilising frequency (number of days)");
    if (notes.length > NOTES_MAX_LENGTH)
      errors.notesHistory.push(`Notes must be ${NOTES_MAX_LENGTH} characters or less`);
    return errors;
  }, [
    plantVariety,
    parentLocation,
    childLocation,
    wateringFrequency,
    fertilisingFrequency,
    notes,
  ]);

  const totalErrorCount = useMemo(
    () => Object.values(validationErrors).reduce((sum, arr) => sum + arr.length, 0),
    [validationErrors],
  );

  const sectionStatuses = useMemo(
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

  const formProgress = useMemo(() => {
    let total = basicFieldCount + locationFieldCount + 9;
    total += 2;
    total += harvestSectionFieldCount;
    total += notesHistoryFieldCount;
    total += pestDiseaseFieldCount;
    if (plantType === "coconut_tree") total += 3;

    let filled = 0;
    if (photoUri) filled += 1;
    if (name || plantVariety) filled += 1;
    if (plantType) filled += 1;
    if (plantVariety) filled += 1;
    if (customVarietyMode || variety) filled += 1;
    if (plantingDate) filled += 1;
    if (parentLocation) filled += 1;
    if (parentLocation && childLocation) filled += 1;
    if (landmarks) filled += 1;
    if (wateringFrequency) filled += 1;
    if (fertilisingFrequency) filled += 1;
    if (sunlight) filled += 1;
    if (waterRequirement) filled += 1;
    if (soilType) filled += 1;
    if (preferredFertiliser) filled += 1;
    if (typeof mulchingUsed === "boolean") filled += 1;
    if (pruningFrequency) filled += 1;
    if (pruningNotes) filled += 1;
    if (healthStatus) filled += 1;
    if (growthStage) filled += 1;
    if (harvestSeason) filled += 1;
    if (expectedHarvestDate) filled += 1;
    if (plantType === "fruit_tree") {
      if (harvestStartDate) filled += 1;
      if (harvestEndDate) filled += 1;
    }
    if (notes) filled += 1;
    filled += pestDiseaseHistory.length;
    if (plantType === "coconut_tree") {
      if (coconutFrondsCount) filled += 1;
      if (nutsPerMonth) filled += 1;
      if (lastClimbingDate) filled += 1;
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
    plantType,
    photoUri,
    name,
    plantVariety,
    variety,
    customVarietyMode,
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

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (plantId) {
      loadPlant();
    } else {
      const timeoutId = setTimeout(() => {
        initialDataLoaded.current = true;
      }, 500);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plantId]);

  // Detect unsaved changes by comparing current values to a snapshot
  useEffect(() => {
    const current = JSON.stringify([
      name, plantType, plantVariety, spaceType, location, parentLocation,
      childLocation, landmarks, bedName, potSize, variety, plantingDate,
      harvestSeason, harvestStartDate, harvestEndDate, notes, photoUri, sunlight,
      soilType, waterRequirement, wateringFrequency, fertilisingFrequency,
      preferredFertiliser, mulchingUsed, healthStatus, expectedHarvestDate,
      pestDiseaseHistory, growthStage, pruningFrequency, pruningNotes,
      coconutFrondsCount, nutsPerMonth, lastClimbingDate,
    ]);
    if (!initialDataLoaded.current || shouldCaptureSnapshot.current) {
      formSnapshot.current = current;
      shouldCaptureSnapshot.current = false;
      setHasUnsavedChanges(false);
      return;
    }
    setHasUnsavedChanges(current !== formSnapshot.current);
  }, [
    name, plantType, plantVariety, spaceType, location, parentLocation,
    childLocation, landmarks, bedName, potSize, variety, plantingDate,
    harvestSeason, harvestStartDate, harvestEndDate, notes, photoUri, sunlight,
    soilType, waterRequirement, wateringFrequency, fertilisingFrequency,
    preferredFertiliser, mulchingUsed, healthStatus, expectedHarvestDate,
    pestDiseaseHistory, growthStage, pruningFrequency, pruningNotes,
    coconutFrondsCount, nutsPerMonth, lastClimbingDate,
  ]);

  // Auto-calculate expected harvest date
  useEffect(() => {
    if (plantVariety && plantingDate) {
      const calculated = calculateExpectedHarvestDate(
        plantVariety,
        plantingDate,
        plantType,
      );
      if (calculated) {
        setExpectedHarvestDate(calculated);
        shouldCaptureSnapshot.current = true;
      }
    }
  }, [plantVariety, plantingDate, plantType]);

  // Coconut age-based care defaults
  useEffect(() => {
    if (plantType === "coconut_tree" && plantingDate) {
      const info = getCoconutAgeInfo(plantingDate);
      setCoconutAgeInfo(info);
      if (info && !plantId) {
        setGrowthStage(info.growthStage);
        setWateringFrequency(info.wateringFrequencyDays.toString());
        setFertilisingFrequency(info.fertilisingFrequencyDays.toString());
        setPruningFrequency(info.pruningFrequencyDays.toString());
        shouldCaptureSnapshot.current = true;
      }
    } else {
      setCoconutAgeInfo(null);
    }
  }, [plantType, plantingDate, plantId]);

  // Reset location defaults flag when parent location changes
  useEffect(() => {
    locationDefaultsApplied.current = false;
    setLocationDefaultsFired(false);
  }, [parentLocation]);

  // Apply location profile defaults (only for new plants, first time per location)
  useEffect(() => {
    if (plantId || !parentLocation || locationDefaultsApplied.current) return;
    const profile = locationProfiles[parentLocation];
    if (!profile) return;
    locationDefaultsApplied.current = true;
    if (profile.soilType) setSoilType(profile.soilType);
    if (profile.moistureRetention || profile.drainageQuality) {
      const retention = profile.moistureRetention;
      const drainage = profile.drainageQuality;
      let wr: WaterRequirement = "medium";
      if (retention === "high") wr = "low";
      else if (retention === "low" && (drainage === "good" || drainage === "excellent")) wr = "high";
      else if (retention === "low") wr = "high";
      setWaterRequirement(wr);
    }
    setLocationDefaultsFired(true);
    shouldCaptureSnapshot.current = true;
  }, [parentLocation, locationProfiles, plantId]);

  // Reset auto-suggest flags when plant variety changes
  useEffect(() => {
    autoSuggestApplied.current = false;
    setAutoSuggestFired(false);
    setCareProfileCardDismissed(false);
    setCustomVarietyMode(false);
  }, [plantVariety]);

  // Auto-suggest care defaults
  useEffect(() => {
    if (
      !plantId &&
      plantVariety &&
      autoApplyCareDefaults &&
      careProfilesLoaded &&
      hasPlantCareProfile(plantVariety, plantType, plantCareProfiles) &&
      !autoSuggestApplied.current
    ) {
      const profile = getPlantCareProfile(
        plantVariety,
        plantType,
        plantCareProfiles,
      );
      if (profile) {
        autoSuggestApplied.current = true;
        setAutoSuggestFired(true);
        setWateringFrequency(profile.wateringFrequencyDays.toString());
        setFertilisingFrequency(profile.fertilisingFrequencyDays.toString());
        if (profile.pruningFrequencyDays)
          setPruningFrequency(profile.pruningFrequencyDays.toString());
        setSunlight(profile.sunlight);
        setSoilType(profile.soilType);
        setWaterRequirement(profile.waterRequirement);
        setPreferredFertiliser(profile.preferredFertiliser);
        setGrowthStage(profile.initialGrowthStage);
        const defaultHarvestSeason = getDefaultHarvestSeason(
          plantVariety,
          plantType,
        );
        if (defaultHarvestSeason) setHarvestSeason(defaultHarvestSeason);
        shouldCaptureSnapshot.current = true;
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

  // Combine parent + child location
  useEffect(() => {
    if (parentLocation && childLocation) {
      setLocation(`${parentLocation} - ${childLocation}`);
    } else {
      setLocation("");
    }
  }, [parentLocation, childLocation]);

  // Back navigation — shared handler for both wizard and edit
  useEffect(() => {
    const backAction = (): boolean => {
      if (savedSuccessfully.current) return false;
      if (!plantId && wizardStep > 1) {
        runSlideTransition("back", (wizardStep - 1) as 1 | 2 | 3);
        return true;
      }
      if (hasUnsavedChanges && !isSaving.current) {
        handleBackPress();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    const unsubscribe = navigation.addListener(
      "beforeRemove",
      (e) => {
        if (savedSuccessfully.current || isDiscarding.current) return;
        if (!plantId && wizardStep > 1) {
          e.preventDefault();
          runSlideTransition("back", (wizardStep - 1) as 1 | 2 | 3);
          return;
        }
        if (!hasUnsavedChanges || isSaving.current) return;
        e.preventDefault();
        handleBackPress();
      },
    );

    return () => {
      backHandler.remove();
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnsavedChanges, navigation, plantId, wizardStep]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const setSectionExpandedState = useCallback(
    (section: FormSectionKey, expanded: boolean) => {
      setSectionExpanded((prev) => ({ ...prev, [section]: expanded }));
    },
    [],
  );

  const handleBackPress = useCallback(() => {
    if (isSaving.current) return;
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
    } else {
      isDiscarding.current = true;
      navigation.goBack();
    }
  }, [hasUnsavedChanges, navigation]);

  const handleDiscard = useCallback(() => {
    setShowDiscardModal(false);
    isDiscarding.current = true;
    setHasUnsavedChanges(false);
    navigation.goBack();
  }, [navigation]);

  const runSlideTransition = useCallback(
    (direction: "forward" | "back", newStep: 1 | 2 | 3) => {
      const startX = direction === "forward" ? 30 : -30;
      slideOpacity.setValue(0);
      slideX.setValue(startX);
      setWizardStep(newStep);
      Animated.parallel([
        Animated.timing(slideOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideX, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [slideOpacity, slideX],
  );

  const getWizardStepErrors = useCallback(
    (step: 1 | 2 | 3): string | null => {
      if (step === 1 && !plantVariety.trim())
        return "Please select a plant type";
      if (step === 2 && !parentLocation.trim())
        return "Please select a main location";
      if (step === 2 && !childLocation.trim())
        return "Please select a direction or section";
      if (step === 3) {
        if (
          !wateringFrequency.trim() ||
          isNaN(parseInt(wateringFrequency, 10)) ||
          parseInt(wateringFrequency, 10) < 1
        )
          return "Please enter a valid watering frequency";
        if (
          !fertilisingFrequency.trim() ||
          isNaN(parseInt(fertilisingFrequency, 10)) ||
          parseInt(fertilisingFrequency, 10) < 1
        )
          return "Please enter a valid fertilising frequency";
      }
      return null;
    },
    [
      plantVariety,
      parentLocation,
      childLocation,
      wateringFrequency,
      fertilisingFrequency,
    ],
  );

  const navigateToPlantsAfterSave = useCallback(() => {
    navigation.navigate({
      name: "PlantsList",
      params: { refresh: Date.now() },
      merge: true,
    });
  }, [navigation]);

  const openImageLibrary = useCallback(async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
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
      setPhotoUri(result.assets[0]!.uri);
      setPhotoFilename(null);
    }
  }, []);

  const openCamera = useCallback(async () => {
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
        setPhotoUri(result.assets[0]!.uri);
        setPhotoFilename(null);
      }
    } catch (error) {
      logger.warn("Camera launch failed", error as Error);
      Alert.alert("Camera Error", "Failed to open camera. Please try again.");
    }
  }, []);

  const pickImage = useCallback(() => {
    setShowPhotoSourceModal(true);
  }, []);

  const loadPlant = async (): Promise<void> => {
    if (!plantId) return;
    try {
      const plant = await getPlant(plantId);
      if (plant) {
        let loadedShortNames = locationShortNames;
        if (Object.keys(loadedShortNames).length === 0) {
          try {
            const config = await getLocationConfig();
            loadedShortNames = config.parentLocationShortNames ?? {};
          } catch {}
        }

        const locationParts = plant.location?.split(" - ") || [];
        const existingParentLoc =
          locationParts.length >= 1 ? (locationParts[0] ?? '') : '';

        const richBase = buildGeneratedPlantNameBase(
          plant.plant_type,
          plant.plant_variety || "",
          plant.variety || "",
          plant.planting_date || undefined,
          existingParentLoc || undefined,
          loadedShortNames[existingParentLoc] || undefined,
        );
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
        if (!generatedName && plant.name) setShowCustomNameInput(true);
        setPlantType(plant.plant_type);
        setPlantVariety(plant.plant_variety || "");
        setSpaceType(plant.space_type);
        setLocation(plant.location);

        if (locationParts.length === 2) {
          setParentLocation(locationParts[0]!);
          setChildLocation(locationParts[1]!);
        } else if (locationParts.length === 1 && locationParts[0]) {
          setParentLocation(locationParts[0]!);
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
        setExpectedHarvestDate(plant.expected_harvest_date || "");
        setPestDiseaseHistory(plant.pest_disease_history || []);
        setGrowthStage(plant.growth_stage || "seedling");
        setPruningFrequency(plant.pruning_frequency_days?.toString() || "");
        setPruningNotes(plant.pruning_notes || "");
        setCoconutFrondsCount(plant.coconut_fronds_count?.toString() || "");
        setNutsPerMonth(plant.nuts_per_month?.toString() || "");
        setLastClimbingDate(plant.last_climbing_date || "");
        setSpatheCount(plant.spathe_count_per_month?.toString() || "");
        setNutFallCount(plant.nut_fall_count?.toString() || "");
        setLastNutFallDate(plant.last_nut_fall_date || "");

        setSectionExpanded((prev) => ({
          ...prev,
          health:
            prev.health ||
            (plant.health_status !== undefined &&
              plant.health_status !== "healthy"),
          harvest:
            prev.harvest ||
            !!plant.harvest_season ||
            !!plant.harvest_start_date ||
            !!plant.harvest_end_date,
          coconut: plant.plant_type === "coconut_tree",
          notesHistory:
            prev.notesHistory ||
            !!plant.notes ||
            (plant.pest_disease_history?.length ?? 0) > 0,
          pestDisease:
            prev.pestDisease ||
            (plant.pest_disease_history?.length ?? 0) > 0,
        }));

        setTimeout(() => {
          initialDataLoaded.current = true;
        }, 500);
      }
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setDataLoading(false);
    }
  };

  const handleSave = async (onSuccessOverride?: () => void): Promise<void> => {
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
      (s) => validationErrors[s].length > 0,
    );
    if (firstErrorSection) {
      setSectionExpandedState(firstErrorSection, true);
      Alert.alert("Validation Error", validationErrors[firstErrorSection][0]);
      return;
    }

    if (loading || isSaving.current) return;

    setLoading(true);
    isSaving.current = true;
    setHasUnsavedChanges(false);
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

      if (photoUri && !resolvedPhotoFilename) {
        const saved = await savePlantImage(photoUri);
        resolvedPhotoFilename = saved.filename ?? getFilenameFromUri(saved.uri);
      } else if (!photoUri) {
        resolvedPhotoFilename = null;
      }

      const plantData: Partial<Plant> = {
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
        sunlight,
        soil_type: soilType,
        water_requirement: waterRequirement,
        watering_frequency_days: parseInt(wateringFrequency, 10) || null,
        fertilising_frequency_days:
          parseInt(fertilisingFrequency, 10) || null,
        preferred_fertiliser: preferredFertiliser,
        mulching_used: mulchingUsed,
        health_status: healthStatus,
        expected_harvest_date: expectedHarvestDate || null,
        pest_disease_history:
          pestDiseaseHistory.length > 0 ? pestDiseaseHistory : null,
        growth_stage: growthStage,
        pruning_frequency_days: pruningFrequency
          ? parseInt(pruningFrequency, 10)
          : null,
        pruning_notes: pruningNotes.trim() || null,
      };

      if (plantType === "fruit_tree") {
        plantData.harvest_start_date = harvestStartDate.trim() || null;
        plantData.harvest_end_date = harvestEndDate.trim() || null;
      }

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
        ? await updatePlant(plantId, plantData as Omit<Plant, 'id' | 'user_id' | 'created_at'>)
        : await createPlant(plantData as Omit<Plant, 'id' | 'user_id' | 'created_at'>);

      setLoadedGeneratedName(nickname ? "" : finalPlantName);
      setExistingPlants((prev) => [
        ...prev.filter((p) => p.id !== savedPlant.id),
        savedPlant,
      ]);

      try {
        await syncCareTasksForPlant(savedPlant);
      } catch (error) {
        logger.warn("Failed to sync care tasks", error as Error);
      }

      savedSuccessfully.current = true;
      if (onSuccessOverride) {
        onSuccessOverride();
        return;
      }
      navigateToPlantsAfterSave();
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error));
      setHasUnsavedChanges(true);
    } finally {
      setLoading(false);
      isSaving.current = false;
    }
  };

  // ── Return ─────────────────────────────────────────────────────────────────

  return {
    plantId,
    theme,
    insets,
    isCompactScreen,
    scrollViewRef,
    isSaving,
    isDiscarding,
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
    name,
    setName,
    loadedGeneratedName,
    setLoadedGeneratedName,
    plantType,
    setPlantType,
    plantVariety,
    setPlantVariety,
    spaceType,
    setSpaceType,
    location,
    parentLocation,
    setParentLocation,
    childLocation,
    setChildLocation,
    landmarks,
    setLandmarks,
    bedName,
    setBedName,
    potSize,
    setPotSize,
    variety,
    setVariety,
    customVarietyMode,
    setCustomVarietyMode,
    plantingDate,
    setPlantingDate,
    harvestSeason,
    setHarvestSeason,
    harvestStartDate,
    setHarvestStartDate,
    harvestEndDate,
    setHarvestEndDate,
    notes,
    setNotes,
    photoUri,
    setPhotoUri,
    photoFilename,
    setPhotoFilename,
    sunlight,
    setSunlight,
    soilType,
    setSoilType,
    waterRequirement,
    setWaterRequirement,
    wateringFrequency,
    setWateringFrequency,
    fertilisingFrequency,
    setFertilisingFrequency,
    preferredFertiliser,
    setPreferredFertiliser,
    mulchingUsed,
    setMulchingUsed,
    healthStatus,
    setHealthStatus,
    expectedHarvestDate,
    pestDiseaseHistory,
    setPestDiseaseHistory,
    growthStage,
    setGrowthStage,
    pruningFrequency,
    setPruningFrequency,
    pruningNotes,
    setPruningNotes,
    coconutFrondsCount,
    setCoconutFrondsCount,
    nutsPerMonth,
    setNutsPerMonth,
    lastClimbingDate,
    setLastClimbingDate,
    spatheCount,
    setSpatheCount,
    nutFallCount,
    setNutFallCount,
    lastNutFallDate,
    setLastNutFallDate,
    coconutAgeInfo,
    loading,
    dataLoading,
    hasUnsavedChanges,
    showDiscardModal,
    setShowDiscardModal,
    showPestDiseaseModal,
    setShowPestDiseaseModal,
    showPhotoSourceModal,
    setShowPhotoSourceModal,
    showValidationErrors,
    showCustomNameInput,
    setShowCustomNameInput,
    autoApplyCareDefaults,
    setAutoApplyCareDefaults,
    autoSuggestFired,
    locationDefaultsFired,
    careProfileCardDismissed,
    setCareProfileCardDismissed,
    sectionExpanded,
    currentPestDisease,
    setCurrentPestDisease,
    editingPestIndex,
    setEditingPestIndex,
    pestPhotoUri,
    setPestPhotoUri,
    showPlantingDatePicker,
    setShowPlantingDatePicker,
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    showClimbingDatePicker,
    setShowClimbingDatePicker,
    showNutFallDatePicker,
    setShowNutFallDatePicker,
    wizardStep,
    slideX,
    slideOpacity,
    generatedPlantName,
    formProgress,
    validationErrors,
    totalErrorCount,
    sectionStatuses,
    phase2Unlocked,
    phase3Unlocked,
    handleSave,
    handleBackPress,
    handleDiscard,
    setSectionExpandedState,
    openCamera,
    openImageLibrary,
    pickImage,
    runSlideTransition,
    getWizardStepErrors,
    navigateToPlantsAfterSave,
  };
}
