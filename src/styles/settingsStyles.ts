import { StyleSheet } from "react-native";
import type { Theme } from "../theme/colors";

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: theme.tabBarBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    headerSpacer: {
      width: 36,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    sectionDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 12,
      lineHeight: 20,
    },
    card: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    rowContent: {
      marginLeft: 16,
    },
    rowTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
    },
    rowSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 2,
    },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
    },
    infoText: {
      fontSize: 14,
      color: theme.text,
      marginLeft: 12,
      flex: 1,
    },
    backupButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 14,
      borderRadius: 10,
      marginTop: 12,
    },
    exportButton: {
      backgroundColor: theme.primary,
    },
    importButton: {
      backgroundColor: theme.background,
      borderWidth: 2,
      borderColor: theme.primary,
    },
    backupButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.textInverse,
      marginLeft: 8,
    },
    backupNote: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 12,
      fontStyle: "italic",
      lineHeight: 18,
    },
    helpText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 8,
      marginLeft: 32,
      lineHeight: 18,
    },
    backupButtonTextSuccess: {
      color: theme.primary,
    },
  });
