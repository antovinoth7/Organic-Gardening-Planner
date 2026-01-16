/**
 * Backup and Restore Service
 *
 * This service provides manual backup/export and import/restore functionality
 * to ensure long-term data safety without depending on any cloud provider.
 *
 * Key features:
 * - Export all text data (plants, tasks, journals) to a JSON file
 * - Import data from a backup file to restore or sync between devices
 * - Backup files are plain JSON - readable and portable
 * - User can manually upload backups to any cloud storage (Google Drive, OneDrive, etc.)
 *
 * Note: Images are NOT included in backups (they remain local).
 * For full device-to-device sync including images, use device file sync tools
 * or manually copy the garden_images folder.
 */

import * as FileSystem from "expo-file-system/legacy";
import { shareAsync, isAvailableAsync } from "expo-sharing";
import { getDocumentAsync } from "expo-document-picker";
import { getData, setData, KEYS } from "../lib/storage";
import { getPlants } from "./plants";
import { getTaskTemplates, getTaskLogs } from "./tasks";
import { getJournalEntries } from "./journal";
import {
  Plant,
  TaskTemplate,
  TaskLog,
  JournalEntry,
} from "../types/database.types";
import { withTimeoutAndRetry } from "../utils/firestoreTimeout";
import { createZipWithImages, extractZipWithImages } from "../utils/zipHelper";
import { Platform } from "react-native";
import { db, auth } from "../lib/firebase";
import {
  collection,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export interface BackupData {
  version: string;
  exportDate: string;
  plants: Plant[];
  tasks: TaskTemplate[];
  taskLogs: TaskLog[];
  journal: JournalEntry[];
  // Note: Images are stored locally and NOT included in the backup
  // Only the imageUri strings are included in the plant/journal objects
}

/**
 * Export all data to a JSON backup file
 * @returns The file URI of the created backup
 */
export const exportBackup = async (): Promise<string> => {
  try {
    console.log("Starting backup export...");

    // Fetch all data from Firestore (or use cached if offline) with timeout
    const [{ plants }, tasks, taskLogs, journal] = await withTimeoutAndRetry(
      () =>
        Promise.all([
          getPlants(),
          getTaskTemplates(),
          getTaskLogs(),
          getJournalEntries(),
        ]),
      { timeoutMs: 20000 } // 20 second timeout for backup export
    );

    // Create backup object
    const backup: BackupData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      plants,
      tasks,
      taskLogs,
      journal,
    };

    // Generate filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const filename = `garden-backup-${timestamp}.json`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    // Write to file
    await FileSystem.writeAsStringAsync(
      fileUri,
      JSON.stringify(backup, null, 2),
      { encoding: "utf8" }
    );

    console.log("Backup created:", fileUri);

    // Share the file so user can save it to cloud storage
    if (await isAvailableAsync()) {
      await shareAsync(fileUri, {
        mimeType: "application/json",
        dialogTitle: "Save Garden Backup",
        UTI: "public.json",
      });
    }

    return fileUri;
  } catch (error) {
    console.error("Error exporting backup:", error);
    throw new Error("Failed to export backup: " + (error as Error).message);
  }
};

/**
 * Import data from a backup file
 * @param overwrite - If true, replaces all existing data. If false, merges with existing data.
 * @returns Number of items imported
 */
