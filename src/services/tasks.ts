import { TaskTemplate, TaskLog, Plant } from '../types/database.types';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { getData, setData, KEYS } from '../lib/storage';
import { withTimeoutAndRetry } from '../utils/firestoreTimeout';
import { logError } from '../utils/errorLogging';

const TASKS_COLLECTION = 'task_templates';
const TASK_LOGS_COLLECTION = 'task_logs';

/**
 * Get all task templates with offline-first approach
 */
export const getTaskTemplates = async (): Promise<TaskTemplate[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('user_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );
    
    const snapshot = await withTimeoutAndRetry(
      () => getDocs(q),
      { timeoutMs: 15000, maxRetries: 2 }
    );
    
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at,
      next_due_at: doc.data().next_due_at?.toDate?.()?.toISOString() || doc.data().next_due_at
    })) as TaskTemplate[];
    
    // Cache locally
    await setData(KEYS.TASKS, tasks);
    
    return tasks;
  } catch (error) {
    console.warn('Failed to fetch from Firestore, using cached data:', error);
    logError('network', 'Failed to fetch task templates', error as Error);
    return getData<TaskTemplate>(KEYS.TASKS);
  }
};

export const getTodayTasks = async (): Promise<TaskTemplate[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Get today's date range (start and end of day)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  
  try {
    // Simplified query without orderBy to avoid composite index requirement
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('user_id', '==', user.uid),
      where('enabled', '==', true)
    );
    
    const snapshot = await withTimeoutAndRetry(
      () => getDocs(q),
      { timeoutMs: 15000, maxRetries: 2 }
    );
    
    let tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at,
      next_due_at: doc.data().next_due_at?.toDate?.()?.toISOString() || doc.data().next_due_at
    })) as TaskTemplate[];
    
    // Filter tasks: include overdue tasks and tasks due today
    tasks = tasks.filter(task => {
      if (!task.next_due_at) return false;
      const dueDate = new Date(task.next_due_at);
      // Show tasks that are overdue or due today
      return dueDate <= todayEnd;
    });
    
    tasks.sort((a, b) => a.next_due_at.localeCompare(b.next_due_at));
    
    return tasks;
  } catch (error) {
    console.warn('Failed to fetch from Firestore, using cached data:', error);
    logError('network', 'Failed to fetch today tasks', error as Error);
    const cachedTasks = await getData<TaskTemplate>(KEYS.TASKS);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const filtered = cachedTasks.filter(task => {
      if (!task.enabled || !task.next_due_at) return false;
      const dueDate = new Date(task.next_due_at);
      return dueDate <= todayEnd;
    });
    filtered.sort((a, b) => a.next_due_at.localeCompare(b.next_due_at));
    return filtered;
  }
};

export const createTaskTemplate = async (
  template: Omit<TaskTemplate, 'id' | 'user_id' | 'created_at'>
): Promise<TaskTemplate> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const newTemplate = {
    ...template,
    user_id: user.uid,
    created_at: Timestamp.now(),
    next_due_at: template.next_due_at ? Timestamp.fromDate(new Date(template.next_due_at)) : null
  };
  
  const docRef = await withTimeoutAndRetry(
    () => addDoc(collection(db, TASKS_COLLECTION), newTemplate),
    { timeoutMs: 15000, maxRetries: 2 }
  );
  
  return {
    id: docRef.id,
    ...template,
    user_id: user.uid,
    created_at: newTemplate.created_at.toDate().toISOString(),
    next_due_at: newTemplate.next_due_at ? newTemplate.next_due_at.toDate().toISOString() : template.next_due_at
  } as TaskTemplate;
};

export const updateTaskTemplate = async (
  id: string,
  updates: Partial<TaskTemplate>
): Promise<TaskTemplate> => {
  const docRef = doc(db, TASKS_COLLECTION, id);
  
  const firestoreUpdates: Record<string, any> = { ...updates };
  if (updates.next_due_at) {
    firestoreUpdates.next_due_at = Timestamp.fromDate(new Date(updates.next_due_at));
  }
  
  await withTimeoutAndRetry(
    () => updateDoc(docRef, firestoreUpdates),
    { timeoutMs: 15000, maxRetries: 2 }
  );
  
  // Use direct document read instead of query for better performance
  const docSnap = await withTimeoutAndRetry(
    () => getDoc(docRef),
    { timeoutMs: 10000, maxRetries: 2 }
  );
  
  if (!docSnap.exists()) throw new Error('Task template not found');
  
  const doc_data = docSnap.data();
  return {
    id,
    ...doc_data,
    created_at: doc_data.created_at?.toDate?.()?.toISOString() || doc_data.created_at,
    next_due_at: doc_data.next_due_at?.toDate?.()?.toISOString() || doc_data.next_due_at
  } as TaskTemplate;
};

export const deleteTaskTemplate = async (id: string): Promise<void> => {
  const docRef = doc(db, TASKS_COLLECTION, id);
  await withTimeoutAndRetry(
    () => deleteDoc(docRef),
    { timeoutMs: 10000, maxRetries: 2 }
  );
};

