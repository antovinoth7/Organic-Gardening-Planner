import { StyleSheet } from "react-native";
import type { Theme } from "../theme/colors";

export const createEnrichedSectionStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    // ─── Stat Grid (Quick Info) ────────────────────────────────────────────────
    statGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    statGridItem: {
      width: "48%" as unknown as number,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    statIconRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textTertiary,
      fontWeight: "500",
    },
    statValue: {
      fontSize: 16,
      color: theme.text,
      fontWeight: "700",
    },

    // ─── Chip Sections (shared by Relationships, Nutrition, CareGuidance) ──────
    chipSection: {
      marginBottom: 12,
    },
    chipSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
    },
    chipSectionLabel: {
      fontSize: 14,
      color: theme.textSecondary,
      fontWeight: "600",
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chipEmoji: {
      fontSize: 14,
    },

    // ─── Companion / Incompatible Chips ────────────────────────────────────────
    companionChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.successLight,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.successBorder,
    },
    companionChipText: {
      fontSize: 13,
      color: theme.successDark,
      fontWeight: "500",
    },
    incompatibleChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.errorLight,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.errorBorder,
    },
    incompatibleChipText: {
      fontSize: 13,
      color: theme.errorDark,
      fontWeight: "500",
    },

    // ─── Pest / Disease Chips (tappable) ───────────────────────────────────────
    pestChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.warningLight,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.warningBorder,
    },
    pestChipText: {
      fontSize: 13,
      color: theme.warningDark,
      fontWeight: "500",
    },
    diseaseChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.cautionLight,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.cautionBorder,
    },
    diseaseChipText: {
      fontSize: 13,
      color: theme.cautionDark,
      fontWeight: "500",
    },

    // ─── Nutrition Chips ───────────────────────────────────────────────────────
    vitaminChip: {
      backgroundColor: theme.infoLight,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.infoBorder,
    },
    vitaminChipText: {
      fontSize: 13,
      color: theme.infoDark,
      fontWeight: "500",
    },
    mineralChip: {
      backgroundColor: theme.purpleLight,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.purpleBorder,
    },
    mineralChipText: {
      fontSize: 13,
      color: theme.purpleDark,
      fontWeight: "500",
    },

    // ─── Feeding Badge ─────────────────────────────────────────────────────────
    feedingBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1.5,
      marginBottom: 12,
    },
    feedingBadgeText: {
      fontSize: 14,
      fontWeight: "600",
    },

    // ─── Safety Banner ─────────────────────────────────────────────────────────
    safetyBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: theme.errorLight,
      borderRadius: 12,
      padding: 14,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: theme.errorBorder,
      gap: 12,
    },
    safetyIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.errorBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    safetyContent: {
      flex: 1,
    },
    safetyTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.errorDark,
      marginBottom: 2,
    },
    safetyText: {
      fontSize: 13,
      color: theme.errorDarkest,
      lineHeight: 18,
    },

    // ─── Narrative Blocks (Care Guidance) ──────────────────────────────────────
    narrativeBlock: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderLight,
    },
    narrativeHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
    },
    narrativeTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
    },
    narrativeText: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    bulletRow: {
      flexDirection: "row",
      paddingLeft: 4,
      marginBottom: 4,
    },
    bullet: {
      fontSize: 14,
      color: theme.textTertiary,
      marginRight: 8,
      lineHeight: 20,
    },
    bulletText: {
      fontSize: 14,
      color: theme.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
    techniqueRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.borderLight,
    },
    techniqueIcon: {
      fontSize: 16,
      marginTop: 2,
    },
    techniqueTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      lineHeight: 20,
    },
    techniqueTiming: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 2,
    },
    flexOne: {
      flex: 1,
    },

    // ─── Empty State (Beneficials) ─────────────────────────────────────────────
    emptyState: {
      alignItems: "center",
      paddingVertical: 20,
      gap: 6,
    },
    emptyStateText: {
      fontSize: 15,
      color: theme.textSecondary,
      fontWeight: "600",
    },
    emptyStateSubtext: {
      fontSize: 13,
      color: theme.textTertiary,
      textAlign: "center",
      paddingHorizontal: 16,
      lineHeight: 18,
    },

    // ─── Care Toggle (B.9) ────────────────────────────────────────────────────
    toggleHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    toggleHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    toggleDisabledText: {
      fontSize: 13,
      color: theme.textTertiary,
      fontStyle: "italic",
      marginTop: 8,
      paddingHorizontal: 4,
    },
    stepperCardDisabled: {
      opacity: 0.5,
    },
  });
