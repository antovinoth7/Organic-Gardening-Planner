import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../theme";
import { createStyles } from "../styles/catalogPlantDetailStyles";
import FloatingLabelInput from "../components/FloatingLabelInput";
import ThemedDropdown from "../components/ThemedDropdown";
import CollapsibleSection from "../components/CollapsibleSection";
import FieldLabelWithHelp from "../components/FieldLabelWithHelp";
import {
  DEFAULT_PLANT_CATALOG,
  getPlantCatalog,
  savePlantCatalog,
} from "../services/plantCatalog";
import {
  getPlantCareProfiles,
  savePlantCareProfiles,
} from "../services/plantCareProfiles";
import { getAllPlants, updatePlantVariety } from "../services/plants";
import {
  FeedingIntensity,
  FertiliserType,
  GrowthStage,
  Lifecycle,
  Plant,
  PlantCareProfile,
  PlantCareProfiles,
  PlantCatalog,
  SoilType,
  SunlightLevel,
  ToleranceLevel,
  WaterRequirement,
} from "../types/database.types";
import { MoreStackParamList } from "../types/navigation.types";
import {
  getPlantCareProfile,
  getStaticPruningDefaults,
} from "../utils/plantCareDefaults";
import {
  getCommonPests,
  getCommonDiseases,
  getPestDiseaseEmoji,
} from "../utils/plantHelpers";
import {
  FEEDING_INTENSITY_LABELS,
  FEEDING_INTENSITY_SUGGESTED_DAYS,
  FERTILISER_LABELS,
  GROWTH_STAGE_LABELS,
  GROWING_SEASON_OPTIONS,
  LIFECYCLE_DESCRIPTIONS,
  LIFECYCLE_LABELS,
  SOIL_LABELS,
  SUNLIGHT_LABELS,
  TOLERANCE_LABELS,
  WATER_REQUIREMENT_LABELS,
} from "../utils/plantLabels";
import { getAllPests } from "../config/pests";
import { getAllDiseases } from "../config/diseases";
import { sanitizeLandmarkText } from "../utils/textSanitizer";
import { getErrorMessage } from "../utils/errorLogging";

type NavProp = NativeStackNavigationProp<MoreStackParamList, "CatalogPlantDetail">;
type RouteParam = RouteProp<MoreStackParamList, "CatalogPlantDetail">;

type CareFormState = {
  // Core care
  waterRequirement: WaterRequirement;
  wateringFrequencyDays: string;
  fertilisingFrequencyDays: string;
  sunlight: SunlightLevel;
  soilType: SoilType;
  preferredFertiliser: FertiliserType;
  initialGrowthStage: GrowthStage;
  // Pruning
  pruningFrequencyDays: string;
  pruningTips: string;
  shapePruningTip: string;
  shapePruningMonths: string;
  flowerPruningTip: string;
  flowerPruningMonths: string;
  // Botanical identity
  scientificName: string;
  taxonomicFamily: string;
  lifecycle: Lifecycle | "";
  description: string;
  tamilName: string;
  // Growing parameters
  growingSeason: string;
  daysToHarvestMin: string;
  daysToHarvestMax: string;
  yearsToFirstHarvest: string;
  heightCmMin: string;
  heightCmMax: string;
  spacingCm: string;
  plantingDepthCm: string;
  germinationDaysMin: string;
  germinationDaysMax: string;
  germinationTempMin: string;
  germinationTempMax: string;
  soilPhMin: string;
  soilPhMax: string;
  // Tolerances & nutrition
  heatTolerance: ToleranceLevel | "";
  droughtTolerance: ToleranceLevel | "";
  waterloggingTolerance: ToleranceLevel | "";
  feedingIntensity: FeedingIntensity | "";
  // Custom pests & diseases
  customPests: string[];
  customDiseases: string[];
};

const sanitizeName = (v: string): string => sanitizeLandmarkText(v).trim();
const sanitizeNum = (v: string): string => v.replace(/[^0-9]/g, "");
const sanitizeDecimal = (v: string): string => v.replace(/[^0-9.]/g, "");

const FIELD_HELP = {
  name: "Primary catalog name shown in lists, details, and linked garden plants.",
  tamilName:
    "Tamil name stored with this catalog entry for localized views and future Tamil UI support.",
  description:
    "Short plain-language summary of the plant. Keep it brief so it reads well in detail views.",
  scientificName:
    "Botanical Latin name used for accurate identification and future grouping logic.",
  taxonomicFamily:
    "Plant family, such as Solanaceae or Fabaceae. Useful for related-crop and rotation features.",
  lifecycle:
    "Defines whether the plant finishes its life cycle in one season, two seasons, or continues for multiple years.",
  growingSeason:
    "Best sowing or growing window for Tamil Nadu and Kanyakumari conditions.",
  waterRequirement:
    "Overall water demand for this plant. Use it together with the watering interval below.",
  wateringFrequencyDays:
    "How often watering reminders should repeat, in days.",
  fertilisingFrequencyDays:
    "How often fertiliser reminders should repeat, in days. Set Feeding Intensity above to auto-suggest this value.",
  sunlight:
    "Amount of direct sun or shade the plant prefers in normal growing conditions.",
  soilType:
    "Best-matching soil profile for drainage, root health, and nutrient performance.",
  preferredFertiliser:
    "Default fertiliser type suggested for this plant's care profile.",
  daysToHarvest:
    "Typical time from planting to first harvest. Use a range when timing varies by climate or variety.",
  yearsToFirstHarvest:
    "For trees and long-lived crops, how many years it usually takes to give the first useful harvest.",
  heightCm: "Typical mature height range in centimeters.",
  spacingCm:
    "Recommended distance between plants to reduce crowding and improve airflow.",
  plantingDepthCm:
    "Suggested sowing or planting depth in centimeters.",
  germinationDays:
    "How long seeds usually take to sprout under suitable conditions.",
  germinationTempC:
    "Temperature range where germination is most reliable.",
  soilPhRange: "Preferred soil acidity or alkalinity range for healthy growth.",
  heatTolerance:
    "How well the plant handles sustained hot weather and heat stress.",
  droughtTolerance:
    "How well the plant copes with dry spells or missed watering.",
  waterloggingTolerance:
    "How well the plant tolerates wet roots, standing moisture, or heavy monsoon rain.",
  feedingIntensity:
    "How heavily the plant draws nutrients from the soil. Light: ~60 days between fertilising. Medium: ~30 days. Heavy: ~14 days. Selecting this auto-fills the fertilising interval below.",
  pruningFrequencyDays:
    "How often pruning reminders should repeat, in days.",
  pruningTips:
    "Short, practical pruning guidance. Add one tip per line.",
  shapePruningTip:
    "How to prune for structure, airflow, and overall plant shape.",
  shapePruningMonths:
    "Best months or season window for structural pruning.",
  flowerPruningTip:
    "How to prune to support flowering and bloom quality.",
  flowerPruningMonths:
    "Best months or season window for flower-focused pruning.",
  initialGrowthStage:
    "Default stage assigned when a new garden plant is created from this catalog entry.",
  vitamins:
    "Key vitamins present in this plant's edible or usable parts. Helpful for planning nutritionally diverse harvests.",
  minerals:
    "Important mineral nutrients found in this plant. Useful for identifying crops that meet specific dietary or soil-health needs.",
  petToxicity:
    "Whether this plant is known to be toxic or safe for common household pets such as dogs and cats. Always confirm with a vet before allowing animals near the plant.",
} as const;

