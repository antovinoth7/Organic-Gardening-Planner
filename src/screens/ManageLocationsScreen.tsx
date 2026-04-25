import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import FloatingLabelInput from "../components/FloatingLabelInput";
import { Ionicons } from "@expo/vector-icons";
import ThemedDropdown from "../components/ThemedDropdown";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, NavigationProp, ParamListBase } from "@react-navigation/native";
import { useTheme } from "../theme";
import {
  DEFAULT_CHILD_LOCATIONS,
  DEFAULT_PARENT_LOCATIONS,
  DEFAULT_PARENT_LOCATION_SHORT_NAMES,
  generateShortName,
  getLocationConfig,
  saveLocationConfig,
} from "../services/locations";
import { getAllPlants, updatePlantLocation } from "../services/plants";
import {
  DrainageQuality,
  LocationProfile,
  NutrientLevel,
  Plant,
} from "../types/database.types";
import { sanitizeLandmarkText } from "../utils/textSanitizer";
import { createStyles } from "../styles/manageLocationsStyles";
import { LocationProfileEditor } from "../components/LocationProfileEditor";
import { getErrorMessage } from "../utils/errorLogging";

type EditModalState = {
  type: "parent" | "child";
  original: string;
  value: string;
  shortName?: string;
  profile?: LocationProfile;
  activeTab?: "name" | "soil";
  showDatePicker?: boolean;
};

type ReassignModalState = {
  type: "parent" | "child";
  target: string;
  replacement: string;
};

const parseLocation = (value?: string | null): { parent: string; child: string } => {
  if (!value) return { parent: "", child: "" };
  const parts = value.split(" - ");
  const parent = parts[0]?.trim() ?? "";
  const child = parts.slice(1).join(" - ").trim();
  return { parent, child };
};

const buildLocation = (parent: string, child: string): string => {
  if (parent && child) return `${parent} - ${child}`;
  return parent || child || "";
};

const sanitizeLocationName = (value: string): string =>
  sanitizeLandmarkText(value).trim();

const isDuplicate = (list: string[], value: string, ignore?: string): boolean => {
  const needle = value.toLowerCase();
  return list.some((item) => {
    const key = item.toLowerCase();
    if (ignore && key === ignore.toLowerCase()) return false;
    return key === needle;
  });
};

const deriveNpkColor = (level?: NutrientLevel | null): string => {
  if (level === "high") return "#4CAF50";
  if (level === "medium") return "#FFC107";
  if (level === "low") return "#F44336";
  return "transparent";
};

const deriveDrainageColor = (level?: DrainageQuality | null): string => {
  if (level === "excellent") return "#4CAF50";
  if (level === "good") return "#8BC34A";
  if (level === "fair") return "#FFC107";
  if (level === "poor") return "#F44336";
  return "#9E9E9E";
};

const hasProfileData = (profile?: LocationProfile): boolean => {
  if (!profile) return false;
  return !!(
    profile.soilPH != null ||
    profile.soilType ||
    profile.drainageQuality ||
    profile.moistureRetention ||
    profile.nitrogenLevel ||
    profile.phosphorusLevel ||
    profile.potassiumLevel ||
    profile.windExposure ||
    profile.waterSource ||
    profile.lastSoilTestDate ||
    profile.notes
  );
};

