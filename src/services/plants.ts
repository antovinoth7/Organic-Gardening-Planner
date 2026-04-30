import { Plant, GrowthStage, GrowthStageHistoryEntry } from "../types/database.types";
import { db, auth, refreshAuthToken } from "../lib/firebase";
import {
  collection,
  doc,
  documentId,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import {
  saveImageLocallyWithFilename,
  resolveLocalImageUri,
  SavedImage,
} from "../lib/imageStorage";
import { getData, setData, KEYS } from "../lib/storage";
import { withTimeoutAndRetry, FIRESTORE_WRITE_TIMEOUT_MS, FIRESTORE_READ_TIMEOUT_MS } from "../utils/firestoreTimeout";
import { logError } from "../utils/errorLogging";
import { logger } from "../utils/logger";
import { convertTimestamp } from "../utils/dateHelpers";
import { resolvePhotoFilename } from "../utils/photoFilename";
import {
  getCached,
  invalidate,
  dedup,
  CACHE_KEYS,
} from "../lib/dataCache";

const PLANTS_COLLECTION = "plants";
const DEFAULT_PAGE_SIZE = 50;
const FETCH_ALL_PAGE_SIZE = 100;

/**
 * Get all plants with offline-first approach and pagination support
 * @param pageSize - Number of plants to fetch per page (default: 50)
 * @param lastDoc - Last document from previous page (for pagination)
 * First returns cached data, then fetches from Firestore if online
 */
export const getPlants = async (
  pageSize: number = DEFAULT_PAGE_SIZE,
  lastDoc?: QueryDocumentSnapshot,
): Promise<{ plants: Plant[]; lastDoc?: QueryDocumentSnapshot }> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  // Refresh token to prevent expiration issues (tokens expire after 1 hour)
  await refreshAuthToken();

  try {
    // Build query with pagination
    let q = query(
      collection(db, PLANTS_COLLECTION),
      where("user_id", "==", user.uid),
      orderBy("created_at", "desc"),
      limit(pageSize),
    );

    if (lastDoc) {
      q = query(
        collection(db, PLANTS_COLLECTION),
        where("user_id", "==", user.uid),
        orderBy("created_at", "desc"),
        startAfter(lastDoc),
        limit(pageSize),
      );
    }

    // Wrap Firestore call with timeout
    const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
      timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
    });

    // Batch image resolution for better performance
    const plantsData = snapshot.docs.map((doc) => {
      const data = doc.data();
      const photoFilename = resolvePhotoFilename(data.photo_filename, data.photo_url);
      return {
        id: doc.id,
        ...data,
        photo_filename: photoFilename ?? null,
        photoIdentifier: data.photo_filename ?? data.photo_url ?? null,
        plant_type: data.plant_type || "vegetable",
        created_at: convertTimestamp(data.created_at),
        deleted_at: convertTimestamp(data.deleted_at),
        is_deleted: data.is_deleted ?? false,
      };
    });

    // Resolve all images in parallel
    const resolvedUrls = await Promise.all(
      plantsData.map(async (p) => {
        try {
          return await resolveLocalImageUri(p.photoIdentifier);
        } catch (error) {
          logger.warn("Failed to resolve plant image", error as Error);
          return null;
        }
      }),
    );

    const plants = plantsData.map((plant, index) => {
      const { photoIdentifier: _photoIdentifier, ...plantData } = plant;
      return {
        ...plantData,
        photo_url: resolvedUrls[index] ?? null,
      } as Plant;
    });
    const activePlants = plants.filter((plant) => !plant.is_deleted);

    // Cache the results locally (only first page to avoid memory issues)
    if (!lastDoc) {
      await setData(KEYS.PLANTS, activePlants);
    }

    return {
      plants: activePlants,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
    };
  } catch (error) {
    logger.warn("Failed to fetch plants, using cached data", error as Error);
    logError(
      "network",
      "Failed to fetch plants from Firestore",
      error as Error,
      { userId: user.uid },
    );
    // Fall back to cached data if offline
    const cachedPlants = await getData<Plant>(KEYS.PLANTS);
    // Batch resolve cached images for performance
    const photoIdentifiers = cachedPlants.map(
      (p) => p.photo_filename ?? p.photo_url ?? null,
    );
    const resolvedUrls = await Promise.all(
      photoIdentifiers.map(async (id) => {
        try {
          return await resolveLocalImageUri(id);
        } catch (error) {
          logger.warn("Failed to resolve cached plant image", error as Error);
          return null;
        }
      }),
    );

    const resolvedCached = cachedPlants.map((plant, index) => ({
      ...plant,
      photo_filename:
        plant.photo_filename ??
        resolvePhotoFilename(null, plant.photo_url) ??
        null,
      photo_url: resolvedUrls[index] ?? null,
    }));
    return { plants: resolvedCached.filter((plant) => !plant.is_deleted) };
  }
};

