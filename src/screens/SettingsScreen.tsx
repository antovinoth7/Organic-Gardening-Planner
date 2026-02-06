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
import {
  exportBackup,
  importBackup,
  getBackupStats,
  exportBackupWithImages,
  importBackupWithImages,
  exportImagesOnly,
  importImagesOnly,
} from "../services/backup";
import { getImageStorageSize } from "../lib/imageStorage";
import { useTheme, useThemeMode } from "../theme";
import { useFocusEffect } from "@react-navigation/native";
import { testSentryLogging } from "../utils/sentryTest";
import { clearAllData } from "../lib/storage";

export default function SettingsScreen({ navigation }: any) {
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();
  const styles = createStyles(theme);
  const scrollViewRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [stats, setStats] = useState<{
    plantCount: number;
    taskCount: number;
    journalCount: number;
    lastExport: string | null;
  }>({ plantCount: 0, taskCount: 0, journalCount: 0, lastExport: null });
  const [imageStorageSize, setImageStorageSize] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  // Reset scroll to top when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const loadStats = async () => {
    try {
      const backupStats = await getBackupStats();
      const imageSize = await getImageStorageSize();
      setStats(backupStats);
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

  const handleExportBackup = async () => {
    try {
      setLoading(true);
      await exportBackup();
      Alert.alert(
        "Backup Created",
        "Your garden data has been exported. Save this file to your cloud storage (Google Drive, OneDrive, etc.) for safekeeping.",
        [{ text: "OK", onPress: loadStats }]
      );
    } catch (error: any) {
      Alert.alert("Export Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async (overwrite: boolean) => {
    Alert.alert(
      "Import Backup",
      overwrite
        ? "This will REPLACE all your current data with the backup. Continue?"
        : "This will MERGE the backup with your current data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: overwrite ? "destructive" : "default",
          onPress: async () => {
            try {
              setLoading(true);
              const result = await importBackup(overwrite);
              Alert.alert(
                "Import Complete",
                `Imported:\n• ${result.plants} plants\n• ${result.tasks} tasks\n• ${result.journal} journal entries`,
                [{ text: "OK", onPress: loadStats }]
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
      ]
    );
  };

  const handleExportBackupWithImages = async () => {
    Alert.alert(
      "Export Complete Backup",
      "This will create a ZIP file containing all your data AND images. This file may be large.\n\nUse this for full device-to-device transfers.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          onPress: async () => {
            try {
              setLoading(true);
              await exportBackupWithImages();
              Alert.alert(
                "Complete Backup Created",
                "Your garden data and images have been exported as a ZIP file. Save this to your cloud storage for complete device transfer.",
                [{ text: "OK", onPress: loadStats }]
              );
            } catch (error: any) {
              Alert.alert("Export Failed", error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleImportBackupWithImages = async (overwrite: boolean) => {
    Alert.alert(
      "Import Complete Backup",
      overwrite
        ? "This will REPLACE all your current data and images with the backup. Continue?"
        : "This will MERGE the backup data and images with your current data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: overwrite ? "destructive" : "default",
          onPress: async () => {
            try {
              setLoading(true);
              const result = await importBackupWithImages(overwrite);
              Alert.alert(
                "Import Complete",
                `Imported:\n• ${result.plants} plants\n• ${result.tasks} tasks\n• ${result.journal} journal entries\n• ${result.images} images`,
                [{ text: "OK", onPress: loadStats }]
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
      ]
    );
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
                [{ text: "OK", onPress: loadStats }]
              );
            } catch (error: any) {
              Alert.alert("Export Failed", error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
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
                [{ text: "OK", onPress: loadStats }]
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
      ]
    );
  };

  const handleTestSentry = () => {
    Alert.alert(
      "Test Sentry Logging",
      "Choose a test type to verify Sentry integration:",
      [
        {
          text: "Info Message",
          onPress: () => {
            testSentryLogging.testInfo();
            Alert.alert("✅ Info Logged", "Check console and Sentry dashboard");
          },
        },
        {
          text: "Warning",
          onPress: () => {
            testSentryLogging.testWarning();
            Alert.alert(
              "⚠️  Warning Logged",
              "Check console and Sentry dashboard"
            );
          },
        },
        {
          text: "Error Exception",
          onPress: () => {
            testSentryLogging.testError();
            Alert.alert(
              "🔴 Error Logged",
              "Check console and Sentry dashboard"
            );
          },
        },
        {
          text: "Test Breadcrumbs",
          onPress: () => {
            testSentryLogging.testBreadcrumbs();
            Alert.alert(
              "🍞 Breadcrumbs Logged",
              "Check event in Sentry for breadcrumb trail"
            );
          },
        },
        {
          text: "Test Context & Tags",
          onPress: () => {
            testSentryLogging.testWithContext();
            Alert.alert(
              "📊 Context Logged",
              "Check event in Sentry for custom context"
            );
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleProdSentryTest = async () => {
    try {
      await testSentryLogging.testProduction();
      Alert.alert(
        "Sentry Production Test",
        "Test event sent. Check Sentry for environment=production and tag test_type:production."
      );
    } catch (error: any) {
      Alert.alert(
        "Sentry Production Test Failed",
        error?.message || "Unknown error"
      );
    }
  };

  const confirmProdSentryTest = () => {
    Alert.alert(
      "Send Production Test",
      "This will send a test event to your production Sentry project. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Send", onPress: handleProdSentryTest },
      ]
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
                "Local cache cleared. Data will be re-synced from Firebase."
              );
            } catch (error: any) {
              Alert.alert("Error", error?.message || "Failed to clear cache");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
          <Text style={styles.sectionTitle}>Data Backup (Text Only)</Text>
          <Text style={styles.sectionDescription}>
            Quick backup of your text data (plants, tasks, journals). Images are
            NOT included. Best for quick data sync or backup.
          </Text>

          <View style={styles.card}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.plantCount}</Text>
                <Text style={styles.statLabel}>Plants</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.taskCount}</Text>
                <Text style={styles.statLabel}>Tasks</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.journalCount}</Text>
                <Text style={styles.statLabel}>Journal</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.backupButton, styles.exportButton]}
            onPress={handleExportBackup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.backupButtonText}>
                  Export Data Only (JSON)
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backupButton, styles.importButton]}
            onPress={() => handleImportBackup(false)}
            disabled={loading}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#2e7d32" />
            <Text style={[styles.backupButtonText, { color: "#2e7d32" }]}>
              Import & Merge
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backupButton, styles.replaceButton]}
            onPress={() => handleImportBackup(true)}
            disabled={loading}
          >
            <Ionicons name="refresh-outline" size={20} color="#f57c00" />
            <Text style={[styles.backupButtonText, { color: "#f57c00" }]}>
              Import & Replace All
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Complete Backup (Data + Images)
          </Text>
          <Text style={styles.sectionDescription}>
            Full backup including all photos as a ZIP file. Use this for
            complete device-to-device transfers. File size:{" "}
            {formatBytes(imageStorageSize)} (approx).
          </Text>

          <View style={styles.card}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.plantCount}</Text>
                <Text style={styles.statLabel}>Plants</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.taskCount}</Text>
                <Text style={styles.statLabel}>Tasks</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.journalCount}</Text>
                <Text style={styles.statLabel}>Journal</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatBytes(imageStorageSize)}
                </Text>
                <Text style={styles.statLabel}>Images</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.backupButton, styles.exportButton]}
            onPress={handleExportBackupWithImages}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="archive-outline" size={20} color="#fff" />
                <Text style={styles.backupButtonText}>
                  Export Complete Backup (ZIP)
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backupButton, styles.importButton]}
            onPress={() => handleImportBackupWithImages(false)}
            disabled={loading}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#2e7d32" />
            <Text style={[styles.backupButtonText, { color: "#2e7d32" }]}>
              Import & Merge Complete Backup
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.backupButton, styles.replaceButton]}
            onPress={() => handleImportBackupWithImages(true)}
            disabled={loading}
          >
            <Ionicons name="refresh-outline" size={20} color="#f57c00" />
            <Text style={[styles.backupButtonText, { color: "#f57c00" }]}>
              Import & Replace All (with Images)
            </Text>
          </TouchableOpacity>

          <Text style={styles.backupNote}>
            💡 Tip: Use "Complete Backup" when switching devices. Save the ZIP
            file to Google Drive, OneDrive, or external storage for safekeeping.
          </Text>
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
            imported, they'll automatically match with your existing plants and
            journal entries.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Diagnostics</Text>
            <TouchableOpacity
              style={styles.sectionToggle}
              onPress={() => setShowDiagnostics((prev) => !prev)}
            >
              <Ionicons
                name={showDiagnostics ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionDescription}>
            Optional tools for validating error reporting. Use only when
            troubleshooting.
          </Text>

          {showDiagnostics && (
            <>
              <TouchableOpacity
                style={[styles.backupButton, styles.testButton]}
                onPress={handleTestSentry}
              >
                <Ionicons name="bug-outline" size={20} color="#9c27b0" />
                <Text style={[styles.backupButtonText, { color: "#9c27b0" }]}>
                  Test Sentry Logging
                </Text>
              </TouchableOpacity>

              <Text style={styles.backupNote}>
                Tests include info messages, warnings, errors, breadcrumbs, and
                custom contexts.
              </Text>

              <TouchableOpacity
                style={[styles.backupButton, styles.testButton]}
                onPress={confirmProdSentryTest}
              >
                <Ionicons name="bug-outline" size={20} color="#9c27b0" />
                <Text style={[styles.backupButtonText, { color: "#9c27b0" }]}>
                  Send Production Test Event
                </Text>
              </TouchableOpacity>

              <Text style={styles.backupNote}>
                Sends a test event to production with tag test_type:production.
              </Text>
            </>
          )}
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
          <Text style={styles.sectionTitle}>Architecture</Text>

          <View style={styles.card}>
            <View style={styles.infoItem}>
              <Ionicons name="cloud-outline" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>
                Text data synced via Firebase (free tier)
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color="#2e7d32"
              />
              <Text style={styles.infoText}>
                Images stored locally on device only
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="wifi-outline" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>
                Works offline with local cache
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#2e7d32"
              />
              <Text style={styles.infoText}>
                Free forever - no subscriptions
              </Text>
            </View>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>

          <View style={styles.card}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>
                Track plants and their locations
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>
                Set recurring tasks (water, fertilise, etc.)
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>Garden journal with photos</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>
                Calendar view of upcoming tasks
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>Cloud sync across all devices</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>Works offline with auto-sync</Text>
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
      paddingTop: 48,
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
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionToggle: {
      padding: 4,
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
    statsContainer: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 8,
    },
    statItem: {
      alignItems: "center",
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.primary,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
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
    replaceButton: {
      backgroundColor: "#fff",
      borderWidth: 2,
      borderColor: "#f57c00",
    },
    testButton: {
      backgroundColor: "#fff",
      borderWidth: 2,
      borderColor: "#9c27b0",
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
