import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import ThemedDropdown from "./ThemedDropdown";
import FloatingLabelInput from "./FloatingLabelInput";
import PhotoSourceModal from "./PhotoSourceModal";
import {
  PestDiseaseRecord,
  IssueSeverity,
  HealthStatus,
  PlantType,
} from "../types/database.types";
import {
  getGroupedPests,
  getGroupedDiseases,
  getPestDiseaseEmoji,
  getGroupedTreatments,
  getTreatmentEffortDot,
} from "../utils/plantHelpers";
import { saveImageLocallyWithFilename } from "../lib/imageStorage";
import { createTaskTemplate } from "../services/tasks";
import { sanitizeAlphaNumericSpaces } from "../utils/textSanitizer";
import { toLocalDateString, formatDateDisplay } from "../utils/dateHelpers";
import { logger } from "../utils/logger";

const ISSUE_SEVERITY_OPTIONS: { value: IssueSeverity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "severe", label: "Severe" },
];

interface PestDiseaseModalProps {
  visible: boolean;
  editingIndex: number | null;
  editingRecord: PestDiseaseRecord | null;
  initialPhotoUri: string | null;
  pestDiseaseHistory: PestDiseaseRecord[];
  plantType: PlantType;
  plantVariety: string;
  plantId: string | undefined;
  healthStatus: HealthStatus;
  styles: any;
  theme: any;
  bottomInset: number;
  onClose: () => void;
  onSave: (updatedHistory: PestDiseaseRecord[]) => void;
  onHealthStatusChange: (status: HealthStatus) => void;
}

const DEFAULT_RECORD: PestDiseaseRecord = {
  type: "pest",
  name: "",
  occurredAt: toLocalDateString(new Date()),
  severity: "medium",
  resolved: false,
};