export const getAllPlants = async (
  pageSize: number = FETCH_ALL_PAGE_SIZE,
): Promise<Plant[]> => {
  // Return fresh in-memory data if available (< 30s old)
  const cached = getCached<Plant[]>(CACHE_KEYS.ALL_PLANTS);
  if (cached) return cached;

  return dedup(CACHE_KEYS.ALL_PLANTS, async () => {
    const allPlants: Plant[] = [];
    let lastDoc: QueryDocumentSnapshot | undefined = undefined;
    let hasMore = true;

    while (hasMore) {
      try {
        const response = await getPlants(pageSize, lastDoc);
        allPlants.push(...(response.plants ?? []));

        if (!response.lastDoc || response.plants.length < pageSize) {
          hasMore = false;
          continue;
        }

        lastDoc = response.lastDoc;
      } catch (error) {
        logger.warn(
          "getAllPlants: page fetch failed, returning partial results",
          error as Error,
        );
        break;
      }
    }

    return allPlants;
  });
};

export const getPlant = async (id: string): Promise<Plant | null> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  await refreshAuthToken();

  const docRef = doc(db, PLANTS_COLLECTION, id);

  const docSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });

  if (!docSnap.exists()) return null;

  const data = docSnap.data();

  // Security: Verify the plant belongs to the current user
  if (data.user_id !== user.uid) {
    logger.warn("Attempted to access plant belonging to another user");
    return null;
  }

  if (data.is_deleted) return null;

  const photoIdentifier = data.photo_filename ?? data.photo_url ?? null;
  const resolvedPhotoUrl = await resolveLocalImageUri(photoIdentifier);
  const photoFilename = resolvePhotoFilename(data.photo_filename, data.photo_url);

  return {
    id: docSnap.id,
    ...data,
    photo_filename: photoFilename ?? null,
    photo_url: resolvedPhotoUrl ?? null,
    created_at: convertTimestamp(data.created_at),
    deleted_at: convertTimestamp(data.deleted_at),
    is_deleted: data.is_deleted ?? false,
  } as Plant;
};

export const getArchivedPlants = async (): Promise<Plant[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  try {
    const q = query(
      collection(db, PLANTS_COLLECTION),
      where("user_id", "==", user.uid),
      where("is_deleted", "==", true),
    );

    const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
      timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
    });

    const plants = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        plant_type: data.plant_type || "vegetable",
        created_at: convertTimestamp(data.created_at),
        deleted_at: convertTimestamp(data.deleted_at),
        is_deleted: data.is_deleted ?? false,
      };
    }) as Plant[];

    plants.sort((a, b) => {
      const aDate = new Date(a.deleted_at || a.created_at).getTime();
      const bDate = new Date(b.deleted_at || b.created_at).getTime();
      return bDate - aDate;
    });

    return plants;
  } catch (error) {
    logger.warn("Failed to fetch archived plants, using cached data", error as Error);
    const cachedPlants = await getData<Plant>(KEYS.PLANTS);
    return cachedPlants.filter((plant) => plant.is_deleted);
  }
};

export const plantExists = async (id: string): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const q = query(
    collection(db, PLANTS_COLLECTION),
    where("user_id", "==", user.uid),
    where(documentId(), "==", id),
  );

  const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });

  return !snapshot.empty;
};

