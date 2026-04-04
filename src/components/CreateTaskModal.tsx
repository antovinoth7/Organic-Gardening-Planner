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
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import ThemedDropdown from "./ThemedDropdown";
import FloatingLabelInput from "./FloatingLabelInput";
import type { DropdownItem } from "./ThemedDropdown";
import { createTaskTemplate } from "../services/tasks";
import { Plant, TaskType } from "../types/database.types";
import { getErrorMessage } from "../utils/errorLogging";
import { createStyles } from "../styles/calendarStyles";

const TASK_TYPE_ITEMS: DropdownItem[] = [
  { label: "💧 Water", value: "water" },
  { label: "🌱 Fertilize", value: "fertilise" },
  { label: "✂️ Prune", value: "prune" },
  { label: "🪴 Repot", value: "repot" },
  { label: "🧴 Spray (Pesticide/Neem)", value: "spray" },
  { label: "🍂 Mulch", value: "mulch" },
];

interface CreateTaskModalProps {
  visible: boolean;
  plants: Plant[];
  styles: ReturnType<typeof createStyles>;
  bottomInset: number;
  initialStartDate?: Date;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateTaskModal({
  visible,
  plants,
  styles,
  bottomInset,
  initialStartDate,
  onClose,
  onCreated,
}: CreateTaskModalProps) {
  const [taskType, setTaskType] = useState<TaskType>("water");
  const [selectedPlant, setSelectedPlant] = useState("");
  const [frequencyDays, setFrequencyDays] = useState("7");
  const [isOneTimeTask, setIsOneTimeTask] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [preferredTime, setPreferredTime] = useState<
    "morning" | "afternoon" | "evening" | null
  >(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && initialStartDate) {
      setStartDate(initialStartDate);
    }
  }, [visible, initialStartDate]);

  const resetForm = () => {
    setTaskType("water");
    setSelectedPlant("");
    setFrequencyDays("7");
    setIsOneTimeTask(false);
    setStartDate(new Date());
    setPreferredTime(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const applyFrequencyPreset = (days: number) => {
    setFrequencyDays(days.toString());
  };

  const handleCreateTask = async () => {
    if (!isOneTimeTask) {
      const frequency = parseInt(frequencyDays);
      if (isNaN(frequency) || frequency < 1) {
        Alert.alert("Error", "Please enter a valid frequency (1 or more days)");
        return;
      }
    }

    setLoading(true);
    try {
      const dueDate = new Date(startDate);

      if (preferredTime === "morning") {
        dueDate.setHours(8, 0, 0, 0);
      } else if (preferredTime === "afternoon") {
        dueDate.setHours(14, 0, 0, 0);
      } else if (preferredTime === "evening") {
        dueDate.setHours(18, 0, 0, 0);
      }

      const now = new Date();
      if (dueDate < now) {
        dueDate.setDate(dueDate.getDate() + 1);
      }

      await createTaskTemplate({
        task_type: taskType,
        plant_id: selectedPlant || null,
        frequency_days: isOneTimeTask ? 0 : parseInt(frequencyDays),
        next_due_at: dueDate.toISOString(),
        enabled: true,
        preferred_time: preferredTime,
      });
      Alert.alert("Success", "Task created successfully!");
      resetForm();
      onCreated();
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Task</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              paddingBottom: Math.max(bottomInset, 12),
            }}
          >
            <View style={styles.modalBody}>
              <ThemedDropdown
                items={TASK_TYPE_ITEMS}
                selectedValue={taskType}
                onValueChange={(v) => setTaskType(v as TaskType)}
                label="Task Type *"
                placeholder="Task Type"
              />

              <ThemedDropdown
                items={[
                  { label: "General Task", value: "" },
                  ...plants.map((p) => ({ label: p.name, value: p.id })),
                ]}
                selectedValue={selectedPlant}
                onValueChange={setSelectedPlant}
                label="Plant (Optional)"
                placeholder="Plant"
                searchable
              />

              <Text style={styles.label}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  {startDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === "ios");
                    if (selectedDate) setStartDate(selectedDate);
                  }}
                />
              )}

              <Text style={styles.label}>Preferred Time (Optional)</Text>
              <View style={styles.timeButtons}>
                <TouchableOpacity
                  style={[
                    styles.timeButton,
                    preferredTime === "morning" && styles.timeButtonActive,
                  ]}
                  onPress={() =>
                    setPreferredTime(
                      preferredTime === "morning" ? null : "morning",
                    )
                  }
                >
                  <Text
                    style={[
                      styles.timeButtonText,
                      preferredTime === "morning" &&
                        styles.timeButtonTextActive,
                    ]}
                  >
                    🌅 Morning
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.timeButton,
                    preferredTime === "afternoon" && styles.timeButtonActive,
                  ]}
                  onPress={() =>
                    setPreferredTime(
                      preferredTime === "afternoon" ? null : "afternoon",
                    )
                  }
                >
                  <Text
                    style={[
                      styles.timeButtonText,
                      preferredTime === "afternoon" &&
                        styles.timeButtonTextActive,
                    ]}
                  >
                    ☀️ Afternoon
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.timeButton,
                    preferredTime === "evening" && styles.timeButtonActive,
                  ]}
                  onPress={() =>
                    setPreferredTime(
                      preferredTime === "evening" ? null : "evening",
                    )
                  }
                >
                  <Text
                    style={[
                      styles.timeButtonText,
                      preferredTime === "evening" &&
                        styles.timeButtonTextActive,
                    ]}
                  >
                    🌙 Evening
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Schedule</Text>
              <View style={styles.taskTypeToggle}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    !isOneTimeTask && styles.toggleButtonActive,
                  ]}
                  onPress={() => setIsOneTimeTask(false)}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      !isOneTimeTask && styles.toggleButtonTextActive,
                    ]}
                  >
                    🔄 Repeating
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    isOneTimeTask && styles.toggleButtonActive,
                  ]}
                  onPress={() => setIsOneTimeTask(true)}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      isOneTimeTask && styles.toggleButtonTextActive,
                    ]}
                  >
                    ✓ One-Time
                  </Text>
                </TouchableOpacity>
              </View>

              {!isOneTimeTask && (
                <>
                  <Text style={styles.label}>Repeat Every (days) *</Text>

                  <View style={styles.presets}>
                    <TouchableOpacity
                      style={[
                        styles.presetButton,
                        frequencyDays === "1" && styles.presetButtonActive,
                      ]}
                      onPress={() => applyFrequencyPreset(1)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.presetText,
                          frequencyDays === "1" && styles.presetTextActive,
                        ]}
                      >
                        Daily
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.presetButton,
                        frequencyDays === "7" && styles.presetButtonActive,
                      ]}
                      onPress={() => applyFrequencyPreset(7)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.presetText,
                          frequencyDays === "7" && styles.presetTextActive,
                        ]}
                      >
                        Weekly
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.presetButton,
                        frequencyDays === "14" && styles.presetButtonActive,
                      ]}
                      onPress={() => applyFrequencyPreset(14)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.presetText,
                          frequencyDays === "14" && styles.presetTextActive,
                        ]}
                      >
                        Bi-weekly
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.presetButton,
                        frequencyDays === "30" && styles.presetButtonActive,
                      ]}
                      onPress={() => applyFrequencyPreset(30)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.presetText,
                          frequencyDays === "30" && styles.presetTextActive,
                        ]}
                      >
                        Monthly
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <FloatingLabelInput
                    label="Frequency (days)"
                    value={frequencyDays}
                    onChangeText={setFrequencyDays}
                    keyboardType="numeric"
                  />

                  {frequencyDays && parseInt(frequencyDays) > 0 && (
                    <View style={styles.preview}>
                      <Text style={styles.previewTitle}>
                        📅 Schedule Preview
                      </Text>
                      <Text style={styles.previewText}>
                        • First task:{" "}
                        {startDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        {preferredTime && ` (${preferredTime})`}
                      </Text>
                      <Text style={styles.previewText}>
                        • Next task:{" "}
                        {new Date(
                          startDate.getTime() +
                            parseInt(frequencyDays) * 24 * 60 * 60 * 1000,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                      <Text style={styles.previewText}>
                        • Repeats every {frequencyDays}{" "}
                        {parseInt(frequencyDays) === 1 ? "day" : "days"}
                      </Text>
                    </View>
                  )}
                </>
              )}

              {isOneTimeTask && (
                <View style={styles.preview}>
                  <Text style={styles.previewTitle}>📅 One-Time Task</Text>
                  <Text style={styles.previewText}>
                    • Due:{" "}
                    {startDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    {preferredTime && ` (${preferredTime})`}
                  </Text>
                  <Text style={styles.previewText}>
                    • Will not repeat after completion
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.createButton,
                  loading && styles.createButtonDisabled,
                ]}
                onPress={handleCreateTask}
                disabled={loading}
              >
                <Text style={styles.createButtonText}>
                  {loading ? "Creating..." : "Create Task"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