export default function PestDiseaseModal({
  visible,
  editingIndex,
  editingRecord,
  initialPhotoUri,
  pestDiseaseHistory,
  plantType,
  plantVariety,
  plantId,
  healthStatus,
  styles,
  theme,
  bottomInset,
  onClose,
  onSave,
  onHealthStatusChange,
}: PestDiseaseModalProps) {
  const [currentRecord, setCurrentRecord] =
    useState<PestDiseaseRecord>(DEFAULT_RECORD);
  const [pestPhotoUri, setPestPhotoUri] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPhotoSource, setShowPhotoSource] = useState(false);
  const [customTreatmentMode, setCustomTreatmentMode] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editingRecord) {
        setCurrentRecord({ ...editingRecord });
        setPestPhotoUri(initialPhotoUri);
      } else {
        setCurrentRecord({
          ...DEFAULT_RECORD,
          occurredAt: toLocalDateString(new Date()),
        });
        setPestPhotoUri(null);
      }
      setShowDatePicker(false);
      setCustomTreatmentMode(false);
    }
  }, [visible, editingRecord, initialPhotoUri]);

  const handleClose = () => {
    setShowDatePicker(false);
    onClose();
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
        quality: 0.7,
        cameraType: ImagePicker.CameraType.back,
      });
      if (!result.canceled) setPestPhotoUri(result.assets[0].uri);
    } catch (error) {
      logger.warn("Camera launch failed", error as Error);
      Alert.alert("Camera Error", "Failed to open camera. Please try again.");
    }
  };

  const openLibrary = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photos");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: 0.7,
    });
    if (!result.canceled) setPestPhotoUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (!currentRecord.name.trim()) {
      Alert.alert("Validation Error", "Please enter a name");
      return;
    }

    const MAX_PEST_RECORDS = 50;
    if (
      editingIndex === null &&
      pestDiseaseHistory.length >= MAX_PEST_RECORDS
    ) {
      Alert.alert(
        "Record Limit",
        `Maximum ${MAX_PEST_RECORDS} pest/disease records per plant. Please remove old resolved records before adding new ones.`,
      );
      return;
    }

    // Save pest photo if provided
    let photoFilename = currentRecord.photo_filename;
    if (pestPhotoUri && pestPhotoUri !== currentRecord.photo_filename) {
      const saved = await saveImageLocallyWithFilename(
        pestPhotoUri,
        `pest_${Date.now()}`,
      );
      if (saved && saved.filename) photoFilename = saved.filename;
    }

    const recordToSave = { ...currentRecord, photo_filename: photoFilename };
    let updatedHistory: PestDiseaseRecord[];
    if (editingIndex !== null) {
      updatedHistory = [...pestDiseaseHistory];
      updatedHistory[editingIndex] = recordToSave;
    } else {
      updatedHistory = [
        ...pestDiseaseHistory,
        { ...recordToSave, id: Date.now().toString() },
      ];
    }
    onSave(updatedHistory);

    // Auto-suggest health status change
    if (!currentRecord.resolved && healthStatus === "healthy") {
      const suggested =
        currentRecord.severity === "high" ? "sick" : "stressed";
      Alert.alert(
        "Update Health Status?",
        `You added an active ${currentRecord.type} record. Would you like to change health status to "${suggested}"?`,
        [
          { text: "Keep Healthy", style: "cancel" },
          {
            text: `Set ${suggested.charAt(0).toUpperCase() + suggested.slice(1)}`,
            onPress: () =>
              onHealthStatusChange(suggested as HealthStatus),
          },
        ],
      );
    }

    // Offer to create spray task when editing existing plant
    if (!currentRecord.resolved && plantId && editingIndex === null) {
      setTimeout(() => {
        Alert.alert(
          "Create Spray Task?",
          `Would you like to create a spray task for "${currentRecord.name}"?`,
          [
            { text: "No", style: "cancel" },
            {
              text: "Create Task",
              onPress: async () => {
                try {
                  const dueDate = new Date();
                  dueDate.setHours(18, 0, 0, 0);
                  await createTaskTemplate({
                    plant_id: plantId,
                    task_type: "spray",
                    frequency_days: 7,
                    next_due_at: dueDate.toISOString(),
                    enabled: true,
                    preferred_time: null,
                  });
                  Alert.alert("Done", "Spray task created!");
                } catch {
                  Alert.alert("Error", "Could not create spray task.");
                }
              },
            },
          ],
        );
      }, 800);
    }

    handleClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingIndex !== null
                  ? "Edit Pest/Disease Record"
                  : "Add Pest/Disease Record"}
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={{
                paddingBottom: Math.max(bottomInset, 12),
              }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    currentRecord.type === "pest" && styles.typeButtonActive,
                  ]}
                  onPress={() => {
                    setCustomTreatmentMode(false);
                    setCurrentRecord({
                      ...currentRecord,
                      type: "pest",
                      name: "",
                      treatment: undefined,
                    });
                  }}
                >
                  <Ionicons
                    name="bug"
                    size={20}
                    color={
                      currentRecord.type === "pest" ? "#2e7d32" : "#666"
                    }
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      currentRecord.type === "pest" &&
                        styles.typeButtonTextActive,
                    ]}
                  >
                    Pest
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    currentRecord.type === "disease" &&
                      styles.typeButtonActive,
                  ]}
                  onPress={() => {
                    setCustomTreatmentMode(false);
                    setCurrentRecord({
                      ...currentRecord,
                      type: "disease",
                      name: "",
                      treatment: undefined,
                    });
                  }}
                >
                  <Ionicons
                    name="medical"
                    size={20}
                    color={
                      currentRecord.type === "disease" ? "#2e7d32" : "#666"
                    }
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      currentRecord.type === "disease" &&
                        styles.typeButtonTextActive,
                    ]}
                  >
                    Disease
                  </Text>
                </TouchableOpacity>
              </View>

              <FloatingLabelInput
                label={`${
                  currentRecord.type === "pest" ? "Pest" : "Disease"
                } Name *`}
                value={currentRecord.name}
                onChangeText={(text) =>
                  setCurrentRecord({
                    ...currentRecord,
                    name: sanitizeAlphaNumericSpaces(text),
                  })
                }
              />

              <Text style={styles.label}>
                Common{" "}
                {currentRecord.type === "pest" ? "Pests" : "Diseases"}:
              </Text>
              
              <View style={styles.suggestionGroupContainer}>
                {(currentRecord.type === "pest"
                  ? getGroupedPests(plantType, plantVariety)
                  : getGroupedDiseases(plantType, plantVariety)
                ).map((group) => (
                  <View key={group.category} style={styles.suggestionGroup}>
                    <Text style={styles.suggestionGroupLabel}>
                      {group.emoji} {group.category}
                    </Text>
                    <View style={styles.suggestionGroupChips}>
                      {group.items.map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={[
                            styles.suggestionChip,
                            currentRecord.name === item &&
                              styles.suggestionChipActive,
                          ]}
                          onPress={() =>
                            setCurrentRecord({ ...currentRecord, name: item })
                          }
                        >
                          <Text
                            style={[
                              styles.suggestionChipText,
                              currentRecord.name === item &&
                                styles.suggestionChipTextActive,
                            ]}
                          >
                            {getPestDiseaseEmoji(item, currentRecord.type)} {item}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text
                  style={
                    currentRecord.occurredAt
                      ? styles.dateButtonText
                      : styles.datePlaceholder
                  }
                >
                  {currentRecord.occurredAt
                    ? formatDateDisplay(currentRecord.occurredAt)
                    : "Occurred Date"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={
                    currentRecord.occurredAt
                      ? new Date(currentRecord.occurredAt)
                      : new Date()
                  }
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, selectedDate) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (selectedDate) {
                      setCurrentRecord({
                        ...currentRecord,
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
                selectedValue={currentRecord.severity || "medium"}
                onValueChange={(value) =>
                  setCurrentRecord({
                    ...currentRecord,
                    severity: value as IssueSeverity,
                  })
                }
                label="Severity"
                placeholder="Severity"
              />

              <Text style={styles.label}>Affected Parts</Text>
              <View style={styles.affectedPartChips}>
                {[
                  "Leaf",
                  "Stem",
                  "Fruit",
                  "Root",
                  "Flower",
                  "Bark",
                  "Whole Plant",
                ].map((part) => {
                  const selectedParts = (currentRecord.affectedPart || "")
                    .split(",")
                    .map((p) => p.trim())
                    .filter(Boolean);
                  const isSelected = selectedParts.includes(part);
                  return (
                    <TouchableOpacity
                      key={part}
                      style={[
                        styles.affectedPartChip,
                        isSelected && styles.affectedPartChipActive,
                      ]}
                      onPress={() => {
                        const parts = (currentRecord.affectedPart || "")
                          .split(",")
                          .map((p) => p.trim())
                          .filter(Boolean);
                        const updated = isSelected
                          ? parts.filter((p) => p !== part)
                          : [...parts, part];
                        setCurrentRecord({
                          ...currentRecord,
                          affectedPart: updated.join(", "),
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles.affectedPartChipText,
                          isSelected && styles.affectedPartChipTextActive,
                        ]}
                      >
                        {part}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {(() => {
                const treatmentGroups =
                  currentRecord.name.trim() !== ""
                    ? getGroupedTreatments(currentRecord.name)
                    : [];
                const allTreatmentNames = treatmentGroups.flatMap((g) =>
                  g.items.map((i) => i.name),
                );
                const isCustom = customTreatmentMode ||
                  (currentRecord.treatment
                    ? !allTreatmentNames.includes(currentRecord.treatment)
                    : false);
                const showCustomInput =
                  isCustom || treatmentGroups.length === 0;

                return (
                  <>
                    {treatmentGroups.length > 0 && (
                      <>
                        <Text style={styles.label}>Recommended Treatments</Text>
                        <Text style={styles.helperText}>
                          🟢 Easy  🟡 Moderate  🔴 Advanced
                        </Text>
                        <View style={styles.treatmentGroupContainer}>
                          {treatmentGroups.map((group) => (
                            <View
                              key={group.method}
                              style={styles.treatmentGroup}
                            >
                              <Text style={styles.treatmentGroupLabel}>
                                {group.emoji} {group.label}
                              </Text>
                              <View style={styles.treatmentGroupChips}>
                                {group.items.map((item) => (
                                  <TouchableOpacity
                                    key={item.name}
                                    style={[
                                      styles.treatmentChip,
                                      currentRecord.treatment === item.name &&
                                        styles.treatmentChipActive,
                                    ]}
                                    onPress={() => {
                                      setCustomTreatmentMode(false);
                                      setCurrentRecord({
                                        ...currentRecord,
                                        treatment:
                                          currentRecord.treatment === item.name
                                            ? ""
                                            : item.name,
                                      });
                                    }}
                                  >
                                    <Text
                                      style={[
                                        styles.treatmentChipText,
                                        currentRecord.treatment === item.name &&
                                          styles.treatmentChipTextActive,
                                      ]}
                                    >
                                      {getTreatmentEffortDot(item.effort)} {item.name}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          ))}
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.treatmentChip,
                            isCustom && styles.treatmentChipActive,
                          ]}
                          onPress={() => {
                            setCustomTreatmentMode(true);
                            setCurrentRecord({
                              ...currentRecord,
                              treatment: "",
                            });
                          }}
                        >
                          <Text
                            style={[
                              styles.treatmentChipText,
                              showCustomInput && styles.treatmentChipTextActive,
                            ]}
                          >
                            ✏️ Custom treatment...
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {showCustomInput && (
                      <>
                        <FloatingLabelInput
                          label="Custom Treatment"
                          value={currentRecord.treatment || ""}
                          onChangeText={(text) =>
                            setCurrentRecord({
                              ...currentRecord,
                              treatment: sanitizeAlphaNumericSpaces(text),
                            })
                          }
                          maxLength={500}
                        />
                        <Text style={styles.charCounter}>
                          {(currentRecord.treatment || "").length}/500
                        </Text>
                      </>
                    )}
                  </>
                );
              })()}

              {/* Treatment Effectiveness */}
              {currentRecord.treatment &&
                currentRecord.treatment.trim() !== "" && (
                  <>
                    <Text style={styles.label}>Treatment Effectiveness</Text>
                    <View style={styles.affectedPartChips}>
                      {(
                        [
                          {
                            value: "effective",
                            label: "✅ Effective",
                            color: "#4CAF50",
                          },
                          {
                            value: "partially_effective",
                            label: "⚠️ Partially",
                            color: "#FF9800",
                          },
                          {
                            value: "ineffective",
                            label: "❌ Ineffective",
                            color: "#f44336",
                          },
                        ] as const
                      ).map((opt) => {
                        const isSelected =
                          currentRecord.treatmentEffectiveness === opt.value;
                        return (
                          <TouchableOpacity
                            key={opt.value}
                            style={[
                              styles.affectedPartChip,
                              isSelected && {
                                backgroundColor: opt.color,
                                borderColor: opt.color,
                              },
                            ]}
                            onPress={() =>
                              setCurrentRecord({
                                ...currentRecord,
                                treatmentEffectiveness: isSelected
                                  ? undefined
                                  : opt.value,
                              })
                            }
                          >
                            <Text
                              style={[
                                styles.affectedPartChipText,
                                isSelected &&
                                  styles.affectedPartChipTextActive,
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

              <FloatingLabelInput
                label="Notes"
                value={currentRecord.notes || ""}
                onChangeText={(text) =>
                  setCurrentRecord({
                    ...currentRecord,
                    notes: sanitizeAlphaNumericSpaces(text),
                  })
                }
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              <Text style={styles.charCounter}>
                {(currentRecord.notes || "").length}/500
              </Text>

              {/* Photo attachment */}
              <Text style={styles.label}>Photo</Text>
              <TouchableOpacity
                style={styles.pestPhotoButton}
                onPress={() => setShowPhotoSource(true)}
              >
                {pestPhotoUri ? (
                  <View style={styles.pestPhotoPreviewWrap}>
                    <Image
                      source={{ uri: pestPhotoUri }}
                      style={styles.pestPhotoPreview}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                    <TouchableOpacity
                      style={styles.pestPhotoRemoveBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        setPestPhotoUri(null);
                      }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={22}
                        color="#f44336"
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.pestPhotoPlaceholder}>
                    <Ionicons name="camera" size={24} color="#999" />
                    <Text style={styles.pestPhotoPlaceholderText}>
                      Add Photo
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.settingToggle,
                  currentRecord.resolved && styles.settingToggleActive,
                ]}
                onPress={() =>
                  setCurrentRecord({
                    ...currentRecord,
                    resolved: !currentRecord.resolved,
                    resolvedAt: !currentRecord.resolved
                      ? toLocalDateString(new Date())
                      : undefined,
                  })
                }
                activeOpacity={0.85}
                accessibilityRole="switch"
                accessibilityState={{ checked: currentRecord.resolved }}
              >
                <View style={styles.settingToggleLeft}>
                  <View
                    style={[
                      styles.settingToggleIconWrap,
                      currentRecord.resolved &&
                        styles.settingToggleIconWrapActive,
                    ]}
                  >
                    <Ionicons
                      name={
                        currentRecord.resolved
                          ? "checkmark-done-circle"
                          : "time-outline"
                      }
                      size={18}
                      color={
                        currentRecord.resolved
                          ? theme.primary
                          : theme.textSecondary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.settingToggleLabel,
                      currentRecord.resolved &&
                        styles.settingToggleLabelActive,
                    ]}
                  >
                    Resolved
                  </Text>
                </View>
                <View
                  style={[
                    styles.settingSwitchTrack,
                    currentRecord.resolved && styles.settingSwitchTrackActive,
                  ]}
                >
                  <View
                    style={[
                      styles.settingSwitchThumb,
                      currentRecord.resolved &&
                        styles.settingSwitchThumbActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSave}
              >
                <Text style={styles.modalSaveButtonText}>
                  {editingIndex !== null ? "Update Record" : "Add Record"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <PhotoSourceModal
        visible={showPhotoSource}
        onClose={() => setShowPhotoSource(false)}
        onCamera={openCamera}
        onLibrary={openLibrary}
      />
    </>
  );
}
