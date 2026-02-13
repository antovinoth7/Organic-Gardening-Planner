
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useTheme } from "../theme";
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
import { getPlants, updatePlantVariety } from "../services/plants";
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
import { getPlantCareProfile } from "../utils/plantCareDefaults";
import { sanitizeLandmarkText } from "../utils/textSanitizer";

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
};

const CATEGORY_LABELS: Record<PlantType, string> = {
  vegetable: "🥬 Vegetable",
  herb: "🌿 Herb",
  flower: "🌸 Flower",
  fruit_tree: "🥭 Fruit Tree",
  timber_tree: "🌲 Timber Tree",
  coconut_tree: "🥥 Coconut Tree",
  shrub: "🌱 Shrub",
};

const WATER_REQUIREMENT_LABELS: Record<WaterRequirement, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const SUNLIGHT_LABELS: Record<SunlightLevel, string> = {
  full_sun: "Full Sun",
  partial_sun: "Partial Sun",
  shade: "Shade",
};

const SOIL_LABELS: Record<SoilType, string> = {
  garden_soil: "Garden Soil",
  potting_mix: "Potting Mix",
  coco_peat: "Coco Peat",
  custom: "Custom",
};

const FERTILISER_LABELS: Record<FertiliserType, string> = {
  compost: "Compost",
  vermicompost: "Vermicompost",
  fish_emulsion: "Fish Emulsion",
  seaweed: "Seaweed",
  neem_cake: "Neem Cake",
  other: "Other",
};

const GROWTH_STAGE_LABELS: Record<GrowthStage, string> = {
  seedling: "Seedling",
  vegetative: "Vegetative",
  flowering: "Flowering",
  fruiting: "Fruiting",
  dormant: "Dormant",
  mature: "Mature",
};

const sanitizePlantName = (value: string) =>
  sanitizeLandmarkText(value).trim();
const sanitizeNumberInput = (value: string) => value.replace(/[^0-9]/g, "");

const isDuplicate = (list: string[], value: string, ignore?: string) => {
  const needle = value.toLowerCase();
  return list.some((item) => {
    const key = item.toLowerCase();
    if (ignore && key === ignore.toLowerCase()) return false;
    return key === needle;
  });
};