export const importBackup = async (
  overwrite: boolean = false
): Promise<{
  plants: number;
  tasks: number;
  taskLogs: number;
  journal: number;
}> => {
  try {
    console.log("Starting backup import...");

    // Let user pick a backup file
    const result = await getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      throw new Error("Import cancelled");
    }

    if (!result.assets || result.assets.length === 0) {
      throw new Error("No backup file selected");
    }

    // Read the backup file
    const fileContent = await FileSystem.readAsStringAsync(
      result.assets[0].uri,
      {
        encoding: "utf8",
      }
    );

    let backup: BackupData;
    try {
      backup = JSON.parse(fileContent);
    } catch (parseError) {
      throw new Error("Invalid JSON format in backup file");
    }

    // Comprehensive validation of backup structure
    if (!backup.version || typeof backup.version !== "string") {
      throw new Error("Invalid or missing backup version");
    }

    if (!Array.isArray(backup.plants)) {
      throw new Error("Invalid backup: plants data is missing or corrupted");
    }

    if (!Array.isArray(backup.tasks)) {
      throw new Error("Invalid backup: tasks data is missing or corrupted");
    }

    if (!Array.isArray(backup.journal)) {
      throw new Error("Invalid backup: journal data is missing or corrupted");
    }

    if (!Array.isArray(backup.taskLogs)) {
      backup.taskLogs = []; // Optional field, default to empty array
    }

    // Validate data integrity - check that items have required fields
    const invalidPlants = backup.plants.filter((p) => !p.id || !p.name);
    if (invalidPlants.length > 0) {
      throw new Error(
        `Backup contains ${invalidPlants.length} invalid plant(s) missing ID or name`
      );
    }

    const invalidTasks = backup.tasks.filter((t) => !t.id || !t.task_type);
    if (invalidTasks.length > 0) {
      throw new Error(
        `Backup contains ${invalidTasks.length} invalid task(s) missing ID or type`
      );
    }

    const invalidJournal = backup.journal.filter((j) => !j.id || !j.entry_type);
    if (invalidJournal.length > 0) {
      throw new Error(
        `Backup contains ${invalidJournal.length} invalid journal entry(ies) missing ID or type`
      );
    }

    console.log(`Importing backup from ${backup.exportDate}`);
    console.log(`- Plants: ${backup.plants.length}`);
    console.log(`- Tasks: ${backup.tasks.length}`);
    console.log(`- Task Logs: ${backup.taskLogs.length}`);
    console.log(`- Journal Entries: ${backup.journal.length}`);

    // Import data based on overwrite mode
    if (overwrite) {
      // Replace all data
      await setData(KEYS.PLANTS, backup.plants);
      await setData(KEYS.TASKS, backup.tasks);
      await setData(KEYS.TASK_LOGS, backup.taskLogs);
      await setData(KEYS.JOURNAL, backup.journal);
    } else {
      // Merge with existing data (keep existing items, add new ones)
      const existingPlants = await getData<Plant>(KEYS.PLANTS);
      const existingTasks = await getData<TaskTemplate>(KEYS.TASKS);
      const existingLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
      const existingJournal = await getData<JournalEntry>(KEYS.JOURNAL);

      // Merge by ID, preferring backup data for conflicts
      const mergedPlants = mergeByIdPreferBackup(existingPlants, backup.plants);
      const mergedTasks = mergeByIdPreferBackup(existingTasks, backup.tasks);
      const mergedLogs = mergeByIdPreferBackup(existingLogs, backup.taskLogs);
      const mergedJournal = mergeByIdPreferBackup(
        existingJournal,
        backup.journal
      );

      await setData(KEYS.PLANTS, mergedPlants);
      await setData(KEYS.TASKS, mergedTasks);
      await setData(KEYS.TASK_LOGS, mergedLogs);
      await setData(KEYS.JOURNAL, mergedJournal);
    }

    console.log("Import completed successfully");

    return {
      plants: backup.plants.length,
      tasks: backup.tasks.length,
      taskLogs: backup.taskLogs.length,
      journal: backup.journal.length,
    };
  } catch (error) {
    console.error("Error importing backup:", error);
    throw new Error("Failed to import backup: " + (error as Error).message);
  }
};

/**
 * Merge two arrays by ID, preferring items from the backup
 */
function mergeByIdPreferBackup<T extends { id: string }>(
  existing: T[],
  backup: T[]
): T[] {
  const merged = new Map<string, T>();

  // Add existing items first
  existing.forEach((item) => merged.set(item.id, item));

  // Overwrite with backup items
  backup.forEach((item) => merged.set(item.id, item));

  return Array.from(merged.values());
}

