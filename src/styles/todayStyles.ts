import { StyleSheet } from "react-native";
import type { Theme } from "../theme/colors";

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    heroHeader: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
      backgroundColor: theme.primary,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    heroGreeting: {
      fontSize: 28,
      fontWeight: "bold",
      color: theme.textInverse,
    },
    heroDate: {
      fontSize: 14,
      color: theme.textInverse + "CC",
      marginTop: 4,
    },
    heroThemeToggle: {
      alignItems: "center",
      justifyContent: "center",
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.textInverse + "33",
    },
    // Task Donut Card
    donutCard: {
      backgroundColor: theme.backgroundSecondary,
      paddingHorizontal: 12,
      paddingVertical: 16,
      marginTop: 1,
    },
    donutRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    donutWrap: {
      alignItems: "center",
      width: 140,
    },
    donutContainer: {
      width: 140,
      height: 140,
      alignItems: "center",
      justifyContent: "center",
    },
    donutCenter: {
      position: "absolute",
      alignItems: "center",
    },
    donutPercent: {
      fontSize: 26,
      fontWeight: "bold",
      color: theme.text,
    },
    donutSubtext: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 1,
    },
    donutOverdueBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
      backgroundColor: theme.error,
      marginTop: 6,
    },
    donutOverdueBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.textInverse,
    },
    // Tile grid beside donut (2 per row)
    chipColumn: {
      flex: 1,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginLeft: 14,
      alignContent: "center",
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 14,
      gap: 3,
      width: "47%",
    },
    chipEmpty: {
      opacity: 0.35,
    },
    chipDone: {
      opacity: 0.55,
    },
    chipOverdue: {
      borderWidth: 1.5,
      borderColor: theme.error + "70",
    },
    chipEmoji: {
      fontSize: 14,
    },
    chipText: {
      fontSize: 13,
      fontWeight: "700",
    },
    chipTextDone: {
      textDecorationLine: "line-through",
    },
    // Garden Health
    gardenHealthCard: {
      backgroundColor: theme.backgroundSecondary,
      marginTop: 1,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    gardenHealthTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.text,
      letterSpacing: 0.3,
      marginBottom: 10,
    },
    gardenHealthRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    healthColumn: {
      flex: 1,
      alignItems: "center",
      gap: 6,
    },
    healthDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    healthCount: {
      fontSize: 22,
      fontWeight: "bold",
      color: theme.text,
    },
    healthLabel: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    healthDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.border,
    },
    // Horizontal attention cards
    alertsSection: {
      backgroundColor: theme.backgroundSecondary,
      paddingTop: 12,
      paddingBottom: 14,
      paddingLeft: 16,
      marginTop: 1,
    },
    alertCardH: {
      width: 150,
      padding: 12,
      backgroundColor: theme.errorLight,
      borderRadius: 14,
      marginRight: 10,
      borderWidth: 1,
      borderColor: theme.error + "30",
    },
    alertCardHCritical: {
      backgroundColor: theme.errorLight,
      borderColor: theme.error + "40",
    },
    alertCardHWarning: {
      backgroundColor: theme.warningLight,
      borderColor: theme.warning + "40",
    },
    alertCardHInfo: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary + "40",
    },
    alertIconH: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.error,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    alertPlantNameH: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 3,
    },
    alertTextH: {
      fontSize: 11,
      color: theme.textSecondary,
      lineHeight: 15,
    },
    // Sections
    sectionTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: theme.text,
    },
    // Seasonal tip banner
    seasonalBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: theme.warningLight,
      borderWidth: 1,
      borderColor: theme.warning + "40",
    },
    seasonalBannerText: {
      flex: 1,
      fontSize: 13,
      color: theme.text,
      lineHeight: 18,
    },
    seasonalBannerClose: {
      padding: 2,
    },
    // Empty state
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      padding: 48,
      marginTop: 48,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    emptyButton: {
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: theme.primary,
      borderRadius: 24,
    },
    emptyButtonText: {
      color: theme.textInverse,
      fontSize: 15,
      fontWeight: "600",
    },
    containerCentered: {
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    flexOne: {
      flex: 1,
    },
    sectionTitleMarginBottom: {
      marginBottom: 10,
    },
    attentionListContent: {
      paddingRight: 8,
    },
  });
