import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import {
  DEFAULT_CHILD_LOCATIONS,
  DEFAULT_PARENT_LOCATIONS,
  getLocationConfig,
  saveLocationConfig,
} from "../services/locations";
import { getPlants, updatePlantLocation } from "../services/plants";
import { Plant } from "../types/database.types";
import { sanitizeLandmarkText } from "../utils/textSanitizer";

type EditModalState = {
  type: "parent" | "child";
  original: string;
  value: string;
};

type ReassignModalState = {
  type: "parent" | "child";
  target: string;
  replacement: string;
};

const parseLocation = (value?: string | null) => {
  if (!value) return { parent: "", child: "" };
  const parts = value.split(" - ");
  const parent = parts[0]?.trim() ?? "";
  const child = parts.slice(1).join(" - ").trim();
  return { parent, child };
};

const buildLocation = (parent: string, child: string) => {
  if (parent && child) return `${parent} - ${child}`;
  return parent || child || "";
};

const sanitizeLocationName = (value: string) =>
  sanitizeLandmarkText(value).trim();

const isDuplicate = (list: string[], value: string, ignore?: string) => {
  const needle = value.toLowerCase();
  return list.some((item) => {
    const key = item.toLowerCase();
    if (ignore && key === ignore.toLowerCase()) return false;
    return key === needle;
  });
};

