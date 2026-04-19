import { StyleSheet } from "react-native";
import type { Theme } from "../theme/colors";

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    anchor: {
      alignSelf: "flex-start",
    },
    trigger: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    triggerCompact: {
      width: 18,
      height: 18,
      borderRadius: 9,
    },
    modalRoot: {
      flex: 1,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    popover: {
      position: "absolute",
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      shadowColor: theme.shadow,
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    popoverTitle: {
      fontSize: 12,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 4,
    },
    popoverText: {
      fontSize: 12,
      lineHeight: 18,
      color: theme.textSecondary,
    },
  });