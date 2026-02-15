/**
 * Local Image Storage Module
 * 
 * This module handles all image file operations on the device.
 * Images are stored locally in PERSISTENT storage (survives app reinstalls) and NEVER uploaded to cloud storage.
 * Only the image filename is stored in Firestore for synchronization.
 * 
 * Storage locations by platform:
 * - Android (dev build): Uses MediaLibrary to store in Pictures/GardenPlanner (persists across reinstalls)
 * - Android (Expo Go): Falls back to documentDirectory (due to permission restrictions)
 * - iOS: Uses documentDirectory (backed up to iCloud by default)
 * - Web: Uses blob URLs (session-based)
 * 
 * Note: Expo Go on Android cannot access MediaLibrary due to Android's permission requirements.
 * The app gracefully falls back to documentDirectory storage when running in Expo Go.
 * For full persistence across reinstalls, create a development build.
 * 
 * Benefits:
 * - Images persist even when app is uninstalled/reinstalled on Android (in dev builds)
 * - Keeps Firestore usage minimal (free tier)
 * - No dependency on Firebase Storage or any paid service
 * - Full control over image files for 10-15+ years
 * - Can be backed up/synced manually by the user
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Check if running in Expo Go (which has limited MediaLibrary permissions)
 * In Expo Go, we fall back to documentDirectory storage
 */
const isExpoGo = Constants.appOwnership === 'expo';

export interface SavedImage {
  uri: string;
  filename: string | null;
}

// Directory for storing all garden images
// iOS uses documentDirectory (backed up to iCloud)
// Android uses MediaLibrary (persists across reinstalls)
const IMAGES_DIR = Platform.OS === 'web' ? null : `${FileSystem.documentDirectory}garden_images/`;
const ALBUM_NAME = 'GardenPlanner';
const MEDIA_LOOKUP_PAGE_SIZE = 200;
const MEDIA_LOOKUP_MAX_PAGES = 20;

let mediaLookupCache: Map<string, string> | null = null;
let mediaLookupPromise: Promise<Map<string, string>> | null = null;

const clearMediaLookupCache = () => {
  mediaLookupCache = null;
  mediaLookupPromise = null;
};

/**
 * Request media library permissions on Android
 * Note: In Expo Go, this will fail due to Android permission restrictions.
 * The app gracefully falls back to documentDirectory storage in that case.
 */
const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  
  // In Expo Go, MediaLibrary permissions are not available on Android
  // due to Android's permission restrictions. Skip and use fallback storage.
  if (isExpoGo) {
    console.log('Running in Expo Go - MediaLibrary not available, using documentDirectory');
    return false;
  }
  
  try {
    // Request only photo permissions (not audio/video) using granularPermissions
    // This prevents AUDIO permission errors on Android
    const { status } = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
    return status === 'granted';
  } catch (error) {
    console.warn('MediaLibrary permissions not available, falling back to documentDirectory:', error);
    return false;
  }
};

const upsertAssetLookup = (
  lookup: Map<string, string>,
  asset: MediaLibrary.Asset
) => {
  if (asset.id) {
    lookup.set(String(asset.id), asset.uri);
  }

  if (asset.filename) {
    const filename = asset.filename.toLowerCase();
    if (!lookup.has(filename)) {
      lookup.set(filename, asset.uri);
    }
  }
};

const scanMediaAssets = async (
  lookup: Map<string, string>,
  options: any = {}
) => {
  let after: string | undefined;
  let pageCount = 0;

  while (pageCount < MEDIA_LOOKUP_MAX_PAGES) {
    const page = await MediaLibrary.getAssetsAsync({
      ...options,
      first: MEDIA_LOOKUP_PAGE_SIZE,
      ...(after ? { after } : {}),
    });

    page.assets.forEach((asset) => upsertAssetLookup(lookup, asset));

    if (!page.hasNextPage || !page.endCursor) {
      break;
    }

    after = page.endCursor;
    pageCount += 1;
  }
};

