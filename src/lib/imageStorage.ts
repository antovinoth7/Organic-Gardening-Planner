/**
 * Local Image Storage Module
 * 
 * This module handles all image file operations on the device.
 * Images are stored locally in the app's document directory and NEVER uploaded to cloud storage.
 * Only the file URI (string path) is stored in Firestore for synchronization.
 * 
 * Benefits:
 * - Keeps Firestore usage minimal (free tier)
 * - No dependency on Firebase Storage or any paid service
 * - Full control over image files for 10-15+ years
 * - Can be backed up/synced manually by the user
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

// Directory for storing all garden images
const IMAGES_DIR = `${FileSystem.documentDirectory}garden_images/`;

/**
 * Initialize the images directory if it doesn't exist
 */
export const initImageStorage = async (): Promise<void> => {
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
export const saveImageLocally = async (
  sourceUri: string,
  prefix: string = 'img'
): Promise<string> => {
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
  
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    return fileInfo.exists;
  } catch (error) {
    return false;
  }
};

/**
 * Pick an image from the device gallery
 * @returns The selected image URI, or null if cancelled
 */
export const pickImage = async (): Promise<string | null> => {
  try {
    // Request permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      throw new Error('Permission to access media library is required');
    }
    
    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Compress to save space
    });
    
    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

/**
 * Take a photo with the device camera
 * @returns The captured photo URI, or null if cancelled
 */
export const takePhoto = async (): Promise<string | null> => {
  try {
    // Request permissions
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      throw new Error('Permission to access camera is required');
    }
    
    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Compress to save space
    });
    
    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    
    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};

/**
 * Get the total size of all stored images
 * @returns Size in bytes
 */
export const getImageStorageSize = async (): Promise<number> => {
  try {
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
 * Get all image URIs in storage
 * @returns Array of image URIs
 */
export const getAllImageUris = async (): Promise<string[]> => {
  try {
    await initImageStorage();
    const files = await FileSystem.readDirectoryAsync(IMAGES_DIR);
    return files.map(file => `${IMAGES_DIR}${file}`);
  } catch (error) {
    console.error('Error listing images:', error);
    return [];
  }
};
