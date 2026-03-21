import {
  TaskTemplate,
  TaskLog,
  Plant,
  TaskType,
} from "../types/database.types";
import { db, auth, refreshAuthToken } from "../lib/firebase";
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
import {
  getCached,
  setCached,
  invalidate,
  CACHE_KEYS,
} from "../lib/dataCache";
import {
  getCurrentSeason,
  getWateringFrequencyMultiplier,
} from "../utils/seasonHelpers";
import { getCoconutAgeInfo } from "../utils/plantHelpers";

const TASKS_COLLECTION = "task_templates";
const TASK_LOGS_COLLECTION = "task_logs";
const PLANTS_COLLECTION = "plants";
type PlantLastCareField =
  | "last_watered_date"
  | "last_fertilised_date"
  | "last_pruned_date"
  | "last_harvest_date";
const TASK_TYPE_TO_PLANT_LAST_CARE_FIELD: Partial<
  Record<TaskType, PlantLastCareField>
> = {
  water: "last_watered_date",
  fertilise: "last_fertilised_date",
  prune: "last_pruned_date",
  harvest: "last_harvest_date",
};
type MarkTaskDoneOptions = {
  skipAlreadyDoneCheck?: boolean;
};

/**
 * Get all task templates with offline-first approach
 */
export const getTaskTemplates = async (): Promise<TaskTemplate[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  // Return fresh in-memory data if available
  const cached = getCached<TaskTemplate[]>(CACHE_KEYS.TASK_TEMPLATES);
  if (cached) return cached;

  // Refresh token to prevent expiration issues
  await refreshAuthToken();
  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where("user_id", "==", user.uid),
      orderBy("created_at", "desc"),
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
    setCached(CACHE_KEYS.TASK_TEMPLATES, tasks);

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

  // Return fresh in-memory data if available
  const cached = getCached<TaskTemplate[]>(CACHE_KEYS.TODAY_TASKS);
  if (cached) return cached;

  // Refresh token to prevent expiration issues
  await refreshAuthToken();

  // Get today's date range (start and end of day)
  const now = new Date();
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );

  try {
    // Simplified query without orderBy to avoid composite index requirement
    const q = query(
      collection(db, TASKS_COLLECTION),
      where("user_id", "==", user.uid),
      where("enabled", "==", true),
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

    setCached(CACHE_KEYS.TODAY_TASKS, tasks);
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
      999,
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
  template: Omit<TaskTemplate, "id" | "user_id" | "created_at">,
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
    { timeoutMs: 15000, maxRetries: 2 },
  );

  const result = {
    id: docRef.id,
    ...template,
    user_id: user.uid,
    created_at: newTemplate.created_at.toDate().toISOString(),
    next_due_at: newTemplate.next_due_at
      ? newTemplate.next_due_at.toDate().toISOString()
      : template.next_due_at,
  } as TaskTemplate;

  invalidate(CACHE_KEYS.TASK_TEMPLATES, CACHE_KEYS.TODAY_TASKS);

  return result;
};

export const updateTaskTemplate = async (
  id: string,
  updates: Partial<TaskTemplate>,
): Promise<TaskTemplate> => {
  const docRef = doc(db, TASKS_COLLECTION, id);

  const firestoreUpdates: Record<string, any> = { ...updates };
  if (updates.next_due_at) {
    const parsedDate = new Date(updates.next_due_at);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new Error("Invalid next_due_at date value");
    }
    firestoreUpdates.next_due_at = Timestamp.fromDate(parsedDate);
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
  const result = {
    id,
    ...doc_data,
    created_at:
      doc_data.created_at?.toDate?.()?.toISOString() || doc_data.created_at,
    next_due_at:
      doc_data.next_due_at?.toDate?.()?.toISOString() || doc_data.next_due_at,
  } as TaskTemplate;

  invalidate(CACHE_KEYS.TASK_TEMPLATES, CACHE_KEYS.TODAY_TASKS);

  return result;
};

