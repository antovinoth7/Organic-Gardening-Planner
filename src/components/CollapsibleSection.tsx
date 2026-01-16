import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";

// Enable LayoutAnimation on Android (suppress warning for New Architecture)
if (Platform.OS === "android") {
  try {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  } catch (e) {
    // Silently ignore - not needed in New Architecture
  }
}

interface CollapsibleSectionProps {
  title: string;
  icon?: string;
  fieldCount?: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  hasError?: boolean;
  autoFilled?: boolean;
}

export default function CollapsibleSection({
  title,
  icon,
  fieldCount,
  children,
  defaultExpanded = true,
  hasError = false,
  autoFilled = false,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const theme = useTheme();
  const styles = createStyles(theme);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.header, hasError && styles.headerError]}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          {icon && (
            <Ionicons
              name={icon as any}
              size={20}
              color={hasError ? "#FF6B6B" : theme.primary}
              style={styles.headerIcon}
            />
          )}
          <Text
            style={[styles.headerTitle, hasError && styles.headerTitleError]}
          >
            {title}
          </Text>
          {fieldCount !== undefined && (
            <Text style={styles.fieldCount}>({fieldCount})</Text>
          )}
          {autoFilled && (
            <View style={styles.autoFilledBadge}>
              <Text style={styles.autoFilledText}>✨ Auto</Text>
            </View>
          )}
          {hasError && <View style={styles.errorDot} />}
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.textSecondary}
        />
      </TouchableOpacity>

      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.card,
      borderRadius: 12,
      marginBottom: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      backgroundColor: theme.card,
    },
    headerError: {
      backgroundColor: "#FFF5F5",
      borderLeftWidth: 4,
      borderLeftColor: "#FF6B6B",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    headerIcon: {
      marginRight: 8,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    headerTitleError: {
      color: "#FF6B6B",
    },
    fieldCount: {
      fontSize: 14,
      color: theme.textSecondary,
      marginLeft: 6,
    },
    autoFilledBadge: {
      backgroundColor: "#E8F5E9",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 8,
    },
    autoFilledText: {
      fontSize: 11,
      color: "#2E7D32",
      fontWeight: "600",
    },
    errorDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#FF6B6B",
      marginLeft: 8,
    },
    content: {
      padding: 16,
      paddingTop: 0,
    },
  });
