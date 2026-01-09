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

class StorageQueue {
  private queue: QueueItem[] = [];
  private isProcessing = false;

  async add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, resolve, reject });
      this.process();
    });
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
 * Safe get with error handling and retry logic
 */
export const safeGetData = async <T>(key: string, retries = 2): Promise<T[]> => {
  return storageQueue.add(async () => {
    let lastError: any;

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
        lastError = e;
        console.error(`Error reading ${key} (attempt ${i + 1}/${retries + 1}):`, e);
        
        // If JSON parse error, data is corrupted - clear it
        if (e instanceof SyntaxError) {
          console.warn(`Corrupted data at ${key}, clearing...`);
          await AsyncStorage.removeItem(key).catch(() => {});
          return [];
        }
        
        // Wait before retry
        if (i < retries) {
          await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
        }
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
    let lastError: any;

    for (let i = 0; i <= retries; i++) {
      try {
        return await AsyncStorage.getItem(key);
      } catch (e: any) {
        lastError = e;
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
    let lastError: any;

    for (let i = 0; i <= retries; i++) {
      try {
        await AsyncStorage.setItem(key, value);
        return true;
      } catch (e: any) {
        lastError = e;
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

/**
 * Safe remove
 */
export const safeRemoveItem = async (key: string): Promise<boolean> => {
  return storageQueue.add(async () => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`Error removing ${key}:`, e);
      return false;
    }
  });
};

/**
 * Clear all storage (use with caution)
 */
export const safeClearAll = async (): Promise<boolean> => {
  return storageQueue.add(async () => {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (e) {
      console.error('Error clearing storage:', e);
      return false;
    }
  });
};
