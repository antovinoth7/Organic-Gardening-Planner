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
      marginRight: 12,
    },
    headerContent: {
      flex: 1,
    },
    headerEmoji: {
      fontSize: 28,
      marginRight: 10,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.text,
    },
    subtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    heroImage: {
      width: "100%",
      height: 220,
      borderRadius: 12,
      marginBottom: 16,
      backgroundColor: theme.backgroundSecondary,
    },
    emojiFallback: {
      width: "100%",
      height: 140,
      borderRadius: 12,
      marginBottom: 16,
      backgroundColor: theme.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    emojiFallbackText: {
      fontSize: 64,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 8,
    },
    bodyText: {
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 22,
    },
    bulletItem: {
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 24,
      paddingLeft: 8,
    },
    treatmentCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    treatmentName: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },
    treatmentMeta: {
      flexDirection: "row",
      gap: 8,
      marginTop: 4,
    },
    treatmentDetailDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginTop: 10,
      marginBottom: 6,
    },
    treatmentDetailRow: {
      marginTop: 4,
    },
    treatmentDetailLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    treatmentDetailValue: {
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 19,
      marginTop: 1,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: theme.primaryLight,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.primary,
      textTransform: "capitalize",
    },
    riskRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    riskSeason: {
      fontSize: 14,
      color: theme.text,
      fontWeight: "500",
      textTransform: "capitalize",
    },
    riskBadge: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 6,
    },
    riskBadgeText: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "capitalize",
    },
    plantTag: {
      backgroundColor: theme.backgroundSecondary,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 8,
      marginBottom: 8,
    },
    plantTagText: {
      fontSize: 13,
      color: theme.text,
      fontWeight: "500",
    },
    plantTagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
  });
