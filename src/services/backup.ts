/**
 * Backup Service (Images Only)
 *
 * This service intentionally supports only image export/import.
 * Data-only and complete (data + images) backup flows have been removed.
 */

import * as FileSystem from "expo-file-system/legacy";
import { shareAsync, isAvailableAsync } from "expo-sharing";
import { getDocumentAsync } from "expo-document-picker";
import { Platform } from "react-native";
import { getData, setData, KEYS } from "../lib/storage";
import { getArchivedPlants, getPlants } from "./plants";
import { getJournalEntries } from "./journal";
import { Plant, JournalEntry } from "../types/database.types";
import { withTimeoutAndRetry } from "../utils/firestoreTimeout";
import {
  createZipWithImages,
  extractZipWithImages,
  ZipImageFile,
} from "../utils/zipHelper";
import {
  getFilenameFromUri,
  imageExists,
  migrateImagesToMediaLibrary,
  resolveLocalImageUri,
} from "../lib/imageStorage";

const BACKUP_PLANT_PAGE_SIZE = 200;

const getAllPlantsForBackup = async (): Promise<Plant[]> => {
  const paginatedPlants: Plant[] = [];
  let lastDoc: any;

  while (true) {
    const { plants, lastDoc: newLastDoc } = await getPlants(
      BACKUP_PLANT_PAGE_SIZE,
      lastDoc
    );

    if (plants.length === 0) {
      break;
    }

    paginatedPlants.push(...plants);

    if (!newLastDoc || plants.length < BACKUP_PLANT_PAGE_SIZE) {
      break;
    }

    lastDoc = newLastDoc;
  }

  let archivedPlants: Plant[] = [];
  try {
    archivedPlants = await getArchivedPlants();
  } catch (error) {
    console.warn("Failed to fetch archived plants for backup:", error);
  }

  const mergedPlants = new Map<string, Plant>();
  paginatedPlants.forEach((plant) => mergedPlants.set(plant.id, plant));
  archivedPlants.forEach((plant) => mergedPlants.set(plant.id, plant));

  return Array.from(mergedPlants.values());
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
 * Export ONLY images as a ZIP file (no data)
 * This creates an images-only archive for backup or transfer
 * @returns The file URI of the created images ZIP
 */
export const exportImagesOnly = async (): Promise<string> => {
  try {
    console.log("Starting images-only export...");

    const [plants, journal] = await withTimeoutAndRetry(
      () => Promise.all([getAllPlantsForBackup(), getJournalEntries()]),
      { timeoutMs: 30000 }
    );

    const imageFiles: ZipImageFile[] = [];
    const imageFilenames = new Set<string>();

    plants.forEach((plant) => {
      const photoFilename =
        plant.photo_filename ?? getFilenameFromUri(plant.photo_url ?? "");
      if (photoFilename) {
        imageFilenames.add(photoFilename);
      }
    });

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

    const manifest = {
      exportDate: new Date().toISOString(),
      imageCount: imageFiles.length,
      note: "This is an images-only backup. Import this on another device to restore photos.",
    };

    const zipUri = await createZipWithImages(manifest, imageFiles);

    console.log("Images-only backup created:", zipUri);

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

    const plants = await getData<Plant>(KEYS.PLANTS);
    const journal = await getData<JournalEntry>(KEYS.JOURNAL);

    let plantsUpdated = 0;
    let journalUpdated = 0;

    const updatedPlants = await Promise.all(
      plants.map(async (plant) => {
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
      })
    );

    const updatedJournal = await Promise.all(
      journal.map(async (entry) => {
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
              const matched = await resolveImportedImageUri(
                getImportedImageUri,
                filename
              );
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
          JSON.stringify(entry.photo_urls ?? []) !==
            JSON.stringify(updatedPhotos) ||
          !!entry.photo_url;

        if (changed) {
          journalUpdated++;
        }
        return nextEntry;
      })
    );

    await setData(KEYS.PLANTS, updatedPlants);
    await setData(KEYS.JOURNAL, updatedJournal);

    console.log("Images import completed:");
    console.log(`- ${imageUris.size} images extracted`);
    console.log(`- ${plantsUpdated} plant photos updated`);
    console.log(`- ${journalUpdated} journal entries updated`);

    return imageUris.size;
  } catch (error) {
    console.error("Error importing images:", error);
    throw new Error("Failed to import images: " + (error as Error).message);
  }
};
