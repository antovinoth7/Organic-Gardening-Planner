import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import type { Theme } from "../theme/colors";

interface DiscardChangesModalProps {
  visible: boolean;
  styles: StyleSheet.NamedStyles<Record<string, unknown>>;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

export default function DiscardChangesModal({
  visible,
  styles,
  onKeepEditing,
  onDiscard,
}: DiscardChangesModalProps): React.JSX.Element {
  const theme = useTheme() as Theme;
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
              <Ionicons name="trash-outline" size={18} color={theme.textInverse} />
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