export const createPlant = async (
  plant: Omit<Plant, "id" | "user_id" | "created_at">,
): Promise<Plant> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  // CRITICAL: photo_filename should already be set for local images
  // Only the filename (not the image data) is stored in Firestore
  const { photo_url: _photoUrl, ...rest } = plant;
  const photoFilename = resolvePhotoFilename(plant.photo_filename, plant.photo_url);
  const newPlant = {
    ...rest,
    photo_filename: photoFilename ?? null,
    user_id: user.uid,
    created_at: Timestamp.now(),
  };

  const docRef = await withTimeoutAndRetry(
    () => addDoc(collection(db, PLANTS_COLLECTION), newPlant),
    { timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS },
  );

  const resolvedPhotoUrl = await resolveLocalImageUri(photoFilename ?? null);
  const result = {
    id: docRef.id,
    ...newPlant,
    photo_url: resolvedPhotoUrl ?? null,
    created_at: convertTimestamp(newPlant.created_at),
  } as Plant;

  // Invalidate in-memory cache so next getAllPlants re-fetches
  invalidate(CACHE_KEYS.ALL_PLANTS);

  // Update local cache
  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  await setData(KEYS.PLANTS, [...cachedPlants, result]);

  return result;
};

export const updatePlant = async (
  id: string,
  updates: Partial<Plant>,
): Promise<Plant> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  await refreshAuthToken();

  const docRef = doc(db, PLANTS_COLLECTION, id);

  // Verify ownership before updating
  const existingSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!existingSnap.exists() || existingSnap.data().user_id !== user.uid) {
    throw new Error('Not authorized to update this plant');
  }

  // CRITICAL: photo_filename should already be set for local images
  // Only the filename (not the image data) is stored in Firestore
  const firestoreUpdates: Partial<Plant> = { ...updates };
  if ("photo_url" in firestoreUpdates) {
    delete (firestoreUpdates as Partial<Plant>).photo_url;
  }
  await withTimeoutAndRetry(() => updateDoc(docRef, firestoreUpdates as Record<string, unknown>), {
    timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS,
  });

  const updated = await getPlant(id);
  if (!updated) throw new Error("Plant not found");

  // Invalidate in-memory cache so next getAllPlants re-fetches
  invalidate(CACHE_KEYS.ALL_PLANTS);

  // Update local cache
  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const index = cachedPlants.findIndex((p) => p.id === id);
  if (index !== -1) {
    cachedPlants[index] = updated;
    await setData(KEYS.PLANTS, cachedPlants);
  }

  return updated;
};

export const updatePlantLocation = async (
  id: string,
  location: string,
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const docRef = doc(db, PLANTS_COLLECTION, id);

  // Verify ownership before updating
  const existingSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!existingSnap.exists() || existingSnap.data().user_id !== user.uid) {
    throw new Error('Not authorized to update this plant');
  }

  await withTimeoutAndRetry(() => updateDoc(docRef, { location }), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });

  invalidate(CACHE_KEYS.ALL_PLANTS);

  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const index = cachedPlants.findIndex((plant) => plant.id === id);
  if (index !== -1) {
    cachedPlants[index] = { ...cachedPlants[index]!, location };
    await setData(KEYS.PLANTS, cachedPlants);
  }
};

export const updatePlantVariety = async (
  id: string,
  plantVariety: string,
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const docRef = doc(db, PLANTS_COLLECTION, id);

  // Verify ownership before updating
  const existingSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!existingSnap.exists() || existingSnap.data().user_id !== user.uid) {
    throw new Error('Not authorized to update this plant');
  }

  await withTimeoutAndRetry(
    () => updateDoc(docRef, { plant_variety: plantVariety }),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS },
  );

  invalidate(CACHE_KEYS.ALL_PLANTS);

  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const index = cachedPlants.findIndex((plant) => plant.id === id);
  if (index !== -1) {
    cachedPlants[index] = {
      ...cachedPlants[index]!,
      plant_variety: plantVariety,
    };
    await setData(KEYS.PLANTS, cachedPlants);
  }
};

export const deletePlant = async (id: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const docRef = doc(db, PLANTS_COLLECTION, id);

  // Verify ownership before deleting
  const existingSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!existingSnap.exists() || existingSnap.data().user_id !== user.uid) {
    throw new Error('Not authorized to delete this plant');
  }

  await withTimeoutAndRetry(
    () =>
      updateDoc(docRef, {
        is_deleted: true,
        deleted_at: Timestamp.now(),
      }),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS },
  );

  // Invalidate in-memory cache
  invalidate(CACHE_KEYS.ALL_PLANTS);

  // Update local cache
  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const filtered = cachedPlants.filter((p) => p.id !== id);
  await setData(KEYS.PLANTS, filtered);

  // Cascade: delete orphaned tasks and logs for this plant
  try {
    const { deleteTasksForPlantIds } = await import("./tasks");
    await deleteTasksForPlantIds([id]);
  } catch (error) {
    logger.warn("Failed to cascade-delete tasks for plant", error as Error);
  }
};

