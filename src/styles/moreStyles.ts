import { StyleSheet } from "react-native";
import type { Theme } from "../theme/colors";

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      padding: 24,
      paddingTop: 12,
      backgroundColor: theme.primary,
    },
    accountHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    accountIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    accountText: {
      flex: 1,
    },
    accountLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: "rgba(255,255,255,0.7)",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 2,
    },
    accountEmail: {
      fontSize: 18,
      fontWeight: "700",
      color: "#fff",
    },
    content: {
      padding: 16,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 12,
    },
    menuIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.primaryLight,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    menuText: {
      flex: 1,
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    signOutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.backgroundSecondary,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      marginTop: 16,
    },
    signOutText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.error,
      marginLeft: 8,
    },
  });
