import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface DiscardChangesModalProps {
  visible: boolean;
  theme: any;
  styles: any;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

export default function DiscardChangesModal({
  visible,
  theme,
  styles,
  onKeepEditing,
  onDiscard,
}: DiscardChangesModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onKeepEditing}
    >
      <View style={styles.discardOverlay}>
        <View style={styles.discardCard}>
          <View style={styles.discardIconWrap}>
            <Ionicons name="alert-circle" size={36} color={theme.error} />
          </View>
          <Text style={styles.discardTitle}>Discard Changes?</Text>
          <Text style={styles.discardMessage}>
            You have unsaved changes. Are you sure you want to leave without
            saving?
          </Text>
          <View style={styles.discardActions}>
            <TouchableOpacity
              style={styles.discardKeepButton}
              onPress={onKeepEditing}
              activeOpacity={0.7}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={theme.primary}
              />
              <Text style={styles.discardKeepText}>Keep Editing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.discardButton}
              onPress={onDiscard}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
