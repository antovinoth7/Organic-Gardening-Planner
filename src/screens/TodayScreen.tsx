import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import {
  getTodayTasks,
  markTaskDone,
  updateTaskTemplate,
  getTaskLogs,
} from "../services/tasks";
import { getAllPlants } from "../services/plants";
import { TaskTemplate, Plant, TaskLog } from "../types/database.types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, useThemeMode } from "../theme";
import { sanitizeAlphaNumericSpaces } from "../utils/textSanitizer";
import Svg, { Circle } from "react-native-svg";

type AttentionSeverity = "critical" | "high" | "medium";

type PlantAttentionItem = {
  plant: Plant;
  severity: AttentionSeverity;
  icon: "medical" | "warning" | "water";
  reasons: string[];
  daysOverdue: number;
};

const ATTENTION_SEVERITY_RANK: Record<AttentionSeverity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
};

const TASK_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  water: "water",
  fertilise: "nutrition",
  prune: "cut",
  repot: "move",
  spray: "sparkles",
  mulch: "layers",
  harvest: "basket",
};

const TASK_COLORS: Record<string, string> = {
  water: "#2196F3",
  fertilise: "#FF9800",
  prune: "#9C27B0",
  repot: "#4CAF50",
  spray: "#00BCD4",
  mulch: "#795548",
  harvest: "#8BC34A",
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const getMotivationalText = (rate: number, total: number): string => {
  if (total === 0) return "No tasks today";
  if (rate === 100) return "All done! \uD83C\uDF89";
  if (rate >= 75) return "Almost there!";
  if (rate >= 50) return "Halfway done!";
  if (rate >= 25) return "Good start!";
  return "Let's get started!";
};

const RING_SIZE = 80;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const THEME_ICONS: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  light: { icon: "sunny", label: "Light" },
  dark: { icon: "moon", label: "Dark" },
  system: { icon: "phone-portrait-outline", label: "Auto" },
};

