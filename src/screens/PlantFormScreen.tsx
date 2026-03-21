import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  Modal,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import ThemedDropdown from "../components/ThemedDropdown";
import FloatingLabelInput from "../components/FloatingLabelInput";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
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
  PlantCatalog,
  PlantCareProfiles,
  IssueSeverity,
} from "../types/database.types";
import { Ionicons } from "@expo/vector-icons";
import {
  calculateExpectedHarvestDate,
  getDefaultHarvestSeason,
  getCompanionSuggestions,
  getIncompatiblePlants,
  getCommonPests,
  getCommonDiseases,
  getCoconutAgeInfo,
  CoconutAgeInfo,
} from "../utils/plantHelpers";
import {
  getPlantCareProfile,
  hasPlantCareProfile,
  getPruningTechniques,
} from "../utils/plantCareDefaults";
import { useTheme } from "../theme";
import CollapsibleSection from "../components/CollapsibleSection";
import PhotoSourceModal from "../components/PhotoSourceModal";
import {
  DEFAULT_CHILD_LOCATIONS,
  DEFAULT_PARENT_LOCATIONS,
  getLocationConfig,
} from "../services/locations";
import {
  DEFAULT_PLANT_CATALOG,
  getPlantCatalog,
} from "../services/plantCatalog";
import { getPlantCareProfiles } from "../services/plantCareProfiles";
import {
  sanitizeAlphaNumericSpaces,
  sanitizeLandmarkText,
} from "../utils/textSanitizer";
import { toLocalDateString, formatDateDisplay } from "../utils/dateHelpers";