export const deleteTasksForPlantIds = async (
  plantIds: string[],
): Promise<void> => {
  const uniquePlantIds = Array.from(
    new Set(plantIds.filter((plantId) => plantId && plantId.trim() !== "")),
  );
  if (uniquePlantIds.length === 0) return;

  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const plantIdSet = new Set(uniquePlantIds);
  const tasks = await getTaskTemplates();
  const logs = await getTaskLogs();

  const tasksToDelete = tasks.filter(
    (task) => task.plant_id && plantIdSet.has(task.plant_id),
  );
  const logsToDelete = logs.filter(
    (log) => log.plant_id && plantIdSet.has(log.plant_id),
  );

  for (const task of tasksToDelete) {
    try {
      await withTimeoutAndRetry(
        () => deleteDoc(doc(db, TASKS_COLLECTION, task.id)),
        { timeoutMs: 10000, maxRetries: 2 },
      );
    } catch (error) {
      console.warn(`Failed to delete task template ${task.id}:`, error);
    }
  }

  for (const log of logsToDelete) {
    try {
      await withTimeoutAndRetry(
        () => deleteDoc(doc(db, TASK_LOGS_COLLECTION, log.id)),
        { timeoutMs: 10000, maxRetries: 2 },
      );
    } catch (error) {
      console.warn(`Failed to delete task log ${log.id}:`, error);
    }
  }

  const cachedTasks = await getData<TaskTemplate>(KEYS.TASKS);
  if (cachedTasks.length > 0) {
    const filteredTasks = cachedTasks.filter(
      (task) => !task.plant_id || !plantIdSet.has(task.plant_id),
    );
    await setData(KEYS.TASKS, filteredTasks);
  }

  const cachedLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
  if (cachedLogs.length > 0) {
    const filteredLogs = cachedLogs.filter(
      (log) => !log.plant_id || !plantIdSet.has(log.plant_id),
    );
    await setData(KEYS.TASK_LOGS, filteredLogs);
  }

  invalidate(
    CACHE_KEYS.TASK_TEMPLATES,
    CACHE_KEYS.TODAY_TASKS,
    CACHE_KEYS.TODAY_TASK_LOGS,
  );
};

