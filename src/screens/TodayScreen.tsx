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
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import {
  getTodayTasks,
  getTodayTaskLogs,
  getSeasonalCareReminder,
} from "../services/tasks";
import { getAllPlants } from "../services/plants";
import { TaskTemplate, Plant, TaskLog, TaskType } from "../types/database.types";
import { Ionicons } from "@expo/vector-icons";
import { TASK_EMOJIS, TASK_COLORS } from "../utils/taskConstants";
import { useFocusEffect, useNavigation, useRoute, NavigationProp, ParamListBase } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, useThemeMode } from "../theme";
import { createStyles } from "../styles/todayStyles";
import Svg, { Circle, Path } from "react-native-svg";
import { useTabBarScroll, TAB_BAR_HEIGHT } from "../components/FloatingTabBar";
import { safeGetItem, safeSetItem } from "../utils/safeStorage";
import { getErrorMessage } from "../utils/errorLogging";

type AttentionSeverity = "critical" | "high" | "medium";

type PlantAttentionItem = {
  plant: Plant;
  severity: AttentionSeverity;
  icon: "medical" | "warning" | "water" | "leaf" | "basket";
  reasons: string[];
  daysOverdue: number;
};

const ATTENTION_SEVERITY_RANK: Record<AttentionSeverity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
};

type TaskGroup = {
  type: TaskType;
  overdue: TaskTemplate[];
  today: TaskTemplate[];
};

const groupTasksByType = (
  overdueTasks: TaskTemplate[],
  todayTasksList: TaskTemplate[],
): TaskGroup[] => {
  const map = new Map<TaskType, TaskGroup>();

  for (const task of overdueTasks) {
    let group = map.get(task.task_type);
    if (!group) {
      group = { type: task.task_type, overdue: [], today: [] };
      map.set(task.task_type, group);
    }
    group.overdue.push(task);
  }

  for (const task of todayTasksList) {
    let group = map.get(task.task_type);
    if (!group) {
      group = { type: task.task_type, overdue: [], today: [] };
      map.set(task.task_type, group);
    }
    group.today.push(task);
  }

  // Sort: groups with overdue tasks first, then by total count descending
  return Array.from(map.values()).sort((a, b) => {
    if (a.overdue.length > 0 && b.overdue.length === 0) return -1;
    if (b.overdue.length > 0 && a.overdue.length === 0) return 1;
    const totalA = a.overdue.length + a.today.length;
    const totalB = b.overdue.length + b.today.length;
    return totalB - totalA;
  });
};

