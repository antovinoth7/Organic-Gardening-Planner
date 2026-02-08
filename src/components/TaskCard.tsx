import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { TaskTemplate } from "../types/database.types";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";

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
}: TaskCardProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
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

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      overflow: "hidden",
      position: "relative",
    },
    overdueCard: {
      backgroundColor: theme.errorLight,
      borderWidth: 2,
      borderColor: theme.error,
    },
    overdueBorder: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      backgroundColor: theme.error,
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    content: {
      flex: 1,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
    },
    taskType: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
      borderWidth: 1,
    },
    priorityText: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.4,
    },
    plantName: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 2,
    },
    time: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 2,
    },
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonDisabled: {
      opacity: 0.5,
    },
  });
