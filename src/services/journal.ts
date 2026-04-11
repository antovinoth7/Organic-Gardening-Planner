import { JournalEntry } from '../types/database.types';
import { db, auth, refreshAuthToken } from '../lib/firebase';
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
import { withTimeoutAndRetry, FIRESTORE_WRITE_TIMEOUT_MS, FIRESTORE_READ_TIMEOUT_MS } from '../utils/firestoreTimeout';
import { logError } from '../utils/errorLogging';
import { logger } from '../utils/logger';
import {
  getCached,
  setCached,
  invalidate,
  CACHE_KEYS,
} from '../lib/dataCache';
const JOURNAL_COLLECTION = 'journal_entries';

/**
 * Get all journal entries with offline-first approach
 */
export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Return fresh in-memory data if available
  const cached = getCached<JournalEntry[]>(CACHE_KEYS.JOURNAL_ENTRIES);
  if (cached) return cached;

  // Refresh token to prevent expiration issues
  await refreshAuthToken();

  try {
    const q = query(
      collection(db, JOURNAL_COLLECTION),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );
    
    const snapshot = await withTimeoutAndRetry(
      () => getDocs(q),
      { timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS }
    );
    
    const entries = (await Promise.all(
      snapshot.docs.map(async doc => {
        try {
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
        } catch (error) {
          logger.warn(`Failed to resolve images for journal ${doc.id}`, error as Error);
          const data = doc.data();
          // Return entry without photos on error
          return {
            id: doc.id,
            ...data,
            photo_filenames: [],
            photo_urls: [],
            photo_url: null,
            created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at
          };
        }
      })
    )) as JournalEntry[];
    
    // Cache locally
    await setData(KEYS.JOURNAL, entries);
    setCached(CACHE_KEYS.JOURNAL_ENTRIES, entries);
    
    return entries;
  } catch (error) {
    logger.warn('Failed to fetch journal entries, using cached data', error as Error);
    logError('network', 'Failed to fetch journal entries', error as Error);
    const cachedEntries = await getData<JournalEntry>(KEYS.JOURNAL);
    const resolvedCached = await Promise.all(
      cachedEntries.map(async entry => {
        try {
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
        } catch (error) {
          logger.warn(`Failed to resolve cached images for journal ${entry.id}`, error as Error);
          return {
            ...entry,
            photo_filenames: [],
            photo_urls: [],
          };
        }
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
    { timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS }
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

  invalidate(CACHE_KEYS.JOURNAL_ENTRIES, CACHE_KEYS.JOURNAL_METADATA);
  
  return result;
};

export const updateJournalEntry = async (
  id: string,
  updates: Partial<JournalEntry>
): Promise<JournalEntry> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  await refreshAuthToken();

  // Verify ownership before updating
  const docRef = doc(db, JOURNAL_COLLECTION, id);
  const existingSnap = await withTimeoutAndRetry(
    () => getDoc(docRef),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
  );

  if (!existingSnap.exists()) throw new Error('Journal entry not found');

  const existingData = existingSnap.data();
  if (existingData.user_id !== user.uid) {
    throw new Error('Not authorized to update this entry');
  }
  
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
    () => updateDoc(docRef, firestoreUpdates as Record<string, unknown>),
    { timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS }
  );
  
  // Use direct document read instead of query for better performance
  const docSnap = await withTimeoutAndRetry(
    () => getDoc(docRef),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
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

  invalidate(CACHE_KEYS.JOURNAL_ENTRIES, CACHE_KEYS.JOURNAL_METADATA);
  
  return result;
};

export const deleteJournalEntry = async (id: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  await refreshAuthToken();

  // Verify ownership before deleting
  const docRef = doc(db, JOURNAL_COLLECTION, id);
  const docSnap = await withTimeoutAndRetry(
    () => getDoc(docRef),
    { timeoutMs: FIRESTORE_READ_TIMEOUT_MS }
  );
  
  if (!docSnap.exists()) {
    logger.warn('Journal entry not found: ' + id);
    return;
  }
  
  const data = docSnap.data();
  if (data.user_id !== user.uid) {
    throw new Error('Not authorized to delete this entry');
  }
  
  // Get the entry to find its image URIs
  const cachedEntries = await getData<JournalEntry>(KEYS.JOURNAL);
  const entry = cachedEntries.find(e => e.id === id);
  
  // Delete from Firestore
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

  invalidate(CACHE_KEYS.JOURNAL_ENTRIES, CACHE_KEYS.JOURNAL_METADATA);
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

/**
 * Lightweight journal fetch — returns entries WITHOUT resolving images.
 * Ideal for CalendarScreen which only needs entry_type and metadata
 * (e.g. harvest entries), avoiding O(entries × photos) filesystem work.
 */
export const getJournalMetadata = async (): Promise<JournalEntry[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Return fresh in-memory data if available
  const cached = getCached<JournalEntry[]>(CACHE_KEYS.JOURNAL_METADATA);
  if (cached) return cached;

  // If full entries are already fresh, derive metadata from them
  const fullCached = getCached<JournalEntry[]>(CACHE_KEYS.JOURNAL_ENTRIES);
  if (fullCached) {
    setCached(CACHE_KEYS.JOURNAL_METADATA, fullCached);
    return fullCached;
  }

  await refreshAuthToken();

  try {
    const q = query(
      collection(db, JOURNAL_COLLECTION),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const snapshot = await withTimeoutAndRetry(
      () => getDocs(q),
      { timeoutMs: FIRESTORE_WRITE_TIMEOUT_MS }
    );

    const entries = snapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        // Skip image resolution — just keep filenames for metadata
        photo_filenames: data.photo_filenames || [],
        photo_urls: [],
        photo_url: null,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
      } as unknown as JournalEntry;
    });

    setCached(CACHE_KEYS.JOURNAL_METADATA, entries);
    return entries;
  } catch (error) {
    logger.warn('Failed to fetch journal metadata, using cache', error as Error);
    const cachedEntries = await getData<JournalEntry>(KEYS.JOURNAL);
    return cachedEntries;
  }
};