export const markTaskDone = async (
  template: TaskTemplate,
  notes?: string,
  productUsed?: string,
  options?: MarkTaskDoneOptions,
): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const doneAt = new Date();
  const frequencyDays = Number.isFinite(template.frequency_days)
    ? template.frequency_days
    : 0;

  // For water tasks, apply Kanyakumari season-aware multiplier so next due
  // date reflects actual rainfall / heat conditions.
  let effectiveDays = frequencyDays;
  if (
    template.task_type === "water" &&
    template.plant_id &&
    frequencyDays > 0
  ) {
    const cachedPlants = await getData<Plant>(KEYS.PLANTS);
    const waterPlant = cachedPlants.find((p) => p.id === template.plant_id);
    if (waterPlant) {
      effectiveDays = Math.max(
        1,
        Math.round(
          frequencyDays * getWateringFrequencyMultiplier(waterPlant.space_type),
        ),
      );
    }
  }

  // Calculate next due date at 6 PM (18:00) instead of using completion time
  const nextDueAt = new Date(doneAt);
  nextDueAt.setDate(nextDueAt.getDate() + effectiveDays);
  nextDueAt.setHours(18, 0, 0, 0); // Always set to 6:00 PM

  const startOfDay = new Date(doneAt);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(doneAt);
  endOfDay.setHours(23, 59, 59, 999);

  if (!options?.skipAlreadyDoneCheck) {
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
  }

  // Insert task log with optional notes
  const logDocRef = await addDoc(collection(db, TASK_LOGS_COLLECTION), {
    user_id: user.uid,
    template_id: template.id,
    plant_id: template.plant_id,
    task_type: template.task_type,
    done_at: Timestamp.fromDate(doneAt),
    notes: notes || null,
    product_used: productUsed || null,
    created_at: Timestamp.now(),
  });

  const doneAtIso = doneAt.toISOString();
  const newTaskLog: TaskLog = {
    id: logDocRef.id,
    user_id: user.uid,
    template_id: template.id,
    plant_id: template.plant_id,
    task_type: template.task_type,
    done_at: doneAtIso,
    notes: notes || null,
    product_used: productUsed || null,
    created_at: doneAtIso,
  };
  const cachedLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
  cachedLogs.unshift(newTaskLog);
  await setData(KEYS.TASK_LOGS, cachedLogs);

  // Update next due date
  const docRef = doc(db, TASKS_COLLECTION, template.id);
  const updates: { next_due_at?: Timestamp; enabled?: boolean } = {};
  let nextDueAtIso: string | undefined;
  if (frequencyDays <= 0) {
    updates.enabled = false;
    updates.next_due_at = Timestamp.fromDate(doneAt);
    nextDueAtIso = doneAtIso;
  } else if (!Number.isNaN(nextDueAt.getTime())) {
    updates.next_due_at = Timestamp.fromDate(nextDueAt);
    nextDueAtIso = nextDueAt.toISOString();
  }

  if (Object.keys(updates).length > 0) {
    await updateDoc(docRef, updates);
  }

  if (Object.keys(updates).length > 0) {
    const cachedTasks = await getData<TaskTemplate>(KEYS.TASKS);
    const taskIndex = cachedTasks.findIndex((task) => task.id === template.id);
    if (taskIndex !== -1) {
      cachedTasks[taskIndex] = {
        ...cachedTasks[taskIndex],
        ...(typeof updates.enabled === "boolean"
          ? { enabled: updates.enabled }
          : {}),
        ...(nextDueAtIso ? { next_due_at: nextDueAtIso } : {}),
      };
      await setData(KEYS.TASKS, cachedTasks);
    }
  }

  const plantLastCareField =
    TASK_TYPE_TO_PLANT_LAST_CARE_FIELD[template.task_type];
  if (template.plant_id && plantLastCareField) {
    try {
      await updateDoc(doc(db, PLANTS_COLLECTION, template.plant_id), {
        [plantLastCareField]: doneAtIso,
      });

      const cachedPlants = await getData<Plant>(KEYS.PLANTS);
      const plantIndex = cachedPlants.findIndex(
        (plant) => plant.id === template.plant_id,
      );
      if (plantIndex !== -1) {
        cachedPlants[plantIndex] = {
          ...cachedPlants[plantIndex],
          [plantLastCareField]: doneAtIso,
        };
        await setData(KEYS.PLANTS, cachedPlants);
      }
    } catch (error) {
      console.warn(
        `Failed to update ${plantLastCareField} for plant ${template.plant_id}:`,
        error,
      );
    }
  }

  // Invalidate caches after mutation
  invalidate(
    CACHE_KEYS.TODAY_TASKS,
    CACHE_KEYS.TASK_TEMPLATES,
    CACHE_KEYS.TODAY_TASK_LOGS,
    CACHE_KEYS.ALL_PLANTS,
  );

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
        where("template_id", "==", templateId),
      );
    } else {
      // Query all user's logs - no orderBy to avoid composite index
      q = query(
        collection(db, TASK_LOGS_COLLECTION),
        where("user_id", "==", user.uid),
      );
    }

    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map((doc) => ({
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
      (a, b) => new Date(b.done_at).getTime() - new Date(a.done_at).getTime(),
    );

    // Cache locally
    await setData(KEYS.TASK_LOGS, logs);

    return logs;
  } catch (error) {
    console.warn("Failed to fetch from Firestore, using cached data:", error);
    const cachedLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
    const filtered = templateId
      ? cachedLogs.filter((log) => log.template_id === templateId)
      : cachedLogs;
    filtered.sort(
      (a, b) => new Date(b.done_at).getTime() - new Date(a.done_at).getTime(),
    );
    return filtered;
  }
};