export default function ManageLocationsScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [parentLocations, setParentLocations] = useState<string[]>(
    DEFAULT_PARENT_LOCATIONS,
  );
  const [childLocations, setChildLocations] = useState<string[]>(
    DEFAULT_CHILD_LOCATIONS,
  );
  const [shortNames, setShortNames] = useState<Record<string, string>>(
    DEFAULT_PARENT_LOCATION_SHORT_NAMES,
  );
  const [locationProfiles, setLocationProfiles] = useState<Record<string, LocationProfile>>({});
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editModal, setEditModal] = useState<EditModalState | null>(null);
  const [reassignModal, setReassignModal] = useState<ReassignModalState | null>(
    null,
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [config, allPlants] = await Promise.all([
        getLocationConfig(),
        getAllPlants(),
      ]);
      setParentLocations(config.parentLocations);
      setChildLocations(config.childLocations);
      setShortNames(config.parentLocationShortNames ?? {});
      setLocationProfiles(config.parentLocationProfiles ?? {});
      setPlants(allPlants);
    } catch (error: unknown) {
      Alert.alert(
        "Error",
        getErrorMessage(error) || "Failed to load locations. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
  ): Promise<number> => {
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

  const updatePlantsForChild = async (fromChild: string, toChild: string): Promise<number> => {
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

  const saveConfig = async (
    parents: string[],
    children: string[],
    updatedShortNames?: Record<string, string>,
    updatedProfiles?: Record<string, LocationProfile>,
  ): Promise<void> => {
    const names = updatedShortNames ?? shortNames;
    const profiles = updatedProfiles ?? locationProfiles;
    const saved = await saveLocationConfig({
      parentLocations: parents,
      childLocations: children,
      parentLocationShortNames: names,
      parentLocationProfiles: profiles,
    });
    setParentLocations(saved.parentLocations);
    setChildLocations(saved.childLocations);
    setShortNames(saved.parentLocationShortNames ?? {});
    setLocationProfiles(saved.parentLocationProfiles ?? {});
  };


  const handleRename = async (): Promise<void> => {
    if (!editModal) return;

    if (editModal.type === "child" && editModal.original === "") {
      const name = sanitizeLocationName(editModal.value);
      if (!name) {
        Alert.alert("Name Required", "Enter a section/direction name.");
        return;
      }
      if (name.includes(" - ")) {
        Alert.alert("Invalid Name", "Please avoid using ' - ' in location names.");
        return;
      }
      if (isDuplicate(childLocations, name)) {
        Alert.alert("Already Exists", `"${name}" already exists.`);
        return;
      }
      setSaving(true);
      try {
        await saveConfig(parentLocations, [...childLocations, name]);
        setEditModal(null);
      } catch (error: unknown) {
        Alert.alert("Error", getErrorMessage(error) || "Failed to add section. Please try again.");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (editModal.type === "parent" && editModal.original === "") {
      const name = sanitizeLocationName(editModal.value);
      if (!name) {
        Alert.alert("Name Required", "Enter a garden location name.");
        return;
      }
      if (name.includes(" - ")) {
        Alert.alert("Invalid Name", "Please avoid using ' - ' in location names.");
        return;
      }
      if (isDuplicate(parentLocations, name)) {
        Alert.alert("Already Exists", `"${name}" already exists.`);
        return;
      }
      setSaving(true);
      try {
        const sn = editModal.shortName?.trim().toUpperCase().slice(0, 5) || generateShortName(name);
        const updatedShortNames = { ...shortNames, [name]: sn };
        const updatedProfiles = hasProfileData(editModal.profile)
          ? { ...locationProfiles, [name]: editModal.profile! }
          : { ...locationProfiles };
        await saveConfig([...parentLocations, name], childLocations, updatedShortNames, updatedProfiles);
        setEditModal(null);
      } catch (error: unknown) {
        Alert.alert("Error", getErrorMessage(error) || "Failed to add area. Please try again.");
      } finally {
        setSaving(false);
      }
      return;
    }

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
    if (name === editModal.original && editModal.type === "child") {
      setEditModal(null);
      return;
    }

    const performRename = async (): Promise<void> => {
      setSaving(true);
      try {
        if (editModal.type === "parent") {
          if (count > 0) {
            await updatePlantsForParent(editModal.original, name);
          }
          const updatedParents = parentLocations.map((item) =>
            item === editModal.original ? name : item,
          );
          const updatedShortNames = { ...shortNames };
          delete updatedShortNames[editModal.original];
          const sn = editModal.shortName?.trim().toUpperCase().slice(0, 5);
          updatedShortNames[name] = (sn && sn.length >= 2) ? sn : generateShortName(name);

          const updatedProfiles = { ...locationProfiles };
          if (updatedProfiles[editModal.original]) {
            updatedProfiles[name] = updatedProfiles[editModal.original]!;
            delete updatedProfiles[editModal.original];
          }
          if (editModal.profile) {
            updatedProfiles[name] = editModal.profile;
          }

          await saveConfig(updatedParents, childLocations, updatedShortNames, updatedProfiles);
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
      } catch (error: unknown) {
        Alert.alert(
          "Error",
          getErrorMessage(error) || "Failed to rename. Please try again.",
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

  const handleDeleteRequest = (type: "parent" | "child", name: string): void => {
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
      replacement: options[0]!,
    });
  };

  const handleDelete = async (
    type: "parent" | "child",
    name: string,
    replacement?: string,
  ): Promise<void> => {
    setSaving(true);
    try {
      if (type === "parent") {
        if (replacement) {
          await updatePlantsForParent(name, replacement);
        }
        const updatedParents = parentLocations.filter((item) => item !== name);
        const updatedShortNames = { ...shortNames };
        delete updatedShortNames[name];
        const updatedProfiles = { ...locationProfiles };
        delete updatedProfiles[name];
        await saveConfig(updatedParents, childLocations, updatedShortNames, updatedProfiles);
      } else {
        if (replacement) {
          await updatePlantsForChild(name, replacement);
        }
        const updatedChildren = childLocations.filter((item) => item !== name);
        await saveConfig(parentLocations, updatedChildren);
      }
      setReassignModal(null);
    } catch (error: unknown) {
      Alert.alert(
        "Error",
        getErrorMessage(error) || "Failed to delete. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReassignConfirm = (): void => {
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

  const updateProfile = useCallback(
    (patch: Partial<LocationProfile>) => {
      setEditModal((prev) =>
        prev ? { ...prev, profile: { ...(prev.profile ?? {}), ...patch } } : prev,
      );
    },
    [],
  );


  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
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
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 48) + 16 }}
        >
          <View style={styles.infoCard}>
            <Ionicons name="map-outline" size={20} color={theme.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Set up your garden locations</Text>
              <Text style={styles.infoText}>
                Each location has a name, short code, and an optional soil profile — pH, soil type, drainage, NPK levels, and more. {"\n"}
                Example: <Text style={styles.infoHighlight}>Kanyakumari - South</Text>
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Garden Locations</Text>
                <Text style={styles.sectionDescription}>
                  The main locations of your garden.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sectionAddButton}
                onPress={() => setEditModal({ type: "parent", original: "", value: "", shortName: "", profile: {}, activeTab: "name" })}
                disabled={saving}
              >
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {parentLocations.length === 0 ? (
              <Text style={styles.emptyText}>No garden locations yet.</Text>
            ) : (
              parentLocations.map((location) => {
                const profile = locationProfiles[location];
                const showStrip = hasProfileData(profile);
                return (
                  <View key={location} style={styles.locationRow}>
                    <View style={styles.locationInfo}>
                      <View style={styles.locationNameRow}>
                        <Text style={styles.locationName}>{location}</Text>
                        {shortNames[location] ? (
                          <View style={styles.shortNameBadge}>
                            <Text style={styles.shortNameBadgeText}>{shortNames[location]}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.locationMeta}>
                        {parentCounts[location] || 0} plant
                        {(parentCounts[location] || 0) === 1 ? "" : "s"}
                      </Text>
                      {showStrip && (
                        <View style={styles.profileSummaryStrip}>
                          {profile?.soilPH != null && (
                            <View style={styles.profileBadge}>
                              <Text style={styles.profileBadgeText}>pH {profile.soilPH.toFixed(1)}</Text>
                            </View>
                          )}
                          {profile?.drainageQuality && (
                            <View style={styles.profileBadge}>
                              <Ionicons name="water-outline" size={10} color={deriveDrainageColor(profile.drainageQuality)} />
                              <Text style={styles.profileBadgeText}>{profile.drainageQuality}</Text>
                            </View>
                          )}
                          {(profile?.nitrogenLevel || profile?.phosphorusLevel || profile?.potassiumLevel) && (
                            <View style={styles.profileBadge}>
                              <View style={styles.npkDotRow}>
                                <View style={[styles.npkDot, { backgroundColor: deriveNpkColor(profile?.nitrogenLevel) }]} />
                                <View style={[styles.npkDot, { backgroundColor: deriveNpkColor(profile?.phosphorusLevel) }]} />
                                <View style={[styles.npkDot, { backgroundColor: deriveNpkColor(profile?.potassiumLevel) }]} />
                              </View>
                              <Text style={styles.profileBadgeText}>NPK</Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                    <View style={styles.locationActions}>
                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() =>
                          setEditModal({
                            type: "parent",
                            original: location,
                            value: location,
                            shortName: shortNames[location] ?? "",
                            profile: locationProfiles[location] ?? {},
                            activeTab: "name",
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
                );
              })
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Sections / Directions</Text>
                <Text style={styles.sectionDescription}>
                  Directions or zones within each location — North, South, etc.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.sectionAddButton}
                onPress={() => setEditModal({ type: "child", original: "", value: "" })}
                disabled={saving}
              >
                <Ionicons name="add" size={22} color="#fff" />
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, styles.modalContentTall]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editModal?.type === "parent"
                  ? editModal.original === "" ? "New Garden Location" : "Edit Garden Location"
                  : "Rename Section"}
              </Text>
              <TouchableOpacity onPress={() => setEditModal(null)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {editModal?.type === "parent" && (
              <View style={styles.modalTabRow}>
                <TouchableOpacity
                  style={[styles.modalTab, editModal.activeTab !== "soil" && styles.modalTabActive]}
                  onPress={() => setEditModal((prev) => prev ? { ...prev, activeTab: "name" } : prev)}
                >
                  <Text style={[styles.modalTabText, editModal.activeTab !== "soil" && styles.modalTabTextActive]}>
                    Name
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalTab, editModal.activeTab === "soil" && styles.modalTabActive]}
                  onPress={() => setEditModal((prev) => prev ? { ...prev, activeTab: "soil" } : prev)}
                >
                  <Text style={[styles.modalTabText, editModal.activeTab === "soil" && styles.modalTabTextActive]}>
                    Soil & Environment
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContentPadding}
            >
              {editModal?.activeTab !== "soil" ? (
                <>
                  <FloatingLabelInput
                    label="Name"
                    value={editModal?.value ?? ""}
                    onChangeText={(text) =>
                      setEditModal((prev) => (prev ? { ...prev, value: text } : prev))
                    }
                    autoFocus
                    autoCorrect={false}
                  />

                  {editModal?.type === "parent" && (
                    <View style={styles.shortNameWrap}>
                      <FloatingLabelInput
                        label="Short name (3–5 letters)"
                        value={editModal?.shortName ?? ""}
                        onChangeText={(text) =>
                          setEditModal((prev) =>
                            prev ? { ...prev, shortName: text.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 5) } : prev,
                          )
                        }
                        autoCorrect={false}
                        maxLength={5}
                        autoCapitalize="characters"
                      />
                      <Text style={styles.modalHint}>
                        Used in auto-generated plant names, e.g. Tomato ({editModal?.shortName || "ABC"})
                      </Text>
                    </View>
                  )}

                  {editModal && (
                    <Text style={styles.modalHint}>
                      Used by {editCount} plant{editCount === 1 ? "" : "s"}.
                    </Text>
                  )}
                </>
              ) : editModal ? (
                <LocationProfileEditor
                  editModal={editModal}
                  setEditModal={setEditModal}
                  updateProfile={updateProfile}
                />
              ) : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalFooterButton, styles.modalFooterButtonPrimary]}
                onPress={handleRename}
              >
                <Text style={styles.modalFooterButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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

            <ThemedDropdown
              items={reassignOptions.map((option) => ({ label: option, value: option }))}
              selectedValue={reassignModal?.replacement ?? ""}
              onValueChange={(value) =>
                setReassignModal((prev) =>
                  prev ? { ...prev, replacement: value } : prev,
                )
              }
              label="Replacement location"
              placeholder="Replacement location"
            />

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
