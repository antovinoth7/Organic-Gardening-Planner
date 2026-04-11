import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Alert,
  Animated,
  Platform,
  RefreshControl,
  LayoutAnimation,
  UIManager,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Modal,
} from "react-native";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import {
  markTaskDone,
  updateTaskTemplate,
  calculateTaskPriority,
} from "../services/tasks";
import {
  TaskTemplate,
  TaskType,
} from "../types/database.types";
import { Ionicons } from "@expo/vector-icons";
import { TASK_EMOJIS, TASK_COLORS, TASK_LABELS } from "../utils/taskConstants";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { CalendarScreenRouteProp } from "../types/navigation.types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { createStyles, getStartOfWeek } from "../styles/calendarStyles";
import { sanitizeAlphaNumericSpaces } from "../utils/textSanitizer";
import { safeGetItem, safeSetItem } from "../utils/safeStorage";
import { useCalendarData, HarvestReadyItem } from "../hooks/useCalendarData";
import { useTabBarScroll, TAB_BAR_HEIGHT, AnimatedFAB } from "../components/FloatingTabBar";
import CreateTaskModal from "../components/modals/CreateTaskModal";
import TaskCompletionModal from "../components/modals/TaskCompletionModal";
import WeekCalendarView from "../components/calendar/WeekCalendarView";
import MonthCalendarView from "../components/calendar/MonthCalendarView";
import { SwipeableTaskCard } from "../components/calendar/SwipeableTaskCard";
import { getErrorMessage } from "../utils/errorLogging";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const GROUP_OPTIONS: {
  value: "none" | "location" | "type" | "plant";
  label: string;
  icon: string;
}[] = [
  { value: "none", label: "No Grouping", icon: "list" },
  { value: "location", label: "Location", icon: "location" },
  { value: "type", label: "Type", icon: "apps" },
  { value: "plant", label: "Plant", icon: "leaf-outline" },
];