/** Compact number display: 0-99 exact, 100-999 → "99+", 1000+ → "1k"/"1.5k" */
const fmtCount = (n: number): string => {
  if (n >= 1000) {
    const k = n / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  if (n >= 100) return "99+";
  return String(n);
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const DONUT_SIZE = 140;
const DONUT_STROKE = 14;
const DONUT_RADIUS = (DONUT_SIZE - DONUT_STROKE) / 2;
const DONUT_CENTER = DONUT_SIZE / 2;

/** Build an SVG arc path for a donut segment */
const describeArc = (
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string => {
  // Clamp arcs to avoid full-circle rendering bugs
  const clampedEnd = Math.min(endAngle, startAngle + 359.99);
  const startRad = ((clampedEnd - 90) * Math.PI) / 180;
  const endRad = ((startAngle - 90) * Math.PI) / 180;
  const largeArc = clampedEnd - startAngle > 180 ? 1 : 0;
  const x1 = cx + r * Math.cos(endRad);
  const y1 = cy + r * Math.sin(endRad);
  const x2 = cx + r * Math.cos(startRad);
  const y2 = cy + r * Math.sin(startRad);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
};

const THEME_ICONS: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  light: { icon: "sunny", label: "Light" },
  dark: { icon: "moon", label: "Dark" },
  system: { icon: "phone-portrait-outline", label: "Auto" },
};

export default function TodayScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route = useRoute();
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { onScroll: onTabBarScroll, resetTabBar } = useTabBarScroll();
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const isMountedRef = React.useRef(true);

  // Check if banner was already dismissed today
  useEffect(() => {
    safeGetItem("seasonal_banner_dismissed_date").then((stored) => {
      const today = new Date().toDateString();
      if (stored === today) setBannerDismissed(true);
    });
  }, []);

  const dismissBanner = useCallback(async () => {
    setBannerDismissed(true);
    await safeSetItem("seasonal_banner_dismissed_date", new Date().toDateString());
  }, []);
  const completedTemplateIds = useMemo(
    () => new Set(taskLogs.map((log) => log.template_id)),
    [taskLogs],
  );

  const loadData = useCallback(async (options?: { silent?: boolean }) => {
    if (isMountedRef.current && !options?.silent) {
      setLoading(true);
    }
    try {
      const [tasksData, plantsData, todayLogs] = await Promise.all([
        getTodayTasks(),
        getAllPlants(),
        getTodayTaskLogs(),
      ]);

      if (!isMountedRef.current) return;

      const plantIds = new Set(plantsData.map((plant) => plant.id));
      const filteredTasks = tasksData.filter(
        (task) => !task.plant_id || plantIds.has(task.plant_id),
      );
      const filteredLogs = todayLogs.filter(
        (log) => !log.plant_id || plantIds.has(log.plant_id),
      );

      setTasks(filteredTasks);
      setPlants(plantsData);
      setTaskLogs(filteredLogs);
    } catch (error: unknown) {
      if (!isMountedRef.current) return;
      if (!options?.silent) {
        Alert.alert("Error", getErrorMessage(error));
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
    const params = route.params as Record<string, unknown> | undefined;
    if (params?.refresh) {
      loadData();
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params, navigation, loadData]);

  // Reset scroll and do a silent refresh whenever the screen regains focus.
  useFocusEffect(
    React.useCallback(() => {
      // Reset scroll to top
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      resetTabBar();
      void loadData({ silent: true });
    }, [loadData, resetTabBar]),
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
    // Pure health_status counts for Garden Health tiles
    const healthyCount = (plants || []).filter(
      (p) =>
        !p.health_status ||
        p.health_status === "healthy" ||
        p.health_status === "recovering",
    ).length;
    const stressedCount = (plants || []).filter(
      (p) => p.health_status === "stressed",
    ).length;
    const sickCount = (plants || []).filter(
      (p) => p.health_status === "sick",
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

    // Fertilising overdue check
    (plants || []).forEach((plant) => {
      const fertFreq = Number(plant.fertilising_frequency_days);
      if (!Number.isFinite(fertFreq) || fertFreq <= 0) return;

      const daysSinceFert = getDaysSince(plant.last_fertilised_date);
      if (daysSinceFert !== null && daysSinceFert >= fertFreq) {
        const daysOverdue = Math.max(0, daysSinceFert - fertFreq);
        addPlantAttention(plant, {
          severity: daysOverdue >= Math.ceil(fertFreq / 2) ? "high" : "medium",
          icon: "leaf",
          reason:
            daysOverdue > 0
              ? `Fertilising overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}`
              : "Fertilising due today",
          daysOverdue,
        });
      }
    });

    // Harvest-ready check
    (plants || []).forEach((plant) => {
      if (!plant.expected_harvest_date) return;
      const daysToHarvest = getDaysSince(plant.expected_harvest_date);
      if (daysToHarvest === null || daysToHarvest < 0) return;
      addPlantAttention(plant, {
        severity: "medium",
        icon: "basket",
        reason:
          daysToHarvest === 0
            ? "Ready to harvest today"
            : `Harvest overdue by ${daysToHarvest} day${daysToHarvest === 1 ? "" : "s"}`,
        daysOverdue: daysToHarvest,
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
      healthyCount,
      stressedCount,
      sickCount,
      needsAttentionCount: plantAttention.length,
      plantAttention,
    };
  }, [tasks, plants, completedTemplateIds, getDaysSince]);

  const cycleTheme = useCallback(() => {
    const order: ("light" | "dark" | "system")[] = [
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

  const taskGroups = useMemo(
    () => groupTasksByType(overdueTasks, todayTasks),
    [overdueTasks, todayTasks],
  );

  // Per-type done/total stats for donut + chips
  type TypeStat = {
    type: TaskType;
    done: number;
    total: number;
    remaining: number;
    overdueCount: number;
  };

  const typeStats: TypeStat[] = useMemo(() => {
    // Count completed tasks per type (from today's logs)
    const doneByType = new Map<TaskType, number>();
    for (const log of taskLogs) {
      doneByType.set(log.task_type, (doneByType.get(log.task_type) || 0) + 1);
    }
    // Gather all task types that appear (remaining or completed)
    const allTypes = new Set<TaskType>();
    for (const group of taskGroups) allTypes.add(group.type);
    for (const [type] of doneByType) allTypes.add(type);

    const result: TypeStat[] = [];
    for (const type of allTypes) {
      const group = taskGroups.find((g) => g.type === type);
      const remaining = group ? group.overdue.length + group.today.length : 0;
      const done = doneByType.get(type) || 0;
      const overdueCount = group ? group.overdue.length : 0;
      result.push({ type, done, total: done + remaining, remaining, overdueCount });
    }

    // Sort: types with remaining work first (overdue first), then fully done
    return result.sort((a, b) => {
      if (a.remaining > 0 && b.remaining === 0) return -1;
      if (b.remaining > 0 && a.remaining === 0) return 1;
      if (a.overdueCount > 0 && b.overdueCount === 0) return -1;
      if (b.overdueCount > 0 && a.overdueCount === 0) return 1;
      return b.total - a.total;
    });
  }, [taskGroups, taskLogs]);

  // Compute donut segments: one per task type (full arc = total for that type)
  const donutSegments = useMemo(() => {
    if (stats.totalTasks === 0) return [];

    let angle = 0;
    return typeStats.map((ts) => {
      const sweep = (ts.total / stats.totalTasks) * 360;
      const startAngle = angle;
      angle += sweep;
      // Completed fraction within this type's arc
      const doneSweep = ts.total > 0 ? (ts.done / ts.total) * sweep : 0;
      return {
        key: ts.type,
        color: TASK_COLORS[ts.type] || "#999",
        startAngle,
        sweep,
        doneSweep,
      };
    });
  }, [stats.totalTasks, typeStats]);

  const seasonalTip = useMemo(() => {
    for (const plant of plants) {
      const tip = getSeasonalCareReminder(plant);
      if (tip) return tip;
    }
    return null;
  }, [plants]);

  const attentionKeyExtractor = useCallback(
    (item: PlantAttentionItem) => item.plant.id,
    [],
  );

  const renderAttentionItem = useCallback(
    ({ item: attention }: { item: PlantAttentionItem }) => (
      <TouchableOpacity
        style={[
          styles.alertCardH,
          attention.severity === "critical" && styles.alertCardHCritical,
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
            attention.severity === "critical" && { backgroundColor: theme.error },
            attention.severity === "high" && { backgroundColor: theme.warning },
            attention.severity === "medium" && { backgroundColor: theme.primary },
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
    ),
    [styles, navigation, theme],
  );

  if (loading && tasks.length === 0 && plants.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center", paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 48) + 16 }}
      onScroll={onTabBarScroll}
      scrollEventThrottle={16}
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
              name={THEME_ICONS[mode].icon}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Task Donut — segmented by type */}
      <View style={styles.donutCard}>
        <Text style={styles.gardenHealthTitle}>📋 Today&apos;s Progress</Text>
        <View style={styles.donutRow}>
          {/* Donut (left) — wrapped to stack ring + overdue badge */}
          <View style={styles.donutWrap}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => navigation.navigate("Care Plan", { resetFilters: true })}
            >
            <View style={styles.donutContainer}>
              <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
                {/* Background track */}
                <Circle
                  cx={DONUT_CENTER}
                  cy={DONUT_CENTER}
                  r={DONUT_RADIUS}
                  stroke={theme.border}
                  strokeWidth={DONUT_STROKE}
                  fill="none"
                />
                {/* Per-type arcs: faded = total, solid = done portion */}
                {donutSegments.map((seg) => (
                  <React.Fragment key={seg.key}>
                    {/* Full arc (faded) — remaining portion */}
                    {seg.sweep > 0.5 && (
                      <Path
                        d={describeArc(
                          DONUT_CENTER,
                          DONUT_CENTER,
                          DONUT_RADIUS,
                          seg.startAngle,
                          seg.startAngle + seg.sweep,
                        )}
                        stroke={seg.color + "40"}
                        strokeWidth={DONUT_STROKE}
                        strokeLinecap="round"
                        fill="none"
                      />
                    )}
                    {/* Done portion (solid) */}
                    {seg.doneSweep > 0.5 && (
                      <Path
                        d={describeArc(
                          DONUT_CENTER,
                          DONUT_CENTER,
                          DONUT_RADIUS,
                          seg.startAngle,
                          seg.startAngle + seg.doneSweep,
                        )}
                        stroke={seg.color}
                        strokeWidth={DONUT_STROKE}
                        strokeLinecap="round"
                        fill="none"
                      />
                    )}
                  </React.Fragment>
                ))}
              </Svg>
              <View style={styles.donutCenter}>
                <Text style={styles.donutPercent}>{stats.completionRate}%</Text>
                <Text style={styles.donutSubtext}>
                  {stats.completed}/{stats.totalTasks}
                </Text>
              </View>
            </View>
            </TouchableOpacity>
            {/* Overdue pill anchored below the ring */}
            {overdueTasks.length > 0 && (
              <TouchableOpacity
                style={styles.donutOverdueBadge}
                activeOpacity={0.75}
                onPress={() => navigation.navigate("Care Plan", { filterOverdue: true })}
              >
                <Ionicons name="alert-circle" size={11} color="#fff" />
                <Text style={styles.donutOverdueBadgeText}>
                  {overdueTasks.length} overdue
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tiles (right) — all 7 task types always visible */}
          <View style={styles.chipColumn}>
            {(Object.keys(TASK_EMOJIS) as TaskType[]).map((type) => {
              const ts = typeStats.find((s) => s.type === type);
              const color = TASK_COLORS[type];
              const emoji = TASK_EMOJIS[type];
              const done = ts?.done ?? 0;
              const total = ts?.total ?? 0;
              const remaining = ts?.remaining ?? 0;
              const overdueCount = ts?.overdueCount ?? 0;
              const hasNothing = total === 0;
              const allDone = !hasNothing && remaining === 0;
              const hasOverdue = overdueCount > 0;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    { backgroundColor: color + "14" },
                    hasNothing && styles.chipEmpty,
                    allDone && styles.chipDone,
                    hasOverdue && styles.chipOverdue,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate("Care Plan")}
                >
                  <Text style={styles.chipEmoji}>{emoji}</Text>
                  <Text
                    style={[
                      styles.chipText,
                      { color: hasNothing ? theme.textSecondary : color },
                      allDone && styles.chipTextDone,
                    ]}
                  >
                    {fmtCount(done)}/{fmtCount(total)}
                  </Text>
                  {hasOverdue && (
                    <Ionicons name="alert-circle" size={12} color={theme.error} />
                  )}
                  {allDone && (
                    <Ionicons name="checkmark" size={13} color={color} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Garden Health Overview */}
      <View style={styles.gardenHealthCard}>
        <Text style={styles.gardenHealthTitle}>🌱 Garden Health</Text>
        <View style={styles.gardenHealthRow}>
          <TouchableOpacity
            style={styles.healthColumn}
            onPress={() => navigation.navigate("Plants", { screen: "PlantsList", params: { healthFilter: "healthy" } })}
          >
            <View
              style={[styles.healthDot, { backgroundColor: theme.success }]}
            />
            <Text style={styles.healthCount}>
              {stats.healthyCount}
            </Text>
            <Text style={styles.healthLabel}>Healthy</Text>
          </TouchableOpacity>
          <View style={styles.healthDivider} />
          <TouchableOpacity
            style={styles.healthColumn}
            onPress={() => navigation.navigate("Plants", { screen: "PlantsList", params: { healthFilter: "stressed" } })}
          >
            <View
              style={[styles.healthDot, { backgroundColor: theme.warning }]}
            />
            <Text style={styles.healthCount}>
              {stats.stressedCount}
            </Text>
            <Text style={styles.healthLabel}>Stressed</Text>
          </TouchableOpacity>
          <View style={styles.healthDivider} />
          <TouchableOpacity
            style={styles.healthColumn}
            onPress={() => navigation.navigate("Plants", { screen: "PlantsList", params: { healthFilter: "sick" } })}
          >
            <View
              style={[styles.healthDot, { backgroundColor: theme.error }]}
            />
            <Text style={styles.healthCount}>{stats.sickCount}</Text>
            <Text style={styles.healthLabel}>Sick</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Seasonal tip banner — shown once per day, dismissible */}
      {seasonalTip !== null && !bannerDismissed && (
        <View style={styles.seasonalBanner}>
          <Ionicons name="sunny-outline" size={16} color={theme.warning} />
          <Text style={styles.seasonalBannerText}>{seasonalTip}</Text>
          <TouchableOpacity style={styles.seasonalBannerClose} onPress={dismissBanner} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

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
            keyExtractor={attentionKeyExtractor}
            contentContainerStyle={{ paddingRight: 8 }}
            renderItem={renderAttentionItem}
          />
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

    </ScrollView>
  );
}

