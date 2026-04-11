import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { TaskTemplate } from "../types/database.types";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { createStyles } from "../styles/taskCardStyles";

interface TaskCardProps {
  task: TaskTemplate;
  plantName: string;
  onMarkDone: () => void;
  isOverdue?: boolean;
  disabled?: boolean;
  priority?: "critical" | "high" | "medium" | "low";
}

const taskIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  water: "water",
  fertilise: "nutrition",
  prune: "cut",
  repot: "move",
};

const taskColors: Record<string, string> = {
  water: "#2196F3",
  fertilise: "#FF9800",
  prune: "#9C27B0",
  repot: "#4CAF50",
};

export default function TaskCard({
  task,
  plantName,
  onMarkDone,
  isOverdue,
  disabled,
  priority,
}: TaskCardProps): React.JSX.Element {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const color = taskColors[task.task_type] || theme.textSecondary;
  const icon = taskIcons[task.task_type] || "ellipse";
  const priorityPalette = {
    critical: {
      background: theme.errorLight,
      border: theme.error,
      text: theme.error,
    },
    high: {
      background: theme.warningLight,
      border: theme.warning,
      text: theme.warning,
    },
    medium: {
      background: `${theme.info}20`,
      border: theme.info,
      text: theme.info,
    },
    low: {
      background: theme.background,
      border: theme.border,
      text: theme.textSecondary,
    },
  };
  const priorityStyle = priority ? priorityPalette[priority] : null;
  const priorityLabel = priority ? priority.toUpperCase() : null;

  return (
    <View style={[styles.card, isOverdue && styles.overdueCard]}>
      {isOverdue && <View style={styles.overdueBorder} />}
      <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.taskType}>
            {task.task_type.charAt(0).toUpperCase() + task.task_type.slice(1)}
          </Text>
          {priorityStyle && priorityLabel && (
            <View
              style={[
                styles.priorityBadge,
                {
                  backgroundColor: priorityStyle.background,
                  borderColor: priorityStyle.border,
                },
              ]}
            >
              <Text style={[styles.priorityText, { color: priorityStyle.text }]}>
                {priorityLabel}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.plantName}>{plantName}</Text>
        {task.preferred_time && (
          <Text style={styles.time}>Preferred: {task.preferred_time}</Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: color },
          disabled && styles.buttonDisabled,
        ]}
        onPress={onMarkDone}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Ionicons name="checkmark" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}
