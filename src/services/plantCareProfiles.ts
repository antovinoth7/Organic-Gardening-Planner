import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, refreshAuthToken } from "../lib/firebase";
import { getData, setData, KEYS } from "../lib/storage";
import {
  FeedingIntensity,
  FertiliserType,
  GrowthStage,
  Lifecycle,
  NumericRange,
  PlantCareProfileOverride,
  PlantCareProfiles,
  SoilType,
  SunlightLevel,
  ToleranceLevel,
  WaterRequirement,
} from "../types/database.types";
import { logError } from "../utils/errorLogging";
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from "../utils/firestoreTimeout";
import { PLANT_CATEGORIES } from "./plantCatalog";

const SETTINGS_COLLECTION = "user_settings";
const CARE_FIELD = "plantCareProfiles";

const createEmptyProfiles = (): PlantCareProfiles =>
  PLANT_CATEGORIES.reduce((acc, type) => {
    acc[type] = {};
    return acc;
  }, {} as PlantCareProfiles);

const WATER_REQUIREMENTS: WaterRequirement[] = ["low", "medium", "high"];
const SUNLIGHT_LEVELS: SunlightLevel[] = ["full_sun", "partial_sun", "shade"];
const SOIL_TYPES: SoilType[] = [
  "garden_soil",
  "potting_mix",
  "coco_peat",
  "red_laterite",
  "coastal_sandy",
  "black_cotton",
  "alluvial",
  "custom",
];
const FERTILISERS: FertiliserType[] = [
  "compost",
  "vermicompost",
  "cow_dung_slurry",
  "neem_cake",
  "panchagavya",
  "jeevamrutham",
  "groundnut_cake",
  "fish_emulsion",
  "seaweed",
  "other",
];
const GROWTH_STAGES: GrowthStage[] = [
  "seedling",
  "vegetative",
  "flowering",
  "fruiting",
  "dormant",
  "mature",
];
const TOLERANCE_LEVELS: ToleranceLevel[] = ["low", "medium", "high"];
const FEEDING_INTENSITIES: FeedingIntensity[] = ["light", "medium", "heavy"];
const LIFECYCLES: Lifecycle[] = ["annual", "biennial", "perennial"];

const normalizeNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.round(parsed);
};

const normalizeNumericRange = (value: unknown): NumericRange | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const obj = value as Record<string, unknown>;
  const min = Number(obj.min);
  const max = Number(obj.max);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) return undefined;
  return { min, max };
};

const normalizeStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
  return items.length > 0 ? items : undefined;
};

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeOverride = (
  override: PlantCareProfileOverride | undefined | null,
): PlantCareProfileOverride => {
  if (!override || typeof override !== "object") return {};
  const normalized: PlantCareProfileOverride = {};

  if (
    WATER_REQUIREMENTS.includes(override.waterRequirement as WaterRequirement)
  ) {
    normalized.waterRequirement = override.waterRequirement as WaterRequirement;
  }
  if (SUNLIGHT_LEVELS.includes(override.sunlight as SunlightLevel)) {
    normalized.sunlight = override.sunlight as SunlightLevel;
  }
  if (SOIL_TYPES.includes(override.soilType as SoilType)) {
    normalized.soilType = override.soilType as SoilType;
  }
  if (FERTILISERS.includes(override.preferredFertiliser as FertiliserType)) {
    normalized.preferredFertiliser =
      override.preferredFertiliser as FertiliserType;
  }
  if (GROWTH_STAGES.includes(override.initialGrowthStage as GrowthStage)) {
    normalized.initialGrowthStage = override.initialGrowthStage as GrowthStage;
  }

  if (override.wateringEnabled === false) {
    normalized.wateringEnabled = false;
  } else {
    const wateringDays = normalizeNumber(override.wateringFrequencyDays);
    if (wateringDays) normalized.wateringFrequencyDays = wateringDays;
  }

  if (override.fertilisingEnabled === false) {
    normalized.fertilisingEnabled = false;
  } else {
    const fertilisingDays = normalizeNumber(override.fertilisingFrequencyDays);
    if (fertilisingDays) normalized.fertilisingFrequencyDays = fertilisingDays;
  }

  if (override.pruningEnabled === false) {
    normalized.pruningEnabled = false;
  } else {
    const pruningDays = normalizeNumber(override.pruningFrequencyDays);
    if (pruningDays) normalized.pruningFrequencyDays = pruningDays;
  }

  // Pruning techniques
  if (Array.isArray(override.pruningTips)) {
    const tips = override.pruningTips
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (tips.length > 0) normalized.pruningTips = tips;
  }
  if (typeof override.shapePruningTip === "string" && override.shapePruningTip.trim()) {
    normalized.shapePruningTip = override.shapePruningTip.trim();
  }
  if (typeof override.shapePruningMonths === "string" && override.shapePruningMonths.trim()) {
    normalized.shapePruningMonths = override.shapePruningMonths.trim();
  }
  if (typeof override.flowerPruningTip === "string" && override.flowerPruningTip.trim()) {
    normalized.flowerPruningTip = override.flowerPruningTip.trim();
  }
  if (typeof override.flowerPruningMonths === "string" && override.flowerPruningMonths.trim()) {
    normalized.flowerPruningMonths = override.flowerPruningMonths.trim();
  }

  // A2 fields — botanical identity
  const scientificName = normalizeOptionalString(override.scientificName);
  if (scientificName) normalized.scientificName = scientificName;

  const taxonomicFamily = normalizeOptionalString(override.taxonomicFamily);
  if (taxonomicFamily) normalized.taxonomicFamily = taxonomicFamily;

  if (LIFECYCLES.includes(override.lifecycle as Lifecycle)) {
    normalized.lifecycle = override.lifecycle as Lifecycle;
  }

  const tamilName = normalizeOptionalString(override.tamilName);
  if (tamilName) normalized.tamilName = tamilName;

  const description = normalizeOptionalString(override.description);
  if (description) normalized.description = description;

  // A2 fields — growing parameters
  const daysToHarvest = normalizeNumericRange(override.daysToHarvest);
  if (daysToHarvest) normalized.daysToHarvest = daysToHarvest;

  const yearsToFirstHarvest = normalizeNumber(override.yearsToFirstHarvest);
  if (yearsToFirstHarvest) normalized.yearsToFirstHarvest = yearsToFirstHarvest;

  const heightCm = normalizeNumericRange(override.heightCm);
  if (heightCm) normalized.heightCm = heightCm;

  const spacingCm = normalizeNumber(override.spacingCm);
  if (spacingCm) normalized.spacingCm = spacingCm;

  const plantingDepthCm = normalizeNumber(override.plantingDepthCm);
  if (plantingDepthCm) normalized.plantingDepthCm = plantingDepthCm;

  const growingSeason = normalizeOptionalString(override.growingSeason);
  if (growingSeason) normalized.growingSeason = growingSeason;

  const germinationDays = normalizeNumericRange(override.germinationDays);
  if (germinationDays) normalized.germinationDays = germinationDays;

  const germinationTempC = normalizeNumericRange(override.germinationTempC);
  if (germinationTempC) normalized.germinationTempC = germinationTempC;

  const soilPhRange = normalizeNumericRange(override.soilPhRange);
  if (soilPhRange) normalized.soilPhRange = soilPhRange;

  // A2 fields — tolerances
  if (TOLERANCE_LEVELS.includes(override.heatTolerance as ToleranceLevel)) {
    normalized.heatTolerance = override.heatTolerance as ToleranceLevel;
  }
  if (TOLERANCE_LEVELS.includes(override.droughtTolerance as ToleranceLevel)) {
    normalized.droughtTolerance = override.droughtTolerance as ToleranceLevel;
  }
  if (TOLERANCE_LEVELS.includes(override.waterloggingTolerance as ToleranceLevel)) {
    normalized.waterloggingTolerance = override.waterloggingTolerance as ToleranceLevel;
  }

  // A2 fields — nutrition & safety
  const vitamins = normalizeStringArray(override.vitamins);
  if (vitamins) normalized.vitamins = vitamins;

  const minerals = normalizeStringArray(override.minerals);
  if (minerals) normalized.minerals = minerals;

  if (typeof override.petToxicity === "boolean") {
    normalized.petToxicity = override.petToxicity;
  }

  if (FEEDING_INTENSITIES.includes(override.feedingIntensity as FeedingIntensity)) {
    normalized.feedingIntensity = override.feedingIntensity as FeedingIntensity;
  }

  // A2 fields — user-extendable lists
  const customPests = normalizeStringArray(override.customPests);
  if (customPests) normalized.customPests = customPests;

  const customDiseases = normalizeStringArray(override.customDiseases);
  if (customDiseases) normalized.customDiseases = customDiseases;

  const customBeneficials = normalizeStringArray(override.customBeneficials);
  if (customBeneficials) normalized.customBeneficials = customBeneficials;

  // B.4 fields — growth stage auto-progression
  if (override.growthStageDurations && typeof override.growthStageDurations === "object") {
    const durations: Partial<Record<GrowthStage, number>> = {};
    for (const key of GROWTH_STAGES) {
      const val = normalizeNumber((override.growthStageDurations as Record<string, unknown>)[key]);
      if (val && val > 0) durations[key] = val;
    }
    if (Object.keys(durations).length > 0) normalized.growthStageDurations = durations;
  }

  if (override.annualCycleDurations && typeof override.annualCycleDurations === "object") {
    const durations: Partial<Record<GrowthStage, number>> = {};
    for (const key of GROWTH_STAGES) {
      const val = normalizeNumber((override.annualCycleDurations as Record<string, unknown>)[key]);
      if (val && val > 0) durations[key] = val;
    }
    if (Object.keys(durations).length > 0) normalized.annualCycleDurations = durations;
  }

  const floweringStartMonth = normalizeNumber(override.floweringStartMonth);
  if (floweringStartMonth && floweringStartMonth >= 1 && floweringStartMonth <= 12) {
    normalized.floweringStartMonth = floweringStartMonth;
  }

  return normalized;
};

