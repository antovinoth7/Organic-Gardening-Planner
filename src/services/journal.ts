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
import {
  saveImageLocallyWithFilename,
  deleteImageLocally,
  resolveLocalImageUri,
  resolveLocalImageUris,
  getFilenameFromUri,
  SavedImage,
} from '../lib/imageStorage';
import { getData, setData, KEYS } from '../lib/storage';
import { withTimeoutAndRetry } from '../utils/firestoreTimeout';
import { logError } from '../utils/errorLogging';

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
    
    const snapshot = await withTimeoutAndRetry(
      () => getDocs(q),
      { timeoutMs: 15000, maxRetries: 2 }
    );
    
    const entries = (await Promise.all(
      snapshot.docs.map(async doc => {
        const data = doc.data();
        const legacyUrls = data.photo_urls || (data.photo_url ? [data.photo_url] : []);
        const photoFilenames: string[] = Array.isArray(data.photo_filenames)
          ? data.photo_filenames
          : legacyUrls
              .map((uri: string) => getFilenameFromUri(uri))
              .filter((filename: string | null): filename is string => !!filename);
        const resolvedPhotoUrls = photoFilenames.length > 0
          ? await resolveLocalImageUris(photoFilenames)
          : await resolveLocalImageUris(legacyUrls);
        const resolvedLegacy = data.photo_url
          ? await resolveLocalImageUri(data.photo_url)
          : null;
        
        return {
          id: doc.id,
          ...data,
          photo_filenames: photoFilenames,
          photo_urls: resolvedPhotoUrls,
          photo_url: resolvedLegacy,
          created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at
        };
      })
    )) as JournalEntry[];
    
    // Cache locally
    await setData(KEYS.JOURNAL, entries);
    
    return entries;
  } catch (error) {
    console.warn('Failed to fetch from Firestore, using cached data:', error);
    logError('network', 'Failed to fetch journal entries', error as Error);
    const cachedEntries = await getData<JournalEntry>(KEYS.JOURNAL);
    const resolvedCached = await Promise.all(
      cachedEntries.map(async entry => {
        const legacyUrls = entry.photo_urls || (entry.photo_url ? [entry.photo_url] : []);
        const photoFilenames = entry.photo_filenames && entry.photo_filenames.length > 0
          ? entry.photo_filenames
          : legacyUrls
              .map((uri: string) => getFilenameFromUri(uri))
              .filter((filename: string | null): filename is string => !!filename);
        const resolvedPhotoUrls = photoFilenames.length > 0
          ? await resolveLocalImageUris(photoFilenames)
          : await resolveLocalImageUris(legacyUrls);
        return {
          ...entry,
          photo_filenames: photoFilenames,
          photo_urls: resolvedPhotoUrls,
        };
      })
    );
    return resolvedCached;
  }
};

export const createJournalEntry = async (
  entry: Omit<JournalEntry, 'id' | 'user_id' | 'created_at'>
): Promise<JournalEntry> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // CRITICAL: photo_filenames should already be set for local images
  // Only the filenames go to Firestore, not the actual image data
  const photoFilenames = entry.photo_filenames && entry.photo_filenames.length > 0
    ? entry.photo_filenames
    : (entry.photo_urls || [])
        .map((uri) => getFilenameFromUri(uri))
        .filter((filename): filename is string => !!filename);
  const photoUrlsForCache = entry.photo_urls && entry.photo_urls.length > 0
    ? entry.photo_urls
    : await resolveLocalImageUris(photoFilenames);
  const baseEntry = {
    ...entry,
    // Ensure photo_filenames exists as array for consistency
    photo_filenames: photoFilenames,
    user_id: user.uid,
    created_at: Timestamp.now(),
  };
  const { photo_urls: _photoUrls, photo_url: _photoUrl, ...firestoreEntry } = baseEntry;
  
  const docRef = await withTimeoutAndRetry(
    () => addDoc(collection(db, JOURNAL_COLLECTION), firestoreEntry),
    { timeoutMs: 15000, maxRetries: 2 }
  );
  
  const result = {
    id: docRef.id,
    ...entry,
    photo_filenames: photoFilenames,
    photo_urls: photoUrlsForCache,
    user_id: user.uid,
    created_at: firestoreEntry.created_at.toDate().toISOString()
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
  
  // CRITICAL: photo_filenames should already be set for local images
  const firestoreUpdates: Partial<JournalEntry> = { ...updates };
  if ('photo_urls' in firestoreUpdates) {
    delete (firestoreUpdates as Partial<JournalEntry>).photo_urls;
  }
  if ('photo_url' in firestoreUpdates) {
    delete (firestoreUpdates as Partial<JournalEntry>).photo_url;
  }
  if (
    (!firestoreUpdates.photo_filenames ||
      firestoreUpdates.photo_filenames.length === 0) &&
    updates.photo_urls &&
    updates.photo_urls.length > 0
  ) {
    firestoreUpdates.photo_filenames = updates.photo_urls
      .map((uri) => getFilenameFromUri(uri))
      .filter((filename): filename is string => !!filename);
  }
  await withTimeoutAndRetry(
    () => updateDoc(docRef, firestoreUpdates as any),
    { timeoutMs: 15000, maxRetries: 2 }
  );
  
  // Use direct document read instead of query for better performance
  const docSnap = await withTimeoutAndRetry(
    () => getDoc(docRef),
    { timeoutMs: 10000, maxRetries: 2 }
  );
  
  if (!docSnap.exists()) throw new Error('Journal entry not found');
  
  const doc_data = docSnap.data();
  const legacyUrls = doc_data.photo_urls || (doc_data.photo_url ? [doc_data.photo_url] : []);
  const photoFilenames: string[] = Array.isArray(doc_data.photo_filenames)
    ? doc_data.photo_filenames
    : legacyUrls
        .map((uri: string) => getFilenameFromUri(uri))
        .filter((filename: string | null): filename is string => !!filename);
  const resolvedPhotoUrls = photoFilenames.length > 0
    ? await resolveLocalImageUris(photoFilenames)
    : await resolveLocalImageUris(legacyUrls);
  const result = {
    id,
    ...doc_data,
    photo_filenames: photoFilenames,
    photo_urls: resolvedPhotoUrls,
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
  } else if (entry?.photo_filenames && entry.photo_filenames.length > 0) {
    for (const filename of entry.photo_filenames) {
      const localUri = await resolveLocalImageUri(filename);
      if (localUri) {
        await deleteImageLocally(localUri);
      }
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
 * Save an image to local storage and return local URI + filename
 * This should be called BEFORE creating/updating a journal entry
 * @param sourceUri - Source image URI (from picker or camera)
 * @returns Local file URI and filename for persistence
 */
export const saveJournalImage = async (sourceUri: string): Promise<SavedImage> => {
  return saveImageLocallyWithFilename(sourceUri, 'journal');
};


