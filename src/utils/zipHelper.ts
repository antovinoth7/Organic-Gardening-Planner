/**
 * ZIP Helper Utilities
 * 
 * Cross-platform utilities for creating and extracting ZIP files
 * containing both JSON backup data and image files.
 * 
 * Uses fflate - a modern, fast, actively maintained compression library
 * with built-in TypeScript support and no dependencies.
 * 
 * Platform compatibility:
 * - iOS: Full support
 * - Android: Full support  
 * - Web: Full support (uses browser APIs)
 */

import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export interface ZipImageFile {
  uri: string;
  filename: string;
}

const safeDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const sanitizeZipImageFilename = (filename: string): string => {
  const normalized = filename.replace(/\\/g, '/');
  const clean = normalized.split('/').pop() || `image_${Date.now()}.jpg`;
  return safeDecodeURIComponent(clean).replace(/\0/g, '');
};

/**
 * Create a ZIP file containing JSON data and images
 * @param jsonData - The backup JSON data object
 * @param imageFiles - Array of image URIs with stable filenames to include
 * @returns URI of the created ZIP file
 */
export const createZipWithImages = async (
  jsonData: any,
  imageFiles: ZipImageFile[]
): Promise<string> => {
  try {
    // Prepare files for ZIP
    const files: Record<string, Uint8Array> = {};
    
    // Add JSON backup data
    const jsonString = JSON.stringify(jsonData, null, 2);
    files['backup.json'] = strToU8(jsonString);
    
    // Process each image
    for (const imageFile of imageFiles) {
      const imageUri = imageFile.uri;
      if (!imageUri || imageUri.trim() === '') continue;
      
      try {
        // Skip if file doesn't exist
        if (Platform.OS !== 'web' && imageUri.startsWith('file://')) {
          const fileInfo = await FileSystem.getInfoAsync(imageUri);
          if (!fileInfo.exists) {
            console.warn(`Image not found, skipping: ${imageUri}`);
            continue;
          }
        }
        
        // Keep original filename from backup metadata so restore can remap reliably.
        const filename = sanitizeZipImageFilename(imageFile.filename);
        
        // Read image as base64
        let imageData: Uint8Array;
        if (Platform.OS === 'web') {
          // For web, fetch blob and convert to Uint8Array
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();
          imageData = new Uint8Array(arrayBuffer);
        } else {
          // For mobile, read as base64 and convert
          const base64Data = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          imageData = base64ToUint8Array(base64Data);
        }
        
        // Add image to files map with images/ prefix
        files[`images/${filename}`] = imageData;
        console.log(`Added image to ZIP: ${filename}`);
      } catch (error) {
        console.error(`Error adding image ${imageUri}:`, error);
        // Continue with other images even if one fails
      }
    }
    
    // Create ZIP using fflate (synchronous for React Native compatibility)
    // Workers are not available in React Native, so we use zipSync
    const zipData = zipSync(files, { level: 6 });
    
    // Save ZIP file to device
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `garden-backup-${timestamp}.zip`;
    
    if (Platform.OS === 'web') {
      // For web, create a download link
      // Create a new Uint8Array to avoid TypeScript issues with ArrayBufferLike
      const blob = new Blob([new Uint8Array(zipData)], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      return url;
    } else {
      // For mobile, save to document directory
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      const base64Data = uint8ArrayToBase64(zipData);
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log(`ZIP file created: ${fileUri}`);
      return fileUri;
    }
  } catch (error) {
    console.error('Error creating ZIP:', error);
    throw new Error('Failed to create backup ZIP: ' + (error as Error).message);
  }
};

/**
 * Extract JSON data and images from a ZIP file
 * @param zipUri - URI of the ZIP file to extract
 * @param targetImagesDir - Directory where images should be extracted
 * @returns Object containing parsed JSON data and array of restored image URIs
 */
export const extractZipWithImages = async (
  zipUri: string,
  targetImagesDir: string
): Promise<{
  jsonData: any;
  imageUris: Map<string, string>; // Map of original filename -> new local URI
}> => {
  try {
    // Read ZIP file
    let zipData: Uint8Array;
    if (Platform.OS === 'web') {
      const response = await fetch(zipUri);
      const arrayBuffer = await response.arrayBuffer();
      zipData = new Uint8Array(arrayBuffer);
    } else {
      const base64Data = await FileSystem.readAsStringAsync(zipUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      zipData = base64ToUint8Array(base64Data);
    }
    
    // Unzip using fflate (synchronous for React Native compatibility)
    // Workers are not available in React Native, so we use unzipSync
    const unzippedFiles = unzipSync(zipData);
    
    // Extract backup.json
    const backupJsonData = unzippedFiles['backup.json'];
    if (!backupJsonData) {
      throw new Error('Invalid backup ZIP: missing backup.json');
    }
    
    const jsonContent = strFromU8(backupJsonData);
    const jsonData = JSON.parse(jsonContent);
    
    // Ensure target images directory exists
    if (Platform.OS !== 'web') {
      const dirInfo = await FileSystem.getInfoAsync(targetImagesDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(targetImagesDir, { intermediates: true });
      }
    }
    
    // Extract images
    const imageUris = new Map<string, string>();
    
    for (const [filePath, fileData] of Object.entries(unzippedFiles)) {
      if (filePath.startsWith('images/') && filePath !== 'images/') {
        try {
          const filename = sanitizeZipImageFilename(
            filePath.replace('images/', '')
          );
          if (!filename) {
            continue;
          }
          
          if (Platform.OS === 'web') {
            // For web, create blob URL
            // Create a new Uint8Array to avoid TypeScript issues with ArrayBufferLike
            const blob = new Blob([new Uint8Array(fileData)], { type: 'image/jpeg' });
            const blobUrl = URL.createObjectURL(blob);
            imageUris.set(filename, blobUrl);
          } else {
            // For mobile, save to local storage
            const localUri = `${targetImagesDir}${filename}`;
            const base64Data = uint8ArrayToBase64(fileData);
            await FileSystem.writeAsStringAsync(localUri, base64Data, {
              encoding: FileSystem.EncodingType.Base64,
            });
            imageUris.set(filename, localUri);
            console.log(`Extracted image: ${filename}`);
          }
        } catch (error) {
          console.error(`Error extracting image ${filePath}:`, error);
          // Continue with other images
        }
      }
    }
    
    console.log(`Extracted ${imageUris.size} images from backup`);
    return { jsonData, imageUris };
  } catch (error) {
    console.error('Error extracting ZIP:', error);
    throw new Error('Failed to extract backup ZIP: ' + (error as Error).message);
  }
};

/**
 * Helper: Convert Base64 string to Uint8Array
 */
const base64ToUint8Array = (base64: string): Uint8Array => {
  // Remove data URL prefix if present
  const base64Clean = base64.replace(/^data:.*?;base64,/, '');
  const binaryString = atob(base64Clean);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Helper: Convert Uint8Array to Base64 string
 */
const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

