import React, { useMemo, useState, useRef } from "react";
import {
  getTaskTemplates,
  deleteTasksForPlantIds,
} from "../services/tasks";
import { getAllPlants, plantExists } from "../services/plants";
import { getJournalMetadata } from "../services/journal";
import {
  TaskTemplate,
  Plant,
  JournalEntryType,
  JournalEntry,
} from "../types/database.types";
import { isNetworkAvailable } from "../utils/networkState";

type GroupBy = "none" | "location" | "type";

interface UseCalendarDataOptions {
  normalizedSearchQuery: string;
  normalizeSearchText: (value: string) => string;
  selectedView: "week" | "month";
  currentWeekStart: Date;
  currentMonth: Date;
  selectedDate: Date | null;
  groupBy: GroupBy;
}

export function useCalendarData({
  normalizedSearchQuery,
  normalizeSearchText,
  selectedView,
  currentWeekStart,
  currentMonth,
  selectedDate,
  groupBy,
}: UseCalendarDataOptions) {
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [harvestEntries, setHarvestEntries] = useState<JournalEntry[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isMountedRef = useRef(true);
  const lastLoadTimeRef = useRef(0);

  const loadData = React.useCallback(async (options?: { force?: boolean }) => {
    // Debounce: skip if loaded recently (within 2s) unless forced
    const now = Date.now();
    if (!options?.force && now - lastLoadTimeRef.current < 2000) return;
    lastLoadTimeRef.current = now;

    try {
      const [tasksData, plantsData, journalData] = await Promise.all([
        getTaskTemplates(),
        getAllPlants(),
        getJournalMetadata(),
      ]);

      if (!isMountedRef.current) return;

      const plantIds = new Set(plantsData.map((plant) => plant.id));
      const filteredTasks = tasksData.filter(
        (task) =>
          task.enabled && (!task.plant_id || plantIds.has(task.plant_id)),
      );
      const orphanPlantIds = Array.from(
        new Set(
          tasksData
            .filter((task) => task.plant_id && !plantIds.has(task.plant_id))
            .map((task) => task.plant_id as string),
        ),
      );

      setTasks(filteredTasks);
      setPlants(plantsData);
      setHarvestEntries(
        journalData.filter((e) => e.entry_type === JournalEntryType.Harvest),
      );

      if (orphanPlantIds.length > 0 && isNetworkAvailable()) {
        const confirmedOrphans = (
          await Promise.all(
            orphanPlantIds.map(async (plantId) => {
              try {
                const exists = await plantExists(plantId);
                return exists ? null : plantId;
              } catch (error) {
                const errorCode = (error as { code?: string })?.code;
                if (
                  errorCode !== "permission-denied" &&
                  errorCode !== "unauthenticated"
                ) {
                  console.warn(`Failed to verify plant ${plantId}:`, error);
                }
                return null;
              }
            }),
          )
        ).filter((plantId): plantId is string => Boolean(plantId));

        if (confirmedOrphans.length > 0) {
          await deleteTasksForPlantIds(confirmedOrphans);
        }
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error(error);
    } finally {
      if (isMountedRef.current) {
        setInitialLoading(false);
      }
    }
  }, []);

  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData({ force: true });
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, [loadData]);

  // O(1) plant lookup map instead of O(n) .find() per task
  const plantMap = useMemo(() => {
    const map = new Map<string, Plant>();
    for (const p of plants) {
      map.set(p.id, p);
    }
    return map;
  }, [plants]);

  const getPlantDetails = React.useCallback(
    (plantId: string | null) => {
      if (!plantId) return { name: "General", location: "", type: "" };
      const plant = plantMap.get(plantId);
      if (!plant) return { name: "Unknown", location: "", type: "" };
      return {
        name: plant.name || "Unknown",
        location: plant.location || "",
        type: plant.plant_type || "",
      };
    },
    [plantMap],
  );

  const filterTasksBySearch = React.useCallback(
    (taskList: TaskTemplate[]) => {
      if (!normalizedSearchQuery) return taskList;
      return taskList.filter((task) => {
        if (!task) return false;
        const plantDetails = getPlantDetails(task.plant_id);
        const plantType = plantDetails.type || "";
        const searchableValues = [
          plantDetails.name,
          plantDetails.location,
          plantType,
          plantType.replace(/_/g, " "),
          task.task_type,
        ];
        return searchableValues.some(
          (value) =>
            typeof value === "string" &&
            normalizeSearchText(value).includes(normalizedSearchQuery),
        );
      });
    },
    [normalizedSearchQuery, normalizeSearchText, getPlantDetails],
  );

  const sortTasks = React.useCallback((taskList: TaskTemplate[]) => {
    return [...taskList].sort((a, b) => {
      const dateA = new Date(a.next_due_at).getTime();
      const dateB = new Date(b.next_due_at).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      return a.task_type.localeCompare(b.task_type);
    });
  }, []);

  const groupTasks = React.useCallback(
    (taskList: TaskTemplate[]) => {
      const sorted = sortTasks(taskList);

      if (groupBy === "none") return { "": sorted };

      if (groupBy === "location") {
        return sorted.reduce(
          (acc, task) => {
            const location =
              getPlantDetails(task.plant_id).location || "General";
            if (!acc[location]) acc[location] = [];
            acc[location].push(task);
            return acc;
          },
          {} as Record<string, TaskTemplate[]>,
        );
      }

      if (groupBy === "type") {
        return sorted.reduce(
          (acc, task) => {
            const type = task.task_type;
            if (!acc[type]) acc[type] = [];
            acc[type].push(task);
            return acc;
          },
          {} as Record<string, TaskTemplate[]>,
        );
      }

      return { "": sorted };
    },
    [sortTasks, getPlantDetails, groupBy],
  );

  const isSearching = normalizedSearchQuery.length > 0;

  const filteredTasks = useMemo(
    () => filterTasksBySearch(tasks),
    [tasks, filterTasksBySearch],
  );

  // Pre-build a date→tasks map so calendar cells do O(1) lookups instead of O(tasks) per cell
  const tasksByDateKey = useMemo(() => {
    const map = new Map<string, TaskTemplate[]>();
    for (const task of filteredTasks) {
      if (!task.next_due_at) continue;
      const key = new Date(task.next_due_at).toDateString();
      const arr = map.get(key);
      if (arr) {
        arr.push(task);
      } else {
        map.set(key, [task]);
      }
    }
    return map;
  }, [filteredTasks]);

  const getTasksForDate = React.useCallback(
    (date: Date) => {
      return tasksByDateKey.get(date.toDateString()) || [];
    },
    [tasksByDateKey],
  );

  const getHarvestsReady = React.useCallback(() => {
    if (!plants || plants.length === 0 || !harvestEntries) return [];
    const fruitTrees = plants.filter(
      (p) => p.plant_type === "fruit_tree" || p.plant_type === "coconut_tree",
    );

    return fruitTrees
      .map((plant) => {
        const plantHarvests = harvestEntries.filter(
          (e) => e.plant_id === plant.id,
        );
        if (plantHarvests.length === 0) return null;

        const lastHarvest = plantHarvests[0];
        const lastDate = new Date(lastHarvest.created_at);
        const nextDate = new Date(lastDate);

        if (plant.plant_type === "coconut_tree") {
          nextDate.setMonth(nextDate.getMonth() + 2);
        } else {
          nextDate.setMonth(nextDate.getMonth() + 6);
        }

        const daysUntil = Math.ceil(
          (nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
        );

        return {
          plant,
          nextDate,
          daysUntil,
          isReady: daysUntil <= 7 && daysUntil >= 0,
        };
      })
      .filter(Boolean);
  }, [plants, harvestEntries]);

  const harvestsReady = useMemo(() => getHarvestsReady(), [getHarvestsReady]);

  const filteredHarvestsReady = useMemo(
    () =>
      normalizedSearchQuery
        ? harvestsReady.filter((item: any) => {
            const plantName = item?.plant?.name || "";
            const plantLocation = item?.plant?.location || "";
            const plantType = item?.plant?.plant_type || "";
            return [
              plantName,
              plantLocation,
              plantType,
              plantType.replace(/_/g, " "),
            ].some((value) =>
              normalizeSearchText(value).includes(normalizedSearchQuery),
            );
          })
        : harvestsReady,
    [harvestsReady, normalizedSearchQuery, normalizeSearchText],
  );

  const todayTasks = useMemo(() => {
    if (isSearching) return [];
    if (!filteredTasks || filteredTasks.length === 0) return [];
    const today = new Date();
    return filteredTasks.filter((task) => {
      if (!task || !task.next_due_at) return false;
      const dueDate = new Date(task.next_due_at);
      return dueDate.toDateString() === today.toDateString();
    });
  }, [isSearching, filteredTasks]);

  const weekTasks = useMemo(() => {
    if (selectedView === "week") {
      if (!filteredTasks || filteredTasks.length === 0) return [];
      const weekStart = new Date(currentWeekStart);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weekEnd.setHours(0, 0, 0, 0);

      return filteredTasks.filter((task) => {
        if (!task || !task.next_due_at) return false;
        const dueDate = new Date(task.next_due_at);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate >= weekStart && dueDate < weekEnd;
      });
    } else {
      // month
      const monthStart = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1,
      );
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0,
      );
      monthEnd.setHours(23, 59, 59, 999);

      return filteredTasks.filter((task) => {
        const dueDate = new Date(task.next_due_at);
        return dueDate >= monthStart && dueDate <= monthEnd;
      });
    }
  }, [selectedView, filteredTasks, currentWeekStart, currentMonth]);

  const tasksForDisplay = useMemo(() => {
    if (isSearching) return filteredTasks;
    if (!selectedDate) return weekTasks;
    const selectedKey = selectedDate.toDateString();
    return weekTasks.filter((t) => {
      if (!t.next_due_at) return true;
      return new Date(t.next_due_at).toDateString() !== selectedKey;
    });
  }, [isSearching, filteredTasks, weekTasks, selectedDate]);

  const groupedTasks = useMemo(
    () => groupTasks(tasksForDisplay),
    [tasksForDisplay, groupTasks],
  );

  return {
    // Raw state
    tasks,
    plants,
    initialLoading,
    refreshing,
    isMountedRef,
    // Data operations
    loadData,
    handleRefresh,
    // Derived data
    plantMap,
    filteredTasks,
    tasksByDateKey,
    filteredHarvestsReady,
    todayTasks,
    weekTasks,
    tasksForDisplay,
    groupedTasks,
    isSearching,
    // Helpers
    getTasksForDate,
    getPlantDetails,
    groupTasks,
    sortTasks,
  };
}