/**
 * Get only today's task logs — much cheaper than getTaskLogs() which
 * fetches the entire history.  Uses a Firestore date-range filter so
 * only relevant docs cross the wire.
 */
export const getTodayTaskLogs = async (): Promise<TaskLog[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  // Return fresh in-memory data if available
  const cached = getCached<TaskLog[]>(CACHE_KEYS.TODAY_TASK_LOGS);
  if (cached) return cached;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  try {
    const q = query(
      collection(db, TASK_LOGS_COLLECTION),
      where("user_id", "==", user.uid),
      where("done_at", ">=", Timestamp.fromDate(today)),
      where("done_at", "<=", Timestamp.fromDate(todayEnd)),
    );

    const snapshot = await withTimeoutAndRetry(() => getDocs(q), {
      timeoutMs: 15000,
      maxRetries: 2,
    });

    const logs = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      done_at:
        d.data().done_at?.toDate?.()?.toISOString() || d.data().done_at,
      created_at:
        d.data().created_at?.toDate?.()?.toISOString() ||
        d.data().created_at,
    })) as TaskLog[];

    logs.sort(
      (a, b) => new Date(b.done_at).getTime() - new Date(a.done_at).getTime(),
    );

    setCached(CACHE_KEYS.TODAY_TASK_LOGS, logs);
    return logs;
  } catch (error) {
    console.warn("Failed to fetch today logs, using cached data:", error);
    const cachedLogs = await getData<TaskLog>(KEYS.TASK_LOGS);
    return cachedLogs.filter((log) => {
      const logDate = new Date(log.done_at);
      return logDate >= today && logDate <= todayEnd;
    });
  }
};

const parseDateValue = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const computeNextDueAt = (
  plant: Plant,
  taskType: TaskType,
  frequency: number,
): string => {
  const reference =
    taskType === "water"
      ? plant.last_watered_date
      : taskType === "fertilise"
        ? plant.last_fertilised_date
        : taskType === "prune"
          ? plant.last_pruned_date
          : null;

  const base = parseDateValue(reference) || new Date();

  const nextDueAt = new Date(base);
  nextDueAt.setDate(nextDueAt.getDate() + frequency);
  nextDueAt.setHours(18, 0, 0, 0);

  return nextDueAt.toISOString();
};

/**
 * Generate recurring tasks from plant care schedules
 * This will create task templates for plants that have care schedules configured
 */
const _generateRecurringTasksFromPlants = async (
  plants: Plant[],
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
        (t) => t.plant_id === plant.id && t.task_type === "water",
      );

      if (!existingWaterTask) {
        await createTaskTemplate({
          plant_id: plant.id,
          task_type: "water",
          frequency_days: schedule.water_frequency_days,
          next_due_at: computeNextDueAt(
            plant,
            "water",
            schedule.water_frequency_days,
          ),
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
        (t) => t.plant_id === plant.id && t.task_type === "fertilise",
      );

      if (!existingFertiliseTask) {
        await createTaskTemplate({
          plant_id: plant.id,
          task_type: "fertilise",
          frequency_days: schedule.fertilise_frequency_days,
          next_due_at: computeNextDueAt(
            plant,
            "fertilise",
            schedule.fertilise_frequency_days,
          ),
          enabled: true,
          preferred_time: null,
        });
      }
    }

    // Generate prune task
    if (schedule.prune_frequency_days && schedule.prune_frequency_days > 0) {
      const existingPruneTask = existingTasks.find(
        (t) => t.plant_id === plant.id && t.task_type === "prune",
      );

      if (!existingPruneTask) {
        await createTaskTemplate({
          plant_id: plant.id,
          task_type: "prune",
          frequency_days: schedule.prune_frequency_days,
          next_due_at: computeNextDueAt(
            plant,
            "prune",
            schedule.prune_frequency_days,
          ),
          enabled: true,
          preferred_time: null,
        });
      }
    }
  }
};

