import { StyleSheet } from "react-native";
import type { Theme } from "../theme/colors";

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.card,
      borderRadius: 12,
      marginBottom: 16,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
    },
    containerComplete: {
      borderLeftWidth: 3,
      borderLeftColor: "#4caf50",
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
    // --- #5 Section Status Indicators ---
    statusCompleteBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#4caf50",
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginLeft: 8,
    },
    statusRequired: {
      flexDirection: "row" as const,
      alignItems: "center",
      gap: 4,
      marginLeft: 8,
      backgroundColor: "#ffebee",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    statusRequiredDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: "#FF6B6B",
    },
    statusRequiredText: {
      fontSize: 11,
      color: "#FF6B6B",
      fontWeight: "700" as const,
    },
    statusOptionalBadge: {
      marginLeft: 8,
      backgroundColor: theme.background,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    statusOptionalText: {
      fontSize: 11,
      color: theme.textTertiary,
      fontWeight: "600" as const,
    },
  });
