import { StyleSheet } from "react-native";
import type { Theme } from "../theme/colors";

export const createEditStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    progressBarTrack: {
      height: 3,
      backgroundColor: theme.borderLight,
      width: "100%",
    },
    progressBarFill: {
      height: 3,
      backgroundColor: theme.primary,
      borderRadius: 1.5,
    },
    editHeaderSpacer: {
      width: 40,
      height: 40,
    },
    dataLoadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.background,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      zIndex: 10,
    },
    flexOne: {
      flex: 1,
    },
    scrollContentPadding: {
      paddingBottom: 160,
    },
    spaceTypeCardHint: {
      fontSize: 10,
      color: theme.textTertiary,
      marginTop: 2,
    },
    spacerSmall: {
      height: 8,
    },
    spacerTiny: {
      height: 4,
    },
    spacerMedium: {
      marginTop: 12,
    },
    noMarginBottom: {
      marginBottom: 0,
    },
    pruningFrequencyRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
      marginBottom: 12,
    },
    frequencyInputWrapCompact: {
      width: 70,
      marginBottom: 0,
    },
    frequencyInputLarge: {
      fontSize: 18,
    },
    pruningTipsCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.borderLight,
      marginBottom: 8,
    },
    pruningTipsHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      marginBottom: 8,
    },
    pruningTipsTitle: {
      fontSize: 12,
      fontWeight: "700" as const,
      color: theme.textSecondary,
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
    },
    pruningTipRow: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      gap: 6,
      marginBottom: 4,
    },
    pruningTipBullet: {
      color: theme.textTertiary,
      fontSize: 13,
      lineHeight: 18,
    },
    pruningTipText: {
      color: theme.text,
      fontSize: 13,
      lineHeight: 18,
      flex: 1,
    },
    pruningTechniqueTopGap: {
      marginTop: 6,
    },
    pruningFlowerTopGap: {
      marginTop: 4,
    },
    pruningTechniqueIcon: {
      fontSize: 13,
      lineHeight: 18,
    },
    pruningTechniqueTitle: {
      color: theme.text,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "600" as const,
    },
    pruningTechniqueDetail: {
      fontWeight: "400" as const,
    },
    pruningTechniqueBestTime: {
      color: theme.primary,
      fontSize: 12,
      fontWeight: "600" as const,
      marginTop: 2,
    },
    coconutInfoCard: {
      marginBottom: 16,
      borderLeftColor: theme.coconut,
      borderLeftWidth: 4,
    },
    coconutInfoCardTitle: {
      color: theme.coconut,
    },
    infoCardTextBold: {
      marginTop: 6,
      fontWeight: "600" as const,
    },
    pestCardResolved: {
      borderLeftWidth: 3,
      borderLeftColor: theme.success,
    },
    pestCardUnresolved: {
      borderLeftWidth: 3,
      borderLeftColor: theme.error,
    },
  });