/**
 * Get backup statistics
 */
export const getBackupStats = async (): Promise<{
  plantCount: number;
  taskCount: number;
  journalCount: number;
  lastExport: string | null;
}> => {
  const plants = await getData<Plant>(KEYS.PLANTS);
  const tasks = await getData<TaskTemplate>(KEYS.TASKS);
  const journal = await getData<JournalEntry>(KEYS.JOURNAL);

  return {
    plantCount: plants.length,
    taskCount: tasks.length,
    journalCount: journal.length,
    lastExport: null, // Could be tracked in AsyncStorage if needed
  };
};

/**
 * Export backup with images as a ZIP file
 * This creates a complete backup including all photos for device-to-device transfer
 * @returns The file URI of the created ZIP backup
 */
export const exportBackupWithImages = async (): Promise<string> => {
  try {
    console.log("Starting backup export with images...");

    // Fetch all data from Firestore with timeout
    const [{ plants }, tasks, taskLogs, journal] = await withTimeoutAndRetry(
      () =>
        Promise.all([
          getPlants(),
          getTaskTemplates(),
          getTaskLogs(),
          getJournalEntries(),
        ]),
      { timeoutMs: 20000 }
    );

    // Create backup object
    const backup: BackupData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      plants,
      tasks,
      taskLogs,
      journal,
    };

    // Collect all image URIs from plants and journal entries
    const imageUris: string[] = [];

    // Add plant images
    plants.forEach((plant) => {
      if (plant.photo_url) {
        imageUris.push(plant.photo_url);
      }
    });

    // Add journal entry images
    journal.forEach((entry) => {
      if (entry.photo_urls && entry.photo_urls.length > 0) {
        imageUris.push(...entry.photo_urls);
      }
      // Also check legacy photo_url field for backward compatibility
      if (entry.photo_url) {
        imageUris.push(entry.photo_url);
      }
    });

    console.log(`Found ${imageUris.length} images to backup`);

    // Create ZIP with JSON and images
    const zipUri = await createZipWithImages(backup, imageUris);

    console.log("Backup with images created:", zipUri);

    // Share the file (except on web where it auto-downloads)
    if (Platform.OS !== "web" && (await isAvailableAsync())) {
      await shareAsync(zipUri, {
        mimeType: "application/zip",
        dialogTitle: "Save Complete Garden Backup",
        UTI: "public.zip-archive",
      });
    }

    return zipUri;
  } catch (error) {
    console.error("Error exporting backup with images:", error);
    throw new Error(
      "Failed to export backup with images: " + (error as Error).message
    );
  }
};

/**
 * Import backup with images from a ZIP file
 * This restores both data and images for complete device transfer
 * @param overwrite - If true, replaces all existing data. If false, merges with existing data.
 * @returns Statistics about imported items
 */