const getAndroidMediaLookup = async (): Promise<Map<string, string>> => {
  if (Platform.OS !== 'android' || isExpoGo) {
    return new Map();
  }

  if (mediaLookupCache) {
    return mediaLookupCache;
  }

  if (!mediaLookupPromise) {
    mediaLookupPromise = (async () => {
      const lookup = new Map<string, string>();
      const hasPermission = await requestMediaLibraryPermissions();

      if (!hasPermission) {
        return lookup;
      }

      try {
        const album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
        if (album) {
          await scanMediaAssets(lookup, { album });
        }

        // Also do a broader scan for legacy or manually restored data not in the album.
        await scanMediaAssets(lookup);
      } catch (error) {
        console.warn('Failed to build MediaLibrary lookup cache:', error);
      }

      mediaLookupCache = lookup;
      return lookup;
    })().finally(() => {
      mediaLookupPromise = null;
    });
  }

  return mediaLookupPromise;
};

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
    // On Android, try to save to persistent MediaLibrary storage
    // Falls back to documentDirectory if MediaLibrary is not available (e.g., in Expo Go)
    if (Platform.OS === 'android') {
      // Request permissions first
      const hasPermission = await requestMediaLibraryPermissions();
      if (!hasPermission) {
        // Fall back to documentDirectory storage (works in Expo Go)
        // Note: These images won't persist across app reinstalls but will work for development
        console.log('Using documentDirectory fallback for image storage');
        await initImageStorage();
        
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const extension = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
        const filename = `${prefix}_${timestamp}_${randomSuffix}.${extension}`;
        const destinationUri = `${IMAGES_DIR}${filename}`;
        
        await FileSystem.copyAsync({
          from: sourceUri,
          to: destinationUri,
        });
        
        console.log('Image saved to documentDirectory (fallback):', destinationUri);
        return destinationUri;
      }

      // Generate a unique filename
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const extension = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
      const filename = `${prefix}_${timestamp}_${randomSuffix}.${extension}`;

      // If the source is a content URI (picked from gallery), copy to app cache first.
      // This avoids "Allow app to modify this photo?" prompts caused by modifying the original asset.
      let assetSourceUri = sourceUri;
      if (sourceUri.startsWith('content://')) {
        const cacheDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
        if (cacheDir) {
          const tempUri = `${cacheDir}${filename}`;
          try {
            await FileSystem.copyAsync({ from: sourceUri, to: tempUri });
            assetSourceUri = tempUri;
          } catch (copyError) {
            console.warn('Failed to copy content URI, using original source:', copyError);
          }
        }
      }

      // Save to MediaLibrary (persists across reinstalls)
      const asset = await MediaLibrary.createAssetAsync(assetSourceUri);
      clearMediaLookupCache();
      
      // Try to organize into an album
      try {
        let album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
        if (!album) {
          album = await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }
      } catch (albumError) {
        console.warn('Could not create/add to album, but image is saved:', albumError);
      }

      // Clean up temp file if we created one
      if (assetSourceUri !== sourceUri && assetSourceUri.startsWith('file://')) {
        try {
          await FileSystem.deleteAsync(assetSourceUri, { idempotent: true });
        } catch (cleanupError) {
          console.warn('Failed to delete temp image file:', cleanupError);
        }
      }

      console.log('Image saved to MediaLibrary (persistent):', asset.uri);
      return asset.uri;
    }
    
    // On iOS, use documentDirectory (backed up to iCloud)
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
    // On Android with MediaLibrary URIs, use MediaLibrary.deleteAssetsAsync
    if (Platform.OS === 'android' && imageUri.startsWith('content://')) {
      try {
        const asset = await MediaLibrary.getAssetInfoAsync(imageUri);
        if (asset) {
          await MediaLibrary.deleteAssetsAsync([asset.id]);
          console.log('Image deleted from MediaLibrary:', imageUri);
          return;
        }
      } catch (mlError) {
        console.warn('Could not delete from MediaLibrary, trying FileSystem:', mlError);
      }
    }
    
    // Fallback to FileSystem deletion (for iOS or old Android files)
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
 * Check if an image file exists with timeout protection
 * Prevents hanging on stale MediaLibrary URIs that can cause native crashes
 * @param imageUri - The local file URI to check
 * @returns True if the file exists, false otherwise
 */
