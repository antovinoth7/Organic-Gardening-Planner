import { TaskTemplate, TaskLog, Plant } from "../types/database.types";
import { db, auth } from "../lib/firebase";
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
  Timestamp,
} from "firebase/firestore";
import { getData, setData, KEYS } from "../lib/storage";
import { withTimeoutAndRetry } from "../utils/firestoreTimeout";
import { logError } from "../utils/errorLogging";
import { getCurrentSeason } from "../utils/seasonHelpers";

const TASKS_COLLECTION = "task_templates";
const TASK_LOGS_COLLECTION = "task_logs";

/**
 * Get all task templates with offline-first approach
 */
export const getTaskTemplates = async (): Promise<TaskTemplate[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where("user_id", "==", user.uid),
      orderBy("created_at", "desc")
    );

    const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
      timeoutMs: 15000,
      maxRetries: 2,
    });

    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at:
        doc.data().created_at?.toDate?.()?.toISOString() ||
        doc.data().created_at,
      next_due_at:
        doc.data().next_due_at?.toDate?.()?.toISOString() ||
        doc.data().next_due_at,
    })) as TaskTemplate[];

    // Cache locally
    await setData(KEYS.TASKS, tasks);

    return tasks;
  } catch (error) {
    console.warn("Failed to fetch from Firestore, using cached data:", error);
    logError("network", "Failed to fetch task templates", error as Error);
    return getData<TaskTemplate>(KEYS.TASKS);
  }
};

export const getTodayTasks = async (): Promise<TaskTemplate[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  // Get today's date range (start and end of day)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  try {
    // Simplified query without orderBy to avoid composite index requirement
    const q = query(
      collection(db, TASKS_COLLECTION),
      where("user_id", "==", user.uid),
      where("enabled", "==", true)
    );

    const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
      timeoutMs: 15000,
      maxRetries: 2,
    });

    let tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at:
        doc.data().created_at?.toDate?.()?.toISOString() ||
        doc.data().created_at,
      next_due_at:
        doc.data().next_due_at?.toDate?.()?.toISOString() ||
        doc.data().next_due_at,
    })) as TaskTemplate[];

    // Filter tasks: include overdue tasks and tasks due today
    tasks = tasks.filter((task) => {
      if (!task.next_due_at) return false;
      const dueDate = new Date(task.next_due_at);
      // Show tasks that are overdue or due today
      return dueDate <= todayEnd;
    });

    tasks.sort((a, b) => a.next_due_at.localeCompare(b.next_due_at));

    return tasks;
  } catch (error) {
    console.warn("Failed to fetch from Firestore, using cached data:", error);
    logError("network", "Failed to fetch today tasks", error as Error);
    const cachedTasks = await getData<TaskTemplate>(KEYS.TASKS);
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );
    const filtered = cachedTasks.filter((task) => {
      if (!task.enabled || !task.next_due_at) return false;
      const dueDate = new Date(task.next_due_at);
      return dueDate <= todayEnd;
    });
    filtered.sort((a, b) => a.next_due_at.localeCompare(b.next_due_at));
    return filtered;
  }
};

export const createTaskTemplate = async (
  template: Omit<TaskTemplate, "id" | "user_id" | "created_at">
): Promise<TaskTemplate> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const newTemplate = {
    ...template,
    user_id: user.uid,
    created_at: Timestamp.now(),
    next_due_at: template.next_due_at
      ? Timestamp.fromDate(new Date(template.next_due_at))
      : null,
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
    next_due_at: newTemplate.next_due_at
      ? newTemplate.next_due_at.toDate().toISOString()
      : template.next_due_at,
  } as TaskTemplate;
};

export const updateTaskTemplate = async (
  id: string,
  updates: Partial<TaskTemplate>
): Promise<TaskTemplate> => {
  const docRef = doc(db, TASKS_COLLECTION, id);

  const firestoreUpdates: Record<string, any> = { ...updates };
  if (updates.next_due_at) {
    firestoreUpdates.next_due_at = Timestamp.fromDate(
      new Date(updates.next_due_at)
    );
  }

  await withTimeoutAndRetry(() => updateDoc(docRef, firestoreUpdates), {
    timeoutMs: 15000,
    maxRetries: 2,
  });

  // Use direct document read instead of query for better performance
  const docSnap = await withTimeoutAndRetry(() => getDoc(docRef), {
    timeoutMs: 10000,
    maxRetries: 2,
  });

  if (!docSnap.exists()) throw new Error("Task template not found");

  const doc_data = docSnap.data();
  return {
    id,
    ...doc_data,
    created_at:
      doc_data.created_at?.toDate?.()?.toISOString() || doc_data.created_at,
    next_due_at:
      doc_data.next_due_at?.toDate?.()?.toISOString() || doc_data.next_due_at,
  } as TaskTemplate;
};

