import { StyleSheet } from "react-native";

export const createStyles = (theme: any) =>
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
