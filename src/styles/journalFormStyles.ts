import { StyleSheet } from "react-native";

export const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      paddingTop: 12,
      backgroundColor: theme.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
    },
    saveText: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.buttonText,
    },
    saveButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 20,
    },
    saveButtonDisabled: {
      backgroundColor: theme.borderDark,
    },
    saveTextDisabled: {
      color: theme.textTertiary,
    },
    content: {
      flex: 1,
      padding: 16,
      paddingBottom: 16,
    },
    photosGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 16,
    },
    photoContainer: {
      position: "relative",
      width: "48%",
      aspectRatio: 1,
    },
    photoThumbnail: {
      width: "100%",
      height: "100%",
      borderRadius: 12,
    },
    removePhotoButton: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      borderRadius: 12,
    },
    addPhotoButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      backgroundColor: theme.primaryLight,
      borderRadius: 12,
      marginBottom: 16,
    },
    addPhotoText: {
      fontSize: 16,
      color: theme.primary,
      marginLeft: 8,
      fontWeight: "600",
    },
    textArea: {
      backgroundColor: theme.inputBackground,
      padding: 16,
      borderRadius: 12,
      fontSize: 16,
      color: theme.inputText,
      minHeight: 150,
      maxHeight: 300,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    typeSelector: {
      flexDirection: "row",
      marginBottom: 16,
      gap: 6,
    },
    typeButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      paddingHorizontal: 2,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.primaryLight,
      gap: 4,
    },
    typeButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    typeButtonText: {
      fontSize: 10,
      color: theme.primary,
      fontWeight: "600",
      textAlign: "center",
    },
    typeButtonTextActive: {
      color: theme.textInverse,
    },
    harvestSection: {
      backgroundColor: theme.backgroundSecondary,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 12,
    },
    harvestRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    quantityInput: {
      flex: 1,
    },
    unitInput: {
      flex: 1,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.inputBackground,
      padding: 12,
      borderRadius: 8,
      fontSize: 16,
      color: theme.inputText,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    unitButtons: {
      flexDirection: "row",
      gap: 8,
    },
    unitButton: {
      flex: 1,
      padding: 8,
      backgroundColor: theme.background,
      borderRadius: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    unitButtonActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    unitButtonText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: "600",
    },
    unitButtonTextActive: {
      color: theme.primary,
    },
    qualityButtons: {
      flexDirection: "row",
      gap: 8,
    },
    qualityButton: {
      flex: 1,
      padding: 8,
      backgroundColor: theme.background,
      borderRadius: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    qualityButtonActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    qualityEmoji: {
      fontSize: 18,
      marginBottom: 2,
    },
    qualityButtonText: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: "600",
    },
    qualityButtonTextActive: {
      color: theme.primary,
    },
    notesWrapper: {
      marginBottom: 4,
    },
    charCounter: {
      fontSize: 12,
      color: theme.textTertiary,
      textAlign: "right",
      marginTop: -6,
    },
  });