export const deleteTaskTemplate = async (id: string): Promise<void> => {
  const docRef = doc(db, TASKS_COLLECTION, id);
  await withTimeoutAndRetry(() => deleteDoc(docRef), {
    timeoutMs: 10000,
    maxRetries: 2,
  });
};

export const deleteTasksForPlantIds = async (
  plantIds: string[]
): Promise<void> => {
  const uniquePlantIds = Array.from(
    new Set(plantIds.filter((plantId) => plantId && plantId.trim() !== ""))
  );
  if (uniquePlantIds.length === 0) return;

  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const plantIdSet = new Set(uniquePlantIds);
  const tasks = await getTaskTemplates();
  const logs = await getTaskLogs();

  const tasksToDelete = tasks.filter(
    (task) => task.plant_id && plantIdSet.has(task.plant_id)
  );
  const logsToDelete = logs.filter(
    (log) => log.plant_id && plantIdSet.has(log.plant_id)
  );

  for (const task of tasksToDelete) {
    try {
      await withTimeoutAndRetry(
        () => deleteDoc(doc(db, TASKS_COLLECTION, task.id)),
        { timeoutMs: 10000, maxRetries: 2 }
      );
    } catch (error) {
      console.warn(`Failed to delete task template ${task.id}:`, error);
    }
  }

  for (const log of logsToDelete) {
    try {
      await withTimeoutAndRetry(
        () => deleteDoc(doc(db, TASK_LOGS_COLLECTION, log.id)),
        { timeoutMs: 10000, maxRetries: 2 }
      );
    } catch (error) {
      console.warn(`Failed to delete task log ${log.id}:`, error);
    }
  }

  const cachedTasks = await getData<TaskTemplate>(KEYS.TASKS);
  if (cachedTasks.length > 0) {
    const filteredTasks = cachedTasks.filter(
      (task) => !task.plant_id || !plantIdSet.has(task.plant_id)
    );
    await setData(KEYS.TASKS, filteredTasks);
  }

  const cachedLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
  if (cachedLogs.length > 0) {
    const filteredLogs = cachedLogs.filter(
      (log) => !log.plant_id || !plantIdSet.has(log.plant_id)
    );
    await setData(KEYS.TASK_LOGS, filteredLogs);
  }
};

export const deleteTasksForPlant = async (plantId: string): Promise<void> => {
  await deleteTasksForPlantIds([plantId]);
};

export const markTaskDone = async (
  template: TaskTemplate,
  notes?: string,
  productUsed?: string
): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const doneAt = new Date();
  const frequencyDays = Number.isFinite(template.frequency_days)
    ? template.frequency_days
    : 0;

  // Calculate next due date at 6 PM (18:00) instead of using completion time
  const nextDueAt = new Date(doneAt);
  nextDueAt.setDate(nextDueAt.getDate() + frequencyDays);
  nextDueAt.setHours(18, 0, 0, 0); // Always set to 6:00 PM

  const startOfDay = new Date(doneAt);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(doneAt);
  endOfDay.setHours(23, 59, 59, 999);

  const existingLogs = await getTaskLogs(template.id);
  const alreadyDoneToday = existingLogs.some((log) => {
    const logDate = new Date(log.done_at);
    return logDate >= startOfDay && logDate <= endOfDay;
  });

  if (alreadyDoneToday) {
    if (frequencyDays <= 0) {
      await updateDoc(doc(db, TASKS_COLLECTION, template.id), {
        enabled: false,
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
    created_at: Timestamp.now(),
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
  if (!user) throw new Error("Not authenticated");

  try {
    let q;

    if (templateId) {
      // Query with template filter - no orderBy to avoid composite index
      q = query(
        collection(db, TASK_LOGS_COLLECTION),
        where("user_id", "==", user.uid),
        where("template_id", "==", templateId)
      );
    } else {
      // Query all user's logs - no orderBy to avoid composite index
      q = query(
        collection(db, TASK_LOGS_COLLECTION),
        where("user_id", "==", user.uid)
      );
    }

    const snapshot = await getDocs(q);
    let logs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      done_at:
        doc.data().done_at?.toDate?.()?.toISOString() || doc.data().done_at,
      created_at:
        doc.data().created_at?.toDate?.()?.toISOString() ||
        doc.data().created_at,
    })) as TaskLog[];

    // Sort in-memory by done_at descending
    logs.sort(
      (a, b) => new Date(b.done_at).getTime() - new Date(a.done_at).getTime()
    );

    // Cache locally
    await setData(KEYS.TASK_LOGS, logs);

    return logs;
  } catch (error) {
    console.warn("Failed to fetch from Firestore, using cached data:", error);
    const cachedLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
    let filtered = templateId
      ? cachedLogs.filter((log) => log.template_id === templateId)
      : cachedLogs;
    filtered.sort(
      (a, b) => new Date(b.done_at).getTime() - new Date(a.done_at).getTime()
    );
    return filtered;
  }
};