export default function ManageLocationsScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const androidPickerProps =
    Platform.OS === "android"
      ? {
          mode: "dropdown" as const,
          dropdownIconColor: theme.textSecondary,
        }
      : {};
  const [parentLocations, setParentLocations] = useState<string[]>(
    DEFAULT_PARENT_LOCATIONS,
  );
  const [childLocations, setChildLocations] = useState<string[]>(
    DEFAULT_CHILD_LOCATIONS,
  );
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newParentName, setNewParentName] = useState("");
  const [newChildName, setNewChildName] = useState("");
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [reassignModal, setReassignModal] = useState<ReassignModalState | null>(
    null,
  );

  const loadAllPlants = useCallback(async () => {
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
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [config, allPlants] = await Promise.all([
        getLocationConfig(),
        loadAllPlants(),
      ]);
      setParentLocations(config.parentLocations);
      setChildLocations(config.childLocations);
      setPlants(allPlants);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to load locations. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadAllPlants]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Note: Data reloads automatically after save operations
  // Users navigating back from other screens don't need fresh data
  // This prevents unnecessary API calls and improves performance

  const parentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    plants.forEach((plant) => {
      const { parent } = parseLocation(plant.location);
      if (!parent) return;
      counts[parent] = (counts[parent] || 0) + 1;
    });
    return counts;
  }, [plants]);

  const childCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    plants.forEach((plant) => {
      const { child } = parseLocation(plant.location);
      if (!child) return;
      counts[child] = (counts[child] || 0) + 1;
    });
    return counts;
  }, [plants]);

  const updatePlantsForParent = async (
    fromParent: string,
    toParent: string,
  ) => {
    const targets = plants.filter(
      (plant) => parseLocation(plant.location).parent === fromParent,
    );

    for (const plant of targets) {
      const { child } = parseLocation(plant.location);
      const nextLocation = buildLocation(toParent, child);
      await updatePlantLocation(plant.id, nextLocation);
    }

    setPlants((prev) =>
      prev.map((plant) => {
        const { parent, child } = parseLocation(plant.location);
        if (parent !== fromParent) return plant;
        return { ...plant, location: buildLocation(toParent, child) };
      }),
    );

    return targets.length;
  };

  const updatePlantsForChild = async (fromChild: string, toChild: string) => {
    const targets = plants.filter(
      (plant) => parseLocation(plant.location).child === fromChild,
    );

    for (const plant of targets) {
      const { parent } = parseLocation(plant.location);
      const nextLocation = buildLocation(parent, toChild);
      await updatePlantLocation(plant.id, nextLocation);
    }

    setPlants((prev) =>
      prev.map((plant) => {
        const { parent, child } = parseLocation(plant.location);
        if (child !== fromChild) return plant;
        return { ...plant, location: buildLocation(parent, toChild) };
      }),
    );

    return targets.length;
  };

  const saveConfig = async (parents: string[], children: string[]) => {
    const saved = await saveLocationConfig({
      parentLocations: parents,
      childLocations: children,
    });
    setParentLocations(saved.parentLocations);
    setChildLocations(saved.childLocations);
  };

  const handleAddParent = async () => {
    const name = sanitizeLocationName(newParentName);
    if (!name) {
      Alert.alert("Name Required", "Enter a main location name.");
      return;
    }
    if (name.includes(" - ")) {
      Alert.alert(
        "Invalid Name",
        "Please avoid using ' - ' in location names.",
      );
      return;
    }
    if (isDuplicate(parentLocations, name)) {
      Alert.alert("Already Exists", "That main location already exists.");
      return;
    }

    setSaving(true);
    try {
      await saveConfig([...parentLocations, name], childLocations);
      setNewParentName("");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to add location. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddChild = async () => {
    const name = sanitizeLocationName(newChildName);
    if (!name) {
      Alert.alert("Name Required", "Enter a section/direction name.");
      return;
    }
    if (name.includes(" - ")) {
      Alert.alert(
        "Invalid Name",
        "Please avoid using ' - ' in location names.",
      );
      return;
    }
    if (isDuplicate(childLocations, name)) {
      Alert.alert("Already Exists", "That section already exists.");
      return;
    }

    setSaving(true);
    try {
      await saveConfig(parentLocations, [...childLocations, name]);
      setNewChildName("");
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to add section. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async () => {
    if (!editModal) return;
    const name = sanitizeLocationName(editModal.value);
    const list = editModal.type === "parent" ? parentLocations : childLocations;
    const count =
      editModal.type === "parent"
        ? parentCounts[editModal.original] || 0
        : childCounts[editModal.original] || 0;

    if (!name) {
      Alert.alert("Name Required", "Please enter a new name.");
      return;
    }
    if (name.includes(" - ")) {
      Alert.alert(
        "Invalid Name",
        "Please avoid using ' - ' in location names.",
      );
      return;
    }
    if (isDuplicate(list, name, editModal.original)) {
      Alert.alert("Already Exists", "That name is already in use.");
      return;
    }
    if (name === editModal.original) {
      setEditModal(null);
      return;
    }

    const performRename = async () => {
      setSaving(true);
      try {
        if (editModal.type === "parent") {
          if (count > 0) {
            await updatePlantsForParent(editModal.original, name);
          }
          const updatedParents = parentLocations.map((item) =>
            item === editModal.original ? name : item,
          );
          await saveConfig(updatedParents, childLocations);
        } else {
          if (count > 0) {
            await updatePlantsForChild(editModal.original, name);
          }
          const updatedChildren = childLocations.map((item) =>
            item === editModal.original ? name : item,
          );
          await saveConfig(parentLocations, updatedChildren);
        }
        setEditModal(null);
      } catch (error: any) {
        Alert.alert(
          "Error",
          error?.message || "Failed to rename. Please try again.",
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
          { text: "Rename", onPress: performRename },
        ],
      );
    } else {
      performRename();
    }
  };

  const handleDeleteRequest = (type: "parent" | "child", name: string) => {
    const list = type === "parent" ? parentLocations : childLocations;
    const count =
      type === "parent" ? parentCounts[name] || 0 : childCounts[name] || 0;

    if (list.length <= 1) {
      Alert.alert("Cannot Delete", "At least one location is required.");
      return;
    }

    if (count === 0) {
      Alert.alert("Delete Location", "Remove this item?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDelete(type, name),
        },
      ]);
      return;
    }

    const options = list.filter((item) => item !== name);
    if (options.length === 0) {
      Alert.alert(
        "Cannot Delete",
        "Please rename this location or add another one first.",
      );
      return;
    }

    setReassignModal({
      type,
      target: name,
      replacement: options[0],
    });
  };

  const handleDelete = async (
    type: "parent" | "child",
    name: string,
    replacement?: string,
  ) => {
    setSaving(true);
    try {
      if (type === "parent") {
        if (replacement) {
          await updatePlantsForParent(name, replacement);
        }
        const updatedParents = parentLocations.filter((item) => item !== name);
        await saveConfig(updatedParents, childLocations);
      } else {
        if (replacement) {
          await updatePlantsForChild(name, replacement);
        }
        const updatedChildren = childLocations.filter((item) => item !== name);
        await saveConfig(parentLocations, updatedChildren);
      }
      setReassignModal(null);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "Failed to delete. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReassignConfirm = () => {
    if (!reassignModal) return;
    handleDelete(
      reassignModal.type,
      reassignModal.target,
      reassignModal.replacement,
    );
  };

  const reassignOptions = useMemo(() => {
    if (!reassignModal) return [];
    const list =
      reassignModal.type === "parent" ? parentLocations : childLocations;
    return list.filter((item) => item !== reassignModal.target);
  }, [reassignModal, parentLocations, childLocations]);

  const editCount = useMemo(() => {
    if (!editModal) return 0;
    return editModal.type === "parent"
      ? parentCounts[editModal.original] || 0
      : childCounts[editModal.original] || 0;
  }, [editModal, parentCounts, childCounts]);

  const reassignCount = useMemo(() => {
    if (!reassignModal) return 0;
    return reassignModal.type === "parent"
      ? parentCounts[reassignModal.target] || 0
      : childCounts[reassignModal.target] || 0;
  }, [reassignModal, parentCounts, childCounts]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Garden Locations</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading locations...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <Ionicons name="map-outline" size={20} color={theme.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoText}>
                Plants use a main location plus a section/direction. Example:
                {"\n"}
                <Text style={styles.infoHighlight}>Mangarai - North</Text>
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Main Locations</Text>
            <Text style={styles.sectionDescription}>
              These are the primary places where plants are located.
            </Text>

            <View style={styles.addRow}>
              <TextInput
                style={styles.input}
                placeholder="Add main location"
                value={newParentName}
                onChangeText={(text) => setNewParentName(text)}
                placeholderTextColor={theme.textTertiary}
                selectionColor={theme.primary}
                cursorColor={theme.primary}
                underlineColorAndroid="transparent"
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddParent}
                disabled={saving}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {parentLocations.length === 0 ? (
              <Text style={styles.emptyText}>No main locations yet.</Text>
            ) : (
              parentLocations.map((location) => (
                <View key={location} style={styles.locationRow}>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>{location}</Text>
                    <Text style={styles.locationMeta}>
                      {parentCounts[location] || 0} plant
                      {(parentCounts[location] || 0) === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <View style={styles.locationActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() =>
                        setEditModal({
                          type: "parent",
                          original: location,
                          value: location,
                        })
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
                      onPress={() => handleDeleteRequest("parent", location)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={theme.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sections / Directions</Text>
            <Text style={styles.sectionDescription}>
              These sections apply to all main locations.
            </Text>

            <View style={styles.addRow}>
              <TextInput
                style={styles.input}
                placeholder="Add section (e.g., North-East)"
                value={newChildName}
                onChangeText={(text) => setNewChildName(text)}
                placeholderTextColor={theme.textTertiary}
                selectionColor={theme.primary}
                cursorColor={theme.primary}
                underlineColorAndroid="transparent"
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddChild}
                disabled={saving}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {childLocations.length === 0 ? (
              <Text style={styles.emptyText}>No sections yet.</Text>
            ) : (
              childLocations.map((location) => (
                <View key={location} style={styles.locationRow}>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationName}>{location}</Text>
                    <Text style={styles.locationMeta}>
                      {childCounts[location] || 0} plant
                      {(childCounts[location] || 0) === 1 ? "" : "s"}
                    </Text>
                  </View>
                  <View style={styles.locationActions}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() =>
                        setEditModal({
                          type: "child",
                          original: location,
                          value: location,
                        })
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
                      onPress={() => handleDeleteRequest("child", location)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={theme.error}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={!!editModal}
        transparent
        animationType="fade"
        hardwareAccelerated
        onRequestClose={() => setEditModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Rename {editModal?.type === "parent" ? "Location" : "Section"}
              </Text>
              <TouchableOpacity onPress={() => setEditModal(null)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              value={editModal?.value ?? ""}
              onChangeText={(text) =>
                setEditModal((prev) => (prev ? { ...prev, value: text } : prev))
              }
              placeholder="New name"
              placeholderTextColor={theme.inputPlaceholder}
              selectionColor={theme.primary}
              cursorColor={theme.primary}
              underlineColorAndroid="transparent"
              autoFocus
              autoCorrect={false}
            />

            {editModal && (
              <Text style={styles.modalHint}>
                Used by {editCount} plant{editCount === 1 ? "" : "s"}.
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setEditModal(null)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleRename}
              >
                <Text style={styles.modalButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!reassignModal}
        transparent
        animationType="fade"
        hardwareAccelerated
        onRequestClose={() => setReassignModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Move Plants & Delete</Text>
              <TouchableOpacity onPress={() => setReassignModal(null)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHint}>
              This location is used by {reassignCount} plant
              {reassignCount === 1 ? "" : "s"}. Choose a replacement.
            </Text>

            <View style={styles.pickerContainer}>
              <Picker
                {...androidPickerProps}
                selectedValue={reassignModal?.replacement}
                onValueChange={(value) =>
                  setReassignModal((prev) =>
                    prev ? { ...prev, replacement: value } : prev,
                  )
                }
                style={styles.picker}
              >
                {reassignOptions.map((option) => (
                  <Picker.Item key={option} label={option} value={option} />
                ))}
              </Picker>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setReassignModal(null)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={handleReassignConfirm}
              >
                <Text style={styles.modalButtonTextPrimary}>Move & Delete</Text>
              </TouchableOpacity>
            </View>
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
          <Text style={styles.savingText}>Updating locations...</Text>
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
      paddingTop: 12,
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
    infoHighlight: {
      fontWeight: "600",
      color: theme.primary,
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
    locationRow: {
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
    locationInfo: {
      flex: 1,
    },
    locationName: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },
    locationMeta: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
    },
    locationActions: {
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
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    },
    modalContent: {
      width: "100%",
      maxWidth: 400,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: theme.border,
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
    pickerContainer: {
      backgroundColor: theme.pickerBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.pickerBorder,
      marginBottom: 4,
      overflow: "hidden",
    },
    picker: {
      height: 50,
      color: theme.pickerText,
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