export default function CalendarScreen(): React.JSX.Element {
  const route = useRoute<CalendarScreenRouteProp>();
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { onScroll: onTabBarScroll, resetTabBar } = useTabBarScroll();
  const scrollViewRef = useRef<ScrollView>(null);
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  const [selectedView, setSelectedView] = useState<"week" | "month">("week");
  const [currentWeekStart, setCurrentWeekStart] = useState(
    getStartOfWeek(new Date()),
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [createTaskInitialDate, setCreateTaskInitialDate] = useState<Date | undefined>(undefined);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskTemplate | null>(null);
  const [taskNotes, setTaskNotes] = useState("");
  const [productUsed, setProductUsed] = useState("");
  const [isCompletingTask, setIsCompletingTask] = useState(false);
  const [isCompletingAll, setIsCompletingAll] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [groupBy, setGroupBy] = useState<"none" | "location" | "type" | "plant">("none");
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [filterTaskTypes, setFilterTaskTypes] = useState<Set<string>>(new Set());
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipTask, setSkipTask] = useState<TaskTemplate | null>(null);
  const [skipReason, setSkipReason] = useState("");
  const [skippingTask, setSkippingTask] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [completingTotal, setCompletingTotal] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [sessionCompletedCount, setSessionCompletedCount] = useState(0);
  const [skipDays, setSkipDays] = useState(1);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [detailTask, setDetailTask] = useState<TaskTemplate | null>(null);
  const calendarHeight = useRef(new Animated.Value(1)).current; // 1 = expanded, 0 = collapsed
  const calendarCollapsed = useRef(false);
  const lastScrollY = useRef(0);
  const searchInputRef = React.useRef<TextInput>(null);
  const normalizeSearchText = (value: string): string =>
    sanitizeAlphaNumericSpaces(value).trim().toLowerCase();
  const normalizedSearchQuery = normalizeSearchText(searchQuery);

  const {
    tasks,
    plants,
    initialLoading,
    refreshing,
    isMountedRef,
    loadData,
    handleRefresh,
    plantMap,
    filteredTasks,
    filteredHarvestsReady,
    todayTasks,
    weekTasks,
    tasksForDisplay,
    groupedTasks,
    overdueTasks,
    isSearching,
    getTasksForDate,
    getRawTasksForDate,
    getPlantDetails,
  } = useCalendarData({
    normalizedSearchQuery,
    normalizeSearchText,
    selectedView,
    currentWeekStart,
    currentMonth,
    selectedDate,
    groupBy,
    filterTaskTypes,
    filterOverdueOnly,
  });

  const isFilterActive = filterTaskTypes.size > 0 || filterOverdueOnly;

  const clearFilters = useCallback(() => {
    setFilterTaskTypes(new Set());
    setFilterOverdueOnly(false);
  }, []);

  const overdueIdSet = React.useMemo(
    () => new Set(overdueTasks.map((t) => t.id)),
    [overdueTasks],
  );

  const dayGroupedTasks = React.useMemo(() => {
    if (groupBy !== "none" || isSearching || selectedView !== "week") return null;
    const todayStr = new Date().toDateString();
    const grouped: Record<string, TaskTemplate[]> = {};
    for (const task of tasksForDisplay) {
      if (!task.next_due_at || overdueIdSet.has(task.id)) continue;
      const key = new Date(task.next_due_at).toDateString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    }
    const sortedKeys = Object.keys(grouped).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );
    return sortedKeys.map((key) => {
      const date = new Date(key);
      const isToday = key === todayStr;
      return {
        dateKey: key,
        label: isToday
          ? "Today"
          : date.toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            }),
        tasks: grouped[key],
        isToday,
      };
    });
  }, [groupBy, isSearching, selectedView, tasksForDisplay, overdueIdSet]);

  const setTodayView = React.useCallback(() => {
    const today = new Date();
    setSelectedDate(null);
    setCurrentWeekStart(getStartOfWeek(today));
    setCurrentMonth(today);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadData({ force: true });
    setTodayView();
    return () => {
      isMountedRef.current = false;
    };
  }, [setTodayView, loadData, isMountedRef]);

  // Show swipe hint banner for the first 3 visits, then auto-hide
  useEffect(() => {
    (async () => {
      const count = parseInt((await safeGetItem("swipeHintViewCount")) || "0", 10);
      if (count < 3) {
        setShowSwipeHint(true);
        await safeSetItem("swipeHintViewCount", String(count + 1));
      }
    })();
  }, []);

  const dismissSwipeHint = useCallback(() => {
    setShowSwipeHint(false);
    safeSetItem("swipeHintViewCount", "3"); // permanently dismiss
  }, []);

  const handleContentScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    onTabBarScroll(event);
    const y = event.nativeEvent.contentOffset.y;
    const delta = y - lastScrollY.current;
    lastScrollY.current = y;

    // Collapse when scrolling down past 30px, expand when scrolling back to top
    if (delta > 4 && y > 30 && !calendarCollapsed.current) {
      calendarCollapsed.current = true;
      Animated.timing(calendarHeight, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    } else if (y <= 10 && calendarCollapsed.current) {
      calendarCollapsed.current = false;
      Animated.timing(calendarHeight, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [onTabBarScroll, calendarHeight]);

  const expandCalendar = useCallback(() => {
    if (calendarCollapsed.current) {
      calendarCollapsed.current = false;
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      Animated.timing(calendarHeight, {
        toValue: 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    }
  }, [calendarHeight]);

  // Reset view and refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      resetTabBar();
      calendarCollapsed.current = false;
      calendarHeight.setValue(1);
      lastScrollY.current = 0;
      const today = new Date();
      setSelectedDate(today);
      setCurrentWeekStart(getStartOfWeek(today));
      setCurrentMonth(today);
      setSessionCompletedCount(0);
      if (route.params?.resetFilters) {
        setFilterTaskTypes(new Set());
        setFilterOverdueOnly(false);
        setGroupBy("none");
      } else if (route.params?.filterOverdue) {
        setFilterOverdueOnly(true);
      }
      void loadData(); // debounced — skips if loaded recently
    }, [loadData, resetTabBar, route, calendarHeight]),
  );

  const handleTaskComplete = useCallback(async (task: TaskTemplate) => {
    // Close the swipeable drawer before opening the modal
    const swipeable = swipeableRefs.current.get(task.id);
    swipeable?.close();
    setSelectedTask(task);
    setTaskNotes("");
    setProductUsed("");
    setShowNotesModal(true);
  }, []);

  const confirmTaskComplete = async (): Promise<void> => {
    if (!selectedTask || isCompletingTask) return;

    setIsCompletingTask(true);
    try {
      const didMark = await markTaskDone(
        selectedTask,
        taskNotes || undefined,
        productUsed || undefined,
      );
      if (!didMark) {
        Alert.alert(
          "Already Completed",
          "This task is already marked as done for today.",
        );
        setShowNotesModal(false);
        setSelectedTask(null);
        setTaskNotes("");
        setProductUsed("");
        loadData({ force: true });
        return;
      }
      setShowNotesModal(false);
      setSelectedTask(null);
      setTaskNotes("");
      setProductUsed("");
      setSessionCompletedCount((prev) => prev + 1);
      loadData({ force: true });
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setIsCompletingTask(false);
    }
  };

  const toggleTaskSelection = useCallback((taskId: string) => {
    // Close any open swipeable to prevent gesture state conflicts
    swipeableRefs.current.get(taskId)?.close();
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const handleCompleteSelected = useCallback(async () => {
    const selected = tasks.filter((t) => selectedTaskIds.has(t.id));
    if (selected.length === 0 || isCompletingAll) return;
    setIsCompletingAll(true);
    setCompletedCount(0);
    setCompletingTotal(selected.length);

    // Fire all in parallel for speed; track completions via allSettled
    const results = await Promise.allSettled(
      selected.map(async (task) => {
        const result = await markTaskDone(task, undefined, undefined, {
          skipAlreadyDoneCheck: true,
        });
        setCompletedCount((prev) => prev + 1);
        return result;
      }),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    setIsCompletingAll(false);
    setCompletedCount(0);
    setSelectedTaskIds(new Set());
    setSessionCompletedCount((prev) => prev + succeeded);
    loadData({ force: true });
    if (failed > 0) {
      Alert.alert("Partial Completion", `${failed} task(s) failed. You can retry them individually.`);
    }
  }, [tasks, selectedTaskIds, isCompletingAll, loadData]);

  const handleBulkSnooze = useCallback(async () => {
    const selected = tasks.filter((t) => selectedTaskIds.has(t.id));
    if (selected.length === 0) return;
    const snoozeTime = new Date();
    snoozeTime.setHours(snoozeTime.getHours() + 4);
    try {
      await Promise.allSettled(
        selected.map((task) =>
          updateTaskTemplate(task.id, { next_due_at: snoozeTime.toISOString() }),
        ),
      );
      setSelectedTaskIds(new Set());
      loadData({ force: true });
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error));
    }
  }, [tasks, selectedTaskIds, loadData]);

  const handleBulkSkip = useCallback(async () => {
    const selected = tasks.filter((t) => selectedTaskIds.has(t.id));
    if (selected.length === 0) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    try {
      await Promise.allSettled(
        selected.map((task) =>
          updateTaskTemplate(task.id, { next_due_at: tomorrow.toISOString() }),
        ),
      );
      setSelectedTaskIds(new Set());
      loadData({ force: true });
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error));
    }
  }, [tasks, selectedTaskIds, loadData]);

  const getSectionState = useCallback(
    (sectionTasks: TaskTemplate[]): "none" | "partial" | "all" => {
      if (sectionTasks.length === 0) return "none";
      const selectedCount = sectionTasks.filter((t) => selectedTaskIds.has(t.id)).length;
      if (selectedCount === 0) return "none";
      if (selectedCount === sectionTasks.length) return "all";
      return "partial";
    },
    [selectedTaskIds],
  );

  const toggleSectionSelection = useCallback((sectionTasks: TaskTemplate[]) => {
    const ids = sectionTasks.map((t) => t.id);
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const renderSectionCheckbox = useCallback(
    (sectionTasks: TaskTemplate[]) => {
      const state = getSectionState(sectionTasks);
      return (
        <TouchableOpacity
          onPress={() => toggleSectionSelection(sectionTasks)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={
              state === "all"
                ? "checkmark-circle"
                : state === "partial"
                  ? "remove-circle"
                  : "ellipse-outline"
            }
            size={20}
            color={state === "none" ? theme.border : theme.primary}
          />
        </TouchableOpacity>
      );
    },
    [getSectionState, toggleSectionSelection, theme],
  );

  const handleSnooze = useCallback(async (task: TaskTemplate, hours: number) => {
    const swipeable = swipeableRefs.current.get(task.id);
    swipeable?.close();
    try {
      const snoozeTime = new Date();
      snoozeTime.setHours(snoozeTime.getHours() + hours);
      await updateTaskTemplate(task.id, {
        next_due_at: snoozeTime.toISOString(),
      });
      Alert.alert("Task Snoozed", `Task snoozed for ${hours} hour${hours > 1 ? "s" : ""}`);
      loadData({ force: true });
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error));
    }
  }, [loadData]);

  const handleOpenSkipModal = useCallback((task: TaskTemplate) => {
    const swipeable = swipeableRefs.current.get(task.id);
    swipeable?.close();
    setSkipTask(task);
    setSkipReason("");
    setShowSkipModal(true);
  }, []);

  const handleConfirmSkip = async (): Promise<void> => {
    if (!skipTask || skippingTask) return;
    setSkippingTask(true);
    try {
      const rescheduleDate = new Date();
      rescheduleDate.setDate(rescheduleDate.getDate() + skipDays);
      await updateTaskTemplate(skipTask.id, {
        next_due_at: rescheduleDate.toISOString(),
      });
      const dayLabel = skipDays === 1 ? "tomorrow" : `in ${skipDays} days`;
      Alert.alert(
        "Task Skipped",
        `Task postponed ${dayLabel}${skipReason ? `: ${skipReason}` : ""}`,
      );
      setShowSkipModal(false);
      setSkipReason("");
      setSkipDays(1);
      setSkipTask(null);
      loadData({ force: true });
    } catch (error: unknown) {
      Alert.alert("Error", getErrorMessage(error));
    } finally {
      setSkippingTask(false);
    }
  };

  const handleDetailComplete = useCallback(() => {
    if (!detailTask) return;
    setShowTaskDetail(false);
    setDetailTask(null);
    handleTaskComplete(detailTask);
  }, [detailTask, handleTaskComplete]);

  const handleDetailSnooze = useCallback(() => {
    if (!detailTask) return;
    setShowTaskDetail(false);
    setDetailTask(null);
    handleSnooze(detailTask, 4);
  }, [detailTask, handleSnooze]);

  const handleDetailSkip = useCallback(() => {
    if (!detailTask) return;
    setShowTaskDetail(false);
    setDetailTask(null);
    handleOpenSkipModal(detailTask);
  }, [detailTask, handleOpenSkipModal]);

  const handleShowDetail = useCallback((task: TaskTemplate) => {
    setDetailTask(task);
    setShowTaskDetail(true);
  }, []);

  const renderSwipeableTask = useCallback(
    (task: TaskTemplate): React.JSX.Element | null => (
      <SwipeableTaskCard
        key={task.id}
        task={task}
        isSelected={selectedTaskIds.has(task.id)}
        plantMap={plantMap}
        swipeableRefs={swipeableRefs}
        getPlantDetails={getPlantDetails}
        onComplete={handleTaskComplete}
        onSnooze={handleSnooze}
        onSkipOpen={handleOpenSkipModal}
        onSelectToggle={toggleTaskSelection}
        onDetail={handleShowDetail}
      />
    ),
    [
      selectedTaskIds,
      plantMap,
      getPlantDetails,
      handleTaskComplete,
      handleSnooze,
      handleOpenSkipModal,
      toggleTaskSelection,
      handleShowDetail,
    ],
  );

  const isViewingToday = React.useMemo(() => {
    const today = new Date();
    if (selectedView === "week") {
      const todayWeekStart = getStartOfWeek(today);
      return currentWeekStart.toDateString() === todayWeekStart.toDateString();
    }
    return (
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  }, [selectedView, currentWeekStart, currentMonth]);

  return (
    <GestureHandlerRootView style={styles.flexOne}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.headerTop, { paddingTop: insets.top + 12 }]}>
            {searchActive ? (
              <View style={styles.searchExpandedRow}>
                <TouchableOpacity
                  style={styles.searchBackBtn}
                  onPress={() => {
                    setSearchActive(false);
                    if (!searchQuery.trim()) setSearchQuery("");
                  }}
                >
                  <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.searchExpandedWrapper}>
                  <Ionicons name="search" size={16} color={theme.textSecondary} />
                  <TextInput
                    ref={searchInputRef}
                    style={styles.searchExpandedInput}
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChangeText={(text) =>
                      setSearchQuery(sanitizeAlphaNumericSpaces(text))
                    }
                    placeholderTextColor={theme.inputPlaceholder}
                    autoFocus
                    returnKeyType="search"
                  />
                  {searchQuery.trim() !== "" && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.headerTitle}>Care Plan</Text>
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.searchIconBtn}
                    onPress={() => setSearchActive(true)}
                  >
                    <Ionicons name="search" size={20} color={theme.primary} />
                    {searchQuery.trim() !== "" && <View style={styles.searchActiveDot} />}
                  </TouchableOpacity>
                  {!isViewingToday && (
                    <TouchableOpacity
                      style={styles.todayButton}
                      onPress={setTodayView}
                    >
                      <Text style={styles.todayButtonText}>Today</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.viewToggle}
                    onPress={() => {
                      LayoutAnimation.configureNext(
                        LayoutAnimation.Presets.easeInEaseOut,
                      );
                      setSelectedView(selectedView === "week" ? "month" : "week");
                    }}
                  >
                    <Ionicons
                      name={selectedView === "week" ? "list" : "calendar"}
                      size={18}
                      color={theme.primary}
                    />
                    <Text style={styles.viewToggleText}>
                      {selectedView === "week" ? "Week" : "Month"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.groupMenuButton,
                      (showGroupMenu || (groupBy !== "none" && filterTaskTypes.size === 0 && !filterOverdueOnly)) && styles.groupMenuButtonActive,
                    ]}
                    onPress={() => setShowGroupMenu(!showGroupMenu)}
                  >
                    <Ionicons
                      name="options-outline"
                      size={20}
                      color={(showGroupMenu || (groupBy !== "none" && filterTaskTypes.size === 0 && !filterOverdueOnly)) ? theme.textInverse : theme.primary}
                    />
                    {(filterTaskTypes.size > 0 || filterOverdueOnly) && !showGroupMenu && (
                      <View style={styles.filterBadge}>
                        <Text style={styles.filterBadgeText}>
                          {filterTaskTypes.size + (filterOverdueOnly ? 1 : 0)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>



        {/* Week or Month View — collapses on scroll */}
        <Animated.View style={[styles.animatedCalendarWrap, {
          maxHeight: calendarHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 500],
          }),
          opacity: calendarHeight.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0, 0.5, 1],
          }),
        }]}>
          {selectedView === "week" ? (
            <WeekCalendarView
              currentWeekStart={currentWeekStart}
              selectedDate={selectedDate}
              taskColors={TASK_COLORS}
              getTasksForDate={getTasksForDate}
              onSelectDate={setSelectedDate}
              onNavigateWeek={(newStart) => {
                setSelectedDate(null);
                setCurrentWeekStart(newStart);
              }}
            />
          ) : (
            <MonthCalendarView
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              taskColors={TASK_COLORS}
              getTasksForDate={getTasksForDate}
              onSelectDate={setSelectedDate}
              onNavigateMonth={(newMonth) => {
                setSelectedDate(null);
                setCurrentMonth(newMonth);
              }}
            />
          )}
        </Animated.View>

        {/* Collapsed date strip — visible when calendar is collapsed */}
        <Animated.View style={[styles.animatedCalendarWrap, {
          maxHeight: calendarHeight.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [44, 20, 0],
          }),
          opacity: calendarHeight.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [1, 0.5, 0],
          }),
        }]}>
          <TouchableOpacity
            style={styles.collapsedStrip}
            onPress={expandCalendar}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
            <Text style={styles.collapsedStripText}>
              {selectedDate
                ? selectedDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                : selectedView === "week"
                  ? `${currentWeekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(currentWeekStart.getTime() + 6 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                  : currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </Text>
            {selectedDate && (
              <Text style={styles.collapsedStripCount}>
                {getTasksForDate(selectedDate).length}
              </Text>
            )}
            <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 48) + 16 }}
          onScroll={handleContentScroll}
          scrollEventThrottle={16}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={initialLoading || refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* Swipe Hint Banner */}
          {showSwipeHint && (
            <View style={styles.swipeHintBanner}>
              <View style={styles.swipeHintBannerContent}>
                <Ionicons name="swap-horizontal-outline" size={18} color={theme.primary} />
                <Text style={styles.swipeHintBannerText}>
                  Swipe cards left to complete, right to skip or snooze
                </Text>
              </View>
              <TouchableOpacity onPress={dismissSwipeHint} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={18} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>
          )}

          {/* Selected Date Tasks */}
          {!isSearching && selectedDate && (
            <View style={styles.section}>
              {(() => {
                const selectedDateTasks = getTasksForDate(selectedDate);
                const rawSelectedDateTasks = getRawTasksForDate(selectedDate);
                const isToday = selectedDate.toDateString() === new Date().toDateString();
                const hiddenByFilter = selectedDateTasks.length === 0 && rawSelectedDateTasks.length > 0 && isFilterActive;
                return selectedDateTasks.length > 0 ? (
                  <>
                    <View style={styles.sectionHeaderRow}>
                      {renderSectionCheckbox(selectedDateTasks)}
                      <Text style={[styles.sectionTitle, styles.sectionTitleFlex]}>
                        {isToday ? "Today" : selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </Text>
                      <Text style={styles.sectionCount}>{selectedDateTasks.length}</Text>
                    </View>
                    {selectedDateTasks.map(renderSwipeableTask)}
                  </>
                ) : hiddenByFilter && !initialLoading ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="options-outline" size={48} color={theme.border} />
                    <Text style={styles.emptyStateText}>No matching tasks for this date</Text>
                    <Text style={styles.emptyStateSubtext}>
                      {rawSelectedDateTasks.length} task{rawSelectedDateTasks.length !== 1 ? "s" : ""} exist but are hidden by your filters
                    </Text>
                    <TouchableOpacity style={styles.clearSearchButton} onPress={clearFilters}>
                      <Text style={styles.clearSearchText}>Clear Filters</Text>
                    </TouchableOpacity>
                  </View>
                ) : !initialLoading ? (
                  <View style={styles.emptyState}>
                    <Ionicons
                      name="calendar-outline"
                      size={48}
                      color={theme.border}
                    />
                    <Text style={styles.emptyStateText}>
                      No tasks scheduled
                    </Text>
                    <Text style={styles.emptyStateSubtext}>
                      {isToday
                        ? "You're all caught up for today!"
                        : "No tasks planned for this date"}
                    </Text>
                    <TouchableOpacity
                      style={styles.addTaskButton}
                      onPress={() => {
                        setCreateTaskInitialDate(selectedDate);
                        setShowModal(true);
                      }}
                    >
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color={theme.primary}
                      />
                      <Text style={styles.addTaskButtonText}>Add Task</Text>
                    </TouchableOpacity>
                  </View>
                ) : null;
              })()}
            </View>
          )}

          {isSearching && filteredTasks.length === 0 && !initialLoading && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={theme.border} />
              <Text style={styles.emptyStateText}>No tasks found</Text>
              <Text style={styles.emptyStateSubtext}>
                {tasks.length === 0
                  ? "Create your first task to get started"
                  : `No results for "${searchQuery}"`}
              </Text>
              {tasks.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery("")}
                >
                  <Text style={styles.clearSearchText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Harvest Ready Section */}
          {filteredHarvestsReady.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>🧺 Harvest Ready</Text>
                <Text style={styles.sectionCount}>{filteredHarvestsReady.length}</Text>
              </View>
              {filteredHarvestsReady.map(
                (item: HarvestReadyItem) =>
                  item && (
                    <View
                      key={item.plant.id}
                      style={[
                        styles.harvestCard,
                        item.isReady && styles.harvestCardReady,
                      ]}
                    >
                      <View style={styles.harvestIcon}>
                        <Text style={styles.harvestEmoji}>
                          {item.plant.plant_type === "coconut_tree"
                            ? "🥥"
                            : "🍎"}
                        </Text>
                      </View>
                      <View style={styles.harvestInfo}>
                        <Text style={styles.harvestPlant}>
                          {item.plant.name}
                        </Text>
                        <Text style={styles.harvestDate}>
                          {item.isReady
                            ? "✅ Ready to harvest!"
                            : `Ready in ${item.daysUntil} days`}
                        </Text>
                      </View>
                    </View>
                  ),
              )}
            </View>
          )}

          {/* Overdue — pinned above Today */}
          {!isSearching && overdueTasks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                {renderSectionCheckbox(overdueTasks)}
                <Text style={[styles.sectionTitle, styles.sectionTitleOverdue]}>⚠️ Overdue</Text>
                <Text style={[styles.sectionCount, { backgroundColor: theme.errorLight, color: theme.error }]}>
                  {overdueTasks.length}
                </Text>
              </View>
              {overdueTasks.map(renderSwipeableTask)}
            </View>
          )}

          {/* Today's Tasks — hidden when today is already the selected date */}
          {todayTasks.length > 0 &&
            !(selectedDate && selectedDate.toDateString() === new Date().toDateString()) && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                {renderSectionCheckbox(todayTasks)}
                <Text style={[styles.sectionTitle, styles.sectionTitleFlex]}>Today</Text>
                <View style={styles.rowCenterGap8}>
                  {sessionCompletedCount > 0 && (
                    <View style={styles.weekDoneChip}>
                      <Text style={styles.weekDoneChipText}>✓ {sessionCompletedCount} done</Text>
                    </View>
                  )}
                  <Text style={styles.sectionCount}>{todayTasks.length}</Text>
                </View>
              </View>
              {todayTasks.map(renderSwipeableTask)}
            </View>
          )}

          {/* Day-by-day week view OR grouped tasks */}
          {dayGroupedTasks
            ? dayGroupedTasks.length > 0
              ? dayGroupedTasks.map(({ dateKey, label, tasks: dayTasks }) => {
                  const isToday = dateKey === new Date().toDateString();
                  if (
                    isToday &&
                    todayTasks.length > 0 &&
                    !(selectedDate && selectedDate.toDateString() === new Date().toDateString())
                  ) {
                    return null;
                  }
                  return (
                    <View key={dateKey} style={styles.section}>
                      <View style={styles.sectionHeaderRow}>
                        {renderSectionCheckbox(dayTasks ?? [])}
                        <Text style={[styles.sectionTitle, styles.sectionTitleFlex]}>{label}</Text>
                        <Text style={styles.sectionCount}>{(dayTasks ?? []).length}</Text>
                      </View>
                      {(dayTasks ?? []).map(renderSwipeableTask)}
                    </View>
                  );
                })
              : !isSearching && todayTasks.length === 0 && overdueTasks.length === 0 && !initialLoading && (
                  isFilterActive ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="options-outline" size={48} color={theme.border} />
                      <Text style={styles.emptyStateText}>No tasks match your filters</Text>
                      <Text style={styles.emptyStateSubtext}>
                        Try adjusting your filters or clear them to see all tasks
                      </Text>
                      <TouchableOpacity style={styles.clearSearchButton} onPress={clearFilters}>
                        <Text style={styles.clearSearchText}>Clear Filters</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons name="checkbox-outline" size={48} color={theme.border} />
                      <Text style={styles.emptyStateText}>No upcoming tasks</Text>
                      <Text style={styles.emptyStateSubtext}>
                        Create a care plan to stay on top of your garden
                      </Text>
                      <TouchableOpacity style={styles.addTaskButton} onPress={() => setShowModal(true)}>
                        <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                        <Text style={styles.addTaskButtonText}>Create Task</Text>
                      </TouchableOpacity>
                    </View>
                  )
                )
            : Object.keys(groupedTasks).length > 0 &&
              Object.values(groupedTasks).some((arr) => arr.length > 0)
              ? Object.keys(groupedTasks).map((groupName) => {
                  const nonOverdue = (groupedTasks[groupName] ?? []).filter((t) => !overdueIdSet.has(t.id));
                  if (nonOverdue.length === 0) return null;
                  return (
                    <View key={groupName} style={styles.section}>
                      {groupName ? (
                        <View style={styles.sectionHeaderRow}>
                          {renderSectionCheckbox(nonOverdue)}
                          <Text style={[styles.sectionTitle, styles.sectionTitleFlex]}>
                            {groupBy === "location"
                              ? `📍 ${groupName}`
                              : groupBy === "type"
                                ? `${TASK_LABELS[groupName as TaskType] || groupName.charAt(0).toUpperCase() + groupName.slice(1)}`
                                : groupBy === "plant"
                                  ? `🌿 ${groupName}`
                                  : selectedView === "month" ? "This Month" : "This Week"}
                          </Text>
                          <Text style={styles.sectionCount}>{nonOverdue.length}</Text>
                        </View>
                      ) : (
                        <View style={styles.sectionHeaderRow}>
                          {renderSectionCheckbox(nonOverdue)}
                          <Text style={[styles.sectionTitle, styles.sectionTitleFlex]}>
                            {isSearching
                              ? "Search Results"
                              : selectedView === "month" ? "This Month" : "This Week"}
                          </Text>
                          <View style={styles.rowCenterGap8}>
                            {sessionCompletedCount > 0 && !isSearching && (
                              <View style={styles.weekDoneChip}>
                                <Text style={styles.weekDoneChipText}>✓ {sessionCompletedCount} done</Text>
                              </View>
                            )}
                            <Text style={styles.sectionCount}>
                              {isSearching ? tasksForDisplay.length : weekTasks.length}
                            </Text>
                          </View>
                        </View>
                      )}
                      {nonOverdue.map(renderSwipeableTask)}
                    </View>
                  );
                })
              : !isSearching &&
                todayTasks.length === 0 &&
                overdueTasks.length === 0 &&
                !initialLoading && (
                  isFilterActive ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="options-outline" size={48} color={theme.border} />
                      <Text style={styles.emptyStateText}>No tasks match your filters</Text>
                      <Text style={styles.emptyStateSubtext}>
                        Try adjusting your filters or clear them to see all tasks
                      </Text>
                      <TouchableOpacity style={styles.clearSearchButton} onPress={clearFilters}>
                        <Text style={styles.clearSearchText}>Clear Filters</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Ionicons name="checkbox-outline" size={48} color={theme.border} />
                      <Text style={styles.emptyStateText}>No upcoming tasks</Text>
                      <Text style={styles.emptyStateSubtext}>
                        Create a care plan to stay on top of your garden
                      </Text>
                      <TouchableOpacity style={styles.addTaskButton} onPress={() => setShowModal(true)}>
                        <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
                        <Text style={styles.addTaskButtonText}>Create Task</Text>
                      </TouchableOpacity>
                    </View>
                  )
                )}
        </ScrollView>

        {/* Floating Selection Bar */}
        {selectedTaskIds.size > 0 && (
          <View style={[styles.selectionBar, { bottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) + 8 }]}>
            <TouchableOpacity
              style={styles.selectionBarCancel}
              onPress={() => setSelectedTaskIds(new Set())}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectionBarSecondaryBtn, { backgroundColor: `${theme.info}20`, borderColor: theme.info }]}
              onPress={handleBulkSnooze}
              disabled={isCompletingAll}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={15} color={theme.info} />
              <Text style={[styles.selectionBarSecondaryBtnText, { color: theme.info }]}>+4h</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectionBarSecondaryBtn, { backgroundColor: `${theme.warning}20`, borderColor: theme.warning }]}
              onPress={handleBulkSkip}
              disabled={isCompletingAll}
              activeOpacity={0.7}
            >
              <Ionicons name="play-skip-forward" size={15} color={theme.warning} />
              <Text style={[styles.selectionBarSecondaryBtnText, { color: theme.warning }]}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.selectionBarBtn,
                isCompletingAll && styles.selectionBarBtnDisabled,
              ]}
              onPress={handleCompleteSelected}
              disabled={isCompletingAll}
              activeOpacity={0.7}
            >
              {isCompletingAll ? (
                <Text style={styles.selectionBarBtnText}>
                  {completedCount}/{selectedTaskIds.size}
                </Text>
              ) : (
                <>
                  <Ionicons name="checkmark-done" size={18} color={theme.textInverse} />
                  <Text style={styles.selectionBarBtnText}>
                    Done ({selectedTaskIds.size})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Floating Action Button */}
        <AnimatedFAB onPress={() => setShowModal(true)} />

        {/* View Options Bottom Sheet */}
        {showGroupMenu && (
          <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowGroupMenu(false)} />
            <View style={[styles.sheetContainer, { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity activeOpacity={0.6} onPress={() => setShowGroupMenu(false)} style={styles.sheetHandleArea}>
                <View style={styles.sheetHandle} />
              </TouchableOpacity>

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>View Options</Text>
                {(groupBy !== "none" || filterTaskTypes.size > 0 || filterOverdueOnly) && (
                  <TouchableOpacity
                    onPress={() => {
                      setGroupBy("none");
                      setFilterTaskTypes(new Set());
                      setFilterOverdueOnly(false);
                    }}
                    style={styles.sheetClearBtn}
                  >
                    <Text style={styles.sheetClearText}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.sheetScroll}
                contentContainerStyle={styles.sheetScrollContent}
                bounces={false}
                nestedScrollEnabled
              >
                {/* Filter Section */}
                <Text style={styles.sheetSectionTitle}>Filter</Text>
                <View style={styles.sheetChipWrap}>
                  <TouchableOpacity
                    style={[styles.sheetChip, filterOverdueOnly && styles.sheetChipActive]}
                    onPress={() => setFilterOverdueOnly((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sheetChipText, filterOverdueOnly && styles.sheetChipTextActive]}>
                      ⚠️ Overdue only
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.sheetChipWrap, styles.chipWrapMarginTop]}>
                  {(Object.keys(TASK_LABELS) as TaskType[]).map((type) => {
                    const isActive = filterTaskTypes.has(type);
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                        onPress={() => {
                          setFilterTaskTypes((prev) => {
                            const next = new Set(prev);
                            if (next.has(type)) {
                              next.delete(type);
                            } else {
                              next.add(type);
                            }
                            return next;
                          });
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
                          {TASK_EMOJIS[type]} {TASK_LABELS[type]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Group By Section */}
                <Text style={[styles.sheetSectionTitle, styles.sheetSectionTitleMarginTop]}>Group By</Text>
                <View style={styles.sheetChipWrap}>
                  {GROUP_OPTIONS.map((option) => {
                    const isActive = groupBy === option.value;
                    return (
                      <TouchableOpacity
                        key={option.value}
                        style={[styles.sheetChip, isActive && styles.sheetChipActive]}
                        onPress={() => {
                          setGroupBy(option.value);
                          setShowGroupMenu(false);
                        }}
                      >
                        <Text style={[styles.sheetChipText, isActive && styles.sheetChipTextActive]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        )}

        {/* Create Task Modal */}
        <CreateTaskModal
          visible={showModal}
          plants={plants}
          styles={styles}
          bottomInset={insets.bottom}
          initialStartDate={createTaskInitialDate}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            loadData({ force: true });
          }}
        />

        {/* Completion Progress Modal */}
        <Modal
          visible={isCompletingAll}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {}}
        >
          <View style={styles.completeAllOverlay}>
            <View style={styles.completeAllCard}>
              <View style={styles.completeAllIconRow}>
                <View style={styles.completeAllIconCircle}>
                  <Ionicons name="hourglass" size={28} color={theme.textInverse} />
                </View>
              </View>
              <Text style={styles.completeAllTitle}>
                {`Completing... ${completedCount}/${completingTotal}`}
              </Text>
              <View style={styles.progressBarOuter}>
                <View
                  style={[
                    styles.progressBarInner,
                    {
                      width: `${completingTotal > 0 ? (completedCount / completingTotal) * 100 : 0}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Task Notes Modal */}
        <TaskCompletionModal
          visible={showNotesModal}
          task={selectedTask}
          taskNotes={taskNotes}
          productUsed={productUsed}
          isCompleting={isCompletingTask}
          plantName={selectedTask ? getPlantDetails(selectedTask.plant_id).name : ""}
          styles={styles}
          bottomInset={insets.bottom}
          onChangeNotes={(text) => setTaskNotes(sanitizeAlphaNumericSpaces(text))}
          onChangeProduct={(text) => setProductUsed(sanitizeAlphaNumericSpaces(text))}
          onClose={() => setShowNotesModal(false)}
          onConfirm={confirmTaskComplete}
        />

        {/* Task Detail Bottom Sheet */}
        {showTaskDetail && detailTask && (() => {
          const dp = getPlantDetails(detailTask.plant_id);
          const dueDateObj = new Date(detailTask.next_due_at);
          const todayS = new Date();
          todayS.setHours(0, 0, 0, 0);
          const isOverdueDetail = dueDateObj < todayS;
          const daysOverdue = isOverdueDetail
            ? Math.floor((todayS.getTime() - dueDateObj.getTime()) / 86400000)
            : null;
          const plantObj = detailTask.plant_id ? plantMap.get(detailTask.plant_id) : undefined;
          const effPriority = detailTask.priority_level || calculateTaskPriority(detailTask, plantObj || null);
          const priorityLabels: Record<string, string> = { critical: "⚠ Critical", high: "↑ High", medium: "• Medium", low: "↓ Low" };
          const priorityColorMap: Record<string, string> = { critical: theme.error, high: theme.warning, medium: theme.info, low: theme.border };
          const closeDetail = (): void => { setShowTaskDetail(false); setDetailTask(null); };
          return (
            <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={closeDetail} />
              <View style={[styles.taskDetailSheet, { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) }]}>
                <TouchableOpacity
                  style={styles.sheetHandleArea}
                  onPress={closeDetail}
                  activeOpacity={0.6}
                >
                  <View style={styles.sheetHandle} />
                </TouchableOpacity>
                <View style={styles.taskDetailHeader}>
                  <Text style={[styles.taskDetailEmoji, { backgroundColor: TASK_COLORS[detailTask.task_type] + "18" }]}>
                    {TASK_EMOJIS[detailTask.task_type]}
                  </Text>
                  <View style={styles.taskDetailTitleBlock}>
                    <Text style={styles.taskDetailTitle}>{TASK_LABELS[detailTask.task_type]}</Text>
                    <Text style={styles.taskDetailSubtitle}>
                      {dp.name}{dp.location ? ` · ${dp.location}` : ""}
                    </Text>
                  </View>
                </View>
                <View style={styles.taskDetailBody}>
                  <View style={styles.taskDetailRow}>
                    <Text style={styles.taskDetailLabel}>Frequency</Text>
                    <Text style={styles.taskDetailValue}>
                      Every {detailTask.frequency_days} day{detailTask.frequency_days !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  {detailTask.preferred_time && (
                    <View style={styles.taskDetailRow}>
                      <Text style={styles.taskDetailLabel}>Preferred Time</Text>
                      <Text style={styles.taskDetailValue}>
                        {detailTask.preferred_time === "morning" ? "🌅 Morning" : detailTask.preferred_time === "afternoon" ? "☀️ Afternoon" : "🌙 Evening"}
                      </Text>
                    </View>
                  )}
                  <View style={styles.taskDetailRow}>
                    <Text style={styles.taskDetailLabel}>Due</Text>
                    <Text style={[styles.taskDetailValue, isOverdueDetail && { color: theme.error }]}>
                      {isOverdueDetail
                        ? daysOverdue === 0 ? "Today" : `${daysOverdue}d overdue`
                        : dueDateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </Text>
                  </View>
                  <View style={styles.taskDetailRow}>
                    <Text style={styles.taskDetailLabel}>Priority</Text>
                    <Text style={[styles.taskDetailValue, { color: priorityColorMap[effPriority] }]}>
                      {priorityLabels[effPriority]}
                    </Text>
                  </View>
                </View>
                <View style={styles.taskDetailActions}>
                  <TouchableOpacity style={[styles.taskDetailActionBtn, { backgroundColor: theme.success }]} onPress={handleDetailComplete}>
                    <Ionicons name="checkmark" size={16} color={theme.textInverse} />
                    <Text style={styles.taskDetailActionBtnText}>Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.taskDetailActionBtn, { backgroundColor: theme.info }]} onPress={handleDetailSnooze}>
                    <Ionicons name="time-outline" size={16} color={theme.textInverse} />
                    <Text style={styles.taskDetailActionBtnText}>Snooze</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.taskDetailActionBtn, { backgroundColor: theme.warning }]} onPress={handleDetailSkip}>
                    <Ionicons name="play-skip-forward" size={16} color={theme.textInverse} />
                    <Text style={styles.taskDetailActionBtnText}>Skip</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })()}

        {/* Skip Task Modal */}
        <Modal
          visible={showSkipModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSkipModal(false)}
        >
          <View style={styles.skipModalOverlay}>
            <View style={styles.skipModalContent}>
              <Text style={styles.skipModalTitle}>Skip Task</Text>
              <Text style={styles.skipModalSubtext}>Reschedule to:</Text>
              <View style={styles.skipDaysRow}>
                {[
                  { days: 1, label: "Tomorrow" },
                  { days: 3, label: "3 Days" },
                  { days: 7, label: "7 Days" },
                ].map(({ days, label }) => (
                  <TouchableOpacity
                    key={days}
                    style={[styles.skipDayChip, skipDays === days && styles.skipDayChipActive]}
                    onPress={() => setSkipDays(days)}
                  >
                    <Text style={[styles.skipDayChipText, skipDays === days && styles.skipDayChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.skipModalInput}
                placeholder="Reason (optional)"
                value={skipReason}
                onChangeText={(text) =>
                  setSkipReason(sanitizeAlphaNumericSpaces(text))
                }
                placeholderTextColor={theme.textTertiary}
                multiline
              />

              <View style={styles.skipReasonChips}>
                {["Weather", "Already done", "Not needed", "Too busy"].map(
                  (reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={styles.skipReasonChip}
                      onPress={() => setSkipReason(reason)}
                    >
                      <Text style={styles.skipReasonChipText}>{reason}</Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>

              <View style={styles.skipModalButtons}>
                <TouchableOpacity
                  style={[styles.skipModalBtn, styles.skipModalBtnCancel]}
                  onPress={() => {
                    setShowSkipModal(false);
                    setSkipReason("");
                    setSkipDays(1);
                    setSkipTask(null);
                  }}
                >
                  <Text style={styles.skipModalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.skipModalBtn, styles.skipModalBtnConfirm]}
                  onPress={handleConfirmSkip}
                  disabled={skippingTask}
                >
                  <Text style={styles.skipModalBtnText}>
                    {skippingTask ? "Skipping..." : skipDays === 1 ? "Skip to Tomorrow" : `Skip (+${skipDays} days)`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

