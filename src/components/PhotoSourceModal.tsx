import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";

type PhotoSourceModalProps = {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onLibrary: () => void;
  title?: string;
  subtitle?: string;
};

export default function PhotoSourceModal({
  visible,
  onClose,
  onCamera,
  onLibrary,
  title = "Add photo",
  subtitle = "Choose a source",
}: PhotoSourceModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);

  const handleAction = (action: () => void) => {
    onClose();
    setTimeout(action, 150);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { marginTop: 16 + insets.top }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionPrimary]}
              onPress={() => handleAction(onLibrary)}
            >
              <View style={styles.iconWrap}>
                <Ionicons
                  name="images-outline"
                  size={18}
                  color={theme.primary}
                />
              </View>
              <Text style={styles.actionText}>Library</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleAction(onCamera)}
            >
              <View style={styles.iconWrap}>
                <Ionicons
                  name="camera-outline"
                  size={18}
                  color={theme.primary}
                />
              </View>
              <Text style={styles.actionText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: "flex-start",
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.overlay,
    },
    sheet: {
      marginHorizontal: 16,
      marginTop: 16,
      padding: 16,
      borderRadius: 18,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 10,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
    },
    subtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    actions: {
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    actionPrimary: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primaryLight,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    actionText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.text,
    },
  });