const NOTES_MAX_LENGTH = 500;
type FormMode = "quick" | "advanced";
type FormSectionKey = "basic" | "location" | "care" | "health" | "harvest" | "coconut" | "history" | "notes";
const sanitizeNumberText = (value: string) => value.replace(/[^0-9]/g, "");
const TAMIL_NADU_HARVEST_SEASONS = [
  "Year Round",
  "Summer (Mar-May)",
  "Southwest Monsoon (Jun-Sep)",
  "Northeast Monsoon (Oct-Dec)",
  "Cool Dry (Jan-Feb)",
];
const ISSUE_SEVERITY_OPTIONS: {
  value: IssueSeverity;
  label: string;
}[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "severe", label: "Severe" },
];

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
  const [existingPlants, setExistingPlants] = useState<Plant[]>([]);
  const [loadedGeneratedName, setLoadedGeneratedName] = useState("");
  const [plantType, setPlantType] = useState<PlantType>("vegetable");
  const [plantVariety, setPlantVariety] = useState("");
  const [plantCatalog, setPlantCatalog] = useState<PlantCatalog>(
    DEFAULT_PLANT_CATALOG,
  );
  const [plantCareProfiles, setPlantCareProfiles] = useState<PlantCareProfiles>(
    {} as PlantCareProfiles,
  );
  const [careProfilesLoaded, setCareProfilesLoaded] = useState(false);
  const [spaceType, setSpaceType] = useState<SpaceType>("ground");
  const [location, setLocation] = useState("");
  const [parentLocation, setParentLocation] = useState("");
  const [childLocation, setChildLocation] = useState("");
  const [parentLocations, setParentLocations] = useState<string[]>(
    DEFAULT_PARENT_LOCATIONS,
  );
  const [childLocations, setChildLocations] = useState<string[]>(
    DEFAULT_CHILD_LOCATIONS,
  );
  const [locationShortNames, setLocationShortNames] = useState<Record<string, string>>({});
  const [landmarks, setLandmarks] = useState("");
  const [bedName, setBedName] = useState("");
  const [potSize, setPotSize] = useState("");
  const [variety, setVariety] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [harvestSeason, setHarvestSeason] = useState("");
  const [harvestStartDate, setHarvestStartDate] = useState("");
  const [harvestEndDate, setHarvestEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [formMode, setFormMode] = useState<FormMode>("quick");
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
  const [showPestOccurredDatePicker, setShowPestOccurredDatePicker] =
    useState(false);
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);
  const [customVarietyMode, setCustomVarietyMode] = useState(false);
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
    history: false,
    notes: false,
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

  const loadLocations = async () => {
    try {
      const config = await getLocationConfig();
      setParentLocations(config.parentLocations);
      setChildLocations(config.childLocations);
      setLocationShortNames(config.parentLocationShortNames ?? {});
    } catch (error) {
      console.error("Error loading locations:", error);
    }
  };

  const loadPlantCatalog = async () => {
    try {
      const catalog = await getPlantCatalog();
      setPlantCatalog(catalog);
    } catch (error) {
      console.error("Error loading plant catalog:", error);
    }
  };

  const loadExistingPlants = async () => {
    try {
      const plants = await getAllPlants();
      setExistingPlants(plants);
    } catch (error) {
      console.error("Error loading plants for naming:", error);
    }
  };

  const loadPlantCareProfiles = async () => {
    try {
      const profiles = await getPlantCareProfiles();
      setPlantCareProfiles(profiles);
    } catch (error) {
      console.error("Error loading plant care profiles:", error);
    } finally {
      setCareProfilesLoaded(true);
    }
  };

  useEffect(() => {
    loadLocations();
    loadPlantCatalog();
    loadPlantCareProfiles();
    loadExistingPlants();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadLocations();
      loadPlantCatalog();
      loadPlantCareProfiles();
      loadExistingPlants();
    }, []),
  );

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
      history: [],
      notes: [],
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
      errors.notes.push(
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
        history: false,
        notes: false,
      }));
    }
  }, [formMode]);

  const parentLocationOptions = React.useMemo(() => {
    if (parentLocation && !parentLocations.includes(parentLocation)) {
      return [parentLocation, ...parentLocations];
    }
    return parentLocations;
  }, [parentLocations, parentLocation]);

  const childLocationOptions = React.useMemo(() => {
    if (childLocation && !childLocations.includes(childLocation)) {
      return [childLocation, ...childLocations];
    }
    return childLocations;
  }, [childLocations, childLocation]);

  const specificPlantOptions = React.useMemo(() => {
    const plants = plantCatalog.categories[plantType]?.plants ?? [];
    if (plantVariety && !plants.includes(plantVariety)) {
      return [plantVariety, ...plants];
    }
    return plants;
  }, [plantCatalog, plantType, plantVariety]);

  const varietySuggestions = React.useMemo(() => {
    if (!plantVariety) return [];
    return plantCatalog.categories[plantType]?.varieties?.[plantVariety] ?? [];
  }, [plantCatalog, plantType, plantVariety]);

  const basicFieldCount = React.useMemo(() => {
    // Always shown in Basic Information
    // 1) Photo, 2) Display name, 3) Plant Category, 4) Specific Plant
    let count = 4;

    if (formMode === "advanced") {
      // Variety control + Planting Date
      count += 2;

      // Extra custom variety input appears in advanced mode when "Other" is selected
      if (varietySuggestions.length > 0 && customVarietyMode) {
        count += 1;
      }
    }

    return count;
  }, [formMode, varietySuggestions.length, customVarietyMode]);

  const locationFieldCount = React.useMemo(() => {
    // 1) Main Location
    let count = 1;
    // Direction/section picker appears after main location is selected
    if (parentLocation !== "") {
      count += 1;
    }
    if (formMode === "advanced") {
      // Landmarks
      count += 1;
    }
    return count;
  }, [formMode, parentLocation]);

  const harvestSeasonOptions = React.useMemo(() => {
    if (!harvestSeason) return TAMIL_NADU_HARVEST_SEASONS;
    if (TAMIL_NADU_HARVEST_SEASONS.includes(harvestSeason)) {
      return TAMIL_NADU_HARVEST_SEASONS;
    }
    return [harvestSeason, ...TAMIL_NADU_HARVEST_SEASONS];
  }, [harvestSeason]);

  const harvestSectionFieldCount = React.useMemo(() => {
    return plantType === "fruit_tree" ? 4 : 2;
  }, [plantType]);

  const pestHistorySectionFieldCount = React.useMemo(() => {
    return Math.max(1, pestDiseaseHistory.length);
  }, [pestDiseaseHistory.length]);

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

        // Mark initial data as loaded
        setTimeout(() => {
          initialDataLoaded.current = true;
        }, 500);
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
      "history",
      "notes",
    ];
    const firstErrorSection = sectionOrder.find(
      (section) => validationErrors[section].length > 0,
    );
    if (firstErrorSection) {
      if (["harvest", "health", "notes"].includes(firstErrorSection) && formMode === "quick") {
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
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveText, loading && styles.saveTextDisabled]}>
            {loading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
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
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryChipsScroll}
            contentContainerStyle={styles.categoryChipsContent}
          >
            {[
              { label: "🥬 Vegetable", value: "vegetable" },
              { label: "🍇 Fruit", value: "fruit_tree" },
              { label: "🥥 Coconut", value: "coconut_tree" },
              { label: "🌿 Herb", value: "herb" },
              { label: "🌲 Timber", value: "timber_tree" },
              { label: "🌸 Flower", value: "flower" },
              { label: "🌱 Shrub", value: "shrub" },
            ].map((cat) => (
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
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryChipsScroll}
              contentContainerStyle={styles.categoryChipsContent}
            >
              {[
                { label: "✅ Healthy", value: "healthy" },
                { label: "⚠️ Stressed", value: "stressed" },
                { label: "🔄 Recovering", value: "recovering" },
                { label: "❌ Sick", value: "sick" },
              ].map((opt) => (
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

            <Text style={styles.fieldGroupLabel}>🌱 Growth Stage</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryChipsScroll}
              contentContainerStyle={styles.categoryChipsContent}
            >
              {[
                { label: "🌱 Seedling", value: "seedling" },
                { label: "🌿 Vegetative", value: "vegetative" },
                { label: "🌸 Flowering", value: "flowering" },
                { label: "🍎 Fruiting", value: "fruiting" },
                { label: "🌳 Mature", value: "mature" },
                { label: "📉 Declining", value: "declining" },
              ].map((opt) => (
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

        {/* Pest & Disease History */}
        {formMode === "advanced" && (
          <CollapsibleSection
            title="Pest & Disease History"
            icon="bug"
            fieldCount={pestHistorySectionFieldCount}
            defaultExpanded={false}
            expanded={sectionExpanded.history}
            onExpandedChange={(expanded) =>
              setSectionExpandedState("history", expanded)
            }
            hasError={
              showValidationErrors && validationErrors.history.length > 0
            }
          >
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.fieldGroupLabel}>Records</Text>
              <TouchableOpacity
                style={styles.addPestButtonPill}
                onPress={() => {
                  setCurrentPestDisease({
                    type: "pest",
                    name: "",
                    occurredAt: toLocalDateString(new Date()),
                    severity: "medium",
                    resolved: false,
                  });
                  setShowPestOccurredDatePicker(false);
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
                {pestDiseaseHistory.map((record, index) => (
                  <View key={index} style={styles.pestDiseaseCard}>
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
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noPestHistory}>
                No pest or disease records yet
              </Text>
            )}
          </CollapsibleSection>
        )}

        {formMode === "advanced" && (
          <CollapsibleSection
            title="Notes & Companions"
            icon="document-text"
            fieldCount={1}
            defaultExpanded={false}
            expanded={sectionExpanded.notes}
            onExpandedChange={(expanded) =>
              setSectionExpandedState("notes", expanded)
            }
            hasError={showValidationErrors && validationErrors.notes.length > 0}
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

        {/* Discard Changes Modal */}
        <Modal
          visible={showDiscardModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowDiscardModal(false)}
        >
          <View style={styles.discardOverlay}>
            <View style={styles.discardCard}>
              <View style={styles.discardIconWrap}>
                <Ionicons name="alert-circle" size={36} color={theme.error} />
              </View>
              <Text style={styles.discardTitle}>Discard Changes?</Text>
              <Text style={styles.discardMessage}>
                You have unsaved changes. Are you sure you want to leave without saving?
              </Text>
              <View style={styles.discardActions}>
                <TouchableOpacity
                  style={styles.discardKeepButton}
                  onPress={() => setShowDiscardModal(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create-outline" size={18} color={theme.primary} />
                  <Text style={styles.discardKeepText}>Keep Editing</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.discardButton}
                  onPress={() => {
                    setShowDiscardModal(false);
                    isDiscarding.current = true;
                    setHasUnsavedChanges(false);
                    navigation.goBack();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                  <Text style={styles.discardButtonText}>Discard</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Pest/Disease Modal */}
        <Modal
          visible={showPestDiseaseModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowPestOccurredDatePicker(false);
            setShowPestDiseaseModal(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Pest/Disease Record</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowPestOccurredDatePicker(false);
                    setShowPestDiseaseModal(false);
                  }}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                contentContainerStyle={{
                  paddingBottom: Math.max(insets.bottom, 12),
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      currentPestDisease.type === "pest" &&
                        styles.typeButtonActive,
                    ]}
                    onPress={() =>
                      setCurrentPestDisease({
                        ...currentPestDisease,
                        type: "pest",
                      })
                    }
                  >
                    <Ionicons
                      name="bug"
                      size={20}
                      color={
                        currentPestDisease.type === "pest" ? "#2e7d32" : "#666"
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        currentPestDisease.type === "pest" &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      Pest
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      currentPestDisease.type === "disease" &&
                        styles.typeButtonActive,
                    ]}
                    onPress={() =>
                      setCurrentPestDisease({
                        ...currentPestDisease,
                        type: "disease",
                      })
                    }
                  >
                    <Ionicons
                      name="medical"
                      size={20}
                      color={
                        currentPestDisease.type === "disease"
                          ? "#2e7d32"
                          : "#666"
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        currentPestDisease.type === "disease" &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      Disease
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>
                  Common{" "}
                  {currentPestDisease.type === "pest" ? "Pests" : "Diseases"}:
                </Text>
                <Text style={styles.helperText}>
                  Suggestions are tuned for Tamil Nadu and Kanyakumari crops.
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.suggestionsScroll}
                >
                  {(currentPestDisease.type === "pest"
                    ? getCommonPests(plantType, plantVariety)
                    : getCommonDiseases(plantType, plantVariety)
                  ).map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionChip}
                      onPress={() =>
                        setCurrentPestDisease({
                          ...currentPestDisease,
                          name: item,
                        })
                      }
                    >
                      <Text style={styles.suggestionChipText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowPestOccurredDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text
                    style={
                      currentPestDisease.occurredAt
                        ? styles.dateButtonText
                        : styles.datePlaceholder
                    }
                  >
                    {currentPestDisease.occurredAt ? formatDateDisplay(currentPestDisease.occurredAt) : "Occurred Date"}
                  </Text>
                </TouchableOpacity>
                {showPestOccurredDatePicker && (
                  <DateTimePicker
                    value={
                      currentPestDisease.occurredAt
                        ? new Date(currentPestDisease.occurredAt)
                        : new Date()
                    }
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(_, selectedDate) => {
                      setShowPestOccurredDatePicker(Platform.OS === "ios");
                      if (selectedDate) {
                        setCurrentPestDisease({
                          ...currentPestDisease,
                          occurredAt: toLocalDateString(selectedDate),
                        });
                      }
                    }}
                  />
                )}

                <ThemedDropdown
                  items={ISSUE_SEVERITY_OPTIONS.map((option) => ({
                    label: option.label,
                    value: option.value,
                  }))}
                  selectedValue={currentPestDisease.severity || "medium"}
                  onValueChange={(value) =>
                    setCurrentPestDisease({
                      ...currentPestDisease,
                      severity: value as IssueSeverity,
                    })
                  }
                  label="Severity"
                  placeholder="Severity"
                />

                <FloatingLabelInput
                  label="Affected Part (Leaf/Stem/Fruit/Root)"
                  value={currentPestDisease.affectedPart || ""}
                  onChangeText={(text) =>
                    setCurrentPestDisease({
                      ...currentPestDisease,
                      affectedPart: sanitizeAlphaNumericSpaces(text),
                    })
                  }
                />

                <FloatingLabelInput
                  label={`${
                    currentPestDisease.type === "pest" ? "Pest" : "Disease"
                  } Name *`}
                  value={currentPestDisease.name}
                  onChangeText={(text) =>
                    setCurrentPestDisease({
                      ...currentPestDisease,
                      name: sanitizeAlphaNumericSpaces(text),
                    })
                  }
                />

                <FloatingLabelInput
                  label="Treatment Used"
                  value={currentPestDisease.treatment || ""}
                  onChangeText={(text) =>
                    setCurrentPestDisease({
                      ...currentPestDisease,
                      treatment: sanitizeAlphaNumericSpaces(text),
                    })
                  }
                />

                <FloatingLabelInput
                  label="Notes"
                  value={currentPestDisease.notes || ""}
                  onChangeText={(text) =>
                    setCurrentPestDisease({
                      ...currentPestDisease,
                      notes: sanitizeAlphaNumericSpaces(text),
                    })
                  }
                  multiline
                  numberOfLines={3}
                />

                <TouchableOpacity
                  style={[
                    styles.settingToggle,
                    currentPestDisease.resolved && styles.settingToggleActive,
                  ]}
                  onPress={() =>
                    setCurrentPestDisease({
                      ...currentPestDisease,
                      resolved: !currentPestDisease.resolved,
                      resolvedAt: !currentPestDisease.resolved
                        ? toLocalDateString(new Date())
                        : undefined,
                    })
                  }
                  activeOpacity={0.85}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: currentPestDisease.resolved }}
                >
                  <View style={styles.settingToggleLeft}>
                    <View
                      style={[
                        styles.settingToggleIconWrap,
                        currentPestDisease.resolved &&
                          styles.settingToggleIconWrapActive,
                      ]}
                    >
                      <Ionicons
                        name={
                          currentPestDisease.resolved
                            ? "checkmark-done-circle"
                            : "time-outline"
                        }
                        size={18}
                        color={
                          currentPestDisease.resolved
                            ? theme.primary
                            : theme.textSecondary
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.settingToggleLabel,
                        currentPestDisease.resolved &&
                          styles.settingToggleLabelActive,
                      ]}
                    >
                      Resolved
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.settingSwitchTrack,
                      currentPestDisease.resolved &&
                        styles.settingSwitchTrackActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.settingSwitchThumb,
                        currentPestDisease.resolved &&
                          styles.settingSwitchThumbActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={() => {
                    if (currentPestDisease.name.trim()) {
                      setPestDiseaseHistory([
                        ...pestDiseaseHistory,
                        { ...currentPestDisease, id: Date.now().toString() },
                      ]);
                      setShowPestOccurredDatePicker(false);
                      setShowPestDiseaseModal(false);
                    } else {
                      Alert.alert("Validation Error", "Please enter a name");
                    }
                  }}
                >
                  <Text style={styles.modalSaveButtonText}>Add Record</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
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

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      paddingTop: 12,
      backgroundColor: theme.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
    },
    headerCenter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    unsavedDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.warning,
    },
    saveText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.primary,
    },
    saveTextDisabled: {
      color: theme.textTertiary,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    modeToggleContainer: {
      flexDirection: "row",
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modeToggleButton: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    modeToggleButtonActive: {
      backgroundColor: theme.primaryLight,
    },
    modeToggleText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    modeToggleTextActive: {
      color: theme.primary,
    },
    photoButton: {
      alignSelf: "center",
      marginTop: 8,
      marginBottom: 20,
    },
    photo: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: theme.primaryLight,
    },
    photoPlaceholder: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: theme.border,
      borderStyle: "dashed",
    },
    photoText: {
      marginTop: 4,
      fontSize: 11,
      color: theme.textTertiary,
      fontWeight: "600",
    },
    input: {
      backgroundColor: theme.inputBackground,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      fontSize: 16,
      color: theme.inputText,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    dateButton: {
      backgroundColor: theme.inputBackground,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    dateButtonText: {
      fontSize: 16,
      color: theme.text,
      fontWeight: "500",
    },
    datePlaceholder: {
      fontSize: 16,
      color: theme.inputPlaceholder,
    },
    textArea: {
      height: 100,
      textAlignVertical: "top",
    },
    noteCounter: {
      fontSize: 12,
      color: theme.textTertiary,
      textAlign: "right",
      marginTop: 6,
    },
    spaceTypeContainer: {
      flexDirection: "row",
      marginBottom: 12,
      gap: 12,
    },
    spaceTypeContainerCompact: {
      gap: 8,
    },
    spaceTypeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      minWidth: 0,
    },
    spaceTypeButtonCompact: {
      paddingVertical: 12,
      paddingHorizontal: 8,
    },
    spaceTypeActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    spaceTypeText: {
      fontSize: 16,
      color: theme.textTertiary,
      marginLeft: 8,
      flexShrink: 1,
    },
    spaceTypeTextCompact: {
      fontSize: 14,
      marginLeft: 6,
    },
    spaceTypeTextActive: {
      color: theme.primary,
      fontWeight: "600",
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 8,
      marginTop: 4,
    },
    nicknameInputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.inputBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    nicknameInput: {
      flex: 1,
      padding: 16,
      fontSize: 16,
      color: theme.inputText,
    },
    nicknameClearButton: {
      paddingHorizontal: 12,
      paddingVertical: 16,
    },
    locationPreview: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.primaryLight,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    locationPreviewText: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: "600",
    },
    sectionHeader: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.primary,
      marginTop: 16,
      marginBottom: 12,
    },
    checkboxContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.backgroundSecondary,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    checkboxLabel: {
      fontSize: 16,
      color: theme.text,
      marginLeft: 12,
    },
    settingToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.backgroundSecondary,
      padding: 14,
      borderRadius: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    settingToggleActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    settingToggleLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      minWidth: 0,
    },
    settingToggleIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 10,
    },
    settingToggleIconWrapActive: {
      borderColor: theme.primary,
      backgroundColor: theme.backgroundSecondary,
    },
    settingToggleLabel: {
      fontSize: 16,
      color: theme.text,
      fontWeight: "600",
      flexShrink: 1,
    },
    settingToggleLabelActive: {
      color: theme.primary,
    },
    settingSwitchTrack: {
      width: 44,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.border,
      justifyContent: "center",
      paddingHorizontal: 3,
      marginLeft: 12,
    },
    settingSwitchTrackActive: {
      backgroundColor: theme.primary,
    },
    settingSwitchThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.backgroundSecondary,
      alignSelf: "flex-start",
    },
    settingSwitchThumbActive: {
      alignSelf: "flex-end",
    },
    smartDefaultsToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.backgroundSecondary,
      padding: 14,
      borderRadius: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    smartDefaultsToggleActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    smartDefaultsLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      minWidth: 0,
    },
    smartDefaultsIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 10,
    },
    smartDefaultsIconWrapActive: {
      borderColor: theme.primary,
      backgroundColor: theme.backgroundSecondary,
    },
    smartDefaultsLabel: {
      fontSize: 16,
      color: theme.text,
      fontWeight: "600",
      flexShrink: 1,
    },
    smartDefaultsLabelCompact: {
      fontSize: 15,
    },
    smartDefaultsLabelActive: {
      color: theme.primary,
    },
    smartDefaultsSwitchTrack: {
      width: 44,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.border,
      justifyContent: "center",
      paddingHorizontal: 3,
      marginLeft: 12,
    },
    smartDefaultsSwitchTrackActive: {
      backgroundColor: theme.primary,
    },
    smartDefaultsSwitchThumb: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.backgroundSecondary,
      alignSelf: "flex-start",
    },
    smartDefaultsSwitchThumbActive: {
      alignSelf: "flex-end",
    },
    helperText: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: -2,
      marginBottom: 12,
      marginLeft: 4,
    },
    // --- Plant Category chip selector ---
    categoryChipsScroll: {
      marginBottom: 12,
    },
    categoryChipsContent: {
      paddingRight: 8,
      gap: 8,
    },
    categoryChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    categoryChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    categoryChipText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.textTertiary,
    },
    categoryChipTextActive: {
      color: theme.primary,
    },
    // --- Field group visual divider ---
    fieldGroupDivider: {
      height: 1,
      backgroundColor: theme.borderLight,
      marginVertical: 16,
      marginHorizontal: 4,
    },
    fieldGroupLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 10,
      marginTop: 2,
    },
    // --- Direction/Section chips ---
    directionChipsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    directionChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1.5,
      borderColor: theme.border,
      gap: 5,
    },
    directionChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    directionChipText: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.textTertiary,
    },
    directionChipTextActive: {
      color: theme.primary,
      fontWeight: "700",
    },
    // --- Display Name Card ---
    displayNameCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    displayNameHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    displayNameLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    displayNameLabel: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    autoGenBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    autoGenBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.primary,
    },
    displayNameHelper: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 4,
      marginLeft: 2,
    },
    // --- Date Card ---
    dateCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderLight,
      overflow: "hidden",
    },
    dateCardTouchable: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
    },
    dateCardIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    dateCardContent: {
      flex: 1,
    },
    dateCardLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    dateCardValue: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    dateCardPlaceholder: {
      fontSize: 15,
      color: theme.inputPlaceholder,
    },
    // --- Frequency Row (Water/Feed/Prune inline cards) ---
    frequencyRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 12,
    },
    frequencyCard: {
      flex: 1,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 14,
      padding: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    frequencyIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: theme.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 6,
    },
    frequencyCardLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    frequencyInputWrap: {
      backgroundColor: theme.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      width: "100%" as any,
      alignItems: "center",
      marginBottom: 4,
    },
    frequencyInput: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.text,
      textAlign: "center",
      paddingVertical: 6,
      paddingHorizontal: 8,
      minWidth: 50,
    },
    frequencyUnit: {
      fontSize: 11,
      color: theme.textTertiary,
      fontWeight: "600",
    },
    // --- Stat Cards (Coconut metrics) ---
    statCardsRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 8,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 14,
      padding: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    statCardIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    statCardLabel: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginBottom: 4,
    },
    statCardInputWrap: {
      backgroundColor: theme.inputBackground,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      width: "100%" as any,
      alignItems: "center",
    },
    statCardInput: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
      textAlign: "center",
      paddingVertical: 4,
      paddingHorizontal: 4,
      minWidth: 40,
    },
    // --- Notes Card ---
    notesCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    notesCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
    },
    notesCardInput: {
      backgroundColor: theme.inputBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      padding: 12,
      fontSize: 15,
      color: theme.inputText,
      minHeight: 80,
      textAlignVertical: "top",
    },
    // --- Add Pest Button Pill ---
    addPestButtonPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    addPestButtonText: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.primary,
    },
    infoCard: {
      backgroundColor: theme.backgroundSecondary,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderDark,
    },
    infoCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    infoCardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      flex: 1,
    },
    infoCardText: {
      fontSize: 16,
      color: theme.primary,
      fontWeight: "600",
      marginBottom: 4,
    },
    infoCardSubtext: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 8,
    },
    chipContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
    },
    varietySuggestions: {
      marginBottom: 12,
    },
    suggestionLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 6,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    varietySuggestionChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    varietySuggestionChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.primaryLight,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    varietySuggestionText: {
      fontSize: 12,
      color: theme.primary,
      fontWeight: "600",
    },
    companionChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 4,
    },
    companionChipSelected: {
      backgroundColor: theme.accentLight,
      borderColor: theme.accent,
    },
    companionChipText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    companionChipTextSelected: {
      color: theme.accent,
      fontWeight: "600",
    },
    incompatibleChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.warningLight,
      borderWidth: 1,
      borderColor: theme.warning,
    },
    incompatibleChipText: {
      fontSize: 13,
      color: theme.warning,
      fontWeight: "600",
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 16,
      marginBottom: 12,
    },
    sectionHeaderText: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      flex: 1,
    },
    addPestButton: {
      padding: 4,
    },
    pestDiseaseList: {
      marginBottom: 16,
    },
    pestDiseaseCard: {
      backgroundColor: theme.backgroundSecondary,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderDark,
      position: "relative",
    },
    pestDiseaseHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    pestDiseaseName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      flex: 1,
    },
    resolvedBadge: {
      backgroundColor: theme.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    resolvedText: {
      fontSize: 11,
      color: theme.primary,
      fontWeight: "600",
    },
    pestDiseaseDate: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    pestDiseaseMetaText: {
      fontSize: 12,
      color: theme.textTertiary,
      marginBottom: 4,
      fontWeight: "500",
    },
    pestDiseaseTreatment: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    pestDiseaseNotes: {
      fontSize: 13,
      color: theme.textSecondary,
      fontStyle: "italic",
    },
    deletePestButton: {
      position: "absolute",
      top: 12,
      right: 12,
      padding: 4,
    },
    noPestHistory: {
      fontSize: 14,
      color: theme.textTertiary,
      textAlign: "center",
      paddingVertical: 20,
      fontStyle: "italic",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "flex-end",
    },
    discardOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    discardCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 20,
      padding: 28,
      alignItems: "center",
      width: "100%",
      maxWidth: 340,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 12,
    },
    discardIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: theme.errorLight,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    discardTitle: {
      fontSize: 19,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 8,
    },
    discardMessage: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      marginBottom: 24,
    },
    discardActions: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
    },
    discardKeepButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 13,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    discardKeepText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.primary,
    },
    discardButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 13,
      borderRadius: 12,
      backgroundColor: theme.error,
    },
    discardButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#fff",
    },
    modalContent: {
      backgroundColor: theme.backgroundSecondary,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      paddingHorizontal: 20,
      maxHeight: "85%",
    },
    modalScrollView: {
      flexGrow: 0,
      marginBottom: 20,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
    },
    typeButtons: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    typeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 8,
    },
    typeButtonActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    typeButtonText: {
      fontSize: 15,
      color: theme.textSecondary,
      fontWeight: "500",
    },
    typeButtonTextActive: {
      color: theme.primary,
      fontWeight: "600",
    },
    suggestionsScroll: {
      marginBottom: 12,
    },
    suggestionChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: theme.accentLight,
      marginRight: 8,
    },
    suggestionChipText: {
      fontSize: 13,
      color: theme.accent,
    },
    modalSaveButton: {
      backgroundColor: theme.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 16,
    },
    modalSaveButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.textInverse,
    },
  });
