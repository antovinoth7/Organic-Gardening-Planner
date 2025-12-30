import { JournalEntry } from '../types/database.types';
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
  Timestamp 
} from 'firebase/firestore';
import { saveImageLocally, deleteImageLocally } from '../lib/imageStorage';
import { getData, setData, KEYS } from '../lib/storage';

const JOURNAL_COLLECTION = 'journal_entries';

/**
 * Get all journal entries with offline-first approach
 */
export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    const q = query(
      collection(db, JOURNAL_COLLECTION),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const entries = snapshot.docs.map(doc => {
      const data = doc.data();
      // Migrate legacy photo_url to photo_urls array
      const photo_urls = data.photo_urls || (data.photo_url ? [data.photo_url] : []);
      
      return {
        id: doc.id,
        ...data,
        photo_urls,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at
      };
    }) as JournalEntry[];
    
    // Cache locally
    await setData(KEYS.JOURNAL, entries);
    
    return entries;
  } catch (error) {
    console.warn('Failed to fetch from Firestore, using cached data:', error);
    const cachedEntries = await getData<JournalEntry>(KEYS.JOURNAL);
    // Ensure cached entries also have photo_urls migrated
    return cachedEntries.map(entry => ({
      ...entry,
      photo_urls: entry.photo_urls || (entry.photo_url ? [entry.photo_url] : [])
    }));
  }
};

export const createJournalEntry = async (
  entry: Omit<JournalEntry, 'id' | 'user_id' | 'created_at'>
): Promise<JournalEntry> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // CRITICAL: photo_urls should already be local file URIs
  // Only the URI strings go to Firestore, not the actual image data
  const newEntry = {
    ...entry,
    // Ensure photo_urls exists as array for consistency
    photo_urls: entry.photo_urls || [],
    user_id: user.uid,
    created_at: Timestamp.now(),
  };
  
  const docRef = await addDoc(collection(db, JOURNAL_COLLECTION), newEntry);
  
  const result = {
    id: docRef.id,
    ...entry,
    photo_urls: entry.photo_urls || [],
    user_id: user.uid,
    created_at: newEntry.created_at.toDate().toISOString()
  } as JournalEntry;
  
  // Update local cache
  const cachedEntries = await getData<JournalEntry>(KEYS.JOURNAL);
  cachedEntries.unshift(result);
  await setData(KEYS.JOURNAL, cachedEntries);
  
  return result;
};

export const updateJournalEntry = async (
  id: string,
  updates: Partial<JournalEntry>
): Promise<JournalEntry> => {
  const docRef = doc(db, JOURNAL_COLLECTION, id);
  
  // CRITICAL: photo_url should already be a local file URI
  await updateDoc(docRef, updates as any);
  
  // Use direct document read instead of query for better performance
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) throw new Error('Journal entry not found');
  
  const doc_data = docSnap.data();
  const result = {
    id,
    ...doc_data,
    created_at: doc_data.created_at?.toDate?.()?.toISOString() || doc_data.created_at
  } as JournalEntry;
  
  // Update local cache
  const cachedEntries = await getData<JournalEntry>(KEYS.JOURNAL);
  const index = cachedEntries.findIndex(e => e.id === id);
  if (index !== -1) {
    cachedEntries[index] = result;
    await setData(KEYS.JOURNAL, cachedEntries);
  }
  
  return result;
};

export const deleteJournalEntry = async (id: string): Promise<void> => {
  // Get the entry to find its image URIs
  const cachedEntries = await getData<JournalEntry>(KEYS.JOURNAL);
  const entry = cachedEntries.find(e => e.id === id);
  
  // Delete from Firestore
  const docRef = doc(db, JOURNAL_COLLECTION, id);
  await deleteDoc(docRef);
  
  // Delete all local image files
  if (entry?.photo_urls && entry.photo_urls.length > 0) {
    for (const photoUrl of entry.photo_urls) {
      await deleteImageLocally(photoUrl);
    }
  }
  // Also handle legacy photo_url field
  else if (entry?.photo_url) {
    await deleteImageLocally(entry.photo_url);
  }
  
  // Update local cache
  const filtered = cachedEntries.filter(e => e.id !== id);
  await setData(KEYS.JOURNAL, filtered);
};

/**
 * Save an image to local storage and return the local URI
 * This should be called BEFORE creating/updating a journal entry
 * @param sourceUri - Source image URI (from picker or camera)
 * @returns Local file URI to be stored in Firestore
 */
export const saveJournalImage = async (sourceUri: string): Promise<string> => {
  return saveImageLocally(sourceUri, 'journal');
};