/**
 * Generate recurring tasks from plant care schedules
 * This will create task templates for plants that have care schedules configured
 */
export const generateRecurringTasksFromPlants = async (
  plants: Plant[]
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  // Get existing task templates to avoid duplicates
  const existingTasks = await getTaskTemplates();

  for (const plant of plants) {
    if (!plant.care_schedule || !plant.care_schedule.auto_generate_tasks)
      continue;

    const schedule = plant.care_schedule;

    // Generate water task
    if (schedule.water_frequency_days && schedule.water_frequency_days > 0) {
      const existingWaterTask = existingTasks.find(
        (t) => t.plant_id === plant.id && t.task_type === "water"
      );

      if (!existingWaterTask) {
        await createTaskTemplate({
          plant_id: plant.id,
          task_type: "water",
          frequency_days: schedule.water_frequency_days,
          next_due_at: new Date().toISOString(),
          enabled: true,
          preferred_time: null,
        });
      }
    }

    // Generate fertilise task
    if (
      schedule.fertilise_frequency_days &&
      schedule.fertilise_frequency_days > 0
    ) {
      const existingFertiliseTask = existingTasks.find(
        (t) => t.plant_id === plant.id && t.task_type === "fertilise"
      );

      if (!existingFertiliseTask) {
        await createTaskTemplate({
          plant_id: plant.id,
          task_type: "fertilise",
          frequency_days: schedule.fertilise_frequency_days,
          next_due_at: new Date().toISOString(),
          enabled: true,
          preferred_time: null,
        });
      }
    }

    // Generate prune task
    if (schedule.prune_frequency_days && schedule.prune_frequency_days > 0) {
      const existingPruneTask = existingTasks.find(
        (t) => t.plant_id === plant.id && t.task_type === "prune"
      );

      if (!existingPruneTask) {
        await createTaskTemplate({
          plant_id: plant.id,
          task_type: "prune",
          frequency_days: schedule.prune_frequency_days,
          next_due_at: new Date().toISOString(),
          enabled: true,
          preferred_time: null,
        });
      }
    }
  }
};

/**
 * Get the appropriate frequency for a task based on plant settings
 * (Simplified version - seasonal adjustments removed)
 */
export const getSmartTaskFrequency = (
  plant: Plant,
  taskType: "water" | "fertilise"
): number => {
  if (taskType === "water") {
    return plant.watering_frequency_days || 3;
  } else if (taskType === "fertilise") {
    return plant.fertilising_frequency_days || 14;
  }

  // Default fallback
  return taskType === "water" ? 3 : 14;
};

/**
 * Check if a watering task should be skipped based on plant preferences
 * (Simplified version - weather intelligence features removed)
 */
export const shouldSkipWateringTask = (
  plant: Plant
): { skip: boolean; reason?: string } => {
  // Always proceed with watering (no advanced weather checks)
  return { skip: false };
};

/**
 * PHASE 2: Calculate task priority based on plant health, growth stage, and overdue status
 */
export const calculateTaskPriority = (
  task: TaskTemplate,
  plant: Plant | null
): "critical" | "high" | "medium" | "low" => {
  if (!plant) {
    return "medium";
  }

  // Critical if plant is sick or stressed
  if (plant.health_status === "sick" || plant.health_status === "stressed") {
    return "critical";
  }

  // High priority for flowering/fruiting stages
  if (plant.growth_stage === "flowering" || plant.growth_stage === "fruiting") {
    return "high";
  }

  // Check if task is overdue
  const dueDate = new Date(task.next_due_at);
  const now = new Date();
  const daysOverdue = Math.floor(
    (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysOverdue > 2) {
    return "critical";
  } else if (daysOverdue > 0) {
    return "high";
  }

  // Low priority for dormant plants
  if (plant.growth_stage === "dormant") {
    return "low";
  }

  return "medium";
};

/**
 * Get seasonal care reminder for plant
 * (Simplified version - seasonal care profiles removed)
 */
export const getSeasonalCareReminder = (plant: Plant): string | null => {
  const season = getCurrentSeason();

  // Provide basic seasonal advice
  if (season === "monsoon" && plant.space_type === "pot") {
    return "Ensure proper drainage to prevent waterlogging";
  }

  return null;
};
