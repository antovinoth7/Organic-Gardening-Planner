import { Plant } from '../types/database.types';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { saveImageLocally, deleteImageLocally } from '../lib/imageStorage';
import { getData, setData, KEYS } from '../lib/storage';

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
    
    const snapshot = await getDocs(q);
    const plants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      plant_type: doc.data().plant_type || 'vegetable',
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at
    })) as Plant[];
    
    // Cache the results locally (only first page to avoid memory issues)
    if (!lastDoc) {
      await setData(KEYS.PLANTS, plants);
    }
    
    return {
      plants,
      lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
  } catch (error) {
    console.warn('Failed to fetch from Firestore, using cached data:', error);
    // Fall back to cached data if offline
    const cachedPlants = await getData<Plant>(KEYS.PLANTS);
    return { plants: cachedPlants };
  }
};

export const getPlant = async (id: string): Promise<Plant | null> => {
  const docRef = doc(db, PLANTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return {
    id: docSnap.id,
    ...docSnap.data(),
    created_at: docSnap.data().created_at?.toDate?.()?.toISOString() || docSnap.data().created_at
  } as Plant;
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
  
  const docRef = await addDoc(collection(db, PLANTS_COLLECTION), newPlant);
  
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
  await updateDoc(docRef, updates as any);
  
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
  // Get the plant to find its image URI
  const plant = await getPlant(id);
  
  // Delete from Firestore
  const docRef = doc(db, PLANTS_COLLECTION, id);
  await deleteDoc(docRef);
  
  // Delete the local image file if it exists
  if (plant?.photo_url) {
    await deleteImageLocally(plant.photo_url);
  }
  
  // Update local cache
  const cachedPlants = await getData<Plant>(KEYS.PLANTS);
  const filtered = cachedPlants.filter(p => p.id !== id);
  await setData(KEYS.PLANTS, filtered);
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