export default function TodayScreen({ navigation, route }: any) {
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskTemplate | null>(null);
  const [skipReason, setSkipReason] = useState("");
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [optimisticCompletedTaskIds, setOptimisticCompletedTaskIds] = useState<
    string[]
  >([]);
  const [skippingTask, setSkippingTask] = useState(false);
  const isMountedRef = React.useRef(true);
  const completedTemplateIds = useMemo(
    () =>
      new Set([
        ...taskLogs.map((log) => log.template_id),
        ...optimisticCompletedTaskIds,
      ]),
    [taskLogs, optimisticCompletedTaskIds],
  );

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    if (isMountedRef.current && !options?.silent) {
      setLoading(true);
    }
    try {
      const [tasksData, plantsData, logs] = await Promise.all([
        getTodayTasks(),
        getAllPlants(),
        getTaskLogs(),
      ]);

      if (!isMountedRef.current) return;

      // Filter logs for today only
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const plantIds = new Set(plantsData.map((plant) => plant.id));
      const filteredTasks = tasksData.filter(
        (task) => !task.plant_id || plantIds.has(task.plant_id),
      );
      const todayLogs = logs
        .filter((log) => {
          const logDate = new Date(log.done_at);
          logDate.setHours(0, 0, 0, 0);
          return logDate.getTime() === today.getTime();
        })
        .filter((log) => !log.plant_id || plantIds.has(log.plant_id));

      setTasks(filteredTasks);
      setPlants(plantsData);
      setTaskLogs(todayLogs);
      setOptimisticCompletedTaskIds((prev) =>
        prev.filter((id) => !todayLogs.some((log) => log.template_id === id)),
      );
    } catch (error: any) {
      if (!isMountedRef.current) return;
      if (!options?.silent) {
        Alert.alert("Error", error.message);
      }
    } finally {
      if (isMountedRef.current && !options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  // Listen for refresh param (e.g., after completing tasks)
  useEffect(() => {
    const refreshParam = route?.params?.refresh;
    if (refreshParam) {
      loadData();
      navigation.setParams({ refresh: undefined });
    }
  }, [route?.params?.refresh, navigation, loadData]);

  // Reset scroll and do a silent refresh whenever the screen regains focus.
  useFocusEffect(
    React.useCallback(() => {
      // Reset scroll to top
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      void loadData({ silent: true });
    }, [loadData]),
  );

  const handleMarkDone = async (task: TaskTemplate) => {
    if (completingTaskId) return; // Prevent multiple clicks
    if (completedTemplateIds.has(task.id)) {
      Alert.alert(
        "Already Completed",
        "This task is already marked as done for today.",
      );
      return;
    }

    setCompletingTaskId(task.id);
    setOptimisticCompletedTaskIds((prev) =>
      prev.includes(task.id) ? prev : [...prev, task.id],
    );
    try {
      const didMark = await markTaskDone(task, undefined, undefined, {
        skipAlreadyDoneCheck: true,
      });
      if (!didMark) {
        Alert.alert(
          "Already Completed",
          "This task is already marked as done for today.",
        );
        void loadData({ silent: true });
        return;
      }
      void loadData({ silent: true });
    } catch (error: any) {
      setOptimisticCompletedTaskIds((prev) =>
        prev.filter((id) => id !== task.id),
      );
      Alert.alert("Error", error.message);
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleSkipTask = async () => {
    if (!selectedTask || skippingTask) return;

    setSkippingTask(true);
    try {
      // Postpone to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await updateTaskTemplate(selectedTask.id, {
        next_due_at: tomorrow.toISOString(),
      });

      Alert.alert(
        "Task Skipped",
        `Task postponed to tomorrow${skipReason ? `: ${skipReason}` : ""}`,
      );
      setShowSkipModal(false);
      setSkipReason("");
      setSelectedTask(null);
      loadData();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSkippingTask(false);
    }
  };

  const handleSnooze = async (task: TaskTemplate, hours: number) => {
    try {
      const snoozeTime = new Date();
      snoozeTime.setHours(snoozeTime.getHours() + hours);

      await updateTaskTemplate(task.id, {
        next_due_at: snoozeTime.toISOString(),
      });

      Alert.alert(
        "Task Snoozed",
        `Task snoozed for ${hours} hour${hours > 1 ? "s" : ""}`,
      );
      loadData();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const getPlantName = useCallback(
    (plantId: string | null) => {
      if (!plantId) return "General";
      if (!plants || plants.length === 0) return "Unknown";
      const plant = plants.find((p) => p.id === plantId);
      return plant?.name || "Unknown";
    },
    [plants],
  );

  const getDaysSince = useCallback((dateValue?: string | null) => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return null;
    const startOfDate = new Date(date);
    startOfDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor(
      (today.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24),
    );
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const taskIds = new Set((tasks || []).map((task) => task.id));
    completedTemplateIds.forEach((id) => taskIds.add(id));
    const totalTasks = taskIds.size;
    const completed = completedTemplateIds.size;
    const completionRate =
      totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
    const unhealthyCount = (plants || []).filter(
      (plant) =>
        plant.health_status === "sick" || plant.health_status === "stressed",
    ).length;
    const attentionByPlant = new Map<string, PlantAttentionItem>();

    const addPlantAttention = (
      plant: Plant,
      alert: Omit<PlantAttentionItem, "plant" | "reasons"> & { reason: string },
    ) => {
      const existing = attentionByPlant.get(plant.id);
      if (!existing) {
        attentionByPlant.set(plant.id, {
          plant,
          severity: alert.severity,
          icon: alert.icon,
          reasons: [alert.reason],
          daysOverdue: alert.daysOverdue,
        });
        return;
      }

      if (!existing.reasons.includes(alert.reason)) {
        existing.reasons.push(alert.reason);
      }
      existing.daysOverdue = Math.max(existing.daysOverdue, alert.daysOverdue);

      const incomingRank = ATTENTION_SEVERITY_RANK[alert.severity];
      const existingRank = ATTENTION_SEVERITY_RANK[existing.severity];
      if (incomingRank > existingRank) {
        existing.severity = alert.severity;
        existing.icon = alert.icon;
      }
    };

    (plants || []).forEach((plant) => {
      if (plant.health_status === "sick") {
        addPlantAttention(plant, {
          severity: "critical",
          icon: "medical",
          reason: "Status: Sick",
          daysOverdue: 0,
        });
      } else if (plant.health_status === "stressed") {
        addPlantAttention(plant, {
          severity: "high",
          icon: "warning",
          reason: "Status: Stressed",
          daysOverdue: 0,
        });
      }

      const frequency = Number(plant.watering_frequency_days);
      if (!Number.isFinite(frequency) || frequency <= 0) return;

      const daysSinceLastWatered = getDaysSince(plant.last_watered_date);
      if (daysSinceLastWatered !== null && daysSinceLastWatered >= frequency) {
        const daysOverdue = Math.max(0, daysSinceLastWatered - frequency);
        addPlantAttention(plant, {
          severity:
            daysOverdue >= Math.max(2, Math.ceil(frequency / 2))
              ? "high"
              : "medium",
          icon: "water",
          reason:
            daysOverdue > 0
              ? `Watering overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}`
              : "Watering due today",
          daysOverdue,
        });
        return;
      }

      if (plant.last_watered_date) return;

      const plantAgeDays = getDaysSince(
        plant.planting_date || plant.created_at,
      );
      if (plantAgeDays === null || plantAgeDays < frequency) return;

      addPlantAttention(plant, {
        severity: "medium",
        icon: "water",
        reason: "No watering history logged",
        daysOverdue: Math.max(0, plantAgeDays - frequency),
      });
    });

    const plantAttention = Array.from(attentionByPlant.values()).sort(
      (a, b) => {
        const bySeverity =
          ATTENTION_SEVERITY_RANK[b.severity] -
          ATTENTION_SEVERITY_RANK[a.severity];
        if (bySeverity !== 0) return bySeverity;

        const byOverdue = b.daysOverdue - a.daysOverdue;
        if (byOverdue !== 0) return byOverdue;

        return a.plant.name.localeCompare(b.plant.name);
      },
    );

    return {
      totalTasks,
      completed,
      completionRate,
      unhealthyCount,
      needsAttentionCount: plantAttention.length,
      plantAttention,
    };
  }, [tasks, plants, completedTemplateIds, getDaysSince]);

  const cycleTheme = useCallback(() => {
    const order: Array<"light" | "dark" | "system"> = [
      "light",
      "dark",
      "system",
    ];
    const idx = order.indexOf(mode);
    setMode(order[(idx + 1) % order.length]);
  }, [mode, setMode]);

  const overdueTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (tasks || []).filter((t) => {
      if (!t || !t.next_due_at) return false;
      if (completedTemplateIds.has(t.id)) return false;
      const dueDate = new Date(t.next_due_at);
      return dueDate < today;
    });
  }, [tasks, completedTemplateIds]);

  const todayTasks = useMemo(() => {
    const today = new Date();
    return (tasks || []).filter((t) => {
      if (!t || !t.next_due_at) return false;
      if (completedTemplateIds.has(t.id)) return false;
      const dueDate = new Date(t.next_due_at);
      return dueDate.toDateString() === today.toDateString();
    });
  }, [tasks, completedTemplateIds]);

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadData} />
      }
    >
      {/* Hero Header */}
      <View style={[styles.heroHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroGreeting}>{getGreeting()}</Text>
            <Text style={styles.heroDate}>
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>
          <TouchableOpacity style={styles.heroThemeToggle} onPress={cycleTheme}>
            <Ionicons
              name={THEME_ICONS[mode].icon as any}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Circular Progress Ring */}
      <View style={styles.progressRingCard}>
        <View style={styles.progressRingRow}>
          <View style={styles.progressRingContainer}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={theme.border}
                strokeWidth={RING_STROKE}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={
                  stats.completionRate === 100 ? theme.success : theme.primary
                }
                strokeWidth={RING_STROKE}
                fill="none"
                strokeDasharray={`${RING_CIRCUMFERENCE}`}
                strokeDashoffset={`${RING_CIRCUMFERENCE - (stats.completionRate / 100) * RING_CIRCUMFERENCE}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>
            <Text style={styles.progressRingPercent}>
              {stats.completionRate}%
            </Text>
          </View>
          <View style={styles.progressRingText}>
            <Text style={styles.progressRingStats}>
              {stats.completed} of {stats.totalTasks} tasks done
            </Text>
            <Text style={styles.progressRingMotivation}>
              {getMotivationalText(stats.completionRate, stats.totalTasks)}
            </Text>
          </View>
        </View>
      </View>

      {/* Garden Health Overview */}
      <View style={styles.gardenHealthCard}>
        <Text style={styles.gardenHealthTitle}>Garden Health</Text>
        <View style={styles.gardenHealthRow}>
          <TouchableOpacity
            style={styles.healthColumn}
            onPress={() => navigation.navigate("Plants")}
          >
            <View
              style={[styles.healthDot, { backgroundColor: theme.success }]}
            />
            <Text style={styles.healthCount}>
              {Math.max(0, plants.length - stats.needsAttentionCount)}
            </Text>
            <Text style={styles.healthLabel}>Healthy</Text>
          </TouchableOpacity>
          <View style={styles.healthDivider} />
          <TouchableOpacity
            style={styles.healthColumn}
            onPress={() => navigation.navigate("Plants")}
          >
            <View
              style={[styles.healthDot, { backgroundColor: theme.warning }]}
            />
            <Text style={styles.healthCount}>
              {Math.max(0, stats.needsAttentionCount - stats.unhealthyCount)}
            </Text>
            <Text style={styles.healthLabel}>Need Care</Text>
          </TouchableOpacity>
          <View style={styles.healthDivider} />
          <TouchableOpacity
            style={styles.healthColumn}
            onPress={() => navigation.navigate("Plants")}
          >
            <View
              style={[styles.healthDot, { backgroundColor: theme.error }]}
            />
            <Text style={styles.healthCount}>{stats.unhealthyCount}</Text>
            <Text style={styles.healthLabel}>Sick</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Plant Health Alerts — horizontal cards */}
      {stats.plantAttention.length > 0 && (
        <View style={styles.alertsSection}>
          <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>
            ⚠️ Needs Attention ({stats.needsAttentionCount})
          </Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={stats.plantAttention}
            keyExtractor={(item) => item.plant.id}
            contentContainerStyle={{ paddingRight: 8 }}
            renderItem={({ item: attention }) => (
              <TouchableOpacity
                style={[
                  styles.alertCardH,
                  attention.severity === "critical" &&
                    styles.alertCardHCritical,
                  attention.severity === "high" && styles.alertCardHWarning,
                  attention.severity === "medium" && styles.alertCardHInfo,
                ]}
                onPress={() =>
                  navigation.navigate("Plants", {
                    screen: "PlantDetail",
                    params: { plantId: attention.plant.id },
                  })
                }
              >
                <View
                  style={[
                    styles.alertIconH,
                    attention.severity === "critical" && {
                      backgroundColor: theme.error,
                    },
                    attention.severity === "high" && {
                      backgroundColor: theme.warning,
                    },
                    attention.severity === "medium" && {
                      backgroundColor: theme.primary,
                    },
                  ]}
                >
                  <Ionicons name={attention.icon} size={18} color="#fff" />
                </View>
                <Text style={styles.alertPlantNameH} numberOfLines={1}>
                  {attention.plant.name}
                </Text>
                <Text style={styles.alertTextH} numberOfLines={2}>
                  {attention.reasons.join(" • ")}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {overdueTasks.length > 0 && (
        <View style={styles.taskSectionV}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              🚨 Overdue ({overdueTasks.length})
            </Text>
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>HIGH</Text>
            </View>
          </View>
          {overdueTasks.map((task) => {
            const taskIcon = TASK_ICONS[task.task_type] || "ellipse";
            const taskColor = TASK_COLORS[task.task_type] || "#999";
            const isDone =
              completingTaskId === task.id || completedTemplateIds.has(task.id);
            return (
              <View key={task.id} style={styles.taskCardV}>
                <View
                  style={[
                    styles.taskCardVBorder,
                    { backgroundColor: theme.error },
                  ]}
                />
                <View style={styles.taskCardVContent}>
                  <View style={styles.taskCardVLeft}>
                    <View
                      style={[
                        styles.taskIconV,
                        { backgroundColor: taskColor + "20" },
                      ]}
                    >
                      <Ionicons name={taskIcon} size={20} color={taskColor} />
                    </View>
                    <View style={styles.taskCardVInfo}>
                      <Text style={styles.taskTypeV}>
                        {task.task_type.charAt(0).toUpperCase() +
                          task.task_type.slice(1)}
                      </Text>
                      <Text style={styles.taskPlantV} numberOfLines={1}>
                        {getPlantName(task.plant_id)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.taskCardVActions}>
                    <TouchableOpacity
                      style={[
                        styles.taskDoneBtnV,
                        isDone && styles.taskDoneBtnDone,
                      ]}
                      onPress={() => !isDone && handleMarkDone(task)}
                      disabled={isDone}
                    >
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={isDone ? "#fff" : theme.textSecondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.taskActionBtn}
                      onPress={() => handleSnooze(task, 2)}
                    >
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={theme.info}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.taskActionBtn}
                      onPress={() => {
                        setSelectedTask(task);
                        setShowSkipModal(true);
                      }}
                    >
                      <Ionicons
                        name="play-skip-forward-outline"
                        size={14}
                        color={theme.warning}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {todayTasks.length > 0 && (
        <View style={styles.taskSectionV}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              📅 Today ({todayTasks.length})
            </Text>
            <View style={[styles.priorityBadge, styles.priorityMedium]}>
              <Text style={[styles.priorityText, { color: theme.warning }]}>
                MEDIUM
              </Text>
            </View>
          </View>
          {todayTasks.map((task) => {
            const taskIcon = TASK_ICONS[task.task_type] || "ellipse";
            const taskColor = TASK_COLORS[task.task_type] || "#999";
            const isDone =
              completingTaskId === task.id || completedTemplateIds.has(task.id);
            return (
              <View key={task.id} style={styles.taskCardV}>
                <View
                  style={[
                    styles.taskCardVBorder,
                    { backgroundColor: theme.primary },
                  ]}
                />
                <View style={styles.taskCardVContent}>
                  <View style={styles.taskCardVLeft}>
                    <View
                      style={[
                        styles.taskIconV,
                        { backgroundColor: taskColor + "20" },
                      ]}
                    >
                      <Ionicons name={taskIcon} size={20} color={taskColor} />
                    </View>
                    <View style={styles.taskCardVInfo}>
                      <Text style={styles.taskTypeV}>
                        {task.task_type.charAt(0).toUpperCase() +
                          task.task_type.slice(1)}
                      </Text>
                      <Text style={styles.taskPlantV} numberOfLines={1}>
                        {getPlantName(task.plant_id)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.taskCardVActions}>
                    <TouchableOpacity
                      style={[
                        styles.taskDoneBtnV,
                        isDone && styles.taskDoneBtnDone,
                      ]}
                      onPress={() => !isDone && handleMarkDone(task)}
                      disabled={isDone}
                    >
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={isDone ? "#fff" : theme.textSecondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.taskActionBtn}
                      onPress={() => handleSnooze(task, 4)}
                    >
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={theme.info}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.taskActionBtn}
                      onPress={() => {
                        setSelectedTask(task);
                        setShowSkipModal(true);
                      }}
                    >
                      <Ionicons
                        name="play-skip-forward-outline"
                        size={14}
                        color={theme.warning}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {tasks.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#4caf50" />
          <Text style={styles.emptyText}>All caught up! 🎉</Text>
          <Text style={styles.emptySubtext}>No tasks due today</Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate("Care Plan")}
          >
            <Text style={styles.emptyButtonText}>View Schedule</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Skip Task Modal */}
      <Modal
        visible={showSkipModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSkipModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Skip Task</Text>
            <Text style={styles.modalSubtext}>
              This task will be postponed to tomorrow
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Reason (optional)"
              value={skipReason}
              onChangeText={(text) =>
                setSkipReason(sanitizeAlphaNumericSpaces(text))
              }
              placeholderTextColor="#999"
              multiline
            />

            <View style={styles.skipReasons}>
              {["Weather", "Already done", "Not needed", "Too busy"].map(
                (reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={styles.reasonChip}
                    onPress={() => setSkipReason(reason)}
                  >
                    <Text style={styles.reasonText}>{reason}</Text>
                  </TouchableOpacity>
                ),
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowSkipModal(false);
                  setSkipReason("");
                  setSelectedTask(null);
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleSkipTask}
                disabled={skippingTask}
              >
                <Text style={styles.modalButtonText}>
                  {skippingTask ? "Skipping..." : "Skip to Tomorrow"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    heroHeader: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
      backgroundColor: theme.primary,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    heroGreeting: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#fff",
    },
    heroDate: {
      fontSize: 14,
      color: "rgba(255,255,255,0.8)",
      marginTop: 4,
    },
    heroThemeToggle: {
      alignItems: "center",
      justifyContent: "center",
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.2)",
    },
    // Progress Ring
    progressRingCard: {
      backgroundColor: theme.backgroundSecondary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      marginTop: 1,
    },
    progressRingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 20,
    },
    progressRingContainer: {
      width: 80,
      height: 80,
      alignItems: "center",
      justifyContent: "center",
    },
    progressRingPercent: {
      position: "absolute",
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
    },
    progressRingText: {
      flex: 1,
    },
    progressRingStats: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
    },
    progressRingMotivation: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    // Garden Health
    gardenHealthCard: {
      backgroundColor: theme.backgroundSecondary,
      marginTop: 1,
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    gardenHealthTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 10,
    },
    gardenHealthRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    healthColumn: {
      flex: 1,
      alignItems: "center",
      gap: 6,
    },
    healthDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    healthCount: {
      fontSize: 22,
      fontWeight: "bold",
      color: theme.text,
    },
    healthLabel: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    healthDivider: {
      width: 1,
      height: 40,
      backgroundColor: theme.border,
    },
    // Horizontal attention cards
    alertsSection: {
      backgroundColor: theme.backgroundSecondary,
      paddingTop: 12,
      paddingBottom: 14,
      paddingLeft: 16,
      marginTop: 1,
    },
    alertCardH: {
      width: 150,
      padding: 12,
      backgroundColor: theme.errorLight,
      borderRadius: 14,
      marginRight: 10,
      borderWidth: 1,
      borderColor: theme.error + "30",
    },
    alertCardHCritical: {
      backgroundColor: theme.errorLight,
      borderColor: theme.error + "40",
    },
    alertCardHWarning: {
      backgroundColor: theme.warningLight,
      borderColor: theme.warning + "40",
    },
    alertCardHInfo: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary + "40",
    },
    alertIconH: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.error,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    alertPlantNameH: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 3,
    },
    alertTextH: {
      fontSize: 11,
      color: theme.textSecondary,
      lineHeight: 15,
    },
    // Sections
    section: {
      padding: 16,
      backgroundColor: theme.backgroundSecondary,
      marginTop: 1,
    },
    taskSection: {
      paddingVertical: 16,
      paddingLeft: 16,
      backgroundColor: theme.backgroundSecondary,
      marginTop: 1,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      paddingRight: 16,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "600",
      color: theme.text,
    },
    seeAllText: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.primary,
    },
    priorityBadge: {
      backgroundColor: theme.errorLight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.error + "40",
    },
    priorityMedium: {
      backgroundColor: theme.warningLight,
      borderColor: theme.warning + "40",
    },
    priorityText: {
      fontSize: 10,
      fontWeight: "700",
      color: theme.error,
      letterSpacing: 0.5,
    },
    // Horizontal task cards
    taskCardH: {
      width: 140,
      padding: 12,
      backgroundColor: theme.background,
      borderRadius: 14,
      marginRight: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    taskCardHOverdue: {
      borderColor: theme.error + "50",
      backgroundColor: theme.errorLight,
    },
    taskCardHTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    taskIconH: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    taskDoneBtn: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    taskDoneBtnDone: {
      backgroundColor: theme.success,
      borderColor: theme.success,
    },
    taskTypeH: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 2,
    },
    taskPlantH: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 8,
    },
    taskCardHActions: {
      flexDirection: "row",
      gap: 8,
    },
    taskActionSmall: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: theme.backgroundSecondary,
    },
    taskActionSmallText: {
      fontSize: 10,
      color: theme.textSecondary,
      fontWeight: "600",
    },
    // Vertical task cards
    taskSectionV: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.backgroundSecondary,
      marginTop: 1,
    },
    taskCardV: {
      flexDirection: "row",
      backgroundColor: theme.background,
      borderRadius: 12,
      marginBottom: 8,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.border,
    },
    taskCardVBorder: {
      width: 4,
    },
    taskCardVContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
    },
    taskCardVLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: 12,
    },
    taskIconV: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    taskCardVInfo: {
      flex: 1,
    },
    taskTypeV: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },
    taskPlantV: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    taskCardVActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    taskDoneBtnV: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 2,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    taskActionBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
    },
    taskWrapper: {
      marginBottom: 8,
    },
    quickActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 8,
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    actionText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontWeight: "500",
    },
    // Empty state
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      padding: 48,
      marginTop: 48,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: "600",
      color: theme.text,
      marginTop: 16,
    },
    emptySubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    emptyButton: {
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: theme.primary,
      borderRadius: 24,
    },
    emptyButtonText: {
      color: theme.textInverse,
      fontSize: 15,
      fontWeight: "600",
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 20,
      padding: 24,
      width: "100%",
      maxWidth: 400,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 8,
    },
    modalSubtext: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 16,
    },
    modalInput: {
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      padding: 12,
      fontSize: 15,
      color: theme.inputText,
      minHeight: 80,
      textAlignVertical: "top",
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    skipReasons: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 20,
    },
    reasonChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: theme.primaryLight,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    reasonText: {
      fontSize: 13,
      color: theme.primary,
      fontWeight: "500",
    },
    modalButtons: {
      flexDirection: "row",
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
    },
    modalButtonCancel: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalButtonConfirm: {
      backgroundColor: theme.warning,
    },
    modalButtonText: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.textInverse,
    },
    modalButtonTextCancel: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.textSecondary,
    },
  });
