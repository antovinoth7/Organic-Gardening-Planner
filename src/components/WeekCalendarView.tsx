import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TaskTemplate, TaskType } from "../types/database.types";
import { useTheme } from "../theme";
import { createStyles } from "../styles/calendarStyles";

interface WeekCalendarViewProps {
  currentWeekStart: Date;
  selectedDate: Date | null;
  taskColors: Record<TaskType, string>;
  getTasksForDate: (date: Date) => TaskTemplate[];
  onSelectDate: (date: Date) => void;
  onNavigateWeek: (newStart: Date) => void;
}

export default function WeekCalendarView({
  currentWeekStart,
  selectedDate,
  taskColors,
  getTasksForDate,
  onSelectDate,
  onNavigateWeek,
}: WeekCalendarViewProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  return (
    <View style={styles.weekView}>
      <View style={styles.weekDaysRow}>
        <TouchableOpacity
          style={styles.weekNavBtn}
          onPress={() => {
            const newDate = new Date(currentWeekStart);
            newDate.setDate(newDate.getDate() - 7);
            onNavigateWeek(newDate);
          }}
        >
          <Ionicons name="chevron-back" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
        {weekDays.map((date, index) => {
          const dayTasks = getTasksForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isSelected =
            selectedDate?.toDateString() === date.toDateString();

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.weekDay,
                isToday && styles.weekDayToday,
                isSelected && styles.weekDaySelected,
              ]}
              onPress={() => onSelectDate(date)}
            >
              <Text
                style={[
                  styles.weekDayName,
                  isToday && styles.weekDayNameToday,
                  isSelected && styles.weekDayNameSelected,
                ]}
              >
                {date.toLocaleDateString("en-US", { weekday: "narrow" })}
              </Text>
              <Text
                style={[
                  styles.weekDayNumber,
                  isToday && styles.weekDayNumberToday,
                  isSelected && styles.weekDayNumberSelected,
                ]}
              >
                {date.getDate()}
              </Text>
              {dayTasks.length > 0 && (
                <View style={styles.weekDayDots}>
                  {dayTasks.slice(0, 3).map((task, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.weekDayDot,
                        { backgroundColor: taskColors[task.task_type] },
                      ]}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <Text style={styles.weekDayMore}>
                      +{dayTasks.length - 3}
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={styles.weekNavBtn}
          onPress={() => {
            const newDate = new Date(currentWeekStart);
            newDate.setDate(newDate.getDate() + 7);
            onNavigateWeek(newDate);
          }}
        >
          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