export const importBackupWithImages = async (
  overwrite: boolean = false
): Promise<{
  plants: number;
  tasks: number;
  taskLogs: number;
  journal: number;
  images: number;
}> => {
  try {
    console.log("Starting backup import with images...");

    // Let user pick a backup ZIP file
    const result = await getDocumentAsync({
      type: "application/zip",
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      throw new Error("Import cancelled");
    }

    if (!result.assets || result.assets.length === 0) {
      throw new Error("No backup file selected");
    }

    // Extract ZIP contents
    const IMAGES_DIR =
      Platform.OS === "web"
        ? ""
        : `${FileSystem.documentDirectory}garden_images/`;

    const { jsonData, imageUris } = await extractZipWithImages(
      result.assets[0].uri,
      IMAGES_DIR
    );

    // Validate backup structure
    const backup = jsonData as BackupData;

    if (!backup.version || typeof backup.version !== "string") {
      throw new Error("Invalid or missing backup version");
    }

    if (!Array.isArray(backup.plants)) {
      throw new Error("Invalid backup: plants data is missing or corrupted");
    }

    if (!Array.isArray(backup.tasks)) {
      throw new Error("Invalid backup: tasks data is missing or corrupted");
    }

    if (!Array.isArray(backup.journal)) {
      throw new Error("Invalid backup: journal data is missing or corrupted");
    }

    if (!Array.isArray(backup.taskLogs)) {
      backup.taskLogs = [];
    }

    console.log(`Importing backup from ${backup.exportDate}`);
    console.log(`- Plants: ${backup.plants.length}`);
    console.log(`- Tasks: ${backup.tasks.length}`);
    console.log(`- Task Logs: ${backup.taskLogs.length}`);
    console.log(`- Journal Entries: ${backup.journal.length}`);
    console.log(`- Images: ${imageUris.size}`);

    // Update image URIs in the backup data to point to newly extracted files
    const updatedPlants = backup.plants.map((plant) => {
      if (plant.photo_url) {
        const filename = plant.photo_url.split("/").pop();
        const newUri = filename ? imageUris.get(filename) : null;
        if (newUri) {
          return { ...plant, photo_url: newUri };
        }
      }
      return plant;
    });

    const updatedJournal = backup.journal.map((entry) => {
      if (entry.photo_urls && entry.photo_urls.length > 0) {
        const updatedPhotos = entry.photo_urls.map((photoUri) => {
          const filename = photoUri.split("/").pop();
          return filename && imageUris.has(filename)
            ? imageUris.get(filename)!
            : photoUri;
        });
        return { ...entry, photo_urls: updatedPhotos };
      }
      // Handle legacy photo_url field
      if (entry.photo_url) {
        const filename = entry.photo_url.split("/").pop();
        const newUri =
          filename && imageUris.has(filename)
            ? imageUris.get(filename)!
            : entry.photo_url;
        return { ...entry, photo_url: newUri };
      }
      return entry;
    });

    // Import data based on overwrite mode
    if (overwrite) {
      // Replace all data
      await setData(KEYS.PLANTS, updatedPlants);
      await setData(KEYS.TASKS, backup.tasks);
      await setData(KEYS.TASK_LOGS, backup.taskLogs);
      await setData(KEYS.JOURNAL, updatedJournal);
    } else {
      // Merge with existing data
      const existingPlants = await getData<Plant>(KEYS.PLANTS);
      const existingTasks = await getData<TaskTemplate>(KEYS.TASKS);
      const existingLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
      const existingJournal = await getData<JournalEntry>(KEYS.JOURNAL);

      const mergedPlants = mergeByIdPreferBackup(existingPlants, updatedPlants);
      const mergedTasks = mergeByIdPreferBackup(existingTasks, backup.tasks);
      const mergedLogs = mergeByIdPreferBackup(existingLogs, backup.taskLogs);
      const mergedJournal = mergeByIdPreferBackup(
        existingJournal,
        updatedJournal
      );

      await setData(KEYS.PLANTS, mergedPlants);
      await setData(KEYS.TASKS, mergedTasks);
      await setData(KEYS.TASK_LOGS, mergedLogs);
      await setData(KEYS.JOURNAL, mergedJournal);
    }

    console.log("Import with images completed successfully");

    return {
      plants: backup.plants.length,
      tasks: backup.tasks.length,
      taskLogs: backup.taskLogs.length,
      journal: backup.journal.length,
      images: imageUris.size,
    };
  } catch (error) {
    console.error("Error importing backup with images:", error);
    throw new Error(
      "Failed to import backup with images: " + (error as Error).message
    );
  }
};

/**
 * Export ONLY images as a ZIP file (no data)
 * This creates an images-only archive for backup or transfer
 * @returns The file URI of the created images ZIP
 */
export const exportImagesOnly = async (): Promise<string> => {
  try {
    console.log("Starting images-only export...");

    // Fetch all data to get image URIs
    const [{ plants }, journal] = await withTimeoutAndRetry(
      () => Promise.all([getPlants(), getJournalEntries()]),
      { timeoutMs: 20000 }
    );

    // Collect all image URIs
    const imageUris: string[] = [];

    // Add plant images
    plants.forEach((plant) => {
      if (plant.photo_url) {
        imageUris.push(plant.photo_url);
      }
    });

    // Add journal entry images
    journal.forEach((entry) => {
      if (entry.photo_urls && entry.photo_urls.length > 0) {
        imageUris.push(...entry.photo_urls);
      }
      if (entry.photo_url) {
        imageUris.push(entry.photo_url);
      }
    });

    console.log(`Found ${imageUris.length} images to export`);

    if (imageUris.length === 0) {
      throw new Error("No images found to export");
    }

    // Create a minimal manifest file
    const manifest = {
      exportDate: new Date().toISOString(),
      imageCount: imageUris.length,
      note: "This is an images-only backup. Import this on another device to restore photos.",
    };

    // Create ZIP with images only (plus manifest)
    const zipUri = await createZipWithImages(manifest, imageUris);

    console.log("Images-only backup created:", zipUri);

    // Share the file
    if (Platform.OS !== "web" && (await isAvailableAsync())) {
      await shareAsync(zipUri, {
        mimeType: "application/zip",
        dialogTitle: "Save Images Backup",
        UTI: "public.zip-archive",
      });
    }

    return zipUri;
  } catch (error) {
    console.error("Error exporting images:", error);
    throw new Error("Failed to export images: " + (error as Error).message);
  }
};

/**
 * Helper function to extract clean filename from URI
 * Handles query params, fragments, and URL encoding
 */
const getFilenameFromUri = (uri: string): string | null => {
  if (!uri) return null;
  try {
    // Remove query params and fragments
    const cleanUri = uri.split("?")[0].split("#")[0];
    // Get filename from path
    const filename = cleanUri.split("/").pop();
    // Decode URL encoding (e.g., %20 for spaces)
    return filename ? decodeURIComponent(filename) : null;
  } catch (error) {
    console.warn("Failed to extract filename from URI:", uri, error);
    // Fallback to simple extraction
    return uri.split("/").pop()?.split("?")[0] || null;
  }
};

/**
 * Import ONLY images from a ZIP file
 * This restores photos without affecting any data
 * @returns Number of images imported
 */
export const importImagesOnly = async (): Promise<number> => {
  try {
    console.log("Starting images-only import...");

    // Let user pick a ZIP file
    const result = await getDocumentAsync({
      type: "application/zip",
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      throw new Error("Import cancelled");
    }

    if (!result.assets || result.assets.length === 0) {
      throw new Error("No backup file selected");
    }

    // Extract images from ZIP
    const IMAGES_DIR =
      Platform.OS === "web"
        ? ""
        : `${FileSystem.documentDirectory}garden_images/`;

    const { imageUris } = await extractZipWithImages(
      result.assets[0].uri,
      IMAGES_DIR
    );

    console.log(`Extracted ${imageUris.size} images to local storage`);
    console.log("Available image filenames:", Array.from(imageUris.keys()));

    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    // Update existing plants and journal entries to point to newly extracted images
    // This fixes the URIs to match the new local paths
    const plants = await getData<Plant>(KEYS.PLANTS);
    const journal = await getData<JournalEntry>(KEYS.JOURNAL);

    let plantsUpdated = 0;
    let journalUpdated = 0;

    // Update plant photo URIs in local cache
    const updatedPlants = plants.map((plant) => {
      if (plant.photo_url) {
        const filename = getFilenameFromUri(plant.photo_url);
        console.log(
          `Plant ${plant.name} - Looking for filename: "${filename}"`
        );
        const newUri = filename ? imageUris.get(filename) : null;
        if (newUri && newUri !== plant.photo_url) {
          console.log(`✓ Updating plant ${plant.name} photo: ${filename}`);
          plantsUpdated++;
          return { ...plant, photo_url: newUri };
        } else if (filename && !imageUris.has(filename)) {
          console.log(`✗ No match found for plant ${plant.name}: ${filename}`);
        }
      }
      return plant;
    });

    // Update journal photo URIs in local cache
    const updatedJournal = journal.map((entry) => {
      let updated = false;
      let entryPhotos: string[] = [];

      // Handle photo_urls array
      if (entry.photo_urls && entry.photo_urls.length > 0) {
        const updatedPhotos = entry.photo_urls.map((photoUri) => {
          const filename = getFilenameFromUri(photoUri);
          console.log(`Journal entry - Looking for filename: "${filename}"`);
          const newUri =
            filename && imageUris.has(filename)
              ? imageUris.get(filename)!
              : photoUri;
          if (newUri !== photoUri) {
            console.log(`✓ Updating journal photo: ${filename}`);
            updated = true;
          } else if (filename && !imageUris.has(filename)) {
            console.log(`✗ No match found for journal photo: ${filename}`);
          }
          return newUri;
        });
        if (updated) {
          journalUpdated++;
          return { ...entry, photo_urls: updatedPhotos };
        }
      }

      // Handle legacy photo_url field
      if (entry.photo_url) {
        const filename = getFilenameFromUri(entry.photo_url);
        console.log(
          `Journal entry (legacy) - Looking for filename: "${filename}"`
        );
        const newUri =
          filename && imageUris.has(filename)
            ? imageUris.get(filename)!
            : entry.photo_url;
        if (newUri !== entry.photo_url) {
          console.log(`✓ Updating journal legacy photo: ${filename}`);
          journalUpdated++;
          return { ...entry, photo_url: newUri };
        } else if (filename && !imageUris.has(filename)) {
          console.log(`✗ No match found for journal legacy photo: ${filename}`);
        }
      }

      return entry;
    });

    // Save updated data to local storage
    await setData(KEYS.PLANTS, updatedPlants);
    await setData(KEYS.JOURNAL, updatedJournal);

    console.log(`Updating Firestore with new image URIs...`);

    // Update Firestore for plants that changed
    const plantsToUpdate = updatedPlants.filter(
      (plant, idx) => plant !== plants[idx]
    );
    for (const plant of plantsToUpdate) {
      try {
        await withTimeoutAndRetry(
          () =>
            updateDoc(doc(db, "plants", plant.id), {
              photo_url: plant.photo_url,
            }),
          { timeoutMs: 10000, maxRetries: 2 }
        );
      } catch (error) {
        console.warn(`Failed to update plant ${plant.id} in Firestore:`, error);
      }
    }

    // Update Firestore for journal entries that changed
    const journalToUpdate = updatedJournal.filter(
      (entry, idx) => entry !== journal[idx]
    );
    for (const entry of journalToUpdate) {
      try {
        const updates: any = {};
        if (entry.photo_urls) {
          updates.photo_urls = entry.photo_urls;
        }
        if (entry.photo_url) {
          updates.photo_url = entry.photo_url;
        }
        await withTimeoutAndRetry(
          () => updateDoc(doc(db, "journal_entries", entry.id), updates),
          { timeoutMs: 10000, maxRetries: 2 }
        );
      } catch (error) {
        console.warn(
          `Failed to update journal entry ${entry.id} in Firestore:`,
          error
        );
      }
    }

    console.log(`Images import completed:`);
    console.log(`- ${imageUris.size} images extracted`);
    console.log(`- ${plantsUpdated} plant photos updated`);
    console.log(`- ${journalUpdated} journal entries updated`);

    return imageUris.size;
  } catch (error) {
    console.error("Error importing images:", error);
    throw new Error("Failed to import images: " + (error as Error).message);
  }
};
