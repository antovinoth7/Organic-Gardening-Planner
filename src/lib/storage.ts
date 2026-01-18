import { safeGetData, safeSetData } from '../utils/safeStorage';
import { logStorageError } from '../utils/errorLogging';

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
