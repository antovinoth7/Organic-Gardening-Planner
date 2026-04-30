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
  (globalThis as { nativeFabricUIManager?: unknown }).nativeFabricUIManager !=
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
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  children: React.ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  hasError?: boolean;
  autoFilled?: boolean;
  summary?: string;
  headerAction?: React.ReactNode;
  sectionStatus?: "required_incomplete" | "complete" | "optional";
}

export default function CollapsibleSection({
  title,
  icon,
  children,
  defaultExpanded = true,
  expanded,
  onExpandedChange,
  hasError = false,
  autoFilled = false,
  summary,
  headerAction,
  sectionStatus,
}: CollapsibleSectionProps): React.JSX.Element {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const isControlled = typeof expanded === "boolean";
  const isExpanded = isControlled ? !!expanded : internalExpanded;

  const toggleExpanded = (): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !isExpanded;
    if (!isControlled) {
      setInternalExpanded(next);
    }
    onExpandedChange?.(next);
  };

  return (
    <View
      style={styles.container}
    >
      <View style={[styles.header, hasError && styles.headerError]}>
        <TouchableOpacity
          style={styles.headerMain}
          onPress={toggleExpanded}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            {icon && (
              <Ionicons
                name={icon}
                size={20}
                color={hasError ? "#FF6B6B" : theme.primary}
                style={styles.headerIcon}
              />
            )}
            <View style={styles.headerTextBlock}>
              <View style={styles.headerTitleRow}>
                <Text
                  style={[styles.headerTitle, hasError && styles.headerTitleError]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
                {autoFilled && (
                  <View style={styles.autoFilledBadge}>
                    <Text style={styles.autoFilledText}>✨ Auto</Text>
                  </View>
                )}
                {!hasError && sectionStatus === "complete" && (
                  <View style={styles.statusCompleteBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#fff" />
                  </View>
                )}
                {!hasError && sectionStatus === "optional" && (
                  <View style={styles.statusOptionalBadge}>
                    <Text style={styles.statusOptionalText}>Optional</Text>
                  </View>
                )}
                {!hasError && sectionStatus === "required_incomplete" && (
                  <View style={styles.statusRequired}>
                    <View style={styles.statusRequiredDot} />
                    <Text style={styles.statusRequiredText}>Required</Text>
                  </View>
                )}
                {hasError && <View style={styles.errorDot} />}
              </View>
              {!isExpanded && summary ? (
                <Text style={styles.headerSummary} numberOfLines={2}>
                  {summary}
                </Text>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.headerRight}>
          {headerAction ? <View style={styles.headerActionSlot}>{headerAction}</View> : null}
          <TouchableOpacity
            style={styles.chevronButton}
            onPress={toggleExpanded}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={isExpanded ? `Collapse ${title}` : `Expand ${title}`}
          >
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {isExpanded && <View style={styles.content}>{children}</View>}
    </View>
  );
}
