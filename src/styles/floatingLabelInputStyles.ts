import { Platform, StyleSheet } from "react-native";
import type { Theme } from "../theme/colors";

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      borderWidth: 1,
      borderRadius: 12,
      borderColor: theme.inputBorder,
      backgroundColor: theme.inputBackground,
      marginBottom: 12,
      paddingHorizontal: 16,
      minHeight: 56,
      justifyContent: "center",
    },
    containerMultiline: {
      minHeight: 80,
      justifyContent: "flex-start",
      paddingTop: 18,
    },
    containerWithHelp: {
      paddingRight: 42,
    },
    containerFocused: {
      borderWidth: 2,
    },
    label: {
      position: "absolute",
      left: 12,
      paddingHorizontal: 4,
      fontWeight: "500",
    },
    labelWithHelp: {
      maxWidth: "82%",
    },
    input: {
      fontSize: 16,
      paddingVertical: Platform.OS === "ios" ? 18 : 14,
      paddingHorizontal: 0,
    },
    inputWithHelp: {
      paddingRight: 2,
    },
    inputMultiline: {
      paddingTop: 4,
      textAlignVertical: "top",
    },
    helpSlot: {
      position: "absolute",
      right: 12,
      zIndex: 2,
    },
    helpSlotSingle: {
      top: 18,
    },
    helpSlotMultiline: {
      top: 12,
    },
  });
