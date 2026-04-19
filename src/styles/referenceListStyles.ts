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
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: theme.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      marginRight: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
      flex: 1,
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.background,
    },
    searchInput: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.border,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: 16,
      paddingBottom: 8,
      gap: 4,
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    card: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    cardEmoji: {
      fontSize: 24,
      width: 36,
      textAlign: "center",
    },
    cardContent: {
      flex: 1,
      minWidth: 0,
    },
    cardName: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },
    cardCategory: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 48,
    },
    emptyText: {
      fontSize: 15,
      color: theme.textSecondary,
      marginTop: 12,
    },
  });
