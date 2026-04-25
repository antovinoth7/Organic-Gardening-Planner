import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  exportImagesOnly,
  importImagesOnly,
  getImagesOnlyStorageSize,
} from "../services/backup";
import { useTheme } from "../theme";
import { useFocusEffect, useNavigation, NavigationProp, ParamListBase } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { clearAllData } from "../lib/storage";
import { createStyles } from "../styles/settingsStyles";import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/errorLogging';
export default function SettingsScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [loadingAction, setLoadingAction] = useState<
    "export" | "import" | "cache" | null
  >(null);
  const [imageStorageSize, setImageStorageSize] = useState(0);
  const loading = loadingAction !== null;

  const loadStats = React.useCallback(async () => {
    try {
      const imageSize = await getImagesOnlyStorageSize();
      setImageStorageSize(imageSize);
    } catch (error) {
      logger.error("Error loading stats", error as Error);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Reset scroll to top when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      void loadStats();
    }, [loadStats]),
  );

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + " MB";
  };

  const handleExportImagesOnly = async (): Promise<void> => {
    Alert.alert(
      "Export Images Only",
      "This will create a ZIP file containing ONLY your photos (no data). Useful for backing up images separately.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Export",
          onPress: async () => {
            try {
              setLoadingAction("export");
              await exportImagesOnly();
              Alert.alert(
                "Images Exported",
                "Your garden images have been exported as a ZIP file. This contains only photos, no data.",
                [{ text: "OK", onPress: loadStats }],
              );
            } catch (error: unknown) {
              Alert.alert("Export Failed", getErrorMessage(error));
            } finally {
              setLoadingAction(null);
            }
          },
        },
      ],
    );
  };

  const handleImportImagesOnly = async (): Promise<void> => {
    Alert.alert(
      "Import Images Only",
      "This will import ONLY photos from a ZIP file. Your existing data will not be changed, only images will be added/replaced.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          onPress: async () => {
            try {
              setLoadingAction("import");
              const count = await importImagesOnly();
              Alert.alert(
                "Images Imported",
                `Successfully imported ${count} image(s). Your data remains unchanged.`,
                [{ text: "OK", onPress: loadStats }],
              );
            } catch (error: unknown) {
              if (getErrorMessage(error) !== "Import cancelled") {
                Alert.alert("Import Failed", getErrorMessage(error));
              }
            } finally {
              setLoadingAction(null);
            }
          },
        },
      ],
    );
  };

  const handleClearCache = async (): Promise<void> => {
    Alert.alert(
      "Clear App Cache",
      "This will clear the app's local data cache. Firebase data will be re-synced on next load. Your data will not be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Cache",
          onPress: async () => {
            try {
              setLoadingAction("cache");
              // Clear AsyncStorage cache (safe - doesn't terminate Firebase)
              await clearAllData();
              await loadStats();
              Alert.alert(
                "Success",
                "Local cache cleared. Data will be re-synced from Firebase.",
              );
            } catch (error: unknown) {
              Alert.alert("Error", getErrorMessage(error) || "Failed to clear cache");
            } finally {
              setLoadingAction(null);
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
          <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView ref={scrollViewRef} style={styles.content} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 48) + 16 }}>
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
            {loadingAction === "export" ? (
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
            {loadingAction === "import" ? (
              <ActivityIndicator color={theme.success} />
            ) : (
              <>
                <Ionicons name="image-outline" size={20} color={theme.success} />
                <Text style={[styles.backupButtonText, styles.backupButtonTextSuccess]}>
                  Import Images Only
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.backupNote}>
            📸 Note: Images are stored with their original filenames. When
            imported, they&apos;ll automatically match with your existing plants
            and journal entries.
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
              <Ionicons name="leaf" size={24} color={theme.success} />
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
