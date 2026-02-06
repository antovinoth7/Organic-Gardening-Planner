import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Safe AsyncStorage Wrapper with Mutex
 * Prevents race conditions and data corruption
 * Handles concurrent reads/writes safely
 */

interface QueueItem {
  operation: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

const MAX_QUEUE_SIZE = 100; // Prevent memory overflow

class StorageQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;

  async add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // Prevent queue overflow - reject if too many operations pending
      if (this.queue.length >= MAX_QUEUE_SIZE) {
        console.error(`Storage queue overflow: ${this.queue.length} items pending`);
        reject(new Error('Storage queue overflow - too many pending operations'));
        return;
      }
      
      this.queue.push({ operation, resolve, reject });
      this.process();
    });
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  private async process() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      try {
        const result = await item.operation();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }

    this.isProcessing = false;
  }
}

const storageQueue = new StorageQueue();

/**
 * Get current storage queue size for monitoring
 */
export const getStorageQueueSize = (): number => storageQueue.getQueueSize();

/**
 * Safe get with error handling and retry logic
 */
export const safeGetData = async <T>(key: string, retries = 2): Promise<T[]> => {
  return storageQueue.add(async () => {
    for (let i = 0; i <= retries; i++) {
      try {
        const jsonValue = await AsyncStorage.getItem(key);
        if (jsonValue === null) return [];
        
        const parsed = JSON.parse(jsonValue);
        
        // Validate that parsed data is an array
        if (!Array.isArray(parsed)) {
          console.warn(`Data at key ${key} is not an array, returning empty array`);
          return [];
        }
        
        return parsed;
      } catch (e: any) {
        console.error(`Error reading ${key} (attempt ${i + 1}/${retries + 1}):`, e);
        
        // If JSON parse error, data is corrupted - clear it
        if (e instanceof SyntaxError || e?.message?.includes('JSON')) {
          console.warn(`Corrupted data at ${key}, clearing...`);
          try {
            await AsyncStorage.removeItem(key);
          } catch (clearError) {
            console.error(`Failed to clear corrupted data at ${key}:`, clearError);
          }
          return [];
        }
        
        // On last retry, return empty array instead of throwing
        if (i === retries) {
          console.error(`All retries exhausted for ${key}, returning empty array`);
          return [];
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)));
      }
    }

    console.error(`Failed to read ${key} after ${retries + 1} attempts`);
    return [];
  });
};

/**
 * Safe set with error handling and retry logic
 */
export const safeSetData = async <T>(key: string, value: T[], retries = 2): Promise<boolean> => {
  return storageQueue.add(async () => {
    let lastError: any;

    // Validate input
    if (!Array.isArray(value)) {
      console.error(`Attempted to save non-array data to ${key}`);
      return false;
    }

    for (let i = 0; i <= retries; i++) {
      try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
        return true;
      } catch (e: any) {
        lastError = e;
        console.error(`Error saving ${key} (attempt ${i + 1}/${retries + 1}):`, e);
        
        // Wait before retry
        if (i < retries) {
          await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
        }
      }
    }

    console.error(`Failed to save ${key} after ${retries + 1} attempts:`, lastError);
    return false;
  });
};

/**
 * Safe single value get
 */
export const safeGetItem = async (key: string, retries = 2): Promise<string | null> => {
  return storageQueue.add(async () => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await AsyncStorage.getItem(key);
      } catch (e: any) {
        console.error(`Error reading item ${key} (attempt ${i + 1}/${retries + 1}):`, e);
        
        if (i < retries) {
          await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
        }
      }
    }

    console.error(`Failed to read item ${key} after ${retries + 1} attempts`);
    return null;
  });
};

/**
 * Safe single value set
 */
export const safeSetItem = async (key: string, value: string, retries = 2): Promise<boolean> => {
  return storageQueue.add(async () => {
    for (let i = 0; i <= retries; i++) {
      try {
        await AsyncStorage.setItem(key, value);
        return true;
      } catch (e: any) {
        console.error(`Error saving item ${key} (attempt ${i + 1}/${retries + 1}):`, e);
        
        if (i < retries) {
          await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
        }
      }
    }

    console.error(`Failed to save item ${key} after ${retries + 1} attempts`);
    return false;
  });
};

