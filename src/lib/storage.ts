import AsyncStorage from '@react-native-async-storage/async-storage';
import { safeGetData, safeSetData, safeGetItem, safeSetItem } from '../utils/safeStorage';
import { logStorageError } from '../utils/errorLogging';
import { Plant, TaskTemplate, TaskLog, JournalEntry } from '../types/database.types';

export interface StorageData {
  plants: Plant[];
  tasks: TaskTemplate[];
  taskLogs: TaskLog[];
  journalEntries: JournalEntry[];
}

const STORAGE_KEYS = {
  PLANTS: '@garden_plants',
  TASKS: '@garden_tasks',
  TASK_LOGS: '@garden_task_logs',
  JOURNAL: '@garden_journal',
  LAST_SYNC: '@garden_last_sync',
  OFFLINE_QUEUE: '@garden_offline_queue',
};

// Export as KEYS for backwards compatibility
export const KEYS = STORAGE_KEYS;

// Generic storage functions with safe wrapper
export const getData = async <T>(key: string): Promise<T[]> => {
  try {
    return await safeGetData<T>(key);
  } catch (e) {
    logStorageError(`Error reading ${key}`, e as Error);
    return [];
  }
};

export const setData = async <T>(key: string, value: T[]): Promise<void> => {
  try {
    await safeSetData(key, value);
  } catch (e) {
    logStorageError(`Error saving ${key}`, e as Error);
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
