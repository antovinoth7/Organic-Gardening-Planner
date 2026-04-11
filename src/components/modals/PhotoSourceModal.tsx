import React from "react";
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme";
import { createStyles } from "../../styles/photoSourceModalStyles";

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
}: PhotoSourceModalProps): React.JSX.Element {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const handleAction = (action: () => void): void => {
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
        <View style={styles.sheet}>
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