export const imageExists = async (imageUri: string | null): Promise<boolean> => {
  if (!imageUri) return false;
  
  // Defensive: check for invalid URI strings
  const trimmedUri = imageUri.trim();
  if (!trimmedUri || trimmedUri === 'null' || trimmedUri === 'undefined') {
    return false;
  }
  
  // On web, assume blob URLs exist
  if (Platform.OS === 'web') return true;
  
  try {
    // Shorter timeout for file system operations (2s instead of 5s)
    // File system checks should be near-instant; if they're slow, the file is likely missing
    const timeoutMs = 2000;
    
    const checkPromise = (async () => {
      // On Android with MediaLibrary URIs (content://), check via MediaLibrary
      if (Platform.OS === 'android' && trimmedUri.startsWith('content://')) {
        try {
          const asset = await MediaLibrary.getAssetInfoAsync(trimmedUri);
          return !!asset;
        } catch (firstError) {
          // Try extracting content ID as fallback
          const contentId = trimmedUri.split('?')[0].split('#')[0].split('/').pop();
          if (contentId && contentId.length > 0) {
            try {
              const asset = await MediaLibrary.getAssetInfoAsync(contentId);
              return !!asset;
            } catch (secondError) {
              // URI is stale or invalid - this is common after device restarts
              if (__DEV__) {
                console.warn('MediaLibrary asset not found (stale URI)');
              }
              return false;
            }
          }
          return false;
        }
      }
      
      // Fallback to FileSystem check
      const fileInfo = await FileSystem.getInfoAsync(trimmedUri);
      return fileInfo.exists;
    })();

    // Race against timeout to prevent indefinite hangs
    const timeoutPromise = new Promise<boolean>((resolve) => {
      setTimeout(() => {
        // Only log in development to reduce noise
        if (__DEV__) {
          console.warn('imageExists timeout (file likely missing)');
        }
        resolve(false);
      }, timeoutMs);
    });

    return await Promise.race([checkPromise, timeoutPromise]);
  } catch (error) {
    // Only log errors in development
    if (__DEV__) {
      console.warn('imageExists error:', error);
    }
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
  const filename = await resolveSavedImageFilename(uri);
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

const getAndroidAssetIdFromUri = (uri: string): string | null => {
  if (!uri || Platform.OS !== 'android' || !uri.startsWith('content://')) {
    return null;
  }

  const cleanUri = uri.split('?')[0].split('#')[0];
  return cleanUri.split('/').pop() || null;
};

async function resolveSavedImageFilename(uri: string): Promise<string | null> {
  if (Platform.OS === 'android') {
    const assetId = getAndroidAssetIdFromUri(uri);
    if (assetId) {
      try {
        const asset = await MediaLibrary.getAssetInfoAsync(assetId);
        if (asset?.filename) {
          return asset.filename;
        }
      } catch {
        // Fall back to URI parsing if MediaLibrary metadata is unavailable.
      }
    }
  }

  return getFilenameFromUri(uri);
}

/**
 * Resolve Android MediaLibrary asset ID to a usable content:// URI.
 */
const resolveMediaLibraryAssetUri = async (
  assetId: string
): Promise<string | null> => {
  if (!assetId || Platform.OS !== 'android') return null;
  try {
    const asset = await MediaLibrary.getAssetInfoAsync(assetId);
    return asset?.uri ?? null;
  } catch {
    return null;
  }
};

const resolveMediaLibraryUriByFilename = async (
  filename: string
): Promise<string | null> => {
  if (!filename || Platform.OS !== 'android') return null;

  const cleanFilename = getFilenameFromUri(filename);
  if (!cleanFilename) return null;

  const lookup = await getAndroidMediaLookup();
  return lookup.get(cleanFilename.toLowerCase()) ?? null;
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
    if (Platform.OS === 'android') {
      const mediaLibraryUri = await resolveMediaLibraryAssetUri(uri);
      if (mediaLibraryUri) {
        return mediaLibraryUri;
      }

      const mediaLibraryUriFromFilename = await resolveMediaLibraryUriByFilename(uri);
      if (mediaLibraryUriFromFilename) {
        return mediaLibraryUriFromFilename;
      }
    }
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

  if (Platform.OS === 'android') {
    const mediaLibraryUri = await resolveMediaLibraryUriByFilename(filename);
    if (mediaLibraryUri) {
      return mediaLibraryUri;
    }
  }

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

/**
 * Migrate existing images from documentDirectory to MediaLibrary on Android
 * This ensures images persist across app reinstalls
 * Call this once on app startup or in settings
 */
export const migrateImagesToMediaLibrary = async (): Promise<{
  completed: boolean;
  success: boolean;
  migratedCount: number;
  errorCount: number;
  message: string;
}> => {
  // Only run on Android
  if (Platform.OS !== 'android') {
    return {
      completed: true,
      success: true,
      migratedCount: 0,
      errorCount: 0,
      message: 'Migration not needed on this platform',
    };
  }

  try {
    // In Expo Go, skip migration silently - MediaLibrary is not available
    if (isExpoGo) {
      return {
        completed: false,
        success: true,
        migratedCount: 0,
        errorCount: 0,
        message: 'Running in Expo Go - migration skipped (MediaLibrary not available)',
      };
    }
    
    // Check permissions first
    const hasPermission = await requestMediaLibraryPermissions();
    if (!hasPermission) {
      return {
        completed: false,
        success: true, // Not a failure, just not possible in this environment
        migratedCount: 0,
        errorCount: 0,
        message: 'Media library permission not granted. Images will use local storage.',
      };
    }

    // Check if old directory exists
    if (!IMAGES_DIR) {
      return {
        completed: true,
        success: true,
        migratedCount: 0,
        errorCount: 0,
        message: 'No images directory configured',
      };
    }

    const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIR);
    if (!dirInfo.exists) {
      return {
        completed: true,
        success: true,
        migratedCount: 0,
        errorCount: 0,
        message: 'No existing images to migrate',
      };
    }

    // Get all files in the directory
    const files = await FileSystem.readDirectoryAsync(IMAGES_DIR);
    if (files.length === 0) {
      return {
        completed: true,
        success: true,
        migratedCount: 0,
        errorCount: 0,
        message: 'No images found to migrate',
      };
    }

    console.log(`Found ${files.length} images to migrate to MediaLibrary`);

    let migratedCount = 0;
    let errorCount = 0;

    // Migrate each file
    for (const file of files) {
      try {
        const oldUri = `${IMAGES_DIR}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(oldUri);
        
        if (!fileInfo.exists) {
          console.warn(`File does not exist: ${oldUri}`);
          errorCount++;
          continue;
        }

        // Save to MediaLibrary
        const asset = await MediaLibrary.createAssetAsync(oldUri);
        
        // Try to add to album
        try {
          let album = await MediaLibrary.getAlbumAsync(ALBUM_NAME);
          if (!album) {
            album = await MediaLibrary.createAlbumAsync(ALBUM_NAME, asset, false);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          }
        } catch (albumError) {
          console.warn('Could not add to album, but image is saved:', albumError);
        }

        // Delete old file
        await FileSystem.deleteAsync(oldUri, { idempotent: true });
        
        migratedCount++;
        console.log(`Migrated: ${file} -> ${asset.uri}`);
      } catch (error) {
        console.error(`Error migrating ${file}:`, error);
        errorCount++;
      }
    }

    if (migratedCount > 0) {
      clearMediaLookupCache();
    }

    return {
      completed: errorCount === 0,
      success: errorCount === 0,
      migratedCount,
      errorCount,
      message: `Migrated ${migratedCount} images to persistent storage. ${errorCount} errors.`,
    };
  } catch (error) {
    console.error('Error during migration:', error);
    return {
      completed: false,
      success: false,
      migratedCount: 0,
      errorCount: 0,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
