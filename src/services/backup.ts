/**
 * Backup and Restore Service
 * 
 * This service provides manual backup/export and import/restore functionality
 * to ensure long-term data safety without depending on any cloud provider.
 * 
 * Key features:
 * - Export all text data (plants, tasks, journals) to a JSON file
 * - Import data from a backup file to restore or sync between devices
 * - Backup files are plain JSON - readable and portable
 * - User can manually upload backups to any cloud storage (Google Drive, OneDrive, etc.)
 * 
 * Note: Images are NOT included in backups (they remain local).
 * For full device-to-device sync including images, use device file sync tools
 * or manually copy the garden_images folder.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { shareAsync, isAvailableAsync } from 'expo-sharing';
import { getDocumentAsync } from 'expo-document-picker';
import { getData, setData, KEYS } from '../lib/storage';
import { getPlants } from './plants';
import { getTaskTemplates, getTaskLogs } from './tasks';
import { getJournalEntries } from './journal';
import { Plant, TaskTemplate, TaskLog, JournalEntry } from '../types/database.types';

export interface BackupData {
  version: string;
  exportDate: string;
  plants: Plant[];
  tasks: TaskTemplate[];
  taskLogs: TaskLog[];
  journal: JournalEntry[];
  // Note: Images are stored locally and NOT included in the backup
  // Only the imageUri strings are included in the plant/journal objects
}

/**
 * Export all data to a JSON backup file
 * @returns The file URI of the created backup
 */
export const exportBackup = async (): Promise<string> => {
  try {
    console.log('Starting backup export...');
    
    // Fetch all data from Firestore (or use cached if offline)
    const { plants } = await getPlants();
    const tasks = await getTaskTemplates();
    const taskLogs = await getTaskLogs();
    const journal = await getJournalEntries();
    
    // Create backup object
    const backup: BackupData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      plants,
      tasks,
      taskLogs,
      journal,
    };
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `garden-backup-${timestamp}.json`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    
    // Write to file
    await FileSystem.writeAsStringAsync(
      fileUri,
      JSON.stringify(backup, null, 2),
      { encoding: 'utf8' }
    );
    
    console.log('Backup created:', fileUri);
    
    // Share the file so user can save it to cloud storage
    if (await isAvailableAsync()) {
      await shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Save Garden Backup',
        UTI: 'public.json',
      });
    }
    
    return fileUri;
  } catch (error) {
    console.error('Error exporting backup:', error);
    throw new Error('Failed to export backup: ' + (error as Error).message);
  }
};

/**
 * Import data from a backup file
 * @param overwrite - If true, replaces all existing data. If false, merges with existing data.
 * @returns Number of items imported
 */
export const importBackup = async (overwrite: boolean = false): Promise<{
  plants: number;
  tasks: number;
  taskLogs: number;
  journal: number;
}> => {
  try {
    console.log('Starting backup import...');
    
    // Let user pick a backup file
    const result = await getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    
    if (result.canceled) {
      throw new Error('Import cancelled');
    }
    
    // Read the backup file
    const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri, {
      encoding: 'utf8',
    });
    
    const backup: BackupData = JSON.parse(fileContent);
    
    // Validate backup structure
    if (!backup.version || !backup.plants || !backup.tasks || !backup.journal) {
      throw new Error('Invalid backup file format');
    }
    
    console.log(`Importing backup from ${backup.exportDate}`);
    
    // Import data based on overwrite mode
    if (overwrite) {
      // Replace all data
      await setData(KEYS.PLANTS, backup.plants);
      await setData(KEYS.TASKS, backup.tasks);
      await setData(KEYS.TASK_LOGS, backup.taskLogs);
      await setData(KEYS.JOURNAL, backup.journal);
    } else {
      // Merge with existing data (keep existing items, add new ones)
      const existingPlants = await getData<Plant>(KEYS.PLANTS);
      const existingTasks = await getData<TaskTemplate>(KEYS.TASKS);
      const existingLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
      const existingJournal = await getData<JournalEntry>(KEYS.JOURNAL);
      
      // Merge by ID, preferring backup data for conflicts
      const mergedPlants = mergeByIdPreferBackup(existingPlants, backup.plants);
      const mergedTasks = mergeByIdPreferBackup(existingTasks, backup.tasks);
      const mergedLogs = mergeByIdPreferBackup(existingLogs, backup.taskLogs);
      const mergedJournal = mergeByIdPreferBackup(existingJournal, backup.journal);
      
      await setData(KEYS.PLANTS, mergedPlants);
      await setData(KEYS.TASKS, mergedTasks);
      await setData(KEYS.TASK_LOGS, mergedLogs);
      await setData(KEYS.JOURNAL, mergedJournal);
    }
    
    console.log('Import completed successfully');
    
    return {
      plants: backup.plants.length,
      tasks: backup.tasks.length,
      taskLogs: backup.taskLogs.length,
      journal: backup.journal.length,
    };
  } catch (error) {
    console.error('Error importing backup:', error);
    throw new Error('Failed to import backup: ' + (error as Error).message);
  }
};

/**
 * Merge two arrays by ID, preferring items from the backup
 */
function mergeByIdPreferBackup<T extends { id: string }>(
  existing: T[],
  backup: T[]
): T[] {
  const merged = new Map<string, T>();
  
  // Add existing items first
  existing.forEach(item => merged.set(item.id, item));
  
  // Overwrite with backup items
  backup.forEach(item => merged.set(item.id, item));
  
  return Array.from(merged.values());
}

/**
 * Get backup statistics
 */
export const getBackupStats = async (): Promise<{
  plantCount: number;
  taskCount: number;
  journalCount: number;
  lastExport: string | null;
}> => {
  const plants = await getData<Plant>(KEYS.PLANTS);
  const tasks = await getData<TaskTemplate>(KEYS.TASKS);
  const journal = await getData<JournalEntry>(KEYS.JOURNAL);
  
  return {
    plantCount: plants.length,
    taskCount: tasks.length,
    journalCount: journal.length,
    lastExport: null, // Could be tracked in AsyncStorage if needed
  };
};

/**
 * Clear all local data (use with caution!)
 */
export const clearAllLocalData = async (): Promise<void> => {
  await setData(KEYS.PLANTS, []);
  await setData(KEYS.TASKS, []);
  await setData(KEYS.TASK_LOGS, []);
  await setData(KEYS.JOURNAL, []);
  console.log('All local data cleared');
};