export const markTaskDone = async (template: TaskTemplate, notes?: string, productUsed?: string): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const doneAt = new Date();
  const frequencyDays = Number.isFinite(template.frequency_days) ? template.frequency_days : 0;
  const nextDueAt = new Date(doneAt.getTime() + frequencyDays * 24 * 60 * 60 * 1000);
  const startOfDay = new Date(doneAt);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(doneAt);
  endOfDay.setHours(23, 59, 59, 999);

  const existingLogs = await getTaskLogs(template.id);
  const alreadyDoneToday = existingLogs.some(log => {
    const logDate = new Date(log.done_at);
    return logDate >= startOfDay && logDate <= endOfDay;
  });

  if (alreadyDoneToday) {
    if (frequencyDays <= 0) {
      await updateDoc(doc(db, TASKS_COLLECTION, template.id), {
        enabled: false
      });
    }
    return false;
  }

  // Insert task log with optional notes
  await addDoc(collection(db, TASK_LOGS_COLLECTION), {
    user_id: user.uid,
    template_id: template.id,
    plant_id: template.plant_id,
    task_type: template.task_type,
    done_at: Timestamp.fromDate(doneAt),
    notes: notes || null,
    product_used: productUsed || null,
    created_at: Timestamp.now()
  });

  // Update next due date
  const docRef = doc(db, TASKS_COLLECTION, template.id);
  const updates: { next_due_at?: Timestamp; enabled?: boolean } = {};
  if (frequencyDays <= 0) {
    updates.enabled = false;
    updates.next_due_at = Timestamp.fromDate(doneAt);
  } else if (!Number.isNaN(nextDueAt.getTime())) {
    updates.next_due_at = Timestamp.fromDate(nextDueAt);
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(docRef, updates);
  }

  return true;
};

export const getTaskLogs = async (templateId?: string): Promise<TaskLog[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    let q;
    
    if (templateId) {
      // Query with template filter - no orderBy to avoid composite index
      q = query(
        collection(db, TASK_LOGS_COLLECTION),
        where('user_id', '==', user.uid),
        where('template_id', '==', templateId)
      );
    } else {
      // Query all user's logs - no orderBy to avoid composite index
      q = query(
        collection(db, TASK_LOGS_COLLECTION),
        where('user_id', '==', user.uid)
      );
    }

    const snapshot = await getDocs(q);
    let logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      done_at: doc.data().done_at?.toDate?.()?.toISOString() || doc.data().done_at,
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at
    })) as TaskLog[];
    
    // Sort in-memory by done_at descending
    logs.sort((a, b) => new Date(b.done_at).getTime() - new Date(a.done_at).getTime());
    
    // Cache locally
    await setData(KEYS.TASK_LOGS, logs);
    
    return logs;
  } catch (error) {
    console.warn('Failed to fetch from Firestore, using cached data:', error);
    const cachedLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
    let filtered = templateId ? cachedLogs.filter(log => log.template_id === templateId) : cachedLogs;
    filtered.sort((a, b) => new Date(b.done_at).getTime() - new Date(a.done_at).getTime());
    return filtered;
  }
};

/**
 * Generate recurring tasks from plant care schedules
 * This will create task templates for plants that have care schedules configured
 */
export const generateRecurringTasksFromPlants = async (plants: Plant[]): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  // Get existing task templates to avoid duplicates
  const existingTasks = await getTaskTemplates();
  
  for (const plant of plants) {
    if (!plant.care_schedule || !plant.care_schedule.auto_generate_tasks) continue;

    const schedule = plant.care_schedule;
    
    // Generate water task
    if (schedule.water_frequency_days && schedule.water_frequency_days > 0) {
      const existingWaterTask = existingTasks.find(
        t => t.plant_id === plant.id && t.task_type === 'water'
      );
      
      if (!existingWaterTask) {
        await createTaskTemplate({
          plant_id: plant.id,
          task_type: 'water',
          frequency_days: schedule.water_frequency_days,
          next_due_at: new Date().toISOString(),
          enabled: true,
          preferred_time: null
        });
      }
    }

    // Generate fertilise task
    if (schedule.fertilise_frequency_days && schedule.fertilise_frequency_days > 0) {
      const existingFertiliseTask = existingTasks.find(
        t => t.plant_id === plant.id && t.task_type === 'fertilise'
      );
      
      if (!existingFertiliseTask) {
        await createTaskTemplate({
          plant_id: plant.id,
          task_type: 'fertilise',
          frequency_days: schedule.fertilise_frequency_days,
          next_due_at: new Date().toISOString(),
          enabled: true,
          preferred_time: null
        });
      }
    }

    // Generate prune task
    if (schedule.prune_frequency_days && schedule.prune_frequency_days > 0) {
      const existingPruneTask = existingTasks.find(
        t => t.plant_id === plant.id && t.task_type === 'prune'
      );
      
      if (!existingPruneTask) {
        await createTaskTemplate({
          plant_id: plant.id,
          task_type: 'prune',
          frequency_days: schedule.prune_frequency_days,
          next_due_at: new Date().toISOString(),
          enabled: true,
          preferred_time: null
        });
      }
    }
  }
};
