import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TaskTemplate, TaskType } from "../types/database.types";
import { useTheme } from "../theme";
import { createStyles } from "../styles/calendarStyles";

interface MonthCalendarViewProps {
  currentMonth: Date;
  selectedDate: Date | null;
  taskColors: Record<TaskType, string>;
  getTasksForDate: (date: Date) => TaskTemplate[];
  onSelectDate: (date: Date) => void;
  onNavigateMonth: (newMonth: Date) => void;
}

export default function MonthCalendarView({
  currentMonth,
  selectedDate,
  taskColors: _taskColors,
  getTasksForDate,
  onSelectDate,
  onNavigateMonth,
}: MonthCalendarViewProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const monthStart = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const monthEnd = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  );
  const startDay = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <View style={styles.monthView}>
      <View style={styles.monthHeader}>
        <TouchableOpacity
          onPress={() => {
            const newDate = new Date(currentMonth);
            newDate.setMonth(newDate.getMonth() - 1);
            onNavigateMonth(newDate);
          }}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {currentMonth.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </Text>
        <TouchableOpacity
          onPress={() => {
            const newDate = new Date(currentMonth);
            newDate.setMonth(newDate.getMonth() + 1);
            onNavigateMonth(newDate);
          }}
        >
          <Ionicons name="chevron-forward" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={styles.monthWeekdays}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <Text key={`${day}-${i}`} style={styles.monthWeekday}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.monthGrid}>
        {calendarDays.map((day, index) => {
          if (!day) {
            return <View key={`empty-${index}`} style={styles.monthCell} />;
          }

          const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day,
          );
          const dayTasks = getTasksForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isSelected =
            selectedDate?.toDateString() === date.toDateString();

          return (
            <TouchableOpacity
              key={day}
              style={[
                styles.monthCell,
                isToday && styles.monthCellToday,
                isSelected && styles.monthCellSelected,
              ]}
              onPress={() => onSelectDate(date)}
            >
              <Text
                style={[
                  styles.monthCellNumber,
                  isToday && styles.monthCellNumberToday,
                  isSelected && styles.monthCellNumberSelected,
                ]}
              >
                {day}
              </Text>
              {dayTasks.length > 0 && (
                <View
                  style={[
                    styles.monthCellBar,
                    isSelected
                      ? styles.monthCellBarSelected
                      : styles.monthCellBarDefault,
                    { opacity: Math.min(0.4 + dayTasks.length * 0.15, 1) },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
