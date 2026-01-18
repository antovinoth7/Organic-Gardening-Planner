import { Plant } from '../types/database.types';
import { db, auth } from '../lib/firebase';
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
  Timestamp 
} from 'firebase/firestore';
import { saveImageLocally } from '../lib/imageStorage';
import { getData, setData, KEYS } from '../lib/storage';
import { withTimeoutAndRetry } from '../utils/firestoreTimeout';
import { logError } from '../utils/errorLogging';

const PLANTS_COLLECTION = 'plants';
const DEFAULT_PAGE_SIZE = 50;

/**
 * Get all plants with offline-first approach and pagination support
 * @param pageSize - Number of plants to fetch per page (default: 50)
 * @param lastDoc - Last document from previous page (for pagination)
 * First returns cached data, then fetches from Firestore if online
 */
export const getPlants = async (
  pageSize: number = DEFAULT_PAGE_SIZE,
  lastDoc?: QueryDocumentSnapshot
): Promise<{ plants: Plant[], lastDoc?: QueryDocumentSnapshot }> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    // Build query with pagination
    let q = query(
      collection(db, PLANTS_COLLECTION),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(
        collection(db, PLANTS_COLLECTION),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }
    
    // Wrap Firestore call with timeout
    const snapshot = await withTimeoutAndRetry(
      () => getDocs(q),
      { timeoutMs: 15000, maxRetries: 2 }
    );
    
    const plants = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        plant_type: data.plant_type || 'vegetable',
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
        deleted_at: data.deleted_at?.toDate?.()?.toISOString() || data.deleted_at,
        is_deleted: data.is_deleted ?? false,
      };
    }) as Plant[];
    const activePlants = plants.filter((plant) => !plant.is_deleted);
    
    // Cache the results locally (only first page to avoid memory issues)
    if (!lastDoc) {
      await setData(KEYS.PLANTS, activePlants);
    }
    
    return {
      plants: activePlants,
      lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
  } catch (error) {
    console.warn('Failed to fetch from Firestore, using cached data:', error);
    logError('network', 'Failed to fetch plants from Firestore', error as Error, { userId: user.uid });
    // Fall back to cached data if offline
    const cachedPlants = await getData<Plant>(KEYS.PLANTS);
    return { plants: cachedPlants.filter((plant) => !plant.is_deleted) };
  }
};

export const getPlant = async (id: string): Promise<Plant | null> => {
  const docRef = doc(db, PLANTS_COLLECTION, id);
  
  const docSnap = await withTimeoutAndRetry(
    () => getDoc(docRef),
    { timeoutMs: 10000, maxRetries: 2 }
  );
  
  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  if (data.is_deleted) return null;
  
  return {
    id: docSnap.id,
    ...data,
    created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
    deleted_at: data.deleted_at?.toDate?.()?.toISOString() || data.deleted_at,
    is_deleted: data.is_deleted ?? false,
  } as Plant;
};

export const getArchivedPlants = async (): Promise<Plant[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    const q = query(
      collection(db, PLANTS_COLLECTION),
      where('user_id', '==', user.uid),
      where('is_deleted', '==', true)
    );

    const snapshot = await withTimeoutAndRetry(
      () => getDocs(q),
      { timeoutMs: 15000, maxRetries: 2 }
    );

    const plants = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        plant_type: data.plant_type || 'vegetable',
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
        deleted_at: data.deleted_at?.toDate?.()?.toISOString() || data.deleted_at,
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
    console.warn('Failed to fetch archived plants, using cached data:', error);
    const cachedPlants = await getData<Plant>(KEYS.PLANTS);
    return cachedPlants.filter((plant) => plant.is_deleted);
  }
};

export const plantExists = async (id: string): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const q = query(
    collection(db, PLANTS_COLLECTION),
    where('user_id', '==', user.uid),
    where(documentId(), '==', id)
  );

  const snapshot = await withTimeoutAndRetry(
    () => getDocs(q),
    { timeoutMs: 10000, maxRetries: 2 }
  );

  return !snapshot.empty;
};

export const createPlant = async (plant: Omit<Plant, 'id' | 'user_id' | 'created_at'>): Promise<Plant> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // CRITICAL: photo_url should already be a local file URI
  // It must NOT be uploaded to Firebase Storage - only the URI string goes to Firestore
  const newPlant = {
    ...plant,
    user_id: user.uid,
    created_at: Timestamp.now(),
  };
  
  const docRef = await withTimeoutAndRetry(
    () => addDoc(collection(db, PLANTS_COLLECTION), newPlant),
    { timeoutMs: 15000, maxRetries: 2 }
  );
  
  const result = {
    id: docRef.id,
    ...newPlant,
    created_at: newPlant.created_at.toDate().toISOString()
  } as Plant;
  
  // Update local cache
  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  await setData(KEYS.PLANTS, [...cachedPlants, result]);
  
  return result;
};

export const updatePlant = async (id: string, updates: Partial<Plant>): Promise<Plant> => {
  const docRef = doc(db, PLANTS_COLLECTION, id);
  
  // CRITICAL: photo_url should already be a local file URI
  // Only the URI string (not the image data) is stored in Firestore
  await withTimeoutAndRetry(
    () => updateDoc(docRef, updates as any),
    { timeoutMs: 15000, maxRetries: 2 }
  );
  
  const updated = await getPlant(id);
  if (!updated) throw new Error('Plant not found');
  
  // Update local cache
  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const index = cachedPlants.findIndex(p => p.id === id);
  if (index !== -1) {
    cachedPlants[index] = updated;
    await setData(KEYS.PLANTS, cachedPlants);
  }
  
  return updated;
};

export const deletePlant = async (id: string): Promise<void> => {
  const docRef = doc(db, PLANTS_COLLECTION, id);
  await withTimeoutAndRetry(
    () =>
      updateDoc(docRef, {
        is_deleted: true,
        deleted_at: Timestamp.now(),
      }),
    { timeoutMs: 10000, maxRetries: 2 }
  );
  
  // Update local cache
  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const filtered = cachedPlants.filter(p => p.id !== id);
  await setData(KEYS.PLANTS, filtered);
};

export const restorePlant = async (id: string): Promise<Plant> => {
  const docRef = doc(db, PLANTS_COLLECTION, id);
  await withTimeoutAndRetry(
    () =>
      updateDoc(docRef, {
        is_deleted: false,
        deleted_at: null,
      }),
    { timeoutMs: 10000, maxRetries: 2 }
  );

  const docSnap = await withTimeoutAndRetry(
    () => getDoc(docRef),
    { timeoutMs: 10000, maxRetries: 2 }
  );

  if (!docSnap.exists()) throw new Error('Plant not found');

  const data = docSnap.data();
  const restored = {
    id: docSnap.id,
    ...data,
    plant_type: data.plant_type || 'vegetable',
    created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
    deleted_at: data.deleted_at?.toDate?.()?.toISOString() || data.deleted_at,
    is_deleted: data.is_deleted ?? false,
  } as Plant;

  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const index = cachedPlants.findIndex(p => p.id === id);
  if (index !== -1) {
    cachedPlants[index] = restored;
  } else {
    cachedPlants.push(restored);
  }
  await setData(KEYS.PLANTS, cachedPlants);

  return restored;
};

/**
 * Save an image to local storage and return the local URI
 * This should be called BEFORE creating/updating a plant
 * @param sourceUri - Source image URI (from picker or camera)
 * @returns Local file URI to be stored in Firestore
 */
export const savePlantImage = async (sourceUri: string): Promise<string> => {
  return saveImageLocally(sourceUri, 'plant');
};


