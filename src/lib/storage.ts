import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageData {
  plants: any[];
  tasks: any[];
  taskLogs: any[];
  journalEntries: any[];
}

const STORAGE_KEYS = {
  PLANTS: '@garden_plants',
  TASKS: '@garden_tasks',
  TASK_LOGS: '@garden_task_logs',
  JOURNAL: '@garden_journal',
  LAST_SYNC: '@garden_last_sync',
  OFFLINE_QUEUE: '@garden_offline_queue',
};

// Generic storage functions
export const getData = async <T>(key: string): Promise<T[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error(`Error reading ${key}:`, e);
    return [];
  }
};

export const setData = async <T>(key: string, value: T[]): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
  }
};

export const addItem = async <T extends { id: string }>(key: string, item: T): Promise<T> => {
  const items = await getData<T>(key);
  items.push(item);
  await setData(key, items);
  return item;
};

export const updateItem = async <T extends { id: string }>(
  key: string,
  id: string,
  updates: Partial<T>
): Promise<T | null> => {
  const items = await getData<T>(key);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  
  items[index] = { ...items[index], ...updates };
  await setData(key, items);
  return items[index];
};

export const deleteItem = async (key: string, id: string): Promise<void> => {
  const items = await getData<any>(key);
  const filtered = items.filter((item) => item.id !== id);
  await setData(key, filtered);
};

export const getItemById = async <T extends { id: string }>(
  key: string,
  id: string
): Promise<T | null> => {
  const items = await getData<T>(key);
  return items.find((item) => item.id === id) || null;
};

// Offline sync management
export const getLastSyncTime = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  } catch (e) {
    console.error('Error reading last sync time:', e);
    return null;
  }
};

export const setLastSyncTime = async (timestamp: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
  } catch (e) {
    console.error('Error saving last sync time:', e);
  }
};

export const addToOfflineQueue = async (operation: {
  type: 'create' | 'update' | 'delete';
  collection: string;
  id?: string;
  data?: any;
}): Promise<void> => {
  try {
    const queue = await getData<any>(STORAGE_KEYS.OFFLINE_QUEUE);
    queue.push({ ...operation, timestamp: new Date().toISOString() });
    await setData(STORAGE_KEYS.OFFLINE_QUEUE, queue);
  } catch (e) {
    console.error('Error adding to offline queue:', e);
  }
};

export const getOfflineQueue = async (): Promise<any[]> => {
  return getData(STORAGE_KEYS.OFFLINE_QUEUE);
};

export const clearOfflineQueue = async (): Promise<void> => {
  await setData(STORAGE_KEYS.OFFLINE_QUEUE, []);
};

// Specific storage keys
export const KEYS = STORAGE_KEYS;
