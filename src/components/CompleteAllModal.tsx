import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TaskTemplate } from "../types/database.types";
import { TASK_EMOJIS, TASK_COLORS } from "../utils/taskConstants";

interface CompleteAllModalProps {
  visible: boolean;
  tasks: TaskTemplate[];
  isCompleting: boolean;
  completedCount: number;
  styles: any;
  getPlantName: (plantId: string | null) => string;
  onCancel: () => void;
  onConfirm: (selectedTasks: TaskTemplate[]) => void;
}

export default function CompleteAllModal({
  visible,
  tasks,
  isCompleting,
  completedCount,
  styles,
  getPlantName,
  onCancel,
  onConfirm,
}: CompleteAllModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset selection when modal opens with new tasks
  useEffect(() => {
    if (visible) {
      setSelectedIds(new Set(tasks.map((t) => t.id)));
    }
  }, [visible, tasks]);

  const toggleTask = (taskId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === tasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(tasks.map((t) => t.id)));
    }
  };

  const selectedCount = selectedIds.size;
  const selectedTasks = tasks.filter((t) => selectedIds.has(t.id));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {
        if (!isCompleting) onCancel();
      }}
    >
      <View style={styles.completeAllOverlay}>
        <View style={styles.completeAllCard}>
          <View style={styles.completeAllIconRow}>
            <View style={styles.completeAllIconCircle}>
              <Ionicons
                name={isCompleting ? "hourglass" : "checkmark-done"}
                size={28}
                color="#fff"
              />
            </View>
          </View>

          <Text style={styles.completeAllTitle}>
            {isCompleting
              ? `Completing... ${completedCount}/${selectedCount}`
              : `Complete tasks`}
          </Text>

          {isCompleting && (
            <View style={styles.progressBarOuter}>
              <View
                style={[
                  styles.progressBarInner,
                  {
                    width: `${selectedCount > 0 ? (completedCount / selectedCount) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          )}

          {!isCompleting && (
            <>
              {/* Select All toggle */}
              <TouchableOpacity
                style={styles.caSelectAllRow}
                onPress={toggleAll}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    selectedCount === tasks.length
                      ? "checkbox"
                      : "square-outline"
                  }
                  size={20}
                  color={styles.caSelectAllText?.color}
                />
                <Text style={styles.caSelectAllText}>
                  {selectedCount === tasks.length
                    ? "Deselect All"
                    : "Select All"}
                </Text>
              </TouchableOpacity>

              {/* Task checklist */}
              <ScrollView
                style={styles.caTaskList}
                bounces={false}
                showsVerticalScrollIndicator={false}
              >
                {tasks.map((task) => {
                  const isSelected = selectedIds.has(task.id);
                  return (
                    <TouchableOpacity
                      key={task.id}
                      style={[
                        styles.caTaskRow,
                        !isSelected && styles.caTaskRowDeselected,
                      ]}
                      onPress={() => toggleTask(task.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={isSelected ? "checkbox" : "square-outline"}
                        size={20}
                        color={
                          isSelected
                            ? TASK_COLORS[task.task_type]
                            : styles.caCheckboxMuted?.color || "#999"
                        }
                      />
                      <Text style={styles.caTaskEmoji}>
                        {TASK_EMOJIS[task.task_type]}
                      </Text>
                      <View style={styles.caTaskInfo}>
                        <Text
                          style={[
                            styles.caTaskName,
                            !isSelected && styles.caTaskNameDeselected,
                          ]}
                          numberOfLines={1}
                        >
                          {getPlantName(task.plant_id)}
                        </Text>
                        <Text style={styles.caTaskType}>
                          {task.task_type}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.completeAllActions}>
                <TouchableOpacity
                  style={styles.completeAllCancelBtn}
                  onPress={onCancel}
                >
                  <Text style={styles.completeAllCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.completeAllConfirmBtn,
                    selectedCount === 0 && styles.completeAllBtnDisabled,
                  ]}
                  onPress={() => {
                    if (selectedCount > 0) onConfirm(selectedTasks);
                  }}
                  disabled={selectedCount === 0}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark-done" size={18} color="#fff" />
                  <Text style={styles.completeAllConfirmText}>
                    {selectedCount === tasks.length
                      ? "Complete All"
                      : `Complete ${selectedCount}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