function rangeStr(val?: { min: number; max: number }): [string, string] {
  if (!val) return ["", ""];
  return [String(val.min), String(val.max)];
}

function toRange(min: string, max: string): { min: number; max: number } | undefined {
  const mn = parseFloat(min);
  const mx = parseFloat(max);
  if (Number.isNaN(mn) || Number.isNaN(mx)) return undefined;
  return { min: mn, max: mx };
}

function toOptNum(s: string): number | undefined {
  const n = parseFloat(s);
  return Number.isNaN(n) ? undefined : n;
}

function joinSummary(parts: (string | null | undefined)[]): string | undefined {
  const values = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  return values.length > 0 ? values.join(" • ") : undefined;
}

function formatRangeLabel(min: string, max: string, unit: string): string | undefined {
  if (min && max) return `${min}-${max} ${unit}`;
  if (min) return `From ${min} ${unit}`;
  if (max) return `Up to ${max} ${unit}`;
  return undefined;
}

function formatCount(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export default function CatalogPlantDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteParam>();
  const { plantName: initialName, plantType } = route.params;

  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [catalog, setCatalog] = useState<PlantCatalog>(DEFAULT_PLANT_CATALOG);
  const [careProfiles, setCareProfiles] = useState<Partial<PlantCareProfiles>>({});
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState(initialName);
  const [careForm, setCareForm] = useState<CareFormState | null>(null);
  const [newVariety, setNewVariety] = useState("");
  const [showReassign, setShowReassign] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reassignReplacement, setReassignReplacement] = useState("");
  const [showPestPicker, setShowPestPicker] = useState(false);
  const [showDiseasePicker, setShowDiseasePicker] = useState(false);
  const [pestSearch, setPestSearch] = useState("");
  const [diseaseSearch, setDiseaseSearch] = useState("");

  const categoryData = catalog.categories[plantType];
  const categoryPlants = categoryData?.plants ?? [];
  const categoryVarieties = categoryData?.varieties ?? {};
  const categoryCareProfiles = careProfiles[plantType] ?? {};
  const varieties: string[] = categoryVarieties[initialName] ?? [];

  const usageCount = useMemo(
    () =>
      plants.filter(
        (p) => p.plant_type === plantType && p.plant_variety === initialName,
      ).length,
    [plants, plantType, initialName],
  );
  const usageSummary =
    usageCount === 0
      ? "Not in garden yet"
      : `${usageCount} in garden`;

  const hasOverride = !!categoryCareProfiles[initialName];

  const buildCareForm = useCallback(
    (profiles: Partial<PlantCareProfiles>): CareFormState | null => {
      const base = getPlantCareProfile(initialName, plantType);
      if (!base) return null;
      const catProfiles = profiles[plantType] ?? {};
      const override = catProfiles[initialName];
      const merged: PlantCareProfile = { ...base, ...(override ?? {}) };

      const hasUserPruning =
        override?.pruningTips || override?.shapePruningTip || override?.flowerPruningTip;
      const staticPruning = getStaticPruningDefaults(plantType, initialName);

      const [dthMin, dthMax] = rangeStr(merged.daysToHarvest);
      const [htMin, htMax] = rangeStr(merged.heightCm);
      const [gdMin, gdMax] = rangeStr(merged.germinationDays);
      const [gtMin, gtMax] = rangeStr(merged.germinationTempC);
      const [phMin, phMax] = rangeStr(merged.soilPhRange);

      return {
        waterRequirement: merged.waterRequirement,
        wateringFrequencyDays: merged.wateringFrequencyDays?.toString() ?? "",
        fertilisingFrequencyDays: merged.fertilisingFrequencyDays?.toString() ?? "",
        pruningFrequencyDays: merged.pruningFrequencyDays?.toString() ?? "",
        sunlight: merged.sunlight,
        soilType: merged.soilType,
        preferredFertiliser: merged.preferredFertiliser,
        initialGrowthStage: merged.initialGrowthStage,
        pruningTips: hasUserPruning
          ? (override?.pruningTips ?? []).join("\n")
          : staticPruning.tips.join("\n"),
        shapePruningTip: hasUserPruning
          ? (override?.shapePruningTip ?? "")
          : (staticPruning.shapePruning?.tip ?? ""),
        shapePruningMonths: hasUserPruning
          ? (override?.shapePruningMonths ?? "")
          : (staticPruning.shapePruning?.months ?? ""),
        flowerPruningTip: hasUserPruning
          ? (override?.flowerPruningTip ?? "")
          : (staticPruning.flowerPruning?.tip ?? ""),
        flowerPruningMonths: hasUserPruning
          ? (override?.flowerPruningMonths ?? "")
          : (staticPruning.flowerPruning?.months ?? ""),
        // Botanical identity
        scientificName: merged.scientificName ?? "",
        taxonomicFamily: merged.taxonomicFamily ?? "",
        lifecycle: merged.lifecycle ?? "",
        description: merged.description ?? "",
        tamilName: merged.tamilName ?? "",
        // Growing parameters
        growingSeason: merged.growingSeason ?? "",
        daysToHarvestMin: dthMin,
        daysToHarvestMax: dthMax,
        yearsToFirstHarvest: merged.yearsToFirstHarvest?.toString() ?? "",
        heightCmMin: htMin,
        heightCmMax: htMax,
        spacingCm: merged.spacingCm?.toString() ?? "",
        plantingDepthCm: merged.plantingDepthCm?.toString() ?? "",
        germinationDaysMin: gdMin,
        germinationDaysMax: gdMax,
        germinationTempMin: gtMin,
        germinationTempMax: gtMax,
        soilPhMin: phMin,
        soilPhMax: phMax,
        // Tolerances & nutrition
        heatTolerance: merged.heatTolerance ?? "",
        droughtTolerance: merged.droughtTolerance ?? "",
        waterloggingTolerance: merged.waterloggingTolerance ?? "",
        feedingIntensity: merged.feedingIntensity ?? "",
        // Custom pests & diseases
        customPests: override?.customPests ?? [],
        customDiseases: override?.customDiseases ?? [],
      };
    },
    [initialName, plantType],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catalogData, allPlants, careProfileData] = await Promise.all([
        getPlantCatalog(),
        getAllPlants(),
        getPlantCareProfiles(),
      ]);
      setCatalog(catalogData);
      setPlants(allPlants);
      setCareProfiles(careProfileData);
      setCareForm(buildCareForm(careProfileData));
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error) ?? "Failed to load plant data.");
    } finally {
      setLoading(false);
    }
  }, [buildCareForm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Variety helpers ──────────────────────────────────────────────────────

  const handleAddVariety = (): void => {
    const v = sanitizeName(newVariety);
    if (!v) return;
    const current = categoryVarieties[initialName] ?? [];
    if (current.some((x) => x.toLowerCase() === v.toLowerCase())) {
      setNewVariety("");
      return;
    }
    const nextVarieties = { ...categoryVarieties, [initialName]: [...current, v] };
    setCatalog((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [plantType]: { plants: categoryPlants, varieties: nextVarieties },
      },
    }));
    setNewVariety("");
  };

  const handleRemoveVariety = (v: string): void => {
    const current = categoryVarieties[initialName] ?? [];
    const filtered = current.filter((x) => x.toLowerCase() !== v.toLowerCase());
    const nextVarieties = { ...categoryVarieties };
    if (filtered.length === 0) delete nextVarieties[initialName];
    else nextVarieties[initialName] = filtered;
    setCatalog((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [plantType]: { plants: categoryPlants, varieties: nextVarieties },
      },
    }));
  };

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async (): Promise<void> => {
    const trimmedName = sanitizeName(name);
    if (!trimmedName) {
      Alert.alert("Name Required", "Enter a plant name.");
      return;
    }
    const wateringDaysVal = parseInt(careForm?.wateringFrequencyDays ?? "", 10);
    if (Number.isNaN(wateringDaysVal) || wateringDaysVal < 1) {
      Alert.alert("Validation Error", "Enter a valid watering frequency (days).");
      return;
    }
    const fertDaysVal = parseInt(careForm?.fertilisingFrequencyDays ?? "", 10);
    if (Number.isNaN(fertDaysVal) || fertDaysVal < 1) {
      Alert.alert("Validation Error", "Enter a valid fertilising frequency (days).");
      return;
    }
    const isDuplicate =
      trimmedName.toLowerCase() !== initialName.toLowerCase() &&
      categoryPlants.some((p) => p.toLowerCase() === trimmedName.toLowerCase());
    if (isDuplicate) {
      Alert.alert("Already Exists", "A plant with that name already exists.");
      return;
    }
    const renameCount =
      trimmedName !== initialName
        ? plants.filter(
            (p) => p.plant_type === plantType && p.plant_variety === initialName,
          ).length
        : 0;

    if (renameCount > 0) {
      Alert.alert(
        "Update Plants",
        `Renaming will update ${renameCount} plant(s). Continue?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Rename", onPress: () => doSave(trimmedName) },
        ],
      );
    } else {
      doSave(trimmedName);
    }
  };

  const doSave = async (trimmedName: string): Promise<void> => {
    if (!careForm) return;
    setSaving(true);
    try {
      // ── Catalog update (rename + varieties) ─────────────────────────────
      let updatedPlants = categoryPlants;
      const updatedVarieties = { ...(catalog.categories[plantType]?.varieties ?? {}) };

      if (trimmedName !== initialName) {
        updatedPlants = categoryPlants.map((p) => (p === initialName ? trimmedName : p));
        if (updatedVarieties[initialName]) {
          updatedVarieties[trimmedName] = updatedVarieties[initialName]!;
          delete updatedVarieties[initialName];
        }
        const targets = plants.filter(
          (p) => p.plant_type === plantType && p.plant_variety === initialName,
        );
        for (const p of targets) {
          await updatePlantVariety(p.id, trimmedName);
        }
      } else {
        const localVarieties = catalog.categories[plantType]?.varieties ?? {};
        if (localVarieties[initialName]) {
          updatedVarieties[initialName] = localVarieties[initialName]!;
        } else {
          delete updatedVarieties[initialName];
        }
      }

      const nextCatalog: PlantCatalog = {
        ...catalog,
        categories: {
          ...catalog.categories,
          [plantType]: { plants: updatedPlants, varieties: updatedVarieties },
        },
      };
      await savePlantCatalog(nextCatalog);

      // ── Care profile override ────────────────────────────────────────────
      const pruningDaysVal = parseInt(careForm.pruningFrequencyDays, 10);
      const pruningTips = careForm.pruningTips
        .split("\n")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const override: Partial<PlantCareProfile> = {
        waterRequirement: careForm.waterRequirement,
        wateringFrequencyDays: parseInt(careForm.wateringFrequencyDays, 10),
        fertilisingFrequencyDays: parseInt(careForm.fertilisingFrequencyDays, 10),
        pruningFrequencyDays:
          Number.isNaN(pruningDaysVal) || pruningDaysVal < 1 ? undefined : pruningDaysVal,
        sunlight: careForm.sunlight,
        soilType: careForm.soilType,
        preferredFertiliser: careForm.preferredFertiliser,
        initialGrowthStage: careForm.initialGrowthStage,
        pruningTips: pruningTips.length > 0 ? pruningTips : undefined,
        shapePruningTip: careForm.shapePruningTip.trim() || undefined,
        shapePruningMonths: careForm.shapePruningMonths.trim() || undefined,
        flowerPruningTip: careForm.flowerPruningTip.trim() || undefined,
        flowerPruningMonths: careForm.flowerPruningMonths.trim() || undefined,
        // Botanical identity
        scientificName: careForm.scientificName.trim() || undefined,
        taxonomicFamily: careForm.taxonomicFamily.trim() || undefined,
        lifecycle: (careForm.lifecycle || undefined) as Lifecycle | undefined,
        description: careForm.description.trim() || undefined,
        tamilName: careForm.tamilName.trim() || undefined,
        // Growing parameters
        growingSeason: careForm.growingSeason.trim() || undefined,
        daysToHarvest: toRange(careForm.daysToHarvestMin, careForm.daysToHarvestMax),
        yearsToFirstHarvest: toOptNum(careForm.yearsToFirstHarvest),
        heightCm: toRange(careForm.heightCmMin, careForm.heightCmMax),
        spacingCm: toOptNum(careForm.spacingCm),
        plantingDepthCm: toOptNum(careForm.plantingDepthCm),
        germinationDays: toRange(careForm.germinationDaysMin, careForm.germinationDaysMax),
        germinationTempC: toRange(careForm.germinationTempMin, careForm.germinationTempMax),
        soilPhRange: toRange(careForm.soilPhMin, careForm.soilPhMax),
        // Tolerances & nutrition
        heatTolerance: (careForm.heatTolerance || undefined) as ToleranceLevel | undefined,
        droughtTolerance: (careForm.droughtTolerance || undefined) as ToleranceLevel | undefined,
        waterloggingTolerance: (careForm.waterloggingTolerance || undefined) as ToleranceLevel | undefined,
        feedingIntensity: (careForm.feedingIntensity || undefined) as FeedingIntensity | undefined,
        // Custom pests & diseases
        customPests: careForm.customPests.length > 0 ? careForm.customPests : undefined,
        customDiseases: careForm.customDiseases.length > 0 ? careForm.customDiseases : undefined,
      };

      const nextCatProfiles = { ...categoryCareProfiles };
      const careKey = trimmedName;
      nextCatProfiles[careKey] = override;
      if (trimmedName !== initialName && nextCatProfiles[initialName]) {
        delete nextCatProfiles[initialName];
      }
      await savePlantCareProfiles({ ...careProfiles, [plantType]: nextCatProfiles });

      navigation.goBack();
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error) ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetCare = (): void => {
    if (!hasOverride) return;
    Alert.alert(
      "Reset Defaults",
      "Remove custom care defaults and use app defaults?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              const nextCatProfiles = { ...categoryCareProfiles };
              delete nextCatProfiles[initialName];
              const nextProfiles = { ...careProfiles, [plantType]: nextCatProfiles };
              await savePlantCareProfiles(nextProfiles);
              setCareProfiles(nextProfiles);
              setCareForm(buildCareForm(nextProfiles));
            } catch (error: unknown) {
              Alert.alert("Error", getErrorMessage(error) ?? "Failed to reset.");
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  const handleDeleteRequest = (): void => {
    if (usageCount === 0) {
      setShowDeleteConfirm(true);
      return;
    }
    const remaining = categoryPlants.filter((p) => p !== initialName);
    if (remaining.length === 0) {
      Alert.alert("Cannot Delete", "Add another plant option before deleting this one.");
      return;
    }
    setReassignReplacement(remaining[0]!);
    setShowReassign(true);
  };

  const doDelete = async (replacement?: string): Promise<void> => {
    setSaving(true);
    try {
      if (replacement) {
        const targets = plants.filter(
          (p) => p.plant_type === plantType && p.plant_variety === initialName,
        );
        for (const p of targets) {
          await updatePlantVariety(p.id, replacement);
        }
      }
      const nextVarieties = { ...(catalog.categories[plantType]?.varieties ?? {}) };
      delete nextVarieties[initialName];
      const nextCatalog: PlantCatalog = {
        ...catalog,
        categories: {
          ...catalog.categories,
          [plantType]: {
            plants: categoryPlants.filter((p) => p !== initialName),
            varieties: nextVarieties,
          },
        },
      };
      await savePlantCatalog(nextCatalog);
      if (categoryCareProfiles[initialName]) {
        const nextCatProfiles = { ...categoryCareProfiles };
        delete nextCatProfiles[initialName];
        await savePlantCareProfiles({ ...careProfiles, [plantType]: nextCatProfiles });
      }
      setShowReassign(false);
      navigation.goBack();
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error) ?? "Failed to delete.");
    } finally {
      setSaving(false);
    }
  };

  const pests = useMemo(() => getCommonPests(plantType, initialName), [plantType, initialName]);
  const diseases = useMemo(() => getCommonDiseases(plantType, initialName), [plantType, initialName]);

  // Read-only data from base profile for nutrition display
  const baseProfile = useMemo(() => getPlantCareProfile(initialName, plantType), [initialName, plantType]);

  const setForm = useCallback(
    (patch: Partial<CareFormState>) =>
      setCareForm((prev) => (prev ? { ...prev, ...patch } : prev)),
    [],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const toleranceItems = Object.entries(TOLERANCE_LABELS).map(([value, label]) => ({ label, value }));
  const displayName = name.trim() || initialName;
  const lifecycleLabel = careForm?.lifecycle
    ? LIFECYCLE_LABELS[careForm.lifecycle as Lifecycle]
    : undefined;
  const waterRequirementLabel = careForm
    ? WATER_REQUIREMENT_LABELS[careForm.waterRequirement]
    : undefined;
  const sunlightLabel = careForm ? SUNLIGHT_LABELS[careForm.sunlight] : undefined;
  const growthStageLabel = careForm
    ? GROWTH_STAGE_LABELS[careForm.initialGrowthStage]
    : undefined;
  const heatToleranceLabel = careForm?.heatTolerance
    ? TOLERANCE_LABELS[careForm.heatTolerance as ToleranceLevel]
    : undefined;
  const droughtToleranceLabel = careForm?.droughtTolerance
    ? TOLERANCE_LABELS[careForm.droughtTolerance as ToleranceLevel]
    : undefined;
  const waterloggingToleranceLabel = careForm?.waterloggingTolerance
    ? TOLERANCE_LABELS[careForm.waterloggingTolerance as ToleranceLevel]
    : undefined;
  const pruningTipsCount = careForm?.pruningTips
    .split("\n")
    .map((tip) => tip.trim())
    .filter((tip) => tip.length > 0).length ?? 0;
  const linkedPestCount = pests.length + (careForm?.customPests.length ?? 0);
  const linkedDiseaseCount = diseases.length + (careForm?.customDiseases.length ?? 0);

  const plantInfoSummary =
    joinSummary([
      careForm?.scientificName,
      lifecycleLabel,
      careForm?.tamilName ? `Tamil: ${careForm.tamilName}` : undefined,
    ]) ?? "Name, identity, and description";
  const coreCareSummary =
    joinSummary([
      waterRequirementLabel,
      careForm?.wateringFrequencyDays
        ? `Water every ${careForm.wateringFrequencyDays} days`
        : undefined,
      sunlightLabel,
    ]) ?? "Water, sunlight, and soil defaults";
  const growingInfoSummary =
    joinSummary([
      careForm?.growingSeason,
      formatRangeLabel(
        careForm?.daysToHarvestMin ?? "",
        careForm?.daysToHarvestMax ?? "",
        "days",
      ),
      careForm?.spacingCm ? `Spacing ${careForm.spacingCm} cm` : undefined,
    ]) ?? "Harvest timing, spacing, and germination";
  const toleranceSummary =
    joinSummary([
      heatToleranceLabel ? `Heat ${heatToleranceLabel}` : undefined,
      droughtToleranceLabel ? `Drought ${droughtToleranceLabel}` : undefined,
      waterloggingToleranceLabel
        ? `Waterlogging ${waterloggingToleranceLabel}`
        : undefined,
      baseProfile?.petToxicity !== undefined
        ? baseProfile.petToxicity
          ? "Pet toxic"
          : "Pet safe"
        : undefined,
    ]) ?? "Stress tolerance and nutrition info";
  const pruningSummary =
    joinSummary([
      careForm?.pruningFrequencyDays
        ? `Every ${careForm.pruningFrequencyDays} days`
        : undefined,
      pruningTipsCount > 0 ? formatCount(pruningTipsCount, "tip") : undefined,
      careForm?.shapePruningTip ? "Shape pruning" : undefined,
    ]) ?? "Timing and pruning guidance";
  const plantingSummary = growthStageLabel
    ? `Starts at ${growthStageLabel}`
    : "Default growth stage";
  const pestsSummary =
    linkedPestCount > 0
      ? formatCount(linkedPestCount, "linked pest", "linked pests")
      : "No linked pests";
  const diseasesSummary =
    linkedDiseaseCount > 0
      ? formatCount(linkedDiseaseCount, "linked disease", "linked diseases")
      : "No linked diseases";
  const varietiesSummary =
    varieties.length > 0
      ? formatCount(varieties.length, "saved variety", "saved varieties")
      : "No saved varieties";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerActionSlot}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>{displayName}</Text>
          <View style={styles.headerMetaRow}>
            <Text style={styles.headerMetaText} numberOfLines={1}>{usageSummary}</Text>
            <View
              style={[
                styles.headerStatePill,
                hasOverride ? styles.headerStatePillCustom : styles.headerStatePillDefault,
              ]}
            >
              <Text
                style={[
                  styles.headerStatePillText,
                  hasOverride
                    ? styles.headerStatePillTextCustom
                    : styles.headerStatePillTextDefault,
                ]}
              >
                {hasOverride ? "Custom" : "App defaults"}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerActionSlot}>
          <TouchableOpacity style={styles.btnDangerIcon} onPress={handleDeleteRequest}>
            <Ionicons name="trash-outline" size={18} color={theme.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Plant Info ─────────────────────────────────────────────────── */}
        <CollapsibleSection
          title="Plant Info"
          icon="information-circle-outline"
          defaultExpanded={true}
          summary={plantInfoSummary}
        >
          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Name"
              value={name}
              onChangeText={setName}
              helpText={FIELD_HELP.name}
              autoCorrect={false}
            />
          </View>
          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Tamil name"
              value={careForm?.tamilName ?? ""}
              onChangeText={(v) => setForm({ tamilName: v })}
              helpText={FIELD_HELP.tamilName}
              autoCorrect={false}
            />
          </View>
          <View style={styles.careStatusBanner}>
            <View style={styles.careStatus}>
              <Ionicons
                name={hasOverride ? "settings" : "leaf-outline"}
                size={15}
                color={hasOverride ? theme.primary : theme.textSecondary}
              />
              <Text style={styles.careStatusText}>
                {hasOverride ? "Custom defaults active" : "Using shared app defaults"}
              </Text>
            </View>
            <Text style={styles.careStatusNote}>
              New garden plants created from this catalog entry will inherit these values.
            </Text>
          </View>
          {careForm?.description !== undefined && (
            <View style={styles.fieldGroup}>
              <FieldLabelWithHelp
                helpText={FIELD_HELP.description}
                label="Description"
                labelStyle={styles.pruningTipsLabel}
                style={styles.fieldLabelRow}
              />
              <TextInput
                style={styles.descriptionInput}
                multiline
                value={careForm.description}
                onChangeText={(v) => setForm({ description: v })}
                placeholder="Brief description of this plant"
                placeholderTextColor={theme.inputPlaceholder}
              />
            </View>
          )}
          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Scientific name"
              value={careForm?.scientificName ?? ""}
              onChangeText={(v) => setForm({ scientificName: v })}
              helpText={FIELD_HELP.scientificName}
              autoCorrect={false}
            />
          </View>
          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Taxonomic family"
              value={careForm?.taxonomicFamily ?? ""}
              onChangeText={(v) => setForm({ taxonomicFamily: v })}
              helpText={FIELD_HELP.taxonomicFamily}
              autoCorrect={false}
            />
          </View>
          <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
            <ThemedDropdown
              items={Object.entries(LIFECYCLE_LABELS).map(([value, label]) => ({ label, value }))}
              selectedValue={careForm?.lifecycle ?? ""}
              onValueChange={(v) => setForm({ lifecycle: v as Lifecycle })}
              label="Lifecycle"
              placeholder="Lifecycle"
              helpText={
                careForm?.lifecycle
                  ? `${FIELD_HELP.lifecycle}\n\n${LIFECYCLE_LABELS[careForm.lifecycle as Lifecycle]}: ${LIFECYCLE_DESCRIPTIONS[careForm.lifecycle as Lifecycle]}`
                  : FIELD_HELP.lifecycle
              }
              compact
            />
          </View>
        </CollapsibleSection>

        {/* ── Core Care ─────────────────────────────────────────────────── */}
        <CollapsibleSection
          title="Core Care"
          icon="water-outline"
          defaultExpanded={true}
          summary={coreCareSummary}
        >
          <View style={styles.fieldGroup}>
            <ThemedDropdown
              items={Object.entries(WATER_REQUIREMENT_LABELS).map(([value, label]) => ({ label, value }))}
              selectedValue={careForm?.waterRequirement ?? ""}
              onValueChange={(v) => setForm({ waterRequirement: v as WaterRequirement })}
              label="Water requirement"
              placeholder="Water requirement"
              helpText={FIELD_HELP.waterRequirement}
              compact
            />
          </View>
          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Watering frequency (days)"
              keyboardType="numeric"
              value={careForm?.wateringFrequencyDays ?? ""}
              onChangeText={(v) => setForm({ wateringFrequencyDays: sanitizeNum(v) })}
              helpText={FIELD_HELP.wateringFrequencyDays}
            />
          </View>
          <View style={styles.fieldGroup}>
            <ThemedDropdown
              items={Object.entries(FEEDING_INTENSITY_LABELS).map(([value, label]) => ({ label, value }))}
              selectedValue={careForm?.feedingIntensity ?? ""}
              onValueChange={(v) => {
                const intensity = v as FeedingIntensity;
                setForm({
                  feedingIntensity: intensity,
                  fertilisingFrequencyDays: String(FEEDING_INTENSITY_SUGGESTED_DAYS[intensity]),
                });
              }}
              label="Feeding intensity"
              placeholder="Feeding intensity"
              helpText={FIELD_HELP.feedingIntensity}
              compact
            />
          </View>
          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Fertilising frequency (days)"
              keyboardType="numeric"
              value={careForm?.fertilisingFrequencyDays ?? ""}
              onChangeText={(v) => setForm({ fertilisingFrequencyDays: sanitizeNum(v) })}
              helpText={FIELD_HELP.fertilisingFrequencyDays}
            />
            {careForm?.feedingIntensity ? (
              <Text style={styles.feedingHint}>
                Suggested: {FEEDING_INTENSITY_SUGGESTED_DAYS[careForm.feedingIntensity]} days for{" "}
                {FEEDING_INTENSITY_LABELS[careForm.feedingIntensity].toLowerCase()} feeders
              </Text>
            ) : null}
          </View>
          <View style={styles.fieldGroup}>
            <ThemedDropdown
              items={Object.entries(SUNLIGHT_LABELS).map(([value, label]) => ({ label, value }))}
              selectedValue={careForm?.sunlight ?? ""}
              onValueChange={(v) => setForm({ sunlight: v as SunlightLevel })}
              label="Sunlight"
              placeholder="Sunlight"
              helpText={FIELD_HELP.sunlight}
              compact
            />
          </View>
          <View style={styles.fieldGroup}>
            <ThemedDropdown
              items={Object.entries(SOIL_LABELS).map(([value, label]) => ({ label, value }))}
              selectedValue={careForm?.soilType ?? ""}
              onValueChange={(v) => setForm({ soilType: v as SoilType })}
              label="Soil type"
              placeholder="Soil type"
              helpText={FIELD_HELP.soilType}
              compact
            />
          </View>
          <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
            <ThemedDropdown
              items={Object.entries(FERTILISER_LABELS).map(([value, label]) => ({ label, value }))}
              selectedValue={careForm?.preferredFertiliser ?? ""}
              onValueChange={(v) => setForm({ preferredFertiliser: v as FertiliserType })}
              label="Preferred fertiliser"
              placeholder="Preferred fertiliser"
              helpText={FIELD_HELP.preferredFertiliser}
              compact
            />
          </View>
        </CollapsibleSection>

        {/* ── Growing Info ──────────────────────────────────────────────── */}
        <CollapsibleSection
          title="Growing Info"
          icon="stats-chart-outline"
          defaultExpanded={false}
          summary={growingInfoSummary}
        >
          <View style={styles.fieldGroup}>
            <ThemedDropdown
              items={GROWING_SEASON_OPTIONS}
              selectedValue={careForm?.growingSeason ?? ""}
              onValueChange={(v) => setForm({ growingSeason: v })}
              label="Growing season"
              placeholder="Select growing season"
              helpText={FIELD_HELP.growingSeason}
              compact
            />
          </View>
          <View style={styles.fieldGroup}>
            <FieldLabelWithHelp
              helpText={FIELD_HELP.daysToHarvest}
              label="Days to harvest (min – max)"
              labelStyle={styles.pruningTipsLabel}
              style={styles.fieldLabelRow}
            />
            <View style={styles.rangeRow}>
              <View style={styles.rangeField}>
                <FloatingLabelInput
                  label="Min days"
                  keyboardType="numeric"
                  value={careForm?.daysToHarvestMin ?? ""}
                  onChangeText={(v) => setForm({ daysToHarvestMin: sanitizeNum(v) })}
                />
              </View>
              <View style={styles.rangeField}>
                <FloatingLabelInput
                  label="Max days"
                  keyboardType="numeric"
                  value={careForm?.daysToHarvestMax ?? ""}
                  onChangeText={(v) => setForm({ daysToHarvestMax: sanitizeNum(v) })}
                />
              </View>
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Years to first harvest"
              keyboardType="numeric"
              value={careForm?.yearsToFirstHarvest ?? ""}
              onChangeText={(v) => setForm({ yearsToFirstHarvest: sanitizeNum(v) })}
              helpText={FIELD_HELP.yearsToFirstHarvest}
            />
          </View>
          <View style={styles.fieldGroup}>
            <FieldLabelWithHelp
              helpText={FIELD_HELP.heightCm}
              label="Height cm (min – max)"
              labelStyle={styles.pruningTipsLabel}
              style={styles.fieldLabelRow}
            />
            <View style={styles.rangeRow}>
              <View style={styles.rangeField}>
                <FloatingLabelInput
                  label="Min cm"
                  keyboardType="numeric"
                  value={careForm?.heightCmMin ?? ""}
                  onChangeText={(v) => setForm({ heightCmMin: sanitizeNum(v) })}
                />
              </View>
              <View style={styles.rangeField}>
                <FloatingLabelInput
                  label="Max cm"
                  keyboardType="numeric"
                  value={careForm?.heightCmMax ?? ""}
                  onChangeText={(v) => setForm({ heightCmMax: sanitizeNum(v) })}
                />
              </View>
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Spacing cm"
              keyboardType="numeric"
              value={careForm?.spacingCm ?? ""}
              onChangeText={(v) => setForm({ spacingCm: sanitizeNum(v) })}
              helpText={FIELD_HELP.spacingCm}
            />
          </View>
          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Planting depth cm"
              keyboardType="decimal-pad"
              value={careForm?.plantingDepthCm ?? ""}
              onChangeText={(v) => setForm({ plantingDepthCm: sanitizeDecimal(v) })}
              helpText={FIELD_HELP.plantingDepthCm}
            />
          </View>
          <View style={styles.fieldGroup}>
            <FieldLabelWithHelp
              helpText={FIELD_HELP.germinationDays}
              label="Germination days (min – max)"
              labelStyle={styles.pruningTipsLabel}
              style={styles.fieldLabelRow}
            />
            <View style={styles.rangeRow}>
              <View style={styles.rangeField}>
                <FloatingLabelInput
                  label="Min days"
                  keyboardType="numeric"
                  value={careForm?.germinationDaysMin ?? ""}
                  onChangeText={(v) => setForm({ germinationDaysMin: sanitizeNum(v) })}
                />
              </View>
              <View style={styles.rangeField}>
                <FloatingLabelInput
                  label="Max days"
                  keyboardType="numeric"
                  value={careForm?.germinationDaysMax ?? ""}
                  onChangeText={(v) => setForm({ germinationDaysMax: sanitizeNum(v) })}
                />
              </View>
            </View>
          </View>
          <View style={styles.fieldGroup}>
            <FieldLabelWithHelp
              helpText={FIELD_HELP.germinationTempC}
              label="Germination temp °C (min – max)"
              labelStyle={styles.pruningTipsLabel}
              style={styles.fieldLabelRow}
            />
            <View style={styles.rangeRow}>
              <View style={styles.rangeField}>
                <FloatingLabelInput
                  label="Min °C"
                  keyboardType="decimal-pad"
                  value={careForm?.germinationTempMin ?? ""}
                  onChangeText={(v) => setForm({ germinationTempMin: sanitizeDecimal(v) })}
                />
              </View>
              <View style={styles.rangeField}>
                <FloatingLabelInput
                  label="Max °C"
                  keyboardType="decimal-pad"
                  value={careForm?.germinationTempMax ?? ""}
                  onChangeText={(v) => setForm({ germinationTempMax: sanitizeDecimal(v) })}
                />
              </View>
            </View>
          </View>
          <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
            <FieldLabelWithHelp
              helpText={FIELD_HELP.soilPhRange}
              label="Soil pH range (min – max)"
              labelStyle={styles.pruningTipsLabel}
              style={styles.fieldLabelRow}
            />
            <View style={styles.rangeRow}>
              <View style={styles.rangeField}>
                <FloatingLabelInput
                  label="Min pH"
                  keyboardType="decimal-pad"
                  value={careForm?.soilPhMin ?? ""}
                  onChangeText={(v) => setForm({ soilPhMin: sanitizeDecimal(v) })}
                />
              </View>
              <View style={styles.rangeField}>
                <FloatingLabelInput
                  label="Max pH"
                  keyboardType="decimal-pad"
                  value={careForm?.soilPhMax ?? ""}
                  onChangeText={(v) => setForm({ soilPhMax: sanitizeDecimal(v) })}
                />
              </View>
            </View>
          </View>
        </CollapsibleSection>

        {/* ── Tolerances & Nutrition ─────────────────────────────────── */}
        <CollapsibleSection
          title="Tolerances & Nutrition"
          icon="shield-checkmark-outline"
          defaultExpanded={false}
          summary={toleranceSummary}
        >
          <View style={styles.fieldGroup}>
            <ThemedDropdown
              items={toleranceItems}
              selectedValue={careForm?.heatTolerance ?? ""}
              onValueChange={(v) => setForm({ heatTolerance: v as ToleranceLevel })}
              label="Heat tolerance"
              placeholder="Heat tolerance"
              helpText={FIELD_HELP.heatTolerance}
              compact
            />
          </View>
          <View style={styles.fieldGroup}>
            <ThemedDropdown
              items={toleranceItems}
              selectedValue={careForm?.droughtTolerance ?? ""}
              onValueChange={(v) => setForm({ droughtTolerance: v as ToleranceLevel })}
              label="Drought tolerance"
              placeholder="Drought tolerance"
              helpText={FIELD_HELP.droughtTolerance}
              compact
            />
          </View>
          <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
            <ThemedDropdown
              items={toleranceItems}
              selectedValue={careForm?.waterloggingTolerance ?? ""}
              onValueChange={(v) => setForm({ waterloggingTolerance: v as ToleranceLevel })}
              label="Waterlogging tolerance"
              placeholder="Waterlogging tolerance"
              helpText={FIELD_HELP.waterloggingTolerance}
              compact
            />
          </View>
          {/* Read-only nutrition info */}
          {(baseProfile?.vitamins?.length || baseProfile?.minerals?.length || baseProfile?.petToxicity !== undefined) && (
            <View style={styles.nutritionSection}>
              {(baseProfile?.vitamins?.length ?? 0) > 0 && (
                <View style={styles.nutritionGroup}>
                  <FieldLabelWithHelp
                    label="Vitamins"
                    helpText={FIELD_HELP.vitamins}
                    labelStyle={styles.nutritionGroupLabel}
                    style={styles.fieldLabelRow}
                  />
                  <View style={styles.chipRow}>
                    {baseProfile!.vitamins!.map((v) => (
                      <View key={v} style={styles.readChip}>
                        <Text style={styles.readChipText}>💊 {v}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {(baseProfile?.minerals?.length ?? 0) > 0 && (
                <View style={styles.nutritionGroup}>
                  <FieldLabelWithHelp
                    label="Minerals"
                    helpText={FIELD_HELP.minerals}
                    labelStyle={styles.nutritionGroupLabel}
                    style={styles.fieldLabelRow}
                  />
                  <View style={styles.chipRow}>
                    {baseProfile!.minerals!.map((m) => (
                      <View key={m} style={styles.readChip}>
                        <Text style={styles.readChipText}>⚗️ {m}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {baseProfile?.petToxicity !== undefined && (
                <View style={styles.nutritionGroup}>
                  <FieldLabelWithHelp
                    label="Animal Safety"
                    helpText={FIELD_HELP.petToxicity}
                    labelStyle={styles.nutritionGroupLabel}
                    style={styles.fieldLabelRow}
                  />
                  <View style={baseProfile.petToxicity ? styles.toxicBadge : styles.safeBadge}>
                    <Text style={styles.badgeText}>
                      {baseProfile.petToxicity ? "⚠️ Pet Toxic" : "✓ Pet Safe"}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </CollapsibleSection>

        {/* ── Pruning ───────────────────────────────────────────────────── */}
        <CollapsibleSection
          title="Pruning"
          icon="cut-outline"
          defaultExpanded={false}
          summary={pruningSummary}
        >
          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Pruning frequency (days)"
              keyboardType="numeric"
              value={careForm?.pruningFrequencyDays ?? ""}
              onChangeText={(v) => setForm({ pruningFrequencyDays: sanitizeNum(v) })}
              helpText={FIELD_HELP.pruningFrequencyDays}
            />
          </View>
          <View style={styles.fieldGroup}>
            <FieldLabelWithHelp
              helpText={FIELD_HELP.pruningTips}
              label="Tips (one per line)"
              labelStyle={styles.pruningTipsLabel}
              style={styles.fieldLabelRow}
            />
            <TextInput
              style={styles.pruningTipsInput}
              multiline
              value={careForm?.pruningTips ?? ""}
              onChangeText={(v) => setForm({ pruningTips: v })}
              placeholder="e.g. Remove yellowing lower leaves"
              placeholderTextColor={theme.inputPlaceholder}
            />
          </View>
          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Shape pruning tip"
              value={careForm?.shapePruningTip ?? ""}
              onChangeText={(v) => setForm({ shapePruningTip: v })}
              helpText={FIELD_HELP.shapePruningTip}
            />
          </View>
          {!!careForm?.shapePruningTip && (
            <View style={styles.fieldGroup}>
              <FloatingLabelInput
                label="Shape pruning — best months"
                value={careForm?.shapePruningMonths ?? ""}
                onChangeText={(v) => setForm({ shapePruningMonths: v })}
                helpText={FIELD_HELP.shapePruningMonths}
                placeholder="e.g. Jan–Feb"
              />
            </View>
          )}
          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Flower pruning tip"
              value={careForm?.flowerPruningTip ?? ""}
              onChangeText={(v) => setForm({ flowerPruningTip: v })}
              helpText={FIELD_HELP.flowerPruningTip}
            />
          </View>
          {!!careForm?.flowerPruningTip && (
            <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
              <FloatingLabelInput
                label="Flower pruning — best months"
                value={careForm?.flowerPruningMonths ?? ""}
                onChangeText={(v) => setForm({ flowerPruningMonths: v })}
                helpText={FIELD_HELP.flowerPruningMonths}
                placeholder="e.g. Year-round"
              />
            </View>
          )}
        </CollapsibleSection>

        {/* ── Planting ──────────────────────────────────────────────────── */}
        <CollapsibleSection
          title="Planting"
          icon="leaf-outline"
          defaultExpanded={false}
          summary={plantingSummary}
        >
          <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
            <ThemedDropdown
              items={Object.entries(GROWTH_STAGE_LABELS).map(([value, label]) => ({ label, value }))}
              selectedValue={careForm?.initialGrowthStage ?? ""}
              onValueChange={(v) => setForm({ initialGrowthStage: v as GrowthStage })}
              label="Initial growth stage"
              placeholder="Initial growth stage"
              helpText={FIELD_HELP.initialGrowthStage}
              compact
            />
          </View>
        </CollapsibleSection>

        {/* ── Known Pests ───────────────────────────────────────────────── */}
        <CollapsibleSection
          title="Known Pests"
          icon="bug-outline"
          defaultExpanded={false}
          summary={pestsSummary}
          headerAction={
            <TouchableOpacity
              style={styles.sectionHeaderAction}
              onPress={() => setShowPestPicker(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Add pest"
            >
              <Ionicons name="add" size={16} color={theme.primary} />
            </TouchableOpacity>
          }
        >
          <View style={styles.chipRow}>
            {pests.map((pest) => (
              <View key={pest} style={styles.readChip}>
                <Text style={styles.readChipText}>
                  {getPestDiseaseEmoji(pest, "pest")} {pest}
                </Text>
              </View>
            ))}
            {(careForm?.customPests ?? []).map((pest) => (
              <View key={pest} style={styles.chip}>
                <Text style={styles.chipText}>
                  {getPestDiseaseEmoji(pest, "pest")} {pest}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setForm({ customPests: (careForm?.customPests ?? []).filter((p) => p !== pest) })
                  }
                >
                  <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </CollapsibleSection>

        {/* ── Known Diseases ─────────────────────────────────────────────── */}
        <CollapsibleSection
          title="Known Diseases"
          icon="medkit-outline"
          defaultExpanded={false}
          summary={diseasesSummary}
          headerAction={
            <TouchableOpacity
              style={styles.sectionHeaderAction}
              onPress={() => setShowDiseasePicker(true)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Add disease"
            >
              <Ionicons name="add" size={16} color={theme.primary} />
            </TouchableOpacity>
          }
        >
          <View style={styles.chipRow}>
            {diseases.map((disease) => (
              <View key={disease} style={styles.readChip}>
                <Text style={styles.readChipText}>
                  {getPestDiseaseEmoji(disease, "disease")} {disease}
                </Text>
              </View>
            ))}
            {(careForm?.customDiseases ?? []).map((disease) => (
              <View key={disease} style={styles.chip}>
                <Text style={styles.chipText}>
                  {getPestDiseaseEmoji(disease, "disease")} {disease}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setForm({ customDiseases: (careForm?.customDiseases ?? []).filter((d) => d !== disease) })
                  }
                >
                  <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </CollapsibleSection>

        {/* ── Varieties ─────────────────────────────────────────────────── */}
        <CollapsibleSection
          title="Varieties"
          icon="albums-outline"
          defaultExpanded={false}
          summary={varietiesSummary}
        >
          <View style={styles.fieldGroup}>
            <View style={styles.addRow}>
              <TextInput
                style={styles.input}
                placeholder="Enter custom variety"
                placeholderTextColor={theme.textTertiary}
                value={newVariety}
                onChangeText={setNewVariety}
                selectionColor={theme.primary}
                cursorColor={theme.primary}
                underlineColorAndroid="transparent"
              />
              <TouchableOpacity style={styles.addInlineButton} onPress={handleAddVariety}>
                <Ionicons name="add" size={20} color={theme.textInverse} />
              </TouchableOpacity>
            </View>
            <View style={styles.chipRow}>
              {varieties.length === 0 ? (
                <Text style={styles.emptyText}>No varieties yet.</Text>
              ) : (
                varieties.map((v) => (
                  <View key={v} style={styles.chip}>
                    <Text style={styles.chipText}>{v}</Text>
                    <TouchableOpacity onPress={() => handleRemoveVariety(v)}>
                      <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </View>
        </CollapsibleSection>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={styles.footerActions}>
          {hasOverride && (
            <TouchableOpacity style={styles.btnResetPill} onPress={handleResetCare}>
              <Text style={styles.btnResetPillText}>Reset</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.btnPrimary} onPress={handleSave} disabled={saving}>
            <Text style={styles.btnPrimaryText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete confirmation modal */}
      <Modal
        visible={showDeleteConfirm}
        transparent
        animationType="fade"
        hardwareAccelerated
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Plant</Text>
              <TouchableOpacity onPress={() => setShowDeleteConfirm(false)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHint}>
              Remove &quot;{initialName}&quot; from the catalog? This cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  void doDelete();
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reassign modal */}
      <Modal
        visible={showReassign}
        transparent
        animationType="fade"
        hardwareAccelerated
        onRequestClose={() => setShowReassign(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Move Plants & Delete</Text>
              <TouchableOpacity onPress={() => setShowReassign(false)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHint}>
              {usageCount} plant{usageCount === 1 ? "" : "s"} use &quot;{initialName}&quot;. Select a replacement.
            </Text>
            <View style={styles.reassignList}>
              {categoryPlants
                .filter((p) => p !== initialName)
                .map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.reassignItem,
                      reassignReplacement === option && styles.reassignItemActive,
                    ]}
                    onPress={() => setReassignReplacement(option)}
                  >
                    <Text
                      style={[
                        styles.reassignText,
                        reassignReplacement === option && styles.reassignTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowReassign(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={() => doDelete(reassignReplacement)}
              >
                <Text style={styles.modalButtonTextPrimary}>Move & Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pest picker */}
      <Modal
        visible={showPestPicker}
        transparent
        animationType="fade"
        hardwareAccelerated
        onRequestClose={() => { setShowPestPicker(false); setPestSearch(""); }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.pickerModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Pest</Text>
              <TouchableOpacity onPress={() => { setShowPestPicker(false); setPestSearch(""); }}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.pickerSearch}
              placeholder="Search pests..."
              placeholderTextColor={theme.textTertiary}
              value={pestSearch}
              onChangeText={setPestSearch}
              autoCorrect={false}
            />
            <FlatList
              style={styles.pickerList}
              data={getAllPests().filter((p) => {
                const taken = new Set([...pests, ...(careForm?.customPests ?? [])].map((n) => n.toLowerCase()));
                return !taken.has(p.name.toLowerCase()) &&
                  (!pestSearch || p.name.toLowerCase().includes(pestSearch.toLowerCase()));
              })}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={styles.pickerSeparator} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => {
                    setForm({ customPests: [...(careForm?.customPests ?? []), item.name] });
                    setShowPestPicker(false);
                    setPestSearch("");
                  }}
                >
                  <Text style={styles.pickerRowText}>{item.emoji} {item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Disease picker */}
      <Modal
        visible={showDiseasePicker}
        transparent
        animationType="fade"
        hardwareAccelerated
        onRequestClose={() => { setShowDiseasePicker(false); setDiseaseSearch(""); }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.pickerModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Link Disease</Text>
              <TouchableOpacity onPress={() => { setShowDiseasePicker(false); setDiseaseSearch(""); }}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.pickerSearch}
              placeholder="Search diseases..."
              placeholderTextColor={theme.textTertiary}
              value={diseaseSearch}
              onChangeText={setDiseaseSearch}
              autoCorrect={false}
            />
            <FlatList
              style={styles.pickerList}
              data={getAllDiseases().filter((d) => {
                const taken = new Set([...diseases, ...(careForm?.customDiseases ?? [])].map((n) => n.toLowerCase()));
                return !taken.has(d.name.toLowerCase()) &&
                  (!diseaseSearch || d.name.toLowerCase().includes(diseaseSearch.toLowerCase()));
              })}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={styles.pickerSeparator} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={() => {
                    setForm({ customDiseases: [...(careForm?.customDiseases ?? []), item.name] });
                    setShowDiseasePicker(false);
                    setDiseaseSearch("");
                  }}
                >
                  <Text style={styles.pickerRowText}>{item.emoji} {item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Saving overlay */}
      <Modal visible={saving} transparent animationType="fade" hardwareAccelerated>
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      </Modal>
    </View>
  );
}
