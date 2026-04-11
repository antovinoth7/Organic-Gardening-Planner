import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FloatingLabelInput from "./FloatingLabelInput";
import { TaskTemplate } from "../types/database.types";
import { createStyles } from "../styles/calendarStyles";

interface TaskCompletionModalProps {
  visible: boolean;
  task: TaskTemplate | null;
  taskNotes: string;
  productUsed: string;
  isCompleting: boolean;
  plantName: string;
  styles: ReturnType<typeof createStyles>;
  bottomInset: number;
  onChangeNotes: (text: string) => void;
  onChangeProduct: (text: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export default function TaskCompletionModal({
  visible,
  task,
  taskNotes,
  productUsed,
  isCompleting,
  plantName,
  styles,
  bottomInset,
  onChangeNotes,
  onChangeProduct,
  onClose,
  onConfirm,
}: TaskCompletionModalProps): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete Task</Text>
            <TouchableOpacity onPress={onClose} disabled={isCompleting}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: Math.max(bottomInset, 12),
            }}
          >
            <View style={styles.modalBody}>
              {task && (
                <View style={styles.selectedTaskInfo}>
                  <Text style={styles.selectedTaskTitle}>
                    {task.task_type.charAt(0).toUpperCase() +
                      task.task_type.slice(1)}
                  </Text>
                  <Text style={styles.selectedTaskPlant}>{plantName}</Text>
                </View>
              )}

              <FloatingLabelInput
                label="Notes (Optional)"
                value={taskNotes}
                onChangeText={onChangeNotes}
                multiline
                numberOfLines={3}
              />

              <FloatingLabelInput
                label="Product Used (Optional)"
                value={productUsed}
                onChangeText={onChangeProduct}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.skipButton,
                    isCompleting && styles.actionButtonDisabled,
                  ]}
                  onPress={onConfirm}
                  disabled={isCompleting}
                  activeOpacity={isCompleting ? 1 : 0.7}
                >
                  <Text style={styles.skipButtonText}>
                    {isCompleting ? "Completing..." : "Complete"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
