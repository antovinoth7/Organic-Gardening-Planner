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
import { getArchivedPlants, getPlants } from "./plants";
import { getTaskTemplates, getTaskLogs } from "./tasks";
import { getJournalEntries } from "./journal";
import { auth, db, refreshAuthToken } from "../lib/firebase";
import {
  Plant,
  TaskTemplate,
  TaskLog,
  JournalEntry,
  LocationConfig,
  PlantCatalog,
  PlantCareProfiles,
  PlantType,
} from "../types/database.types";
import { getLocationConfig, saveLocationConfig } from "./locations";
import {
  DEFAULT_PLANT_CATALOG,
  PLANT_CATEGORIES,
  getPlantCatalog,
  savePlantCatalog,
} from "./plantCatalog";
import {
  getPlantCareProfiles,
  savePlantCareProfiles,
} from "./plantCareProfiles";
import { withTimeoutAndRetry } from "../utils/firestoreTimeout";
import {
  createZipWithImages,
  extractZipWithImages,
  ZipImageFile,
} from "../utils/zipHelper";
import { Platform } from "react-native";
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import {
  getFilenameFromUri,
  imageExists,
  migrateImagesToMediaLibrary,
  resolveLocalImageUri,
  resolveLocalImageUris,
} from "../lib/imageStorage";

interface BackupData {
  version: string;
  exportDate: string;
  plants: Plant[];
  tasks: TaskTemplate[];
  taskLogs: TaskLog[];
  journal: JournalEntry[];
  locations?: LocationConfig | null;
  plantCatalog?: PlantCatalog | null;
  plantCareProfiles?: PlantCareProfiles | null;
  // Note: Images are stored locally and NOT included in the backup
  // Only the image filenames are included in the plant/journal objects
}

const BACKUP_PLANT_PAGE_SIZE = 200;
const PLANTS_COLLECTION = "plants";
const TASKS_COLLECTION = "task_templates";
const TASK_LOGS_COLLECTION = "task_logs";
const JOURNAL_COLLECTION = "journal_entries";
const MAX_FIRESTORE_BATCH_WRITES = 450;

type BackupFirestoreCollectionName =
  | typeof PLANTS_COLLECTION
  | typeof TASKS_COLLECTION
  | typeof TASK_LOGS_COLLECTION
  | typeof JOURNAL_COLLECTION;

interface FirestoreImportRecord {
  id: string;
  data: Record<string, any>;
}

type FirestoreWriteOperation =
  | { type: "set"; record: FirestoreImportRecord }
  | { type: "delete"; id: string };

const toFirestoreTimestamp = (value: unknown): Timestamp | null => {
  if (!value) return null;

  if (value instanceof Timestamp) {
    return value;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return Timestamp.fromDate(value);
  }

  if (typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return Timestamp.fromDate(parsed);
    }
    return null;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return Timestamp.fromDate(parsed);
    }
    return null;
  }

  if (typeof value === "object") {
    const asAny = value as Record<string, any>;
    if (
      typeof asAny.seconds === "number" &&
      typeof asAny.nanoseconds === "number"
    ) {
      return new Timestamp(asAny.seconds, asAny.nanoseconds);
    }
    if (typeof asAny.toDate === "function") {
      try {
        const parsed = asAny.toDate();
        if (parsed instanceof Date && !Number.isNaN(parsed.getTime())) {
          return Timestamp.fromDate(parsed);
        }
      } catch {
        // Ignore invalid custom timestamp object.
      }
    }
  }

  return null;
};