export const syncCareTasksForPlant = async (plant: Plant): Promise<void> => {
  if (!plant?.id) return;

  const desiredFrequencies = [
    { taskType: "water" as TaskType, frequency: plant.watering_frequency_days },
    {
      taskType: "fertilise" as TaskType,
      frequency: plant.fertilising_frequency_days,
    },
    { taskType: "prune" as TaskType, frequency: plant.pruning_frequency_days },
  ].filter(
    (item) =>
      typeof item.frequency === "number" &&
      Number.isFinite(item.frequency) &&
      item.frequency > 0,
  ) as { taskType: TaskType; frequency: number }[];

  // For coconut trees, auto-derive a Harvest task from the tree's age.
  // harvestFrequencyDays === 0 means the tree is not yet bearing.
  if (plant.plant_type === "coconut_tree" && plant.planting_date) {
    const ageInfo = getCoconutAgeInfo(plant.planting_date);
    if (ageInfo && ageInfo.harvestFrequencyDays > 0) {
      desiredFrequencies.push({
        taskType: "harvest",
        frequency: ageInfo.harvestFrequencyDays,
      });
    }
  }

  if (desiredFrequencies.length === 0) return;

  const existingTasks = await getTaskTemplates();
  const plantTasks = existingTasks.filter((task) => task.plant_id === plant.id);
  const plantCreatedAt = parseDateValue(plant.created_at);

  for (const { taskType, frequency } of desiredFrequencies) {
    // Apply Kanyakumari season-aware multiplier for water tasks.
    // frequencyDays stored remains the user-configured base so the user's
    // intent is preserved across seasons; only next_due_at is adjusted.
    const effectiveFrequency =
      taskType === "water"
        ? Math.max(
            1,
            Math.round(
              frequency * getWateringFrequencyMultiplier(plant.space_type),
            ),
          )
        : frequency;
    const nextDueAt = computeNextDueAt(plant, taskType, effectiveFrequency);
    const existing = plantTasks.find((task) => task.task_type === taskType);
    if (existing) {
      const updates: Partial<TaskTemplate> = {};
      if (existing.frequency_days !== frequency) {
        updates.frequency_days = frequency;
        updates.next_due_at = nextDueAt;
      }
      if (!existing.enabled) {
        updates.enabled = true;
      }
      const existingDueDate = parseDateValue(existing.next_due_at);
      if (!existingDueDate) {
        updates.next_due_at = nextDueAt;
      } else if (plantCreatedAt && existingDueDate < plantCreatedAt) {
        updates.next_due_at = nextDueAt;
      }
      if (Object.keys(updates).length > 0) {
        await updateTaskTemplate(existing.id, updates);
      }
      continue;
    }

    await createTaskTemplate({
      plant_id: plant.id,
      task_type: taskType,
      frequency_days: frequency,
      next_due_at: nextDueAt,
      enabled: true,
      preferred_time: null,
    });
  }
};

/**
 * PHASE 2: Calculate task priority based on plant health, growth stage, and overdue status
 */
export const calculateTaskPriority = (
  task: TaskTemplate,
  plant: Plant | null,
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
    (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
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

  // Provide season-specific advice for Kanyakumari conditions
  if (
    (season === "sw_monsoon" || season === "ne_monsoon") &&
    plant.space_type === "pot"
  ) {
    return season === "ne_monsoon"
      ? "NE Monsoon: heaviest rains — check drainage daily, move pots under cover if needed"
      : "SW Monsoon: ensure proper drainage to prevent waterlogging";
  }

  if (
    season === "ne_monsoon" &&
    (plant.space_type === "bed" || plant.space_type === "ground")
  ) {
    return "NE Monsoon season — reduce watering; natural rainfall is usually sufficient";
  }

  if (season === "summer") {
    return "Peak summer heat — water early morning or after sunset to reduce evaporation";
  }

  if (season === "cool_dry") {
    return "Cool dry period — good time to apply organic mulch and prepare beds for the next season";
  }

  return null;
};
