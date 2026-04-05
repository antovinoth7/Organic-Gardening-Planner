import FloatingLabelInput from "../components/FloatingLabelInput";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ThemedDropdown from "../components/ThemedDropdown";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  NavigationProp,
  ParamListBase,
} from "@react-navigation/native";
import { useTheme } from "../theme";
import { createStyles } from "../styles/managePlantCatalogStyles";
import {
  DEFAULT_PLANT_CATALOG,
  PLANT_CATEGORIES,
  getPlantCatalog,
  savePlantCatalog,
} from "../services/plantCatalog";
import {
  getPlantCareProfiles,
  savePlantCareProfiles,
} from "../services/plantCareProfiles";
import { getAllPlants, updatePlantVariety } from "../services/plants";
import {
  FertiliserType,
  GrowthStage,
  Plant,
  PlantCareProfiles,
  PlantCatalog,
  PlantType,
  SoilType,
  SunlightLevel,
  WaterRequirement,
} from "../types/database.types";
import {
  getPlantCareProfile,
  getStaticPruningDefaults,
} from "../utils/plantCareDefaults";
import {
  CATEGORY_LABELS,
  FERTILISER_LABELS,
  GROWTH_STAGE_LABELS,
  SOIL_LABELS,
  SUNLIGHT_LABELS,
  WATER_REQUIREMENT_LABELS,
} from "../utils/plantLabels";
import { sanitizeLandmarkText } from "../utils/textSanitizer";
import { getErrorMessage } from "../utils/errorLogging";

type EditPlantState = {
  name: string;
  value: string;
};

type ReassignPlantState = {
  name: string;
  replacement: string;
};

type VarietyModalState = {
  plantName: string;
};

type CareModalState = {
  plantName: string;
};

type CareFormState = {
  waterRequirement: WaterRequirement;
  wateringFrequencyDays: string;
  fertilisingFrequencyDays: string;
  pruningFrequencyDays: string;
  sunlight: SunlightLevel;
  soilType: SoilType;
  preferredFertiliser: FertiliserType;
  initialGrowthStage: GrowthStage;
  pruningTips: string;
  shapePruningTip: string;
  shapePruningMonths: string;
  flowerPruningTip: string;
  flowerPruningMonths: string;
};

const sanitizePlantName = (value: string) => sanitizeLandmarkText(value).trim();
const sanitizeNumberInput = (value: string) => value.replace(/[^0-9]/g, "");

const isDuplicate = (list: string[], value: string, ignore?: string) => {
  const needle = value.toLowerCase();
  return list.some((item) => {
    const key = item.toLowerCase();
    if (ignore && key === ignore.toLowerCase()) return false;
    return key === needle;
  });
};