const normalizeProfiles = (
  profiles?: Partial<PlantCareProfiles> | null,
): PlantCareProfiles => {
  const normalized = createEmptyProfiles();

  if (!profiles || typeof profiles !== "object") {
    return normalized;
  }

  PLANT_CATEGORIES.forEach((type) => {
    const entries = profiles[type];
    if (!entries || typeof entries !== "object") return;

    Object.entries(entries).forEach(([plantName, override]) => {
      const trimmed = plantName?.toString().trim();
      if (!trimmed) return;
      const normalizedOverride = normalizeOverride(
        override as PlantCareProfileOverride,
      );
      if (Object.keys(normalizedOverride).length === 0) return;
      normalized[type][trimmed] = normalizedOverride;
    });
  });

  return normalized;
};

const getCachedProfiles = async (): Promise<PlantCareProfiles> => {
  const stored = await getData<PlantCareProfiles>(KEYS.PLANT_CARE_PROFILES);
  if (stored.length > 0 && stored[0]) {
    return normalizeProfiles(stored[0]);
  }
  return createEmptyProfiles();
};

export const getPlantCareProfiles = async (): Promise<PlantCareProfiles> => {
  const cached = await getCachedProfiles();
  const user = auth.currentUser;
  if (!user) return cached;

  // Refresh token to prevent expiration issues
  await refreshAuthToken();

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
    });

    if (!snapshot.exists()) {
      await withTimeoutAndRetry(
        () =>
          setDoc(
            docRef,
            { [CARE_FIELD]: cached, updated_at: serverTimestamp() },
            { merge: true },
          ),
        { timeoutMs: FIRESTORE_READ_TIMEOUT_MS, maxRetries: 1, throwOnTimeout: false },
      );
      return cached;
    }

    const data = snapshot.data();
    const remoteProfiles = normalizeProfiles(
      (data as Record<string, unknown>)[CARE_FIELD] ?? data,
    );
    await setData(KEYS.PLANT_CARE_PROFILES, [remoteProfiles]);
    return remoteProfiles;
  } catch (error) {
    logError("network", "Failed to fetch plant care profiles", error as Error, {
      userId: user.uid,
    });
    return cached;
  }
};

export const savePlantCareProfiles = async (
  profiles: Partial<PlantCareProfiles>,
): Promise<PlantCareProfiles> => {
  const normalized = normalizeProfiles(profiles);
  await setData(KEYS.PLANT_CARE_PROFILES, [normalized]);

  const user = auth.currentUser;
  if (!user) return normalized;

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    await withTimeoutAndRetry(
      () =>
        setDoc(
          docRef,
          { [CARE_FIELD]: normalized, updated_at: serverTimestamp() },
          { merge: true },
        ),
      { timeoutMs: FIRESTORE_READ_TIMEOUT_MS, throwOnTimeout: false },
    );
  } catch (error) {
    logError("network", "Failed to save plant care profiles", error as Error, {
      userId: user.uid,
    });
  }

  return normalized;
};
