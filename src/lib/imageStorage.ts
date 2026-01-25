/**
 * Local Image Storage Module
 * 
 * This module handles all image file operations on the device.
 * Images are stored locally in the app's document directory and NEVER uploaded to cloud storage.
 * Only the image filename is stored in Firestore for synchronization.
 * 
 * Benefits:
 * - Keeps Firestore usage minimal (free tier)
 * - No dependency on Firebase Storage or any paid service
 * - Full control over image files for 10-15+ years
 * - Can be backed up/synced manually by the user
 */

import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export interface SavedImage {
  uri: string;
  filename: string | null;
}

// Directory for storing all garden images
const IMAGES_DIR = Platform.OS === 'web' ? null : `${FileSystem.documentDirectory}garden_images/`;

/**
 * Initialize the images directory if it doesn't exist
 */
const initImageStorage = async (): Promise<void> => {
  // Skip on web platform
  if (Platform.OS === 'web' || !IMAGES_DIR) return;
  
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
      console.log('Created images directory:', IMAGES_DIR);
    }
  } catch (error) {
    console.error('Error initializing image storage:', error);
    throw error;
  }
};

/**
 * Save an image from a URI to local storage
 * @param sourceUri - The source URI (from image picker, camera, etc.)
 * @param prefix - Optional prefix for the filename (e.g., 'plant', 'journal')
 * @returns The local file URI where the image was saved
 */
const saveImageLocally = async (
  sourceUri: string,
  prefix: string = 'img'
): Promise<string> => {
  // On web, just return the source URI (blob URL)
  if (Platform.OS === 'web') {
    return sourceUri;
  }
  
  try {
    await initImageStorage();
    
    // Generate a unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `${prefix}_${timestamp}_${randomSuffix}.${extension}`;
    const destinationUri = `${IMAGES_DIR}${filename}`;
    
    // Copy the image to our local storage
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri,
    });
    
    console.log('Image saved locally:', destinationUri);
    return destinationUri;
  } catch (error) {
    console.error('Error saving image locally:', error);
    throw error;
  }
};

/**
 * Delete an image from local storage
 * @param imageUri - The local file URI to delete
 */
export const deleteImageLocally = async (imageUri: string | null): Promise<void> => {
  if (!imageUri) return;
  
  // On web, we can't delete blob URLs, just skip
  if (Platform.OS === 'web') return;
  
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(imageUri);
      console.log('Image deleted:', imageUri);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - file might already be deleted
  }
};

/**
 * Check if an image file exists
 * @param imageUri - The local file URI to check
 * @returns True if the file exists, false otherwise
 */
export const imageExists = async (imageUri: string | null): Promise<boolean> => {
  if (!imageUri) return false;
  
  // On web, assume blob URLs exist
  if (Platform.OS === 'web') return true;
  
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    return fileInfo.exists;
  } catch {
    return false;
  }
};

/**
 * Get the total size of all stored images
 * @returns Size in bytes
 */
export const getImageStorageSize = async (): Promise<number> => {
  // On web, we can't calculate storage size
  if (Platform.OS === 'web') return 0;
  
  try {
    if (!IMAGES_DIR) return 0;
    
    const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (!dirInfo.exists) return 0;
    
    const files = await FileSystem.readDirectoryAsync(IMAGES_DIR);
    let totalSize = 0;
    
    for (const file of files) {
      const fileInfo = await FileSystem.getInfoAsync(`${IMAGES_DIR}${file}`);
      if (fileInfo.exists && fileInfo.size) {
        totalSize += fileInfo.size;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Error calculating storage size:', error);
    return 0;
  }
};

/**
 * Save an image and return both the local URI and filename.
 */
export const saveImageLocallyWithFilename = async (
  sourceUri: string,
  prefix: string = 'img'
): Promise<SavedImage> => {
  const uri = await saveImageLocally(sourceUri, prefix);
  const filename = getFilenameFromUri(uri);
  return { uri, filename };
};

/**
 * Extract clean filename from URI
 * Handles query params, fragments, and URL encoding
 */
export const getFilenameFromUri = (uri: string): string | null => {
  if (!uri) return null;
  try {
    const cleanUri = uri.split('?')[0].split('#')[0];
    const filename = cleanUri.split('/').pop();
    return filename ? decodeURIComponent(filename) : null;
  } catch (error) {
    console.warn('Failed to extract filename from URI:', uri, error);
    return uri.split('/').pop()?.split('?')[0] || null;
  }
};

/**
 * Build a local file URI from a stored filename.
 */
export const getLocalImageUriFromFilename = (
  filename: string | null
): string | null => {
  if (!filename || !IMAGES_DIR || Platform.OS === 'web') return null;
  const cleanFilename = getFilenameFromUri(filename);
  return cleanFilename ? `${IMAGES_DIR}${cleanFilename}` : null;
};

/**
 * Resolve a potentially cross-device URI to a local file if it exists.
 */
export const resolveLocalImageUri = async (
  uri: string | null
): Promise<string | null> => {
  if (!uri) return null;
  if (Platform.OS === 'web' || !IMAGES_DIR) return uri;

  const hasScheme = uri.includes('://');
  const hasPathSep = uri.includes('/') || uri.includes('\\');
  const isFilenameOnly = !hasScheme && !hasPathSep;
  const isRemoteUri = /^(https?|data|blob):/i.test(uri);
  const isLocalScheme = /^(file|content|ph|assets-library):/i.test(uri);

  if (isRemoteUri) {
    return uri;
  }

  if (isFilenameOnly) {
    const localUri = getLocalImageUriFromFilename(uri);
    if (localUri && (await imageExists(localUri))) {
      return localUri;
    }
    return null;
  }

  if (isLocalScheme || uri.startsWith('/')) {
    if (await imageExists(uri)) {
      return uri;
    }
  }

  const filename = getFilenameFromUri(uri);
  if (!filename) return null;

  const localUri = getLocalImageUriFromFilename(filename);
  if (localUri && (await imageExists(localUri))) {
    return localUri;
  }

  return null;
};

/**
 * Resolve an array of image URIs to local files when available.
 */
export const resolveLocalImageUris = async (
  uris: string[] | null | undefined
): Promise<string[]> => {
  if (!uris || uris.length === 0) return [];
  if (Platform.OS === 'web' || !IMAGES_DIR) return uris;

  const resolved = await Promise.all(
    uris.map(async (uri) => resolveLocalImageUri(uri))
  );
  return resolved.filter((uri): uri is string => !!uri);
};

