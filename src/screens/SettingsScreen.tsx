import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { exportImagesOnly, importImagesOnly } from "../services/backup";
import { getImageStorageSize } from "../lib/imageStorage";
import { useTheme, useThemeMode } from "../theme";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { clearAllData } from "../lib/storage";

export default function SettingsScreen({ navigation }: any) {
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(false);
  const [imageStorageSize, setImageStorageSize] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  // Reset scroll to top when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  const loadStats = async () => {
    try {
      const imageSize = await getImageStorageSize();
      setImageStorageSize(imageSize);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + " MB";
  };

  const handleExportImagesOnly = async () => {
    Alert.alert(
      "Export Images Only",
      "This will create a ZIP file containing ONLY your photos (no data). Useful for backing up images separately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          onPress: async () => {
            try {
              setLoading(true);
              await exportImagesOnly();
              Alert.alert(
                "Images Exported",
                "Your garden images have been exported as a ZIP file. This contains only photos, no data.",
                [{ text: "OK", onPress: loadStats }],
              );
            } catch (error: any) {
              Alert.alert("Export Failed", error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleImportImagesOnly = async () => {
    Alert.alert(
      "Import Images Only",
      "This will import ONLY photos from a ZIP file. Your existing data will not be changed, only images will be added/replaced.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          onPress: async () => {
            try {
              setLoading(true);
              const count = await importImagesOnly();
              Alert.alert(
                "Images Imported",
                `Successfully imported ${count} image(s). Your data remains unchanged.`,
                [{ text: "OK", onPress: loadStats }],
              );
            } catch (error: any) {
              if (error.message !== "Import cancelled") {
                Alert.alert("Import Failed", error.message);
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleClearCache = async () => {
    Alert.alert(
      "Clear App Cache",
      "This will clear the app's local data cache. Firebase data will be re-synced on next load. Your data will not be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Cache",
          onPress: async () => {
            try {
              setLoading(true);
              // Clear AsyncStorage cache (safe - doesn't terminate Firebase)
              await clearAllData();
              Alert.alert(
                "Success",
                "Local cache cleared. Data will be re-synced from Firebase.",
              );
            } catch (error: any) {
              Alert.alert("Error", error?.message || "Failed to clear cache");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView ref={scrollViewRef} style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>

          <View style={styles.card}>
            <View style={styles.themeRow}>
              <Text style={styles.infoText}>App Theme</Text>
              <View style={styles.themeButtons}>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    mode === "system" && styles.themeButtonActive,
                  ]}
                  onPress={() => setMode("system")}
                >
                  <Text
                    style={[
                      styles.themeButtonText,
                      mode === "system" && styles.themeButtonTextActive,
                    ]}
                  >
                    Automatic
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    mode === "light" && styles.themeButtonActive,
                  ]}
                  onPress={() => setMode("light")}
                >
                  <Text
                    style={[
                      styles.themeButtonText,
                      mode === "light" && styles.themeButtonTextActive,
                    ]}
                  >
                    Light
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.themeButton,
                    mode === "dark" && styles.themeButtonActive,
                  ]}
                  onPress={() => setMode("dark")}
                >
                  <Text
                    style={[
                      styles.themeButtonText,
                      mode === "dark" && styles.themeButtonTextActive,
                    ]}
                  >
                    Dark
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Images-Only Backup</Text>
          <Text style={styles.sectionDescription}>
            Export or import ONLY your photos without any data. Useful for
            backing up images separately or transferring photos between devices.
            Total size: {formatBytes(imageStorageSize)}.
          </Text>

          <TouchableOpacity
            style={[styles.backupButton, styles.exportButton]}
            onPress={handleExportImagesOnly}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="images-outline" size={20} color="#fff" />
                <Text style={styles.backupButtonText}>
                  Export Images Only (ZIP)
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backupButton, styles.importButton]}
            onPress={handleImportImagesOnly}
            disabled={loading}
          >
            <Ionicons name="image-outline" size={20} color="#2e7d32" />
            <Text style={[styles.backupButtonText, { color: "#2e7d32" }]}>
              Import Images Only
            </Text>
          </TouchableOpacity>

          <Text style={styles.backupNote}>
            📸 Note: Images are stored with their original filenames. When
            imported, they&apos;ll automatically match with your existing plants and
            journal entries.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Maintenance</Text>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.infoItem}
              onPress={handleClearCache}
              disabled={loading}
            >
              <Ionicons name="trash-outline" size={20} color="#FF9800" />
              <Text style={styles.infoText}>Clear App Cache</Text>
            </TouchableOpacity>
            <Text style={styles.helpText}>
              Clears temporary data to improve performance. Your plants, tasks,
              and journal entries are not affected.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="leaf" size={24} color="#2e7d32" />
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Garden Planner</Text>
                <Text style={styles.rowSubtitle}>Version 1.0.0</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: theme.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    headerSpacer: {
      width: 36,
    },
    title: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    sectionDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 12,
      lineHeight: 20,
    },
    card: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    rowContent: {
      marginLeft: 16,
    },
    rowTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
    },
    rowSubtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 2,
    },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 8,
    },
    infoText: {
      fontSize: 14,
      color: theme.text,
      marginLeft: 12,
      flex: 1,
    },
    themeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    themeButtons: {
      flexDirection: "row",
      gap: 8,
    },
    themeButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.background,
    },
    themeButtonActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    themeButtonText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: "600",
    },
    themeButtonTextActive: {
      color: theme.primary,
    },
    backupButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 14,
      borderRadius: 10,
      marginTop: 12,
    },
    exportButton: {
      backgroundColor: "#2e7d32",
    },
    importButton: {
      backgroundColor: "#fff",
      borderWidth: 2,
      borderColor: "#2e7d32",
    },
    backupButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#fff",
      marginLeft: 8,
    },
    backupNote: {
      fontSize: 13,
      color: "#666",
      marginTop: 12,
      fontStyle: "italic",
      lineHeight: 18,
    },
    helpText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 8,
      marginLeft: 32,
      lineHeight: 18,
    },
  });