const stripUndefinedFields = (value: any): any => {
  if (value === undefined) return undefined;

  if (Array.isArray(value)) {
    return value
      .map((item) => stripUndefinedFields(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    if (value instanceof Timestamp || value instanceof Date) {
      return value;
    }

    const result: Record<string, any> = {};
    Object.entries(value).forEach(([key, nested]) => {
      if (nested === undefined) return;
      const sanitized = stripUndefinedFields(nested);
      if (sanitized !== undefined) {
        result[key] = sanitized;
      }
    });
    return result;
  }

  return value;
};

const toPlantImportRecord = (
  plant: Plant,
  userId: string
): FirestoreImportRecord | null => {
  if (!plant.id) return null;

  const photoFilename =
    plant.photo_filename ?? getFilenameFromUri(plant.photo_url ?? "");
  const { id, photo_url: _photoUrl, created_at: _createdAt, deleted_at: _deletedAt, ...rest } = plant;

  const payload = stripUndefinedFields({
    ...rest,
    user_id: userId,
    photo_filename: photoFilename ?? null,
    created_at: toFirestoreTimestamp(plant.created_at) ?? Timestamp.now(),
    deleted_at: toFirestoreTimestamp(plant.deleted_at) ?? null,
    is_deleted: plant.is_deleted ?? false,
  });

  return { id, data: payload };
};

const toTaskImportRecord = (
  task: TaskTemplate,
  userId: string
): FirestoreImportRecord | null => {
  if (!task.id) return null;

  const { id, created_at: _createdAt, next_due_at: _nextDueAt, ...rest } = task;
  const payload = stripUndefinedFields({
    ...rest,
    user_id: userId,
    created_at: toFirestoreTimestamp(task.created_at) ?? Timestamp.now(),
    next_due_at: toFirestoreTimestamp(task.next_due_at) ?? null,
  });

  return { id, data: payload };
};

const toTaskLogImportRecord = (
  log: TaskLog,
  userId: string
): FirestoreImportRecord | null => {
  if (!log.id) return null;

  const doneAt =
    toFirestoreTimestamp(log.done_at) ??
    toFirestoreTimestamp(log.created_at) ??
    Timestamp.now();
  const createdAt = toFirestoreTimestamp(log.created_at) ?? doneAt;

  const { id, done_at: _doneAt, created_at: _createdAt, ...rest } = log;
  const payload = stripUndefinedFields({
    ...rest,
    user_id: userId,
    done_at: doneAt,
    created_at: createdAt,
  });

  return { id, data: payload };
};

const toJournalImportRecord = (
  entry: JournalEntry,
  userId: string
): FirestoreImportRecord | null => {
  if (!entry.id) return null;

  const legacyUrls =
    entry.photo_urls && entry.photo_urls.length > 0
      ? entry.photo_urls
      : entry.photo_url
      ? [entry.photo_url]
      : [];
  const photoFilenames =
    entry.photo_filenames && entry.photo_filenames.length > 0
      ? entry.photo_filenames
      : legacyUrls
          .map((uri) => getFilenameFromUri(uri))
          .filter((filename): filename is string => !!filename);

  const {
    id,
    photo_urls: _photoUrls,
    photo_url: _photoUrl,
    created_at: _createdAt,
    ...rest
  } = entry;

  const payload = stripUndefinedFields({
    ...rest,
    user_id: userId,
    photo_filenames: photoFilenames,
    created_at: toFirestoreTimestamp(entry.created_at) ?? Timestamp.now(),
  });

  return { id, data: payload };
};

const commitFirestoreOperations = async (
  collectionName: BackupFirestoreCollectionName,
  operations: FirestoreWriteOperation[]
): Promise<void> => {
  if (operations.length === 0) return;

  let batch = writeBatch(db);
  let operationCount = 0;

  const commitCurrentBatch = async () => {
    if (operationCount === 0) return;

    await withTimeoutAndRetry(() => batch.commit(), {
      timeoutMs: 20000,
      maxRetries: 2,
    });

    batch = writeBatch(db);
    operationCount = 0;
  };

  for (const operation of operations) {
    if (operation.type === "delete") {
      batch.delete(doc(db, collectionName, operation.id));
    } else {
      batch.set(doc(db, collectionName, operation.record.id), operation.record.data, {
        merge: false,
      });
    }

    operationCount += 1;

    if (operationCount >= MAX_FIRESTORE_BATCH_WRITES) {
      await commitCurrentBatch();
    }
  }

  await commitCurrentBatch();
};

const syncCollectionFromBackup = async (
  collectionName: BackupFirestoreCollectionName,
  userId: string,
  overwrite: boolean,
  records: FirestoreImportRecord[]
): Promise<void> => {
  const uniqueRecords = Array.from(
    records.reduce((map, record) => {
      if (record.id) {
        map.set(record.id, record);
      }
      return map;
    }, new Map<string, FirestoreImportRecord>()).values()
  );

  const setOperations: FirestoreWriteOperation[] = uniqueRecords.map((record) => ({
    type: "set",
    record,
  }));
  const deleteOperations: FirestoreWriteOperation[] = [];

  if (overwrite) {
    const incomingIds = new Set(uniqueRecords.map((record) => record.id));
    const existingSnapshot = await withTimeoutAndRetry(
      () =>
        getDocs(
          query(collection(db, collectionName), where("user_id", "==", userId))
        ),
      { timeoutMs: 20000, maxRetries: 2 }
    );

    existingSnapshot.docs.forEach((docSnap) => {
      if (!incomingIds.has(docSnap.id)) {
        deleteOperations.push({ type: "delete", id: docSnap.id });
      }
    });
  }

  await commitFirestoreOperations(collectionName, [
    ...deleteOperations,
    ...setOperations,
  ]);
};

const syncBackupDataToFirestore = async (
  overwrite: boolean,
  importedPlants: Plant[],
  importedTasks: TaskTemplate[],
  importedTaskLogs: TaskLog[],
  importedJournal: JournalEntry[]
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not authenticated");
  }

  const tokenReady = await refreshAuthToken();
  if (!tokenReady) {
    throw new Error("Authentication expired. Please sign in again.");
  }

  const plantRecords = importedPlants
    .map((plant) => toPlantImportRecord(plant, user.uid))
    .filter((record): record is FirestoreImportRecord => !!record);
  const taskRecords = importedTasks
    .map((task) => toTaskImportRecord(task, user.uid))
    .filter((record): record is FirestoreImportRecord => !!record);
  const taskLogRecords = importedTaskLogs
    .map((log) => toTaskLogImportRecord(log, user.uid))
    .filter((record): record is FirestoreImportRecord => !!record);
  const journalRecords = importedJournal
    .map((entry) => toJournalImportRecord(entry, user.uid))
    .filter((record): record is FirestoreImportRecord => !!record);

  await syncCollectionFromBackup(
    PLANTS_COLLECTION,
    user.uid,
    overwrite,
    plantRecords
  );
  await syncCollectionFromBackup(
    TASKS_COLLECTION,
    user.uid,
    overwrite,
    taskRecords
  );
  await syncCollectionFromBackup(
    TASK_LOGS_COLLECTION,
    user.uid,
    overwrite,
    taskLogRecords
  );
  await syncCollectionFromBackup(
    JOURNAL_COLLECTION,
    user.uid,
    overwrite,
    journalRecords
  );
};

const getAllPlantsForBackup = async (): Promise<Plant[]> => {
  const allPlants: Plant[] = [];
  const seenIds = new Set<string>();

  let lastDoc: QueryDocumentSnapshot | undefined;

  while (true) {
    const { plants, lastDoc: nextLastDoc } = await getPlants(
      BACKUP_PLANT_PAGE_SIZE,
      lastDoc
    );

    plants.forEach((plant) => {
      if (seenIds.has(plant.id)) return;
      seenIds.add(plant.id);
      allPlants.push(plant);
    });

    if (!nextLastDoc || plants.length === 0) {
      break;
    }

    lastDoc = nextLastDoc;
  }

  try {
    const archivedPlants = await getArchivedPlants();
    archivedPlants.forEach((plant) => {
      if (seenIds.has(plant.id)) return;
      seenIds.add(plant.id);
      allPlants.push(plant);
    });
  } catch (error) {
    console.warn("Failed to fetch archived plants for backup:", error);
  }

  return allPlants;
};

const getNormalizedFilename = (value?: string | null): string | null => {
  const filename = getFilenameFromUri(value ?? "");
  return filename ? filename.toLowerCase() : null;
};

const buildImageUriLookup = (imageUris: Map<string, string>) => {
  const normalized = new Map<string, string>();
  imageUris.forEach((uri, filename) => {
    const key = getNormalizedFilename(filename);
    if (key) {
      normalized.set(key, uri);
    }
  });

  return (filename?: string | null): string | null => {
    const key = getNormalizedFilename(filename);
    if (!key) return null;
    return normalized.get(key) ?? null;
  };
};

const resolveImportedImageUri = async (
  getImportedImageUri: (filename?: string | null) => string | null,
  filename?: string | null
): Promise<string | null> => {
  const importedUri = getImportedImageUri(filename);

  if (importedUri) {
    const resolvedImportedUri = await resolveLocalImageUri(importedUri);
    if (resolvedImportedUri && (await imageExists(resolvedImportedUri))) {
      return resolvedImportedUri;
    }
  }

  return resolveLocalImageUri(filename ?? null);
};

/**
 * Export all data to a JSON backup file
 * @returns The file URI of the created backup
 */
export const exportBackup = async (): Promise<string> => {
  try {
    console.log("Starting backup export...");

    // Fetch all data from Firestore (or use cached if offline) with timeout
    const [plants, tasks, taskLogs, journal] = await withTimeoutAndRetry(
      () =>
        Promise.all([
          getAllPlantsForBackup(),
          getTaskTemplates(),
          getTaskLogs(),
          getJournalEntries(),
        ]),
      { timeoutMs: 30000 } // 30 second timeout because plants can be paginated
    );

    const normalizedPlants = plants.map((plant) => {
      const photoFilename =
        plant.photo_filename ?? getFilenameFromUri(plant.photo_url ?? "");
      return {
        ...plant,
        photo_filename: photoFilename ?? null,
        photo_url: null,
      };
    });
    const normalizedJournal = journal.map((entry) => {
      const legacyUrls =
        entry.photo_urls && entry.photo_urls.length > 0
          ? entry.photo_urls
          : entry.photo_url
          ? [entry.photo_url]
          : [];
      const photoFilenames =
        entry.photo_filenames && entry.photo_filenames.length > 0
          ? entry.photo_filenames
          : legacyUrls
              .map((uri) => getFilenameFromUri(uri))
              .filter((filename): filename is string => !!filename);
      return {
        ...entry,
        photo_filenames: photoFilenames,
        photo_urls: [],
        photo_url: null,
      };
    });

    const locations = await getLocationConfig();
    const plantCatalog = await getPlantCatalog();
    const plantCareProfiles = await getPlantCareProfiles();

    // Create backup object
    const backup: BackupData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      plants: normalizedPlants,
      tasks,
      taskLogs,
      journal: normalizedJournal,
      locations,
      plantCatalog,
      plantCareProfiles,
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
  cloudSynced: boolean;
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
    } catch {
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

    const normalizedPlants = await Promise.all(
      backup.plants.map(async (plant) => {
        const photoFilename =
          plant.photo_filename ?? getFilenameFromUri(plant.photo_url ?? "");
        const resolvedPhotoUrl = await resolveLocalImageUri(
          photoFilename ?? null
        );
        return {
          ...plant,
          photo_filename: photoFilename ?? null,
          photo_url: resolvedPhotoUrl ?? null,
        };
      })
    );

    const normalizedJournal = await Promise.all(
      backup.journal.map(async (entry) => {
        const legacyUrls =
          entry.photo_urls && entry.photo_urls.length > 0
            ? entry.photo_urls
            : entry.photo_url
            ? [entry.photo_url]
            : [];
        const photoFilenames =
          entry.photo_filenames && entry.photo_filenames.length > 0
            ? entry.photo_filenames
            : legacyUrls
                .map((uri) => getFilenameFromUri(uri))
                .filter((filename): filename is string => !!filename);
        const resolvedPhotoUrls =
          photoFilenames.length > 0
            ? await resolveLocalImageUris(photoFilenames)
            : await resolveLocalImageUris(legacyUrls);
        return {
          ...entry,
          photo_filenames: photoFilenames,
          photo_urls: resolvedPhotoUrls,
          photo_url: null,
        };
      })
    );

    // Persist imported data to Firestore first for cross-device durability.
    await syncBackupDataToFirestore(
      overwrite,
      normalizedPlants,
      backup.tasks,
      backup.taskLogs,
      normalizedJournal
    );

    // Import data based on overwrite mode
    if (overwrite) {
      // Replace all data
      await setData(KEYS.PLANTS, normalizedPlants);
      await setData(KEYS.TASKS, backup.tasks);
      await setData(KEYS.TASK_LOGS, backup.taskLogs);
      await setData(KEYS.JOURNAL, normalizedJournal);
    } else {
      // Merge with existing data (keep existing items, add new ones)
      const existingPlants = await getData<Plant>(KEYS.PLANTS);
      const existingTasks = await getData<TaskTemplate>(KEYS.TASKS);
      const existingLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
      const existingJournal = await getData<JournalEntry>(KEYS.JOURNAL);

      // Merge by ID, preferring backup data for conflicts
      const mergedPlants = mergeByIdPreferBackup(
        existingPlants,
        normalizedPlants
      );
      const mergedTasks = mergeByIdPreferBackup(existingTasks, backup.tasks);
      const mergedLogs = mergeByIdPreferBackup(existingLogs, backup.taskLogs);
      const mergedJournal = mergeByIdPreferBackup(
        existingJournal,
        normalizedJournal
      );

      await setData(KEYS.PLANTS, mergedPlants);
      await setData(KEYS.TASKS, mergedTasks);
      await setData(KEYS.TASK_LOGS, mergedLogs);
      await setData(KEYS.JOURNAL, mergedJournal);
    }

    if (
      backup.locations &&
      Array.isArray(backup.locations.parentLocations) &&
      Array.isArray(backup.locations.childLocations)
    ) {
      if (overwrite) {
        await saveLocationConfig(backup.locations);
      } else {
        const existingLocations = await getLocationConfig();
        const mergedLocations = {
          parentLocations: mergeLocationLists(
            existingLocations.parentLocations,
            backup.locations.parentLocations
          ),
          childLocations: mergeLocationLists(
            existingLocations.childLocations,
            backup.locations.childLocations
          ),
        };
        await saveLocationConfig(mergedLocations);
      }
    }

    if (backup.plantCatalog && backup.plantCatalog.categories) {
      if (overwrite) {
        await savePlantCatalog(backup.plantCatalog);
      } else {
        const existingCatalog = await getPlantCatalog();
        const mergedCatalog = mergePlantCatalog(
          existingCatalog,
          backup.plantCatalog
        );
        await savePlantCatalog(mergedCatalog);
      }
    }

    if (backup.plantCareProfiles) {
      if (overwrite) {
        await savePlantCareProfiles(backup.plantCareProfiles);
      } else {
        const existingProfiles = await getPlantCareProfiles();
        const mergedProfiles = mergePlantCareProfiles(
          existingProfiles,
          backup.plantCareProfiles
        );
        await savePlantCareProfiles(mergedProfiles);
      }
    }

    console.log("Import completed successfully");

    return {
      plants: backup.plants.length,
      tasks: backup.tasks.length,
      taskLogs: backup.taskLogs.length,
      journal: backup.journal.length,
      cloudSynced: true,
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

function mergeLocationLists(base: string[], incoming: string[]): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  base.forEach((item) => {
    const trimmed = item?.toString().trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(trimmed);
  });

  incoming.forEach((item) => {
    const trimmed = item?.toString().trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(trimmed);
  });

  return merged;
}

function mergePlantCatalog(
  existingCatalog: PlantCatalog,
  incomingCatalog: PlantCatalog
): PlantCatalog {
  const categories = {} as Record<
    PlantType,
    { plants: string[]; varieties: Record<string, string[]> }
  >;

  PLANT_CATEGORIES.forEach((category) => {
    const existingCategory =
      existingCatalog.categories?.[category] ??
      DEFAULT_PLANT_CATALOG.categories[category];
    const incomingCategory = incomingCatalog.categories?.[category];

    const plants = mergeLocationLists(
      existingCategory.plants || [],
      incomingCategory?.plants || []
    );

    const varieties: Record<string, string[]> = {
      ...(existingCategory.varieties || {}),
    };

    Object.entries(incomingCategory?.varieties || {}).forEach(
      ([plantName, list]) => {
        varieties[plantName] = mergeLocationLists(
          varieties[plantName] || [],
          list || []
        );
      }
    );

    categories[category] = { plants, varieties };
  });

  return { categories };
}

function mergePlantCareProfiles(
  existingProfiles: PlantCareProfiles,
  incomingProfiles: PlantCareProfiles
): PlantCareProfiles {
  const merged = {} as PlantCareProfiles;

  PLANT_CATEGORIES.forEach((type) => {
    merged[type] = {
      ...(existingProfiles?.[type] ?? {}),
      ...(incomingProfiles?.[type] ?? {}),
    };
  });

  return merged;
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
    const [plants, tasks, taskLogs, journal] = await withTimeoutAndRetry(
      () =>
        Promise.all([
          getAllPlantsForBackup(),
          getTaskTemplates(),
          getTaskLogs(),
          getJournalEntries(),
        ]),
      { timeoutMs: 30000 }
    );

    const normalizedPlants = plants.map((plant) => {
      const photoFilename =
        plant.photo_filename ?? getFilenameFromUri(plant.photo_url ?? "");
      return {
        ...plant,
        photo_filename: photoFilename ?? null,
        photo_url: null,
      };
    });
    const normalizedJournal = journal.map((entry) => {
      const legacyUrls =
        entry.photo_urls && entry.photo_urls.length > 0
          ? entry.photo_urls
          : entry.photo_url
          ? [entry.photo_url]
          : [];
      const photoFilenames =
        entry.photo_filenames && entry.photo_filenames.length > 0
          ? entry.photo_filenames
          : legacyUrls
              .map((uri) => getFilenameFromUri(uri))
              .filter((filename): filename is string => !!filename);
      return {
        ...entry,
        photo_filenames: photoFilenames,
        photo_urls: [],
        photo_url: null,
      };
    });

    const locations = await getLocationConfig();
    const plantCatalog = await getPlantCatalog();
    const plantCareProfiles = await getPlantCareProfiles();

    // Create backup object
    const backup: BackupData = {
      version: "1.0.0",
      exportDate: new Date().toISOString(),
      plants: normalizedPlants,
      tasks,
      taskLogs,
      journal: normalizedJournal,
      locations,
      plantCatalog,
      plantCareProfiles,
    };

    // Collect all image URIs from plants and journal entries
    const imageFiles: ZipImageFile[] = [];
    const imageFilenames = new Set<string>();

    normalizedPlants.forEach((plant) => {
      if (plant.photo_filename) {
        imageFilenames.add(plant.photo_filename);
      }
    });

    normalizedJournal.forEach((entry) => {
      if (entry.photo_filenames && entry.photo_filenames.length > 0) {
        entry.photo_filenames.forEach((filename) => imageFilenames.add(filename));
      }
    });

    const resolvedImages = await Promise.all(
      Array.from(imageFilenames).map(async (filename) => ({
        filename,
        uri: await resolveLocalImageUri(filename),
      }))
    );
    resolvedImages.forEach((image) => {
      if (image.uri) {
        imageFiles.push({
          filename: image.filename,
          uri: image.uri,
        });
      }
    });

    console.log(`Found ${imageFiles.length} images to backup`);

    // Create ZIP with JSON and images
    const zipUri = await createZipWithImages(backup, imageFiles);

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
  cloudSynced: boolean;
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
    const getImportedImageUri = buildImageUriLookup(imageUris);

    // Move extracted images to persistent MediaLibrary on Android when possible.
    if (Platform.OS === "android") {
      try {
        const migration = await migrateImagesToMediaLibrary();
        console.log("Post-import migration:", migration.message);
      } catch (migrationError) {
        console.warn("Post-import migration failed:", migrationError);
      }
    }

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

    // Update image URIs and filenames in the backup data
    const updatedPlants = await Promise.all(
      backup.plants.map(async (plant) => {
        const photoFilename =
          plant.photo_filename ?? getFilenameFromUri(plant.photo_url ?? "");
        const newUri = await resolveImportedImageUri(
          getImportedImageUri,
          photoFilename
        );
        return {
          ...plant,
          photo_filename: photoFilename ?? null,
          photo_url: newUri ?? null,
        };
      })
    );

    const updatedJournal = await Promise.all(
      backup.journal.map(async (entry) => {
        const legacyUrls =
          entry.photo_urls && entry.photo_urls.length > 0
            ? entry.photo_urls
            : entry.photo_url
            ? [entry.photo_url]
            : [];
        const photoFilenames =
          entry.photo_filenames && entry.photo_filenames.length > 0
            ? entry.photo_filenames
            : legacyUrls
                .map((uri) => getFilenameFromUri(uri))
                .filter((filename): filename is string => !!filename);
        const updatedPhotos = (
          await Promise.all(
            photoFilenames.map(async (filename) => {
              return resolveImportedImageUri(getImportedImageUri, filename);
            })
          )
        ).filter((uri): uri is string => !!uri);
        return {
          ...entry,
          photo_filenames: photoFilenames,
          photo_urls: updatedPhotos,
          photo_url: null,
        };
      })
    );

    // Persist imported data to Firestore first for cross-device durability.
    await syncBackupDataToFirestore(
      overwrite,
      updatedPlants,
      backup.tasks,
      backup.taskLogs,
      updatedJournal
    );

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

    if (
      backup.locations &&
      Array.isArray(backup.locations.parentLocations) &&
      Array.isArray(backup.locations.childLocations)
    ) {
      if (overwrite) {
        await saveLocationConfig(backup.locations);
      } else {
        const existingLocations = await getLocationConfig();
        const mergedLocations = {
          parentLocations: mergeLocationLists(
            existingLocations.parentLocations,
            backup.locations.parentLocations
          ),
          childLocations: mergeLocationLists(
            existingLocations.childLocations,
            backup.locations.childLocations
          ),
        };
        await saveLocationConfig(mergedLocations);
      }
    }

    if (backup.plantCareProfiles) {
      if (overwrite) {
        await savePlantCareProfiles(backup.plantCareProfiles);
      } else {
        const existingProfiles = await getPlantCareProfiles();
        const mergedProfiles = mergePlantCareProfiles(
          existingProfiles,
          backup.plantCareProfiles
        );
        await savePlantCareProfiles(mergedProfiles);
      }
    }

    if (backup.plantCatalog && backup.plantCatalog.categories) {
      if (overwrite) {
        await savePlantCatalog(backup.plantCatalog);
      } else {
        const existingCatalog = await getPlantCatalog();
        const mergedCatalog = mergePlantCatalog(
          existingCatalog,
          backup.plantCatalog
        );
        await savePlantCatalog(mergedCatalog);
      }
    }

    console.log("Import with images completed successfully");

    return {
      plants: backup.plants.length,
      tasks: backup.tasks.length,
      taskLogs: backup.taskLogs.length,
      journal: backup.journal.length,
      images: imageUris.size,
      cloudSynced: true,
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
    const [plants, journal] = await withTimeoutAndRetry(
      () => Promise.all([getAllPlantsForBackup(), getJournalEntries()]),
      { timeoutMs: 30000 }
    );

    // Collect all image URIs
    const imageFiles: ZipImageFile[] = [];
    const imageFilenames = new Set<string>();

    // Add plant images
    plants.forEach((plant) => {
      const photoFilename =
        plant.photo_filename ?? getFilenameFromUri(plant.photo_url ?? "");
      if (photoFilename) {
        imageFilenames.add(photoFilename);
      }
    });

    // Add journal entry images
    journal.forEach((entry) => {
      const legacyUrls =
        entry.photo_urls && entry.photo_urls.length > 0
          ? entry.photo_urls
          : entry.photo_url
          ? [entry.photo_url]
          : [];
      const photoFilenames =
        entry.photo_filenames && entry.photo_filenames.length > 0
          ? entry.photo_filenames
          : legacyUrls
              .map((uri) => getFilenameFromUri(uri))
              .filter((filename): filename is string => !!filename);
      photoFilenames.forEach((filename) => imageFilenames.add(filename));
    });

    const resolvedImages = await Promise.all(
      Array.from(imageFilenames).map(async (filename) => ({
        filename,
        uri: await resolveLocalImageUri(filename),
      }))
    );
    resolvedImages.forEach((image) => {
      if (image.uri) {
        imageFiles.push({
          filename: image.filename,
          uri: image.uri,
        });
      }
    });

    console.log(`Found ${imageFiles.length} images to export`);

    if (imageFiles.length === 0) {
      throw new Error("No images found to export");
    }

    // Create a minimal manifest file
    const manifest = {
      exportDate: new Date().toISOString(),
      imageCount: imageFiles.length,
      note: "This is an images-only backup. Import this on another device to restore photos.",
    };

    // Create ZIP with images only (plus manifest)
    const zipUri = await createZipWithImages(manifest, imageFiles);

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
    const getImportedImageUri = buildImageUriLookup(imageUris);

    if (Platform.OS === "android") {
      try {
        const migration = await migrateImagesToMediaLibrary();
        console.log("Post-import migration:", migration.message);
      } catch (migrationError) {
        console.warn("Post-import migration failed:", migrationError);
      }
    }

    console.log(`Extracted ${imageUris.size} images to local storage`);
    console.log("Available image filenames:", Array.from(imageUris.keys()));

    // Update existing plants and journal entries to point to newly extracted images
    // This fixes the URIs to match the new local paths
    const plants = await getData<Plant>(KEYS.PLANTS);
    const journal = await getData<JournalEntry>(KEYS.JOURNAL);

    let plantsUpdated = 0;
    let journalUpdated = 0;

    // Update plant photo URIs in local cache
    const updatedPlants = await Promise.all(plants.map(async (plant) => {
      const photoFilename =
        plant.photo_filename ?? getFilenameFromUri(plant.photo_url ?? "");
      if (!photoFilename) return plant;

      const newUri =
        (await resolveImportedImageUri(getImportedImageUri, photoFilename)) ??
        null;
      const nextPlant = {
        ...plant,
        photo_filename: photoFilename,
        photo_url: newUri ?? plant.photo_url ?? null,
      };
      const changed =
        (newUri && newUri !== plant.photo_url) ||
        (plant.photo_filename ?? null) !== (photoFilename ?? null);
      if (changed) {
        plantsUpdated++;
      }
      return nextPlant;
    }));

    // Update journal photo URIs in local cache
    const updatedJournal = await Promise.all(journal.map(async (entry) => {
      const legacyUrls =
        entry.photo_urls && entry.photo_urls.length > 0
          ? entry.photo_urls
          : entry.photo_url
          ? [entry.photo_url]
          : [];
      const photoFilenames =
        entry.photo_filenames && entry.photo_filenames.length > 0
          ? entry.photo_filenames
          : legacyUrls
              .map((uri) => getFilenameFromUri(uri))
              .filter((filename): filename is string => !!filename);
      if (photoFilenames.length === 0) return entry;

      const currentUrls = entry.photo_urls ?? [];
      const updatedPhotos = (
        await Promise.all(
          photoFilenames.map(async (filename, index) => {
            const matched =
              await resolveImportedImageUri(getImportedImageUri, filename);
            return matched ?? currentUrls[index] ?? null;
          })
        )
      ).filter((uri): uri is string => !!uri);

      const nextEntry = {
        ...entry,
        photo_filenames: photoFilenames,
        photo_urls: updatedPhotos,
        photo_url: null,
      };

      const changed =
        JSON.stringify(entry.photo_filenames ?? []) !==
          JSON.stringify(photoFilenames) ||
        JSON.stringify(entry.photo_urls ?? []) !== JSON.stringify(updatedPhotos) ||
        !!entry.photo_url;

      if (changed) {
        journalUpdated++;
      }
      return nextEntry;
    }));

    // Save updated data to local storage
    await setData(KEYS.PLANTS, updatedPlants);
    await setData(KEYS.JOURNAL, updatedJournal);

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
