import React, { useEffect, useState } from "react";
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
} from "react-native";
import { Image } from 'expo-image';
import * as ImagePicker from "expo-image-picker";
import PhotoSourceModal from "../components/PhotoSourceModal";
import {
  createJournalEntry,
  updateJournalEntry,
  saveJournalImage,
} from "../services/journal";
import { getPlants } from "../services/plants";
import { Plant, JournalEntry, JournalEntryType } from "../types/database.types";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { sanitizeAlphaNumericSpaces } from "../utils/textSanitizer";
import {
  getFilenameFromUri,
  getLocalImageUriFromFilename,
  resolveLocalImageUri,
} from "../lib/imageStorage";

type PhotoItem = {
  uri: string | null;
  filename: string | null;
};

export default function JournalFormScreen({ navigation, route }: any) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const editEntry = route.params?.entry as JournalEntry | undefined;
  const initialEntryType = route.params?.initialEntryType as
    | JournalEntryType
    | undefined;
  const initialPlantId = route.params?.initialPlantId as string | undefined;
  const isEditing = !!editEntry;

  const [entryType, setEntryType] = useState<JournalEntryType>(
    editEntry?.entry_type || initialEntryType || "observation"
  );
  const [content, setContent] = useState(editEntry?.content || "");
  const buildInitialPhotoItems = (): PhotoItem[] => {
    if (!editEntry) return [];
    if (editEntry.photo_filenames && editEntry.photo_filenames.length > 0) {
      return editEntry.photo_filenames.map((filename, index) => ({
        filename,
        uri: editEntry.photo_urls?.[index] ?? getLocalImageUriFromFilename(filename),
      }));
    }
    const legacyUris =
      editEntry.photo_urls || (editEntry.photo_url ? [editEntry.photo_url] : []);
    return legacyUris.map((uri) => ({
      uri,
      filename: getFilenameFromUri(uri),
    }));
  };
  const [photoItems, setPhotoItems] = useState<PhotoItem[]>(
    buildInitialPhotoItems
  );
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(
    editEntry?.plant_id || initialPlantId || null
  );
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPlantPicker, setShowPlantPicker] = useState(false);
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);

  // Harvest-specific fields
  const [harvestQuantity, setHarvestQuantity] = useState(
    editEntry?.harvest_quantity?.toString() || ""
  );
  const [harvestUnit, setHarvestUnit] = useState(
    editEntry?.harvest_unit || "pieces"
  );
  const [harvestQuality, setHarvestQuality] = useState<
    "excellent" | "good" | "fair" | "poor"
  >(editEntry?.harvest_quality || "good");
  const [harvestNotes, setHarvestNotes] = useState(
    editEntry?.harvest_notes || ""
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

  const loadPlants = async () => {
    try {
      const { plants: data } = await getPlants();
      setPlants(data);
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

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your camera");
      return;
    }

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
  };

  const pickImage = () => {
    setShowPhotoSourceModal(true);
  };

  const removeImage = (index: number) => {
    setPhotoItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Input validation
    if (!content.trim()) {
      Alert.alert("Validation Error", "Please write something in your journal");
      return;
    }

    if (content.trim().length < 3) {
      Alert.alert(
        "Validation Error",
        "Journal entry must be at least 3 characters long"
      );
      return;
    }

    if (content.trim().length > 5000) {
      Alert.alert(
        "Validation Error",
        "Journal entry must be less than 5000 characters"
      );
      return;
    }

    if (entryType === "harvest") {
      if (!harvestQuantity || harvestQuantity.trim() === "") {
        Alert.alert("Validation Error", "Please enter harvest quantity");
        return;
      }

      const quantity = parseFloat(harvestQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        Alert.alert(
          "Validation Error",
          "Harvest quantity must be a positive number"
        );
        return;
      }

      if (quantity > 100000) {
        Alert.alert(
          "Validation Error",
          "Harvest quantity seems too large. Please check your input."
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
        harvest_quantity:
          entryType === "harvest" ? parseFloat(harvestQuantity) : null,
        harvest_unit: entryType === "harvest" ? harvestUnit : null,
        harvest_quality: entryType === "harvest" ? harvestQuality : null,
        harvest_notes: entryType === "harvest" ? harvestNotes : null,
      };

      if (isEditing && editEntry) {
        await updateJournalEntry(editEntry.id, entryData);
      } else {
        await createJournalEntry(entryData);
      }

      // Trigger refresh in parent screen
      navigation.navigate({
        name: 'JournalList',
        params: { refresh: Date.now() },
        merge: true,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlant = plants.find((p) => p.id === selectedPlantId);
  const styles = createStyles(theme);

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
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveText, loading && styles.saveTextDisabled]}>
            {loading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Entry Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              entryType === "observation" && styles.typeButtonActive,
            ]}
            onPress={() => setEntryType("observation")}
          >
            <Ionicons
              name="eye"
              size={18}
              color={
                entryType === "observation" ? theme.textInverse : theme.primary
              }
            />
            <Text
              style={[
                styles.typeButtonText,
                entryType === "observation" && styles.typeButtonTextActive,
              ]}
            >
              Watch
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              entryType === "harvest" && styles.typeButtonActive,
            ]}
            onPress={() => setEntryType("harvest")}
          >
            <Ionicons
              name="basket"
              size={18}
              color={
                entryType === "harvest" ? theme.textInverse : theme.primary
              }
            />
            <Text
              style={[
                styles.typeButtonText,
                entryType === "harvest" && styles.typeButtonTextActive,
              ]}
            >
              Harvest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              entryType === "issue" && styles.typeButtonActive,
            ]}
            onPress={() => setEntryType("issue")}
          >
            <Ionicons
              name="alert-circle"
              size={18}
              color={entryType === "issue" ? theme.textInverse : theme.primary}
            />
            <Text
              style={[
                styles.typeButtonText,
                entryType === "issue" && styles.typeButtonTextActive,
              ]}
            >
              Issue
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeButton,
              entryType === "milestone" && styles.typeButtonActive,
            ]}
            onPress={() => setEntryType("milestone")}
          >
            <Ionicons
              name="flag"
              size={18}
              color={
                entryType === "milestone" ? theme.textInverse : theme.primary
              }
            />
            <Text
              style={[
                styles.typeButtonText,
                entryType === "milestone" && styles.typeButtonTextActive,
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
                    style={styles.photoThumbnail}
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
              ) : null
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

        <TouchableOpacity
          style={styles.plantSelector}
          onPress={() => setShowPlantPicker(!showPlantPicker)}
        >
          <Ionicons name="leaf" size={20} color="#2e7d32" />
          <Text style={styles.plantSelectorText}>
            {selectedPlant ? selectedPlant.name : "Link to plant (optional)"}
          </Text>
          {selectedPlantId && (
            <TouchableOpacity onPress={() => setSelectedPlantId(null)}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {showPlantPicker && (
          <View style={styles.plantPicker}>
            {plants.map((plant) => (
              <TouchableOpacity
                key={plant.id}
                style={[
                  styles.plantOption,
                  selectedPlantId === plant.id && styles.plantOptionSelected,
                ]}
                onPress={() => {
                  setSelectedPlantId(plant.id);
                  setShowPlantPicker(false);
                }}
              >
                <Text style={styles.plantOptionText}>{plant.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Harvest-specific fields */}
        {entryType === "harvest" && (
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
                  {["pieces", "kg", "lbs"].map((unit) => (
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
              {[
                { value: "excellent", label: "Excellent", emoji: "🌟" },
                { value: "good", label: "Good", emoji: "👍" },
                { value: "fair", label: "Fair", emoji: "👌" },
                { value: "poor", label: "Poor", emoji: "👎" },
              ].map((quality) => (
                <TouchableOpacity
                  key={quality.value}
                  style={[
                    styles.qualityButton,
                    harvestQuality === quality.value &&
                      styles.qualityButtonActive,
                  ]}
                  onPress={() => setHarvestQuality(quality.value as any)}
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

            <Text style={styles.label}>Storage / Notes</Text>
            <TextInput
              style={styles.harvestNotesInput}
              placeholder="Storage method, taste notes, etc. (optional)"
              placeholderTextColor={theme.inputPlaceholder}
              value={harvestNotes}
              onChangeText={(text) => setHarvestNotes(sanitizeAlphaNumericSpaces(text))}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>
        )}

        <TextInput
          style={styles.textArea}
          placeholder="What's happening in your garden today?"
          value={content}
          onChangeText={(text) => setContent(sanitizeAlphaNumericSpaces(text))}
          multiline
          textAlignVertical="top"
          placeholderTextColor="#999"
        />

        {/* Extra spacing for keyboard */}
        <View style={{ height: 300 }} />
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
      paddingBottom: 16,
    },
    photosGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16,
    },
    photoContainer: {
      position: "relative",
      width: "48%",
      aspectRatio: 1,
    },
    photoThumbnail: {
      width: "100%",
      height: "100%",
      borderRadius: 12,
    },
    removePhotoButton: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      borderRadius: 12,
    },
    addPhotoButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      backgroundColor: theme.primaryLight,
      borderRadius: 12,
      marginBottom: 16,
    },
    addPhotoText: {
      fontSize: 16,
      color: theme.primary,
      marginLeft: 8,
      fontWeight: "600",
    },
    plantSelector: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    plantSelectorText: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      marginLeft: 8,
    },
    plantPicker: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      marginBottom: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
    },
    plantOption: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    plantOptionSelected: {
      backgroundColor: theme.primaryLight,
    },
    plantOptionText: {
      fontSize: 16,
      color: theme.text,
    },
    textArea: {
      backgroundColor: theme.inputBackground,
      padding: 16,
      borderRadius: 12,
      fontSize: 16,
      color: theme.inputText,
      minHeight: 150,
      maxHeight: 300,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    typeSelector: {
      flexDirection: "row",
      marginBottom: 16,
      gap: 8,
    },
    typeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.primaryLight,
      gap: 4,
    },
    typeButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    typeButtonText: {
      fontSize: 11,
      color: theme.primary,
      fontWeight: "600",
    },
    typeButtonTextActive: {
      color: theme.textInverse,
    },
    harvestSection: {
      backgroundColor: theme.backgroundSecondary,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 12,
    },
    harvestRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    quantityInput: {
      flex: 1,
    },
    unitInput: {
      flex: 1,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.inputBackground,
      padding: 12,
      borderRadius: 8,
      fontSize: 16,
      color: theme.inputText,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    unitButtons: {
      flexDirection: "row",
      gap: 8,
    },
    unitButton: {
      flex: 1,
      padding: 8,
      backgroundColor: theme.background,
      borderRadius: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    unitButtonActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    unitButtonText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: "600",
    },
    unitButtonTextActive: {
      color: theme.primary,
    },
    qualityButtons: {
      flexDirection: "row",
      gap: 8,
    },
    qualityButton: {
      flex: 1,
      padding: 8,
      backgroundColor: theme.background,
      borderRadius: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    qualityButtonActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    qualityEmoji: {
      fontSize: 18,
      marginBottom: 2,
    },
    qualityButtonText: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: "600",
    },
    qualityButtonTextActive: {
      color: theme.primary,
    },
    harvestNotesInput: {
      backgroundColor: theme.inputBackground,
      padding: 12,
      borderRadius: 8,
      fontSize: 16,
      color: theme.inputText,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      minHeight: 60,
    },
  });
