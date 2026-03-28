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
  Modal,
} from "react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import {
  markTaskDone,
  updateTaskTemplate,
} from "../services/tasks";
import {
  TaskTemplate,
} from "../types/database.types";
import { Ionicons } from "@expo/vector-icons";
import { TASK_EMOJIS, TASK_COLORS } from "../utils/taskConstants";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { createStyles, getStartOfWeek } from "../styles/calendarStyles";
import { sanitizeAlphaNumericSpaces } from "../utils/textSanitizer";
import { safeGetItem, safeSetItem } from "../utils/safeStorage";
import { useCalendarData } from "../hooks/useCalendarData";
import { useTabBarScroll, TAB_BAR_HEIGHT, AnimatedFAB } from "../components/FloatingTabBar";
import CreateTaskModal from "../components/CreateTaskModal";
import CompleteAllModal from "../components/CompleteAllModal";
import TaskCompletionModal from "../components/TaskCompletionModal";
import WeekCalendarView from "../components/WeekCalendarView";
import MonthCalendarView from "../components/MonthCalendarView";

const GROUP_OPTIONS: {
  value: "none" | "location" | "type";
  label: string;
  icon: string;
}[] = [
  { value: "none", label: "All Tasks", icon: "list" },
  { value: "location", label: "Location", icon: "location" },
  { value: "type", label: "Type", icon: "apps" },
];

