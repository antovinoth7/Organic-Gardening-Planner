import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, refreshAuthToken } from "../lib/firebase";
import { getData, setData, KEYS } from "../lib/storage";
import {
  FertiliserType,
  GrowthStage,
  PlantCareProfileOverride,
  PlantCareProfiles,
  SoilType,
  SunlightLevel,
  WaterRequirement,
} from "../types/database.types";
import { logError } from "../utils/errorLogging";
import { withTimeoutAndRetry } from "../utils/firestoreTimeout";
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
  "custom",
];
const FERTILISERS: FertiliserType[] = [
  "compost",
  "vermicompost",
  "fish_emulsion",
  "seaweed",
  "neem_cake",
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

const normalizeNumber = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return Math.round(parsed);
};

const normalizeOverride = (
  override: PlantCareProfileOverride | undefined | null
): PlantCareProfileOverride => {
  if (!override || typeof override !== "object") return {};
  const normalized: PlantCareProfileOverride = {};

  if (WATER_REQUIREMENTS.includes(override.waterRequirement as WaterRequirement)) {
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
    normalized.initialGrowthStage =
      override.initialGrowthStage as GrowthStage;
  }

  const wateringDays = normalizeNumber(override.wateringFrequencyDays);
  if (wateringDays) normalized.wateringFrequencyDays = wateringDays;

  const fertilisingDays = normalizeNumber(override.fertilisingFrequencyDays);
  if (fertilisingDays) normalized.fertilisingFrequencyDays = fertilisingDays;

  const pruningDays = normalizeNumber(override.pruningFrequencyDays);
  if (pruningDays) normalized.pruningFrequencyDays = pruningDays;

  return normalized;
};

const normalizeProfiles = (
  profiles?: PlantCareProfiles | null
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
        override as PlantCareProfileOverride
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
      timeoutMs: 10000,
      maxRetries: 2,
    });

    if (!snapshot.exists()) {
      await withTimeoutAndRetry(
        () =>
          setDoc(
            docRef,
            { [CARE_FIELD]: cached, updated_at: serverTimestamp() },
            { merge: true }
          ),
        { timeoutMs: 10000, maxRetries: 1, throwOnTimeout: false }
      );
      return cached;
    }

    const data = snapshot.data();
    const remoteProfiles = normalizeProfiles(
      (data as Record<string, any>)[CARE_FIELD] ?? data
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
  profiles: PlantCareProfiles
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
          { merge: true }
        ),
      { timeoutMs: 10000, maxRetries: 2, throwOnTimeout: false }
    );
  } catch (error) {
    logError("network", "Failed to save plant care profiles", error as Error, {
      userId: user.uid,
    });
  }

  return normalized;
};
