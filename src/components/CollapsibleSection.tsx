import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { createStyles } from "../styles/collapsibleSectionStyles";

// Enable LayoutAnimation on Android only for the old architecture.
const isNewArchitectureEnabled =
  (global as { nativeFabricUIManager?: unknown }).nativeFabricUIManager !=
  null;

if (Platform.OS === "android" && !isNewArchitectureEnabled) {
  try {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  } catch {
    // Silently ignore if unavailable.
  }
}

interface CollapsibleSectionProps {
  title: string;
  icon?: string;
  fieldCount?: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  hasError?: boolean;
  autoFilled?: boolean;
}

export default function CollapsibleSection({
  title,
  icon,
  fieldCount,
  children,
  defaultExpanded = true,
  expanded,
  onExpandedChange,
  hasError = false,
  autoFilled = false,
}: CollapsibleSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const theme = useTheme();
  const styles = createStyles(theme);
  const isControlled = typeof expanded === "boolean";
  const isExpanded = isControlled ? !!expanded : internalExpanded;

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !isExpanded;
    if (!isControlled) {
      setInternalExpanded(next);
    }
    onExpandedChange?.(next);
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
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.textSecondary}
        />
      </TouchableOpacity>

      {isExpanded && <View style={styles.content}>{children}</View>}
    </View>
  );
}