export const restorePlant = async (id: string): Promise<Plant> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const docRef = doc(db, PLANTS_COLLECTION, id);

  // Verify ownership before restoring
  const existingSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });
  if (!existingSnap.exists() || existingSnap.data().user_id !== user.uid) {
    throw new Error('Not authorized to restore this plant');
  }

  await withTimeoutAndRetry(
    () =>
      updateDoc(docRef, {
        is_deleted: false,
        deleted_at: null,
      }),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS },
  );

  const docSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
  });

  if (!docSnap.exists()) throw new Error("Plant not found");

  const data = docSnap.data();
  const photoIdentifier = data.photo_filename ?? data.photo_url ?? null;
  const resolvedPhotoUrl = await resolveLocalImageUri(photoIdentifier);
  const photoFilename = resolvePhotoFilename(data.photo_filename, data.photo_url);
  const restored = {
    id: docSnap.id,
    ...data,
    photo_filename: photoFilename ?? null,
    photo_url: resolvedPhotoUrl ?? null,
    plant_type: data.plant_type || "vegetable",
    created_at: convertTimestamp(data.created_at),
    deleted_at: convertTimestamp(data.deleted_at),
    is_deleted: data.is_deleted ?? false,
  } as Plant;

  invalidate(CACHE_KEYS.ALL_PLANTS);

  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const index = cachedPlants.findIndex((p) => p.id === id);
  if (index !== -1) {
    cachedPlants[index] = restored;
  } else {
    cachedPlants.push(restored);
  }
  await setData(KEYS.PLANTS, cachedPlants);

  return restored;
};

/**
 * Save an image to local storage and return local URI + filename
 * This should be called BEFORE creating/updating a plant
 * @param sourceUri - Source image URI (from picker or camera)
 * @returns Local file URI and filename for persistence
 */
export const savePlantImage = async (
  sourceUri: string,
): Promise<SavedImage> => {
  return saveImageLocallyWithFilename(sourceUri, "plant");
};

/**
 * Pin a manual growth stage override on a plant.
 * Records the event in growth_stage_history.
 */
export const pinGrowthStage = async (
  plantId: string,
  stage: GrowthStage,
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  await refreshAuthToken();

  const plantRef = doc(db, PLANTS_COLLECTION, plantId);
  const snap = await withTimeoutAndRetry(
    () => getDoc(plantRef),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS },
  );
  if (!snap.exists()) throw new Error("Plant not found");

  const existing = snap.data() as Plant;
  const history: GrowthStageHistoryEntry[] = [
    ...(existing.growth_stage_history ?? []),
    { stage, pinnedAt: new Date().toISOString() },
  ];

  await withTimeoutAndRetry(
    () =>
      updateDoc(plantRef, {
        growth_stage_pinned: stage,
        growth_stage_history: history,
      } as Record<string, unknown>),
    { timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS },
  );

  invalidate(CACHE_KEYS.ALL_PLANTS);
};

/**
 * Remove a pinned growth stage override — reverts to computed stage.
 * Records the unpin timestamp on the last history entry.
 */
export const unpinGrowthStage = async (plantId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  await refreshAuthToken();

  const plantRef = doc(db, PLANTS_COLLECTION, plantId);
  const snap = await withTimeoutAndRetry(
    () => getDoc(plantRef),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS },
  );
  if (!snap.exists()) throw new Error("Plant not found");

  const existing = snap.data() as Plant;
  const history = [...(existing.growth_stage_history ?? [])];
  // Mark the last pin entry as unpinned
  if (history.length > 0) {
    const lastEntry = history[history.length - 1]!;
    if (!lastEntry.unpinnedAt) {
      history[history.length - 1] = {
        ...lastEntry,
        unpinnedAt: new Date().toISOString(),
      };
    }
  }

  await withTimeoutAndRetry(
    () =>
      updateDoc(plantRef, {
        growth_stage_pinned: null,
        growth_stage_history: history,
      } as Record<string, unknown>),
    { timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS },
  );

  invalidate(CACHE_KEYS.ALL_PLANTS);
};
