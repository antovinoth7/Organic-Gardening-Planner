import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ImageStyle,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import PhotoSourceModal from "../components/modals/PhotoSourceModal";
import FloatingLabelInput from "../components/FloatingLabelInput";
import ThemedDropdown from "../components/ThemedDropdown";
import {
  createJournalEntry,
  updateJournalEntry,
  saveJournalImage,
} from "../services/journal";
import { getAllPlants } from "../services/plants";
import { Plant, JournalEntryType } from "../types/database.types";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  JournalFormScreenNavigationProp,
  JournalFormScreenRouteProp,
} from "../types/navigation.types";
import { useTheme } from "../theme";
import { sanitizeAlphaNumericSpaces } from "../utils/textSanitizer";
import { createStyles } from "../styles/journalFormStyles";
import { logger } from "../utils/logger";
import {
  getFilenameFromUri,
  getLocalImageUriFromFilename,
  resolveLocalImageUri,
} from "../lib/imageStorage";
import { getErrorMessage } from "../utils/errorLogging";

type PhotoItem = {
  uri: string | null;
  filename: string | null;
};

export default function JournalFormScreen(): React.JSX.Element {
  const navigation = useNavigation<JournalFormScreenNavigationProp>();
  const route = useRoute<JournalFormScreenRouteProp>();
  const editEntry = route.params?.entry;
  const initialEntryType = route.params?.initialEntryType;
  const initialPlantId = route.params?.initialPlantId;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isEditing = !!editEntry;

  const [entryType, setEntryType] = useState<JournalEntryType>(
    editEntry?.entry_type || initialEntryType || JournalEntryType.Observation,
  );
  const [content, setContent] = useState(editEntry?.content || "");
  const buildInitialPhotoItems = (): PhotoItem[] => {
    if (!editEntry) return [];
    if (editEntry.photo_filenames && editEntry.photo_filenames.length > 0) {
      return editEntry.photo_filenames.map((filename, index) => ({
        filename,
        uri:
          editEntry.photo_urls?.[index] ??
          getLocalImageUriFromFilename(filename),
      }));
    }
    const legacyUris =
      editEntry.photo_urls ||
      (editEntry.photo_url ? [editEntry.photo_url] : []);
    return legacyUris.map((uri) => ({
      uri,
      filename: getFilenameFromUri(uri),
    }));
  };
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>(
    buildInitialPhotoItems,
  );
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(
    editEntry?.plant_id || initialPlantId || null,
  );
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);

  // Tags
  const PREDEFINED_TAGS = [
    "pest",
    "weather_damage",
    "harvest",
    "soil_prep",
    "growth_update",
    "experiment",
  ] as const;
  const [selectedTags, setSelectedTags] = useState<string[]>(
    editEntry?.tags ?? [],
  );

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  // Harvest-specific fields
  const [harvestQuantity, setHarvestQuantity] = useState(
    editEntry?.harvest_quantity?.toString() || "",
  );
  const [harvestUnit, setHarvestUnit] = useState(
    editEntry?.harvest_unit || "pieces",
  );
  const [harvestQuality, setHarvestQuality] = useState<
    "excellent" | "good" | "fair" | "poor"
  >(editEntry?.harvest_quality || "good");
  const [harvestNotes, setHarvestNotes] = useState(
    editEntry?.harvest_notes || "",
  );

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    if (isEditing) return;
    if (initialEntryType) {
      setEntryType(initialEntryType);
    }
    if (initialPlantId) {
      setSelectedPlantId(initialPlantId);
    }
  }, [isEditing, initialEntryType, initialPlantId]);

  const loadPlants = async (): Promise<void> => {
    try {
      const data = await getAllPlants();
      setPlants(data);
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error));
    }
  };

  const openImageLibrary = async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      const newItems = result.assets.map((asset) => ({
        uri: asset.uri,
        filename: null,
      }));
      setPhotoItems((prev) => [...prev, ...newItems]);
    }
  };

  const openCamera = async (): Promise<void> => {
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
        const cameraUri = result.assets[0]?.uri;
        if (cameraUri) {
          setPhotoItems((prev) => [
            ...prev,
            { uri: cameraUri, filename: null },
          ]);
        }
      }
    } catch (error) {
      logger.warn("Camera launch failed", error as Error);
      Alert.alert("Camera Error", "Failed to open camera. Please try again.");
    }
  };

  const pickImage = (): void => {
    setShowPhotoSourceModal(true);
  };

  const removeImage = (index: number): void => {
    setPhotoItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (): Promise<void> => {
    // Input validation
    if (!content.trim()) {
      Alert.alert("Validation Error", "Please write something in your journal");
      return;
    }

    if (content.trim().length < 3) {
      Alert.alert(
        "Validation Error",
        "Journal entry must be at least 3 characters long",
      );
      return;
    }

    if (content.trim().length > 5000) {
      Alert.alert(
        "Validation Error",
        "Journal entry must be less than 5000 characters",
      );
      return;
    }

    if (entryType === JournalEntryType.Harvest) {
      if (!harvestQuantity || harvestQuantity.trim() === "") {
        Alert.alert("Validation Error", "Please enter harvest quantity");
        return;
      }

      const quantity = parseFloat(harvestQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        Alert.alert(
          "Validation Error",
          "Harvest quantity must be a positive number",
        );
        return;
      }

      if (quantity > 100000) {
        Alert.alert(
          "Validation Error",
          "Harvest quantity seems too large. Please check your input.",
        );
        return;
      }
    }

    if (loading) {
      return; // Prevent multiple submissions
    }

    setLoading(true);
    try {
      const photoUrls: string[] = [];
      const photoFilenames: string[] = [];

      for (const item of photoItems) {
        if (item.filename) {
          photoFilenames.push(item.filename);
          if (item.uri) {
            photoUrls.push(item.uri);
          } else {
            const localUri = await resolveLocalImageUri(item.filename);
            if (localUri) {
              photoUrls.push(localUri);
            }
          }
          continue;
        }
        if (item.uri) {
          const saved = await saveJournalImage(item.uri);
          const filename = saved.filename || getFilenameFromUri(saved.uri);
          if (filename) {
            photoFilenames.push(filename);
          }
          photoUrls.push(saved.uri);
        }
      }

      const entryData = {
        entry_type: entryType,
        content: content.trim(),
        photo_filenames: photoFilenames,
        photo_urls: photoUrls,
        plant_id: selectedPlantId,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        harvest_quantity:
          entryType === JournalEntryType.Harvest
            ? parseFloat(harvestQuantity)
            : null,
        harvest_unit:
          entryType === JournalEntryType.Harvest ? harvestUnit : null,
        harvest_quality:
          entryType === JournalEntryType.Harvest ? harvestQuality : null,
        harvest_notes:
          entryType === JournalEntryType.Harvest ? harvestNotes : null,
      };

      if (isEditing && editEntry) {
        await updateJournalEntry(editEntry.id, entryData);
      } else {
        await createJournalEntry(entryData);
      }

      // Trigger refresh in parent screen
      navigation.navigate({
        name: "JournalList",
        params: { refresh: Date.now() },
        merge: true,
      });
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditing ? "Edit Entry" : "New Entry"}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={[styles.saveButton, loading && styles.saveButtonDisabled]}>
          <Text style={[styles.saveText, loading && styles.saveTextDisabled]}>
            {loading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Entry Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              entryType === JournalEntryType.Observation &&
                styles.typeButtonActive,
            ]}
            onPress={() => setEntryType(JournalEntryType.Observation)}
          >
            <Ionicons
              name="eye"
              size={18}
              color={
                entryType === JournalEntryType.Observation
                  ? theme.textInverse
                  : theme.primary
              }
            />
            <Text
              style={[
                styles.typeButtonText,
                entryType === JournalEntryType.Observation &&
                  styles.typeButtonTextActive,
              ]}
            >
              Observation
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              entryType === JournalEntryType.Harvest && styles.typeButtonActive,
            ]}
            onPress={() => setEntryType(JournalEntryType.Harvest)}
          >
            <Ionicons
              name="basket"
              size={18}
              color={
                entryType === JournalEntryType.Harvest
                  ? theme.textInverse
                  : theme.primary
              }
            />
            <Text
              style={[
                styles.typeButtonText,
                entryType === JournalEntryType.Harvest &&
                  styles.typeButtonTextActive,
              ]}
            >
              Harvest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              entryType === JournalEntryType.Issue && styles.typeButtonActive,
            ]}
            onPress={() => setEntryType(JournalEntryType.Issue)}
          >
            <Ionicons
              name="alert-circle"
              size={18}
              color={
                entryType === JournalEntryType.Issue
                  ? theme.textInverse
                  : theme.primary
              }
            />
            <Text
              style={[
                styles.typeButtonText,
                entryType === JournalEntryType.Issue &&
                  styles.typeButtonTextActive,
              ]}
            >
              Issue
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              entryType === JournalEntryType.Milestone &&
                styles.typeButtonActive,
            ]}
            onPress={() => setEntryType(JournalEntryType.Milestone)}
          >
            <Ionicons
              name="flag"
              size={18}
              color={
                entryType === JournalEntryType.Milestone
                  ? theme.textInverse
                  : theme.primary
              }
            />
            <Text
              style={[
                styles.typeButtonText,
                entryType === JournalEntryType.Milestone &&
                  styles.typeButtonTextActive,
              ]}
            >
              Milestone
            </Text>
          </TouchableOpacity>
        </View>

        {photoItems.length > 0 && (
          <View style={styles.photosGrid}>
            {photoItems.map((item, index) =>
              item.uri ? (
                <View key={index} style={styles.photoContainer}>
                  <Image
                    source={{ uri: item.uri }}
                    style={styles.photoThumbnail as ImageStyle}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                    recyclingKey={`journal-photo-${index}`}
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : null,
            )}
          </View>
        )}

        <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
          <Ionicons name="camera" size={20} color="#2e7d32" />
          <Text style={styles.addPhotoText}>
            {photoItems.length > 0
              ? `Add More Photos (${photoItems.length})`
              : "Add Photos"}
          </Text>
        </TouchableOpacity>

        <ThemedDropdown
          items={[
            { label: "No plant linked", value: "" },
            ...plants.map((p) => ({ label: p.name, value: p.id })),
          ]}
          selectedValue={selectedPlantId || ""}
          onValueChange={(value) => setSelectedPlantId(value || null)}
          label="Link to plant"
          placeholder="Link to plant (optional)"
          searchable
        />

        {/* Tags */}
        <View style={styles.tagsSection}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagsWrap}>
            {PREDEFINED_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagChip,
                  selectedTags.includes(tag) && styles.tagChipActive,
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    selectedTags.includes(tag) && styles.tagChipTextActive,
                  ]}
                >
                  {tag.replace(/_/g, " ")}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Harvest-specific fields */}
        {entryType === JournalEntryType.Harvest && (
          <View style={styles.harvestSection}>
            <Text style={styles.sectionTitle}>Harvest Details</Text>

            <View style={styles.harvestRow}>
              <View style={styles.quantityInput}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={theme.inputPlaceholder}
                  value={harvestQuantity}
                  onChangeText={setHarvestQuantity}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.unitInput}>
                <Text style={styles.label}>Unit</Text>
                <View style={styles.unitButtons}>
                  {["pcs", "kg"].map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitButton,
                        harvestUnit === unit && styles.unitButtonActive,
                      ]}
                      onPress={() => setHarvestUnit(unit)}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          harvestUnit === unit && styles.unitButtonTextActive,
                        ]}
                      >
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Text style={styles.label}>Quality</Text>
            <View style={styles.qualityButtons}>
              {(
                [
                  { value: "excellent" as const, label: "Excellent", emoji: "🌟" },
                  { value: "good" as const, label: "Good", emoji: "👍" },
                  { value: "fair" as const, label: "Fair", emoji: "👌" },
                  { value: "poor" as const, label: "Poor", emoji: "👎" },
                ] satisfies { value: "excellent" | "good" | "fair" | "poor"; label: string; emoji: string }[]
              ).map((quality) => (
                <TouchableOpacity
                  key={quality.value}
                  style={[
                    styles.qualityButton,
                    harvestQuality === quality.value &&
                      styles.qualityButtonActive,
                  ]}
                  onPress={() => setHarvestQuality(quality.value)}
                >
                  <Text style={styles.qualityEmoji}>{quality.emoji}</Text>
                  <Text
                    style={[
                      styles.qualityButtonText,
                      harvestQuality === quality.value &&
                        styles.qualityButtonTextActive,
                    ]}
                  >
                    {quality.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.notesWrapper, styles.notesWrapperMarginTop]}>
              <FloatingLabelInput
                label="Storage / Notes"
                value={harvestNotes}
                onChangeText={(text) =>
                  setHarvestNotes(sanitizeAlphaNumericSpaces(text))
                }
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              <Text style={styles.charCounter}>
                {harvestNotes.length}/500
              </Text>
            </View>
          </View>
        )}

        <View style={styles.notesWrapper}>
          <FloatingLabelInput
            label="What's happening in your garden today?"
            value={content}
            onChangeText={(text) => setContent(sanitizeAlphaNumericSpaces(text))}
            multiline
            numberOfLines={6}
            maxLength={5000}
          />
          <Text style={styles.charCounter}>
            {content.length}/5000
          </Text>
        </View>

        {/* Extra spacing for keyboard */}
        <View style={styles.keyboardSpacer} />
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
