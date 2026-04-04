import { Dimensions, Platform, StyleSheet } from "react-native";
import type { Theme } from "../theme/colors";

function getScreenHeight() {
  return Dimensions.get("window").height;
}

export const createStyles = (theme: Theme, compact: boolean) =>
  StyleSheet.create({
    // Option A: iOS Settings row — label left, value right
    trigger: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.pickerBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.pickerBorder,
      paddingHorizontal: 16,
      minHeight: compact ? 40 : 44,
      marginBottom: compact ? 8 : 10,
    },
    triggerDisabled: {
      opacity: 0.45,
    },
    // Left-side label (always visible)
    triggerLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: theme.textTertiary,
      flex: 1,
      marginRight: 8,
    },
    triggerLabelDisabled: {
      color: theme.textTertiary,
    },
    // Right-side selected value
    triggerText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      textAlign: "right" as const,
      flexShrink: 1,
      maxWidth: "58%",
      marginRight: 6,
    },
    triggerPlaceholder: {
      color: theme.inputPlaceholder,
      fontWeight: "400",
    },
    triggerTextDisabled: {
      color: theme.textTertiary,
    },
    // Kept for backward compat — no longer used visually
    triggerWithLabel: {},
    floatingLabel: {
      position: "absolute" as const,
      top: -9,
      left: 12,
      paddingHorizontal: 4,
      fontSize: 12,
      fontWeight: "500",
      color: theme.textSecondary,
      backgroundColor: theme.pickerBackground,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.overlay,
    },
    sheet: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 8,
      maxHeight: getScreenHeight() * 0.7,
      // Shadow for the sheet
      ...Platform.select({
        ios: {
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
        },
        android: {
          elevation: 16,
        },
      }),
    },
    sheetCloseRow: {
      width: "100%",
      alignItems: "center" as const,
      paddingTop: 10,
      paddingBottom: 4,
    },
    sheetCloseRowPressed: {
      backgroundColor: theme.borderLight,
    },
    sheetHandleArea: {
      alignSelf: "center",
      paddingTop: 12,
      paddingBottom: 8,
      paddingHorizontal: 40,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
      marginBottom: 4,
    },
    sheetTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.pickerBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.pickerBorder,
      marginHorizontal: 12,
      marginBottom: 8,
      paddingHorizontal: 12,
      minHeight: 42,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: theme.text,
      paddingVertical: Platform.OS === "ios" ? 10 : 8,
    },
    emptyText: {
      fontSize: 14,
      color: theme.textTertiary,
      textAlign: "center",
      paddingVertical: 24,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 10,
      marginHorizontal: 4,
      minHeight: 52,
    },
    optionRowSelected: {
      backgroundColor: theme.primaryLight,
    },
    optionRowPressed: {
      backgroundColor: theme.primaryLight,
      opacity: 0.75,
    },
    optionText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "400",
      color: theme.text,
      letterSpacing: 0.15,
      marginRight: 8,
    },
    optionTextSelected: {
      fontWeight: "600",
      color: theme.primary,
    },
  });
