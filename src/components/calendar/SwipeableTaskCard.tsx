import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { TaskTemplate, Plant } from "../../types/database.types";
import { TASK_EMOJIS, TASK_COLORS, TASK_LABELS } from "../../utils/taskConstants";
import { calculateTaskPriority } from "../../services/tasks";
import { useTheme } from "../../theme";
import { createStyles } from "../../styles/calendarStyles";

interface PlantDetails {
  name: string;
  location: string;
  type: string;
}

interface Props {
  task: TaskTemplate;
  isSelected: boolean;
  plantMap: Map<string, Plant>;
  swipeableRefs: React.MutableRefObject<Map<string, Swipeable>>;
  getPlantDetails: (plantId: string | null) => PlantDetails;
  onComplete: (task: TaskTemplate) => void;
  onSnooze: (task: TaskTemplate, hours: number) => void;
  onSkipOpen: (task: TaskTemplate) => void;
  onSelectToggle: (taskId: string) => void;
  onDetail: (task: TaskTemplate) => void;
}

export function SwipeableTaskCard({
  task,
  isSelected,
  plantMap,
  swipeableRefs,
  getPlantDetails,
  onComplete,
  onSnooze,
  onSkipOpen,
  onSelectToggle,
  onDetail,
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!task || !task.next_due_at) return null;

  const plantDetails = getPlantDetails(task.plant_id);
  const dueDate = new Date(task.next_due_at);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const isOverdue = dueDate < todayStart;

  const plantObj = task.plant_id ? plantMap.get(task.plant_id) : undefined;
  const effectivePriority =
    task.priority_level || calculateTaskPriority(task, plantObj || null);

  const priorityColor =
    effectivePriority === "critical"
      ? theme.error
      : effectivePriority === "high"
        ? theme.warning
        : null;

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
  ): React.JSX.Element => {
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
        onPress={() => onComplete(task)}
      >
        <Animated.View
          style={[
            styles.swipeActionContent,
            { opacity, transform: [{ scale }] },
          ]}
        >
          <Ionicons name="checkmark-circle" size={28} color={theme.textInverse} />
          <Text style={styles.swipeActionText}>Done</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>,
  ): React.JSX.Element => {
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
          onPress={() => onSnooze(task, isOverdue ? 2 : 4)}
        >
          <Animated.View
            style={[
              styles.swipeActionContent,
              { opacity, transform: [{ scale }] },
            ]}
          >
            <Ionicons name="time-outline" size={24} color={theme.textInverse} />
            <Text style={styles.swipeActionText}>
              {isOverdue ? "+2h" : "+4h"}
            </Text>
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.swipeSkipAction}
          onPress={() => onSkipOpen(task)}
        >
          <Animated.View
            style={[
              styles.swipeActionContent,
              { opacity, transform: [{ scale }] },
            ]}
          >
            <Ionicons name="play-skip-forward" size={24} color={theme.textInverse} />
            <Text style={styles.swipeActionText}>Skip</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  };

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
        if (direction === "right") onComplete(task);
      }}
    >
      <View style={[styles.taskCard, isOverdue && styles.taskCardOverdue, isSelected && styles.taskCardSelected]}>
        <View
          style={[
            styles.taskColorBar,
            { backgroundColor: TASK_COLORS[task.task_type] },
          ]}
        />
        <TouchableOpacity
          style={styles.flexOne}
          onPress={() => onDetail(task)}
          activeOpacity={0.7}
        >
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
                <View style={styles.rowCenter}>
                  <Text style={styles.taskTitle}>
                    {TASK_LABELS[task.task_type]}
                  </Text>
                  {priorityColor && (
                    <View
                      style={[
                        styles.taskPriorityBadge,
                        { backgroundColor: priorityColor + "22" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.taskPriorityBadgeText,
                          { color: priorityColor },
                        ]}
                      >
                        {effectivePriority === "critical" ? "⚠ Critical" : "↑ High"}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.taskPlant}>{plantDetails.name}</Text>
                {plantDetails.location && (
                  <Text style={styles.taskLocation}>
                    📍 {plantDetails.location}
                  </Text>
                )}
                {task.preferred_time && (
                  <Text style={styles.taskPreferredTime}>
                    {task.preferred_time === "morning"
                      ? "🌅 Morning"
                      : task.preferred_time === "afternoon"
                        ? "☀️ Afternoon"
                        : "🌙 Evening"}
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
                  onPress={() => onSelectToggle(task.id)}
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
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
}