export default function ManagePlantCatalogScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [catalog, setCatalog] = useState<PlantCatalog>(DEFAULT_PLANT_CATALOG);
  const [careProfiles, setCareProfiles] = useState<PlantCareProfiles>(
    {} as PlantCareProfiles
  );
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PlantType>("vegetable");
  const [newPlantName, setNewPlantName] = useState("");
  const [editPlant, setEditPlant] = useState<EditPlantState | null>(null);
  const [reassignPlant, setReassignPlant] =
    useState<ReassignPlantState | null>(null);
  const [varietyModal, setVarietyModal] = useState<VarietyModalState | null>(
    null
  );
  const [newVariety, setNewVariety] = useState("");
  const [careModal, setCareModal] = useState<CareModalState | null>(null);
  const [careForm, setCareForm] = useState<CareFormState | null>(null);

  const loadAllPlants = async () => {
    const allPlants: Plant[] = [];
    let lastDoc: any = undefined;
    const pageSize = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await getPlants(pageSize, lastDoc);
      allPlants.push(...(response.plants ?? []));

      if (!response.lastDoc || response.plants.length < pageSize) {
        hasMore = false;
        continue;
      }

      lastDoc = response.lastDoc;
    }

    return allPlants;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [catalogData, allPlants, careProfileData] = await Promise.all([
        getPlantCatalog(),
        loadAllPlants(),
        getPlantCareProfiles(),
      ]);
      setCatalog(catalogData);
      setPlants(allPlants);
      setCareProfiles(careProfileData);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to load plant catalog. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
  const categoryVarieties =
    catalog.categories[activeCategory]?.varieties ?? {};
  const categoryCareProfiles = careProfiles[activeCategory] ?? {};
  const hasCareOverride =
    !!careModal && !!categoryCareProfiles[careModal.plantName];

  const saveCatalog = async (nextCatalog: PlantCatalog) => {
    const saved = await savePlantCatalog(nextCatalog);
    setCatalog(saved);
    return saved;
  };

  const saveCareProfiles = async (nextProfiles: PlantCareProfiles) => {
    const saved = await savePlantCareProfiles(nextProfiles);
    setCareProfiles(saved);
    return saved;
  };

  const handleSaveCatalog = async (nextCatalog: PlantCatalog) => {
    setSaving(true);
    try {
      await saveCatalog(nextCatalog);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to save plant catalog. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const updatePlantsForVariety = async (
    category: PlantType,
    fromVariety: string,
    toVariety: string
  ) => {
    const targets = plants.filter(
      (plant) =>
        plant.plant_type === category && plant.plant_variety === fromVariety
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
      })
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
        "Enter a valid watering frequency (days)."
      );
      return;
    }

    const fertilisingDays = parseInt(careForm.fertilisingFrequencyDays, 10);
    if (Number.isNaN(fertilisingDays) || fertilisingDays < 1) {
      Alert.alert(
        "Validation Error",
        "Enter a valid fertilising frequency (days)."
      );
      return;
    }

    const pruningDays = parseInt(careForm.pruningFrequencyDays, 10);
    const pruningValue =
      Number.isNaN(pruningDays) || pruningDays < 1 ? undefined : pruningDays;

    const nextProfiles: PlantCareProfiles = {
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
        },
      },
    };

    setSaving(true);
    try {
      await saveCareProfiles(nextProfiles);
      closeCareModal();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to save care defaults. Please try again."
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
            const nextProfiles: PlantCareProfiles = {
              ...careProfiles,
              [activeCategory]: nextCategory,
            };
            setSaving(true);
            try {
              await saveCareProfiles(nextProfiles);
              closeCareModal();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error?.message ||
                  "Failed to reset care defaults. Please try again."
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
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
          plant === editPlant.name ? name : plant
        );

        const nextVarieties = { ...categoryVarieties };
        if (nextVarieties[editPlant.name]) {
          const existing = nextVarieties[editPlant.name];
          delete nextVarieties[editPlant.name];
          const merged = nextVarieties[name]
            ? Array.from(
                new Set(
                  [...nextVarieties[name], ...existing].map((item) =>
                    item.toLowerCase()
                  )
                )
              ).map((item) =>
                existing.find(
                  (value) => value.toLowerCase() === item.toLowerCase()
                ) || item
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
      } catch (error: any) {
        Alert.alert(
          "Error",
          error?.message || "Failed to rename plant. Please try again."
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
        ]
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
        "Add another plant option before deleting this one."
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
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to delete plant. Please try again."
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
      new Set(suggestions.map((item) => item.toLowerCase()))
    ).map(
      (value) =>
        suggestions.find((item) => item.toLowerCase() === value) ?? value
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
      (item) => item.toLowerCase() !== value.toLowerCase()
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
      <View style={styles.header}>
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
          <View style={styles.categoryBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryBarContent}
            >
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
            </ScrollView>
          </View>

          <ScrollView
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.infoCard}>
              <Ionicons name="leaf-outline" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Specific plants</Text>
                <Text style={styles.infoText}>
                  These appear under “Specific Plant” when adding a plant. You
                  can also store optional variety suggestions.
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {CATEGORY_LABELS[activeCategory]}
              </Text>
              <Text style={styles.sectionDescription}>
                {categoryPlants.length} option
                {categoryPlants.length === 1 ? "" : "s"} available.
              </Text>

              <View style={styles.addRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Add specific plant"
                  value={newPlantName}
                  onChangeText={(text) => setNewPlantName(text)}
                  placeholderTextColor={theme.textTertiary}
                  selectionColor={theme.primary}
                  cursorColor={theme.primary}
                  underlineColorAndroid="transparent"
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddPlant}
                  disabled={saving}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              {categoryPlants.length === 0 ? (
                <Text style={styles.emptyText}>
                  No plants yet. Add one above.
                </Text>
              ) : (
                categoryPlants.map((plantName) => {
                  const count =
                    plantCounts[activeCategory]?.[plantName] || 0;
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
                          onPress={() =>
                            setVarietyModal({ plantName })
                          }
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

            <TextInput
              style={styles.modalInput}
              value={editPlant?.value ?? ""}
              onChangeText={(text) =>
                setEditPlant((prev) => (prev ? { ...prev, value: text } : prev))
              }
              placeholder="New name"
              placeholderTextColor={theme.inputPlaceholder}
              selectionColor={theme.primary}
              cursorColor={theme.primary}
              underlineColorAndroid="transparent"
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
                ? categoryPlants.filter(
                    (plant) => plant !== reassignPlant.name
                  )
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
                      prev ? { ...prev, replacement: option } : prev
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
                    reassignPlant.replacement
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
                ? categoryVarieties[varietyModal.plantName] ?? []
                : []
              ).map((variety) => (
                <View key={variety} style={styles.varietyChip}>
                  <Text style={styles.varietyChipText}>{variety}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      varietyModal &&
                      handleRemoveVarietySuggestion(
                        varietyModal.plantName,
                        variety
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
                  <Text style={styles.emptyText}>
                    No suggestions yet.
                  </Text>
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
                  <Text style={styles.fieldLabel}>Water requirement</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={careForm?.waterRequirement}
                      onValueChange={(value) =>
                        setCareForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                waterRequirement: value as WaterRequirement,
                              }
                            : prev
                        )
                      }
                      style={styles.picker}
                    >
                      {Object.entries(WATER_REQUIREMENT_LABELS).map(
                        ([value, label]) => (
                          <Picker.Item
                            key={value}
                            label={label}
                            value={value}
                          />
                        )
                      )}
                    </Picker>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Watering frequency (days)</Text>
                  <TextInput
                    style={styles.careInput}
                    keyboardType="numeric"
                    value={careForm?.wateringFrequencyDays ?? ""}
                    onChangeText={(text) =>
                      setCareForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              wateringFrequencyDays: sanitizeNumberInput(text),
                            }
                          : prev
                      )
                    }
                    placeholder="e.g., 3"
                    placeholderTextColor={theme.inputPlaceholder}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Fertilising frequency (days)</Text>
                  <TextInput
                    style={styles.careInput}
                    keyboardType="numeric"
                    value={careForm?.fertilisingFrequencyDays ?? ""}
                    onChangeText={(text) =>
                      setCareForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              fertilisingFrequencyDays: sanitizeNumberInput(text),
                            }
                          : prev
                      )
                    }
                    placeholder="e.g., 14"
                    placeholderTextColor={theme.inputPlaceholder}
                  />
                </View>

                <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
                  <Text style={styles.fieldLabel}>
                    Pruning frequency (days, optional)
                  </Text>
                  <TextInput
                    style={styles.careInput}
                    keyboardType="numeric"
                    value={careForm?.pruningFrequencyDays ?? ""}
                    onChangeText={(text) =>
                      setCareForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              pruningFrequencyDays: sanitizeNumberInput(text),
                            }
                          : prev
                      )
                    }
                    placeholder="Leave blank if not needed"
                    placeholderTextColor={theme.inputPlaceholder}
                  />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formSectionTitle}>Environment</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Sunlight</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={careForm?.sunlight}
                      onValueChange={(value) =>
                        setCareForm((prev) =>
                          prev
                            ? { ...prev, sunlight: value as SunlightLevel }
                            : prev
                        )
                      }
                      style={styles.picker}
                    >
                      {Object.entries(SUNLIGHT_LABELS).map(([value, label]) => (
                        <Picker.Item key={value} label={label} value={value} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Soil type</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={careForm?.soilType}
                      onValueChange={(value) =>
                        setCareForm((prev) =>
                          prev ? { ...prev, soilType: value as SoilType } : prev
                        )
                      }
                      style={styles.picker}
                    >
                      {Object.entries(SOIL_LABELS).map(([value, label]) => (
                        <Picker.Item key={value} label={label} value={value} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Preferred fertiliser</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={careForm?.preferredFertiliser}
                      onValueChange={(value) =>
                        setCareForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                preferredFertiliser: value as FertiliserType,
                              }
                            : prev
                        )
                      }
                      style={styles.picker}
                    >
                      {Object.entries(FERTILISER_LABELS).map(([value, label]) => (
                        <Picker.Item key={value} label={label} value={value} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={[styles.fieldGroup, styles.fieldGroupLast]}>
                  <Text style={styles.fieldLabel}>Initial growth stage</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={careForm?.initialGrowthStage}
                      onValueChange={(value) =>
                        setCareForm((prev) =>
                          prev
                            ? {
                                ...prev,
                                initialGrowthStage: value as GrowthStage,
                              }
                            : prev
                        )
                      }
                      style={styles.picker}
                    >
                      {Object.entries(GROWTH_STAGE_LABELS).map(([value, label]) => (
                        <Picker.Item key={value} label={label} value={value} />
                      ))}
                    </Picker>
                  </View>
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

      <Modal visible={saving} transparent animationType="fade" hardwareAccelerated>
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.savingText}>Updating catalog...</Text>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 48,
      paddingBottom: 16,
      backgroundColor: theme.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    headerSpacer: {
      width: 36,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
    },
    loadingState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    categoryBar: {
      backgroundColor: theme.backgroundSecondary,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    categoryBarContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    categoryChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    categoryChipActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    categoryChipText: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: "600",
    },
    categoryChipTextActive: {
      color: theme.primary,
    },
    content: {
      padding: 16,
    },
    infoCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: theme.backgroundSecondary,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 20,
      gap: 12,
    },
    infoContent: {
      flex: 1,
    },
    infoTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
    },
    infoText: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 4,
    },
    sectionDescription: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 12,
    },
    addRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 16,
    },
    input: {
      flex: 1,
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingHorizontal: 14,
      height: 44,
      fontSize: 16,
      color: theme.inputText,
      textAlignVertical: "center",
    },
    addButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      gap: 6,
    },
    addButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textInverse,
    },
    plantRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 10,
    },
    plantInfo: {
      flex: 1,
    },
    plantName: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },
    plantMeta: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
    },
    plantActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginLeft: 12,
    },
    iconButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    emptyText: {
      fontSize: 13,
      color: theme.textTertiary,
      fontStyle: "italic",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    modalContent: {
      width: "100%",
      maxWidth: 420,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
    },
    careModalContent: {
      maxHeight: "85%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
    },
    modalHint: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 12,
    },
    modalInput: {
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingHorizontal: 14,
      height: 44,
      fontSize: 16,
      color: theme.inputText,
      textAlignVertical: "center",
    },
    modalScroll: {
      marginBottom: 12,
    },
    modalScrollContent: {
      paddingBottom: 4,
    },
    careStatus: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      marginBottom: 12,
    },
    careStatusText: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: "600",
    },
    formSection: {
      backgroundColor: theme.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
      marginBottom: 12,
    },
    formSectionTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 10,
    },
    fieldGroup: {
      marginBottom: 10,
    },
    fieldGroupLast: {
      marginBottom: 0,
    },
    modalActions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    modalButton: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 12,
      borderRadius: 10,
    },
    modalButtonSecondary: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalButtonPrimary: {
      backgroundColor: theme.primary,
    },
    modalButtonDanger: {
      backgroundColor: theme.error,
    },
    modalButtonTextSecondary: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    modalButtonTextPrimary: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textInverse,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 6,
    },
    careInput: {
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      paddingHorizontal: 14,
      height: 44,
      fontSize: 16,
      color: theme.inputText,
      textAlignVertical: "center",
    },
    pickerContainer: {
      backgroundColor: theme.pickerBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.pickerBorder,
      minHeight: Platform.OS === "android" ? 56 : 50,
      justifyContent: "center",
      overflow: "hidden",
    },
    picker: {
      height: Platform.OS === "android" ? 56 : 50,
      paddingHorizontal: Platform.OS === "android" ? 8 : 0,
      color: theme.pickerText,
    },
    reassignList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    reassignItem: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    reassignItemActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    reassignText: {
      fontSize: 13,
      color: theme.textSecondary,
      fontWeight: "600",
    },
    reassignTextActive: {
      color: theme.primary,
    },
    varietyChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 12,
    },
    varietyChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    varietyChipText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: "600",
    },
    resetButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: 8,
      paddingVertical: 8,
    },
    resetButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.textSecondary,
    },
    savingOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    savingText: {
      fontSize: 14,
      color: "#fff",
      fontWeight: "600",
    },
  });
