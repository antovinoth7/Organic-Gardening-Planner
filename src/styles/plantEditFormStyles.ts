import { StyleSheet } from "react-native";
import type { Theme } from "../theme/colors";

export const createEditStyles = (theme: Theme) =>
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
  });
