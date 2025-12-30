import { TaskTemplate, TaskLog } from '../types/database.types';
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
    
    const snapshot = await getDocs(q);
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
    return getData<TaskTemplate>(KEYS.TASKS);
  }
};

export const getTodayTasks = async (): Promise<TaskTemplate[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const today = new Date().toISOString();
  
  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('user_id', '==', user.uid),
      where('enabled', '==', true),
      orderBy('next_due_at', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at,
      next_due_at: doc.data().next_due_at?.toDate?.()?.toISOString() || doc.data().next_due_at
    })) as TaskTemplate[];
    
    return tasks.filter(task => task.next_due_at && task.next_due_at <= today);
  } catch (error) {
    console.warn('Failed to fetch from Firestore, using cached data:', error);
    const cachedTasks = await getData<TaskTemplate>(KEYS.TASKS);
    return cachedTasks.filter(task => task.enabled && task.next_due_at && task.next_due_at <= today);
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
  
  const docRef = await addDoc(collection(db, TASKS_COLLECTION), newTemplate);
  
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
  
  const firestoreUpdates: any = { ...updates };
  if (updates.next_due_at) {
    firestoreUpdates.next_due_at = Timestamp.fromDate(new Date(updates.next_due_at));
  }
  
  await updateDoc(docRef, firestoreUpdates);
  
  // Use direct document read instead of query for better performance
  const docSnap = await getDoc(docRef);
  
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
  await deleteDoc(docRef);
};

export const markTaskDone = async (template: TaskTemplate): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const doneAt = new Date();
  const nextDueAt = new Date(doneAt.getTime() + template.frequency_days * 24 * 60 * 60 * 1000);

  // Insert task log
  await addDoc(collection(db, TASK_LOGS_COLLECTION), {
    user_id: user.uid,
    template_id: template.id,
    plant_id: template.plant_id,
    task_type: template.task_type,
    done_at: Timestamp.fromDate(doneAt)
  });

  // Update next due date
  const docRef = doc(db, TASKS_COLLECTION, template.id);
  await updateDoc(docRef, {
    next_due_at: Timestamp.fromDate(nextDueAt)
  });
};

export const getTaskLogs = async (templateId?: string): Promise<TaskLog[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  try {
    let q = query(
      collection(db, TASK_LOGS_COLLECTION),
      where('user_id', '==', user.uid),
      orderBy('done_at', 'desc')
    );

    if (templateId) {
      q = query(
        collection(db, TASK_LOGS_COLLECTION),
        where('user_id', '==', user.uid),
        where('template_id', '==', templateId),
        orderBy('done_at', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      done_at: doc.data().done_at?.toDate?.()?.toISOString() || doc.data().done_at
    })) as TaskLog[];
    
    // Cache locally
    await setData(KEYS.TASK_LOGS, logs);
    
    return logs;
  } catch (error) {
    console.warn('Failed to fetch from Firestore, using cached data:', error);
    const cachedLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
    return templateId ? cachedLogs.filter(log => log.template_id === templateId) : cachedLogs;
  }
};