export default function ManagePlantCatalogScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [catalog, setCatalog] = useState<PlantCatalog>(DEFAULT_PLANT_CATALOG);
  const [careProfiles, setCareProfiles] = useState<Partial<PlantCareProfiles>>(
    {},
  );
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PlantType>("vegetable");
  const [newPlantName, setNewPlantName] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [editPlant, setEditPlant] = useState<EditPlantState | null>(null);
  const [reassignPlant, setReassignPlant] = useState<ReassignPlantState | null>(
    null,
  );
  const [varietyModal, setVarietyModal] = useState<VarietyModalState | null>(
    null,
  );
  const [newVariety, setNewVariety] = useState("");
  const [careModal, setCareModal] = useState<CareModalState | null>(null);
  const [careForm, setCareForm] = useState<CareFormState | null>(null);

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
    } catch (error: unknown) {
      Alert.alert(
        "Error",
        getErrorMessage(error) ||
          "Failed to load plant catalog. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setShowAddInput(false);
    setNewPlantName("");
  }, [activeCategory]);

  // Note: Data reloads automatically after save operations
  // Users navigating back from other screens don't need fresh data
  // This prevents unnecessary API calls and improves performance

  const plantCounts = useMemo(() => {
    const counts: Record<PlantType, Record<string, number>> = {
      vegetable: {},
      herb: {},
      flower: {},
      fruit_tree: {},
      timber_tree: {},
      coconut_tree: {},
      shrub: {},
    };

    plants.forEach((plant) => {
      const type = plant.plant_type;
      const variety = plant.plant_variety ?? "";
      if (!type || !variety) return;
      counts[type][variety] = (counts[type][variety] || 0) + 1;
    });

    return counts;
  }, [plants]);

  const categoryPlants = catalog.categories[activeCategory]?.plants ?? [];
  const categoryVarieties = catalog.categories[activeCategory]?.varieties ?? {};
  const categoryCareProfiles = careProfiles[activeCategory] ?? {};
  const hasCareOverride =
    !!careModal && !!categoryCareProfiles[careModal.plantName];

  const saveCatalog = async (nextCatalog: PlantCatalog) => {
    const saved = await savePlantCatalog(nextCatalog);
    setCatalog(saved);
    return saved;
  };

  const saveCareProfiles = async (nextProfiles: Partial<PlantCareProfiles>) => {
    const saved = await savePlantCareProfiles(nextProfiles);
    setCareProfiles(saved);
    return saved;
  };

  const handleSaveCatalog = async (nextCatalog: PlantCatalog) => {
    setSaving(true);
    try {
      await saveCatalog(nextCatalog);
    } catch (error: unknown) {
      Alert.alert(
        "Error",
        getErrorMessage(error) ||
          "Failed to save plant catalog. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const updatePlantsForVariety = async (
    category: PlantType,
    fromVariety: string,
    toVariety: string,
  ) => {
    const targets = plants.filter(
      (plant) =>
        plant.plant_type === category && plant.plant_variety === fromVariety,
    );

    for (const plant of targets) {
      await updatePlantVariety(plant.id, toVariety);
    }

    setPlants((prev) =>
      prev.map((plant) => {
        if (
          plant.plant_type !== category ||
          plant.plant_variety !== fromVariety
        ) {
          return plant;
        }
        return { ...plant, plant_variety: toVariety };
      }),
    );

    return targets.length;
  };

  const buildCareForm = (plantName: string): CareFormState | null => {
    const base = getPlantCareProfile(plantName, activeCategory);
    if (!base) return null;
    const override = categoryCareProfiles[plantName];
    const merged = {
      ...base,
      ...(override ?? {}),
    };

    // Pruning techniques: user override fields take priority, else static defaults
    const hasUserPruning =
      override?.pruningTips ||
      override?.shapePruningTip ||
      override?.flowerPruningTip;
    const staticPruning = getStaticPruningDefaults(activeCategory, plantName);

    const tips = hasUserPruning
      ? (override?.pruningTips ?? []).join("\n")
      : staticPruning.tips.join("\n");
    const shapeTip = hasUserPruning
      ? (override?.shapePruningTip ?? "")
      : (staticPruning.shapePruning?.tip ?? "");
    const shapeMonths = hasUserPruning
      ? (override?.shapePruningMonths ?? "")
      : (staticPruning.shapePruning?.months ?? "");
    const flowerTip = hasUserPruning
      ? (override?.flowerPruningTip ?? "")
      : (staticPruning.flowerPruning?.tip ?? "");
    const flowerMonths = hasUserPruning
      ? (override?.flowerPruningMonths ?? "")
      : (staticPruning.flowerPruning?.months ?? "");

    return {
      waterRequirement: merged.waterRequirement,
      wateringFrequencyDays: merged.wateringFrequencyDays.toString(),
      fertilisingFrequencyDays: merged.fertilisingFrequencyDays.toString(),
      pruningFrequencyDays: merged.pruningFrequencyDays
        ? merged.pruningFrequencyDays.toString()
        : "",
      sunlight: merged.sunlight,
      soilType: merged.soilType,
      preferredFertiliser: merged.preferredFertiliser,
      initialGrowthStage: merged.initialGrowthStage,
      pruningTips: tips,
      shapePruningTip: shapeTip,
      shapePruningMonths: shapeMonths,
      flowerPruningTip: flowerTip,
      flowerPruningMonths: flowerMonths,
    };
  };

  const openCareDefaults = (plantName: string) => {
    const form = buildCareForm(plantName);
    if (!form) {
      Alert.alert("Missing Defaults", "Unable to load care defaults.");
      return;
    }
    setCareForm(form);
    setCareModal({ plantName });
  };

  const closeCareModal = () => {
    setCareModal(null);
    setCareForm(null);
  };

  const handleSaveCareDefaults = async () => {
    if (!careModal || !careForm) return;

    const wateringDays = parseInt(careForm.wateringFrequencyDays, 10);
    if (Number.isNaN(wateringDays) || wateringDays < 1) {
      Alert.alert(
        "Validation Error",
        "Enter a valid watering frequency (days).",
      );
      return;
    }

    const fertilisingDays = parseInt(careForm.fertilisingFrequencyDays, 10);
    if (Number.isNaN(fertilisingDays) || fertilisingDays < 1) {
      Alert.alert(
        "Validation Error",
        "Enter a valid fertilising frequency (days).",
      );
      return;
    }

    const pruningDays = parseInt(careForm.pruningFrequencyDays, 10);
    const pruningValue =
      Number.isNaN(pruningDays) || pruningDays < 1 ? undefined : pruningDays;

    // Parse pruning tips (one per line)
    const pruningTips = careForm.pruningTips
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const nextProfiles: Partial<PlantCareProfiles> = {
      ...careProfiles,
      [activeCategory]: {
        ...categoryCareProfiles,
        [careModal.plantName]: {
          waterRequirement: careForm.waterRequirement,
          wateringFrequencyDays: wateringDays,
          fertilisingFrequencyDays: fertilisingDays,
          pruningFrequencyDays: pruningValue,
          sunlight: careForm.sunlight,
          soilType: careForm.soilType,
          preferredFertiliser: careForm.preferredFertiliser,
          initialGrowthStage: careForm.initialGrowthStage,
          pruningTips: pruningTips.length > 0 ? pruningTips : undefined,
          shapePruningTip: careForm.shapePruningTip.trim() || undefined,
          shapePruningMonths: careForm.shapePruningMonths.trim() || undefined,
          flowerPruningTip: careForm.flowerPruningTip.trim() || undefined,
          flowerPruningMonths: careForm.flowerPruningMonths.trim() || undefined,
        },
      },
    };

    setSaving(true);
    try {
      await saveCareProfiles(nextProfiles);
      closeCareModal();
    } catch (error: unknown) {
      Alert.alert(
        "Error",
        getErrorMessage(error) ||
          "Failed to save care defaults. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetCareDefaults = () => {
    if (!careModal) return;
    const hasOverride = !!categoryCareProfiles[careModal.plantName];
    if (!hasOverride) {
      closeCareModal();
      return;
    }

    Alert.alert(
      "Reset Defaults",
      "Remove custom defaults and use app defaults instead?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            const nextCategory = { ...categoryCareProfiles };
            delete nextCategory[careModal.plantName];
            const nextProfiles: Partial<PlantCareProfiles> = {
              ...careProfiles,
              [activeCategory]: nextCategory,
            };
            setSaving(true);
            try {
              await saveCareProfiles(nextProfiles);
              closeCareModal();
            } catch (error: unknown) {
              Alert.alert(
                "Error",
                getErrorMessage(error) ||
                  "Failed to reset care defaults. Please try again.",
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  const handleAddPlant = async () => {
    const name = sanitizePlantName(newPlantName);
    if (!name) {
      Alert.alert("Name Required", "Enter a plant name.");
      return;
    }
    if (isDuplicate(categoryPlants, name)) {
      Alert.alert("Already Exists", "That plant already exists.");
      return;
    }

    const nextCatalog: PlantCatalog = {
      ...catalog,
      categories: {
        ...catalog.categories,
        [activeCategory]: {
          plants: [...categoryPlants, name],
          varieties: { ...categoryVarieties },
        },
      },
    };

    await handleSaveCatalog(nextCatalog);
    setNewPlantName("");
  };

  const handleRenamePlant = async () => {
    if (!editPlant) return;
    const name = sanitizePlantName(editPlant.value);
    if (!name) {
      Alert.alert("Name Required", "Enter a plant name.");
      return;
    }
    if (isDuplicate(categoryPlants, name, editPlant.name)) {
      Alert.alert("Already Exists", "That plant already exists.");
      return;
    }

    if (name === editPlant.name) {
      setEditPlant(null);
      return;
    }

    const count = plantCounts[activeCategory]?.[editPlant.name] || 0;

    const applyRename = async () => {
      setSaving(true);
      try {
        if (count > 0) {
          await updatePlantsForVariety(activeCategory, editPlant.name, name);
        }

        const updatedPlants = categoryPlants.map((plant) =>
          plant === editPlant.name ? name : plant,
        );

        const nextVarieties = { ...categoryVarieties };
        if (nextVarieties[editPlant.name]) {
          const existing = nextVarieties[editPlant.name];
          delete nextVarieties[editPlant.name];
          const merged = nextVarieties[name]
            ? Array.from(
                new Set(
                  [...nextVarieties[name], ...existing].map((item) =>
                    item.toLowerCase(),
                  ),
                ),
              ).map(
                (item) =>
                  existing.find(
                    (value) => value.toLowerCase() === item.toLowerCase(),
                  ) || item,
              )
            : existing;
          nextVarieties[name] = merged;
        }

        const nextCatalog = {
          ...catalog,
          categories: {
            ...catalog.categories,
            [activeCategory]: {
              plants: updatedPlants,
              varieties: nextVarieties,
            },
          },
        };

        const hasCareOverride = Boolean(categoryCareProfiles[editPlant.name]);
        const nextCareCategory = hasCareOverride
          ? { ...categoryCareProfiles }
          : categoryCareProfiles;
        if (hasCareOverride) {
          nextCareCategory[name] = nextCareCategory[editPlant.name];
          delete nextCareCategory[editPlant.name];
        }

        await saveCatalog(nextCatalog);

        if (hasCareOverride) {
          await saveCareProfiles({
            ...careProfiles,
            [activeCategory]: nextCareCategory,
          });
        }

        setEditPlant(null);
      } catch (error: unknown) {
        Alert.alert(
          "Error",
          getErrorMessage(error) || "Failed to rename plant. Please try again.",
        );
      } finally {
        setSaving(false);
      }
    };

    if (count > 0) {
      Alert.alert(
        "Update Plants",
        `Renaming will update ${count} plant(s). Continue?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Rename", onPress: applyRename },
        ],
      );
    } else {
      applyRename();
    }
  };

  const handleDeleteRequest = (name: string) => {
    const count = plantCounts[activeCategory]?.[name] || 0;
    const remaining = categoryPlants.filter((plant) => plant !== name);

    if (count === 0) {
      Alert.alert("Delete Plant", "Remove this plant option?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeletePlant(name),
        },
      ]);
      return;
    }

    if (remaining.length === 0) {
      Alert.alert(
        "Cannot Delete",
        "Add another plant option before deleting this one.",
      );
      return;
    }

    setReassignPlant({
      name,
      replacement: remaining[0],
    });
  };

  const handleDeletePlant = async (name: string, replacement?: string) => {
    setSaving(true);
    try {
      if (replacement) {
        await updatePlantsForVariety(activeCategory, name, replacement);
      }

      const nextVarieties = { ...categoryVarieties };
      delete nextVarieties[name];

      const nextCatalog = {
        ...catalog,
        categories: {
          ...catalog.categories,
          [activeCategory]: {
            plants: categoryPlants.filter((plant) => plant !== name),
            varieties: nextVarieties,
          },
        },
      };

      const hasCareOverride = Boolean(categoryCareProfiles[name]);
      const nextCareCategory = hasCareOverride
        ? { ...categoryCareProfiles }
        : categoryCareProfiles;
      if (hasCareOverride) {
        delete nextCareCategory[name];
      }

      await saveCatalog(nextCatalog);

      if (hasCareOverride) {
        await saveCareProfiles({
          ...careProfiles,
          [activeCategory]: nextCareCategory,
        });
      }

      setReassignPlant(null);
    } catch (error: unknown) {
      Alert.alert(
        "Error",
        getErrorMessage(error) || "Failed to delete plant. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVarieties = async () => {
    if (!varietyModal) return;

    const plantName = varietyModal.plantName;
    const suggestions = categoryVarieties[plantName] ?? [];
    const normalized = Array.from(
      new Set(suggestions.map((item) => item.toLowerCase())),
    ).map(
      (value) =>
        suggestions.find((item) => item.toLowerCase() === value) ?? value,
    );

    const nextVarieties = { ...categoryVarieties };
    if (normalized.length === 0) {
      delete nextVarieties[plantName];
    } else {
      nextVarieties[plantName] = normalized;
    }

    await handleSaveCatalog({
      ...catalog,
      categories: {
        ...catalog.categories,
        [activeCategory]: {
          plants: categoryPlants,
          varieties: nextVarieties,
        },
      },
    });
    setVarietyModal(null);
    setNewVariety("");
  };

  const handleAddVarietySuggestion = () => {
    if (!varietyModal) return;
    const name = sanitizePlantName(newVariety);
    if (!name) return;

    const current = categoryVarieties[varietyModal.plantName] ?? [];
    if (isDuplicate(current, name)) {
      setNewVariety("");
      return;
    }

    const nextVarieties = {
      ...categoryVarieties,
      [varietyModal.plantName]: [...current, name],
    };

    setCatalog((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [activeCategory]: {
          plants: categoryPlants,
          varieties: nextVarieties,
        },
      },
    }));
    setNewVariety("");
  };

  const handleRemoveVarietySuggestion = (plantName: string, value: string) => {
    const current = categoryVarieties[plantName] ?? [];
    const filtered = current.filter(
      (item) => item.toLowerCase() !== value.toLowerCase(),
    );
    const nextVarieties = { ...categoryVarieties };
    if (filtered.length === 0) {
      delete nextVarieties[plantName];
    } else {
      nextVarieties[plantName] = filtered;
    }

    setCatalog((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [activeCategory]: {
          plants: categoryPlants,
          varieties: nextVarieties,
        },
      },
    }));
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Plant Catalog</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading catalog...</Text>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: Math.max(insets.bottom, 48) + 16,
            }}
          >
            <View style={styles.infoCard}>
              <Ionicons name="map-outline" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Your plant catalog</Text>
                <Text style={styles.infoText}>
                  Add specific plants per category — they appear as options when
                  adding a new plant. Each plant can have variety suggestions
                  and custom care defaults.
                </Text>
              </View>
            </View>

            <View style={styles.categoryBar}>
              {PLANT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    activeCategory === category && styles.categoryChipActive,
                  ]}
                  onPress={() => setActiveCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      activeCategory === category &&
                        styles.categoryChipTextActive,
                    ]}
                  >
                    {CATEGORY_LABELS[category]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderText}>
                  <Text style={styles.sectionTitle}>
                    {CATEGORY_LABELS[activeCategory]}
                  </Text>
                  <Text style={styles.sectionDescription}>
                    {categoryPlants.length} option
                    {categoryPlants.length === 1 ? "" : "s"} available
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.sectionAddButton}
                  onPress={() => setShowAddInput(true)}
                  disabled={saving}
                >
                  <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
              </View>

              {showAddInput && (
                <View style={styles.addInputRow}>
                  <FloatingLabelInput
                    label="Plant name"
                    value={newPlantName}
                    onChangeText={(text) => setNewPlantName(text)}
                    autoFocus
                    autoCorrect={false}
                  />
                  <View style={styles.addInputActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonSecondary]}
                      onPress={() => {
                        setNewPlantName("");
                        setShowAddInput(false);
                      }}
                    >
                      <Text style={styles.modalButtonTextSecondary}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.modalButtonPrimary]}
                      onPress={() => {
                        handleAddPlant();
                        setShowAddInput(false);
                      }}
                      disabled={saving}
                    >
                      <Text style={styles.modalButtonTextPrimary}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {categoryPlants.length === 0 ? (
                <Text style={styles.emptyText}>
                  No plants yet. Add one above.
                </Text>
              ) : (
                categoryPlants.map((plantName) => {
                  const count = plantCounts[activeCategory]?.[plantName] || 0;
                  return (
                    <View key={plantName} style={styles.plantRow}>
                      <View style={styles.plantInfo}>
                        <Text style={styles.plantName}>{plantName}</Text>
                        <Text style={styles.plantMeta}>
                          Used by {count} plant{count === 1 ? "" : "s"}
                        </Text>
                      </View>
                      <View style={styles.plantActions}>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => setVarietyModal({ plantName })}
                        >
                          <Ionicons
                            name="albums-outline"
                            size={18}
                            color={theme.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => openCareDefaults(plantName)}
                        >
                          <Ionicons
                            name="options-outline"
                            size={18}
                            color={theme.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() =>
                            setEditPlant({ name: plantName, value: plantName })
                          }
                        >
                          <Ionicons
                            name="create-outline"
                            size={18}
                            color={theme.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconButton}
                          onPress={() => handleDeleteRequest(plantName)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color={theme.error}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </>
      )}

      <Modal
        visible={!!editPlant}
        transparent
        animationType="fade"
        hardwareAccelerated
        onRequestClose={() => setEditPlant(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rename Plant</Text>
              <TouchableOpacity onPress={() => setEditPlant(null)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <FloatingLabelInput
              label="New name"
              value={editPlant?.value ?? ""}
              onChangeText={(text) =>
                setEditPlant((prev) => (prev ? { ...prev, value: text } : prev))
              }
              autoFocus
              autoCorrect={false}
            />

            <Text style={styles.modalHint}>
              Used by{" "}
              {editPlant
                ? plantCounts[activeCategory]?.[editPlant.name] || 0
                : 0}{" "}
              plant
              {(editPlant
                ? plantCounts[activeCategory]?.[editPlant.name] || 0
                : 0) === 1
                ? ""
                : "s"}
              .
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setEditPlant(null)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleRenamePlant}
              >
                <Text style={styles.modalButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!reassignPlant}
        transparent
        animationType="fade"
        hardwareAccelerated
        onRequestClose={() => setReassignPlant(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Move Plants & Delete</Text>
              <TouchableOpacity onPress={() => setReassignPlant(null)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHint}>
              This plant option is used by{" "}
              {reassignPlant
                ? plantCounts[activeCategory]?.[reassignPlant.name] || 0
                : 0}{" "}
              plant
              {(reassignPlant
                ? plantCounts[activeCategory]?.[reassignPlant.name] || 0
                : 0) === 1
                ? ""
                : "s"}
              . Select a replacement.
            </Text>

            <View style={styles.reassignList}>
              {(reassignPlant
                ? categoryPlants.filter((plant) => plant !== reassignPlant.name)
                : []
              ).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.reassignItem,
                    reassignPlant?.replacement === option &&
                      styles.reassignItemActive,
                  ]}
                  onPress={() =>
                    setReassignPlant((prev) =>
                      prev ? { ...prev, replacement: option } : prev,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.reassignText,
                      reassignPlant?.replacement === option &&
                        styles.reassignTextActive,
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
                onPress={() => setReassignPlant(null)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={() =>
                  reassignPlant &&
                  handleDeletePlant(
                    reassignPlant.name,
                    reassignPlant.replacement,
                  )
                }
              >
                <Text style={styles.modalButtonTextPrimary}>Move & Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!varietyModal}
        transparent
        animationType="fade"
        hardwareAccelerated
        onRequestClose={() => setVarietyModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Variety Suggestions</Text>
              <TouchableOpacity onPress={() => setVarietyModal(null)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHint}>
              Suggestions for {varietyModal?.plantName}
            </Text>

            <View style={styles.addRow}>
              <TextInput
                style={styles.input}
                placeholder="Add variety"
                value={newVariety}
                onChangeText={(text) => setNewVariety(text)}
                placeholderTextColor={theme.textTertiary}
                selectionColor={theme.primary}
                cursorColor={theme.primary}
                underlineColorAndroid="transparent"
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddVarietySuggestion}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.varietyChips}>
              {(varietyModal
                ? (categoryVarieties[varietyModal.plantName] ?? [])
                : []
              ).map((variety) => (
                <View key={variety} style={styles.varietyChip}>
                  <Text style={styles.varietyChipText}>{variety}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      varietyModal &&
                      handleRemoveVarietySuggestion(
                        varietyModal.plantName,
                        variety,
                      )
                    }
                  >
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              ))}
              {varietyModal &&
                (categoryVarieties[varietyModal.plantName] ?? []).length ===
                  0 && (
                  <Text style={styles.emptyText}>No suggestions yet.</Text>
                )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setVarietyModal(null)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveVarieties}
              >
                <Text style={styles.modalButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!careModal && !!careForm}
        transparent
        animationType="fade"
        hardwareAccelerated
        onRequestClose={closeCareModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.careModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Care Defaults</Text>
              <TouchableOpacity onPress={closeCareModal}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.modalHint}>
                Defaults apply only when adding new plants.
              </Text>

              <View style={styles.careStatus}>
                <Ionicons
                  name={hasCareOverride ? "settings" : "leaf-outline"}
                  size={16}
                  color={hasCareOverride ? theme.primary : theme.textSecondary}
                />
                <Text style={styles.careStatusText}>
                  {hasCareOverride
                    ? "Custom defaults set"
                    : "Using app defaults"}
                </Text>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Water & Feeding</Text>

                <View style={styles.fieldGroup}>
                  <ThemedDropdown
                    items={Object.entries(WATER_REQUIREMENT_LABELS).map(
                      ([value, label]) => ({ label, value }),
                    )}
                    selectedValue={careForm?.waterRequirement ?? ""}
                    onValueChange={(value) =>
                      setCareForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              waterRequirement: value as WaterRequirement,
                            }
                          : prev,
                      )
                    }
                    label="Water requirement"
                    placeholder="Water requirement"
                    compact
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <FloatingLabelInput
                    label="Watering frequency (days)"
                    keyboardType="numeric"
                    value={careForm?.wateringFrequencyDays ?? ""}
                    onChangeText={(text) =>
                      setCareForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              wateringFrequencyDays: sanitizeNumberInput(text),
                            }
                          : prev,
                      )
                    }
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <FloatingLabelInput
                    label="Fertilising frequency (days)"
                    keyboardType="numeric"
                    value={careForm?.fertilisingFrequencyDays ?? ""}
                    onChangeText={(text) =>
                      setCareForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              fertilisingFrequencyDays:
                                sanitizeNumberInput(text),
                            }
                          : prev,
                      )
                    }
                  />
                </View>

                <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
                  <FloatingLabelInput
                    label="Pruning frequency (days)"
                    keyboardType="numeric"
                    value={careForm?.pruningFrequencyDays ?? ""}
                    onChangeText={(text) =>
                      setCareForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              pruningFrequencyDays: sanitizeNumberInput(text),
                            }
                          : prev,
                      )
                    }
                  />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>
                  ✂️ Pruning Techniques
                </Text>

                <View style={styles.fieldGroup}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.textTertiary,
                      marginBottom: 6,
                    }}
                  >
                    Tips (one per line)
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: theme.borderLight,
                      borderRadius: 8,
                      padding: 10,
                      minHeight: 80,
                      color: theme.text,
                      fontSize: 14,
                      textAlignVertical: "top",
                      backgroundColor: theme.backgroundSecondary,
                    }}
                    multiline
                    value={careForm?.pruningTips ?? ""}
                    onChangeText={(text) =>
                      setCareForm((prev) =>
                        prev ? { ...prev, pruningTips: text } : prev,
                      )
                    }
                    placeholder="e.g. Remove yellowing lower leaves"
                    placeholderTextColor={theme.inputPlaceholder}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <FloatingLabelInput
                    label="Shape pruning tip"
                    value={careForm?.shapePruningTip ?? ""}
                    onChangeText={(text) =>
                      setCareForm((prev) =>
                        prev ? { ...prev, shapePruningTip: text } : prev,
                      )
                    }
                  />
                </View>

                {careForm?.shapePruningTip ? (
                  <View style={styles.fieldGroup}>
                    <FloatingLabelInput
                      label="Shape pruning — best months"
                      value={careForm?.shapePruningMonths ?? ""}
                      onChangeText={(text) =>
                        setCareForm((prev) =>
                          prev ? { ...prev, shapePruningMonths: text } : prev,
                        )
                      }
                      placeholder="e.g. Jan–Feb"
                    />
                  </View>
                ) : null}

                <View style={styles.fieldGroup}>
                  <FloatingLabelInput
                    label="Flower pruning tip"
                    value={careForm?.flowerPruningTip ?? ""}
                    onChangeText={(text) =>
                      setCareForm((prev) =>
                        prev ? { ...prev, flowerPruningTip: text } : prev,
                      )
                    }
                  />
                </View>

                {careForm?.flowerPruningTip ? (
                  <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
                    <FloatingLabelInput
                      label="Flower pruning — best months"
                      value={careForm?.flowerPruningMonths ?? ""}
                      onChangeText={(text) =>
                        setCareForm((prev) =>
                          prev ? { ...prev, flowerPruningMonths: text } : prev,
                        )
                      }
                      placeholder="e.g. Year-round"
                    />
                  </View>
                ) : null}
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Environment</Text>

                <View style={styles.fieldGroup}>
                  <ThemedDropdown
                    items={Object.entries(SUNLIGHT_LABELS).map(
                      ([value, label]) => ({ label, value }),
                    )}
                    selectedValue={careForm?.sunlight ?? ""}
                    onValueChange={(value) =>
                      setCareForm((prev) =>
                        prev
                          ? { ...prev, sunlight: value as SunlightLevel }
                          : prev,
                      )
                    }
                    label="Sunlight"
                    placeholder="Sunlight"
                    compact
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedDropdown
                    items={Object.entries(SOIL_LABELS).map(
                      ([value, label]) => ({ label, value }),
                    )}
                    selectedValue={careForm?.soilType ?? ""}
                    onValueChange={(value) =>
                      setCareForm((prev) =>
                        prev ? { ...prev, soilType: value as SoilType } : prev,
                      )
                    }
                    label="Soil type"
                    placeholder="Soil type"
                    compact
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedDropdown
                    items={Object.entries(FERTILISER_LABELS).map(
                      ([value, label]) => ({ label, value }),
                    )}
                    selectedValue={careForm?.preferredFertiliser ?? ""}
                    onValueChange={(value) =>
                      setCareForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              preferredFertiliser: value as FertiliserType,
                            }
                          : prev,
                      )
                    }
                    label="Preferred fertiliser"
                    placeholder="Preferred fertiliser"
                    compact
                  />
                </View>

                <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
                  <ThemedDropdown
                    items={Object.entries(GROWTH_STAGE_LABELS).map(
                      ([value, label]) => ({ label, value }),
                    )}
                    selectedValue={careForm?.initialGrowthStage ?? ""}
                    onValueChange={(value) =>
                      setCareForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              initialGrowthStage: value as GrowthStage,
                            }
                          : prev,
                      )
                    }
                    label="Initial growth stage"
                    placeholder="Initial growth stage"
                    compact
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={closeCareModal}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSaveCareDefaults}
              >
                <Text style={styles.modalButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>

            {hasCareOverride && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetCareDefaults}
              >
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color={theme.textSecondary}
                />
                <Text style={styles.resetButtonText}>
                  Reset to app defaults
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={saving}
        transparent
        animationType="fade"
        hardwareAccelerated
      >
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.savingText}>Updating catalog...</Text>
        </View>
      </Modal>
    </View>
  );
}
