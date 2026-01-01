import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TaskTemplate } from '../types/database.types';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

interface TaskCardProps {
  task: TaskTemplate;
  plantName: string;
  onMarkDone: () => void;
  isOverdue?: boolean;
  disabled?: boolean;
}

const taskIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  water: 'water',
  fertilise: 'nutrition',
  prune: 'cut',
  repot: 'move',
};

const taskColors: Record<string, string> = {
  water: '#2196F3',
  fertilise: '#FF9800',
  prune: '#9C27B0',
  repot: '#4CAF50',
};

export default function TaskCard({ task, plantName, onMarkDone, isOverdue, disabled }: TaskCardProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const color = taskColors[task.task_type] || theme.textSecondary;
  const icon = taskIcons[task.task_type] || 'ellipse';

  return (
    <View style={[styles.card, isOverdue && styles.overdueCard]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>

      <View style={styles.content}>
        <Text style={styles.taskType}>
          {task.task_type.charAt(0).toUpperCase() + task.task_type.slice(1)}
        </Text>
        <Text style={styles.plantName}>{plantName}</Text>
        {task.preferred_time && (
          <Text style={styles.time}>Preferred: {task.preferred_time}</Text>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: color }, disabled && styles.buttonDisabled]} 
        onPress={onMarkDone}
        disabled={disabled}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Ionicons name="checkmark" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.error,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  taskType: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