export default function CalendarScreen() {
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
  const [showCompleteAllModal, setShowCompleteAllModal] = useState(false);
  const [completeAllTasks, setCompleteAllTasks] = useState<TaskTemplate[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [groupBy, setGroupBy] = useState<"none" | "location" | "type">("none");
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipTask, setSkipTask] = useState<TaskTemplate | null>(null);
  const [skipReason, setSkipReason] = useState("");
  const [skippingTask, setSkippingTask] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const calendarHeight = useRef(new Animated.Value(1)).current; // 1 = expanded, 0 = collapsed
  const calendarCollapsed = useRef(false);
  const lastScrollY = useRef(0);
  const searchInputRef = React.useRef<TextInput>(null);
  const normalizeSearchText = (value: string) =>
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
    filteredTasks,
    filteredHarvestsReady,
    todayTasks,
    weekTasks,
    tasksForDisplay,
    groupedTasks,
    isSearching,
    getTasksForDate,
    getPlantDetails,
  } = useCalendarData({
    normalizedSearchQuery,
    normalizeSearchText,
    selectedView,
    currentWeekStart,
    currentMonth,
    selectedDate,
    groupBy,
  });

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
  }, [setTodayView, loadData]);

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

  const handleContentScroll = useCallback((event: any) => {
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
      void loadData(); // debounced — skips if loaded recently
    }, [loadData, resetTabBar]),
  );

  const handleTaskComplete = async (task: TaskTemplate) => {
    // Close the swipeable drawer before opening the modal
    const swipeable = swipeableRefs.current.get(task.id);
    swipeable?.close();
    setSelectedTask(task);
    setTaskNotes("");
    setProductUsed("");
    setShowNotesModal(true);
  };

  const confirmTaskComplete = async () => {
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
      loadData({ force: true });
    } catch (error: any) {
      Alert.alert("Error", error.message);
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

  const handleCompleteSelected = useCallback(() => {
    const selected = tasks.filter((t) => selectedTaskIds.has(t.id));
    if (selected.length === 0) return;
    setCompleteAllTasks(selected);
    setShowCompleteAllModal(true);
  }, [tasks, selectedTaskIds]);

  const confirmCompleteAll = async (selectedTasks: TaskTemplate[]) => {
    if (isCompletingAll || selectedTasks.length === 0) return;
    setIsCompletingAll(true);
    setCompletedCount(0);
    setCompleteAllTasks(selectedTasks);

    // Fire all in parallel for speed; track completions via allSettled
    const results = await Promise.allSettled(
      selectedTasks.map(async (task) => {
        const result = await markTaskDone(task, undefined, undefined, {
          skipAlreadyDoneCheck: true,
        });
        setCompletedCount((prev) => prev + 1);
        return result;
      }),
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    setIsCompletingAll(false);
    setCompletedCount(0);
    setShowCompleteAllModal(false);
    setCompleteAllTasks([]);
    setSelectedTaskIds(new Set());
    loadData({ force: true });
    if (failed > 0) {
      Alert.alert("Partial Completion", `${failed} task(s) failed. You can retry them individually.`);
    }
  };

  const handleSnooze = async (task: TaskTemplate, hours: number) => {
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
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleOpenSkipModal = (task: TaskTemplate) => {
    const swipeable = swipeableRefs.current.get(task.id);
    swipeable?.close();
    setSkipTask(task);
    setSkipReason("");
    setShowSkipModal(true);
  };

  const handleConfirmSkip = async () => {
    if (!skipTask || skippingTask) return;
    setSkippingTask(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await updateTaskTemplate(skipTask.id, {
        next_due_at: tomorrow.toISOString(),
      });
      Alert.alert(
        "Task Skipped",
        `Task postponed to tomorrow${skipReason ? `: ${skipReason}` : ""}`,
      );
      setShowSkipModal(false);
      setSkipReason("");
      setSkipTask(null);
      loadData({ force: true });
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setSkippingTask(false);
    }
  };

  const renderSwipeableTask = (task: TaskTemplate) => {
    if (!task || !task.next_due_at) return null;
    const plantDetails = getPlantDetails(task.plant_id);
    const dueDate = new Date(task.next_due_at);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const isOverdue = dueDate < todayStart;

    const renderRightActions = (
      progress: Animated.AnimatedInterpolation<number>,
      _dragX: Animated.AnimatedInterpolation<number>,
    ) => {
      const scale = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 1],
        extrapolate: "clamp",
      });
      const opacity = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: "clamp",
      });

      return (
        <TouchableOpacity
          style={styles.swipeAction}
          onPress={() => handleTaskComplete(task)}
        >
          <Animated.View
            style={[
              styles.swipeActionContent,
              { opacity, transform: [{ scale }] },
            ]}
          >
            <Ionicons name="checkmark-circle" size={28} color="#fff" />
            <Text style={styles.swipeActionText}>Done</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    };

    const renderLeftActions = (
      progress: Animated.AnimatedInterpolation<number>,
      _dragX: Animated.AnimatedInterpolation<number>,
    ) => {
      const scale = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 1],
        extrapolate: "clamp",
      });
      const opacity = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
        extrapolate: "clamp",
      });

      return (
        <View style={styles.swipeLeftActions}>
          <TouchableOpacity
            style={styles.swipeSnoozeAction}
            onPress={() => handleSnooze(task, isOverdue ? 2 : 4)}
          >
            <Animated.View
              style={[
                styles.swipeActionContent,
                { opacity, transform: [{ scale }] },
              ]}
            >
              <Ionicons name="time-outline" size={24} color="#fff" />
              <Text style={styles.swipeActionText}>
                {isOverdue ? "+2h" : "+4h"}
              </Text>
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.swipeSkipAction}
            onPress={() => handleOpenSkipModal(task)}
          >
            <Animated.View
              style={[
                styles.swipeActionContent,
                { opacity, transform: [{ scale }] },
              ]}
            >
              <Ionicons name="play-skip-forward" size={24} color="#fff" />
              <Text style={styles.swipeActionText}>Skip</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      );
    };

    const isSelected = selectedTaskIds.has(task.id);

    return (
      <Swipeable
        key={task.id}
        ref={(ref) => {
          if (ref) {
            swipeableRefs.current.set(task.id, ref);
          } else {
            swipeableRefs.current.delete(task.id);
          }
        }}
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        friction={2}
        rightThreshold={40}
        leftThreshold={40}
        overshootRight={false}
        overshootLeft={false}
        onSwipeableOpen={(direction) => {
          if (direction === "right") handleTaskComplete(task);
        }}
      >
        <View style={[styles.taskCard, isOverdue && styles.taskCardOverdue, isSelected && styles.taskCardSelected]}>
          <View
            style={[
              styles.taskColorBar,
              { backgroundColor: TASK_COLORS[task.task_type] },
            ]}
          />
          <View style={styles.taskContent}>
            <View style={styles.taskHeader}>
              <View
                style={[
                  styles.taskIconContainer,
                  { backgroundColor: TASK_COLORS[task.task_type] + "18" },
                ]}
              >
                <Text style={styles.taskIconEmoji}>
                  {TASK_EMOJIS[task.task_type] || "📌"}
                </Text>
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>
                  {task.task_type.charAt(0).toUpperCase() +
                    task.task_type.slice(1)}
                </Text>
                <Text style={styles.taskPlant}>{plantDetails.name}</Text>
                {plantDetails.location && (
                  <Text style={styles.taskLocation}>
                    📍 {plantDetails.location}
                  </Text>
                )}
              </View>
              <View style={styles.taskRight}>
                <Text
                  style={[styles.taskTime, isOverdue && styles.taskTimeOverdue]}
                >
                  {isOverdue
                    ? "Overdue"
                    : dueDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                </Text>
                <TouchableOpacity
                  style={[styles.taskCheckbox, isSelected && styles.taskCheckboxSelected]}
                  onPress={() => toggleTaskSelection(task.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.6}
                >
                  <Ionicons
                    name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                    size={22}
                    color={isSelected ? theme.primary : theme.border}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Swipeable>
    );
  };

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
    <GestureHandlerRootView style={{ flex: 1 }}>
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
                      groupBy !== "none" && styles.groupMenuButtonActive,
                    ]}
                    onPress={() => setShowGroupMenu(!showGroupMenu)}
                  >
                    <Ionicons
                      name="funnel"
                      size={20}
                      color={groupBy !== "none" ? "#fff" : theme.primary}
                    />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>



        {/* Week or Month View — collapses on scroll */}
        <Animated.View style={{
          overflow: "hidden",
          maxHeight: calendarHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 500],
          }),
          opacity: calendarHeight.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0, 0.5, 1],
          }),
        }}>
          {selectedView === "week" ? (
            <WeekCalendarView
              currentWeekStart={currentWeekStart}
              selectedDate={selectedDate}
              styles={styles}
              theme={theme}
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
              styles={styles}
              theme={theme}
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
        <Animated.View style={{
          overflow: "hidden",
          maxHeight: calendarHeight.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [44, 20, 0],
          }),
          opacity: calendarHeight.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [1, 0.5, 0],
          }),
        }}>
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
                const isToday = selectedDate.toDateString() === new Date().toDateString();
                return selectedDateTasks.length > 0 ? (
                  <>
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>
                        {isToday ? "Today" : selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </Text>
                      <Text style={styles.sectionCount}>{selectedDateTasks.length}</Text>
                    </View>
                    {selectedDateTasks.map(renderSwipeableTask)}
                  </>
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
                      {selectedDate.toDateString() === new Date().toDateString()
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
                (item: any) =>
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

          {/* Today's Tasks — hidden when today is already the selected date */}
          {todayTasks.length > 0 &&
            !(selectedDate && selectedDate.toDateString() === new Date().toDateString()) && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  Today
                </Text>
                <Text style={styles.sectionCount}>{todayTasks.length}</Text>
              </View>
              {todayTasks.map(renderSwipeableTask)}
            </View>
          )}

          {/* Grouped Tasks */}
          {Object.keys(groupedTasks).length > 0 &&
          Object.values(groupedTasks).some((arr) => arr.length > 0)
            ? Object.keys(groupedTasks).map((groupName) => (
                <View key={groupName} style={styles.section}>
                  {groupName && (
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>
                        {groupBy === "location"
                          ? `📍 ${groupName}`
                          : groupBy === "type"
                            ? `${groupName.charAt(0).toUpperCase() + groupName.slice(1)}`
                            : "This Week"}
                      </Text>
                      <Text style={styles.sectionCount}>{groupedTasks[groupName].length}</Text>
                    </View>
                  )}
                  {!groupName && (
                    <View style={styles.sectionHeaderRow}>
                      <Text style={styles.sectionTitle}>
                        {isSearching
                          ? "Search Results"
                          : "This Week"}
                      </Text>
                      <Text style={styles.sectionCount}>
                        {isSearching ? tasksForDisplay.length : weekTasks.length}
                      </Text>
                    </View>
                  )}
                  {groupedTasks[groupName].map(renderSwipeableTask)}
                </View>
              ))
            : !isSearching &&
              todayTasks.length === 0 &&
              !selectedDate &&
              !initialLoading && (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="checkbox-outline"
                    size={48}
                    color={theme.border}
                  />
                  <Text style={styles.emptyStateText}>No upcoming tasks</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Create a care plan to stay on top of your garden
                  </Text>
                  <TouchableOpacity
                    style={styles.addTaskButton}
                    onPress={() => setShowModal(true)}
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color={theme.primary}
                    />
                    <Text style={styles.addTaskButtonText}>Create Task</Text>
                  </TouchableOpacity>
                </View>
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
            <Text style={styles.selectionBarText}>
              {selectedTaskIds.size} selected
            </Text>
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
                  <Ionicons name="checkmark-done" size={18} color="#fff" />
                  <Text style={styles.selectionBarBtnText}>
                    Complete ({selectedTaskIds.size})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Floating Action Button */}
        <AnimatedFAB onPress={() => setShowModal(true)} />

        {/* Filter Bottom Sheet */}
        {showGroupMenu && (
          <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowGroupMenu(false)} />
            <View style={[styles.sheetContainer, { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) }]}>
              <TouchableOpacity activeOpacity={0.6} onPress={() => setShowGroupMenu(false)} style={styles.sheetHandleArea}>
                <View style={styles.sheetHandle} />
              </TouchableOpacity>

              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Filter Tasks</Text>
                {groupBy !== "none" && (
                  <TouchableOpacity onPress={() => { setGroupBy("none"); setShowGroupMenu(false); }} style={styles.sheetClearBtn}>
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
                <Text style={styles.sheetSectionTitle}>
                  <Ionicons name="funnel" size={14} color={theme.textSecondary} /> Group By
                </Text>
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

        {/* Complete All Modal */}
        <CompleteAllModal
          visible={showCompleteAllModal}
          tasks={completeAllTasks}
          isCompleting={isCompletingAll}
          completedCount={completedCount}
          styles={styles}
          getPlantName={(plantId) => getPlantDetails(plantId).name}
          onCancel={() => {
            setShowCompleteAllModal(false);
            setCompleteAllTasks([]);
          }}
          onConfirm={confirmCompleteAll}
        />

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
              <Text style={styles.skipModalSubtext}>
                This task will be postponed to tomorrow
              </Text>

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
                    {skippingTask ? "Skipping..." : "Skip to Tomorrow"}
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

