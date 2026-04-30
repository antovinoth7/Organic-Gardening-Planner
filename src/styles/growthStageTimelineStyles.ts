import { StyleSheet } from "react-native";
import type { Theme } from "../theme/colors";

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      paddingVertical: 8,
    },
    row: {
      flexDirection: "row",
      minHeight: 48,
    },
    lineColumn: {
      width: 32,
      alignItems: "center",
    },
    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 2,
      zIndex: 1,
    },
    dotCurrent: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    dotCompleted: {
      backgroundColor: theme.success,
      borderColor: theme.success,
    },
    dotFuture: {
      backgroundColor: theme.backgroundSecondary,
      borderColor: theme.border,
    },
    line: {
      flex: 1,
      width: 2,
      marginTop: -1,
      marginBottom: -1,
    },
    lineCompleted: {
      backgroundColor: theme.success,
    },
    lineCurrent: {
      backgroundColor: theme.primary,
    },
    lineFuture: {
      backgroundColor: theme.border,
    },
    content: {
      flex: 1,
      paddingLeft: 12,
      paddingBottom: 12,
    },
    stageLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
    },
    stageLabelCurrent: {
      color: theme.primary,
      fontWeight: "700",
    },
    stageLabelFuture: {
      color: theme.textTertiary,
    },
    dateText: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.borderLight,
      marginTop: 6,
      width: "70%",
    },
    progressFill: {
      height: "100%",
      borderRadius: 2,
      backgroundColor: theme.primary,
    },
    pinnedBadge: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },
    pinnedText: {
      fontSize: 11,
      color: theme.accent,
      marginLeft: 4,
    },
    sourceTag: {
      fontSize: 11,
      color: theme.textTertiary,
      marginTop: 2,
    },
    checkIcon: {
      position: "absolute",
      top: 0,
      left: 0,
    },
  });
