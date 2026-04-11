import { StyleSheet } from "react-native";
import type { Theme } from "../theme/colors";

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      overflow: "hidden",
      position: "relative",
    },
    overdueCard: {
      backgroundColor: theme.errorLight,
      borderWidth: 2,
      borderColor: theme.error,
    },
    overdueBorder: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: theme.error,
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    content: {
      flex: 1,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    taskType: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 1,
    },
    priorityText: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.4,
    },
    plantName: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 2,
    },
    time: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 2,
    },
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonDisabled: {
      opacity: 0.5,
    },
  });
