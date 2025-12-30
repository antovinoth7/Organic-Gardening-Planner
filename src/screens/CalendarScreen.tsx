import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Animated, Platform } from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getTaskTemplates, createTaskTemplate, markTaskDone, generateRecurringTasksFromPlants } from '../services/tasks';
import { getPlants } from '../services/plants';
import { getJournalEntries } from '../services/journal';
import { TaskTemplate, Plant, TaskType, JournalEntry } from '../types/database.types';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const TASK_COLORS: Record<TaskType, string> = {
  water: '#2196F3',
  fertilise: '#FF9800',
  prune: '#9C27B0',
  repot: '#4CAF50',
  spray: '#F44336',
  mulch: '#795548',
};

export default function CalendarScreen() {
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [harvestEntries, setHarvestEntries] = useState<JournalEntry[]>([]);
  const [selectedView, setSelectedView] = useState<'week' | 'month'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskTemplate | null>(null);
  const [taskNotes, setTaskNotes] = useState('');
  const [productUsed, setProductUsed] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('water');
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [frequencyDays, setFrequencyDays] = useState('7');
  const [startDate, setStartDate] = useState(new Date());
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening' | null>(null);
  const [taskDescription, setTaskDescription] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState<'none' | 'location' | 'type'>('none');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, { plants: plantsData }, journalData] = await Promise.all([
        getTaskTemplates(),
        getPlants(),
        getJournalEntries(),
      ]);
      setTasks(tasksData.filter(t => t.enabled));
      setPlants(plantsData);
      setHarvestEntries(journalData.filter(e => e.entry_type === 'harvest'));
    } catch (error) {
      console.error(error);
    }
  };

  const handleTaskComplete = async (task: TaskTemplate) => {
    setSelectedTask(task);
    setTaskNotes('');
    setProductUsed('');
    setShowNotesModal(true);
  };

  const confirmTaskComplete = async () => {
    if (!selectedTask) return;
    
    try {
      await markTaskDone(selectedTask, taskNotes || undefined, productUsed || undefined);
      Alert.alert('✓', 'Task completed!');
      setShowNotesModal(false);
      setSelectedTask(null);
      setTaskNotes('');
      setProductUsed('');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleGenerateRecurringTasks = async () => {
    Alert.alert(
      'Generate Recurring Tasks',
      'This will create automatic tasks for plants with care schedules. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              setLoading(true);
              await generateRecurringTasksFromPlants(plants);
              Alert.alert('Success', 'Recurring tasks generated successfully!');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getMonthTasks = () => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    return tasks.filter(task => {
      const dueDate = new Date(task.next_due_at);
      return dueDate >= monthStart && dueDate <= monthEnd;
    });
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const dueDate = new Date(task.next_due_at);
      return dueDate.toDateString() === date.toDateString();
    });
  };

  const handleCreateTask = async () => {
    const frequency = parseInt(frequencyDays);
    if (isNaN(frequency) || frequency < 1) {
      Alert.alert('Error', 'Please enter a valid frequency (1 or more days)');
      return;
    }

    setLoading(true);
    try {
      // Calculate the actual due date based on preferred time
      const dueDate = new Date(startDate);
      
      // Apply preferred time if selected
      if (preferredTime === 'morning') {
        dueDate.setHours(8, 0, 0, 0); // 8:00 AM
      } else if (preferredTime === 'afternoon') {
        dueDate.setHours(14, 0, 0, 0); // 2:00 PM
      } else if (preferredTime === 'evening') {
        dueDate.setHours(18, 0, 0, 0); // 6:00 PM
      }
      
      // Ensure the due date is not in the past
      const now = new Date();
      if (dueDate < now) {
        // If the calculated time is in the past, set it to tomorrow at that time
        dueDate.setDate(dueDate.getDate() + 1);
      }
      
      await createTaskTemplate({
        task_type: taskType,
        plant_id: selectedPlant || null,
        frequency_days: frequency,
        next_due_at: dueDate.toISOString(),
        enabled: true,
        preferred_time: preferredTime,
      });
      Alert.alert('Success', 'Task created successfully!');
      resetCreateTaskForm();
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetCreateTaskForm = () => {
    setShowModal(false);
    setTaskType('water');
    setSelectedPlant('');
    setFrequencyDays('7');
    setStartDate(new Date());
    setPreferredTime(null);
    setTaskDescription('');
  };

  const applyFrequencyPreset = (days: number, label: string) => {
    try {
      setFrequencyDays(days.toString());
    } catch (error) {
      console.error('Error setting frequency:', error);
    }
  };

  // Get tasks for today and upcoming week
  const getTodayTasks = () => {
    if (!tasks || tasks.length === 0) return [];
    const today = new Date();
    return tasks.filter(task => {
      if (!task || !task.next_due_at) return false;
      const dueDate = new Date(task.next_due_at);
      return dueDate.toDateString() === today.toDateString();
    });
  };

  const getWeekTasks = () => {
    if (!tasks || tasks.length === 0) return [];
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return tasks.filter(task => {
      if (!task || !task.next_due_at) return false;
      const dueDate = new Date(task.next_due_at);
      return dueDate >= currentWeekStart && dueDate < weekEnd;
    });
  };

  const getHarvestsReady = () => {
    if (!plants || plants.length === 0 || !harvestEntries) return [];
    const fruitTrees = plants.filter(p => 
      (p.plant_type === 'fruit_tree' || p.plant_type === 'coconut_tree')
    );
    
    return fruitTrees.map(plant => {
      const plantHarvests = harvestEntries.filter(e => e.plant_id === plant.id);
      if (plantHarvests.length === 0) return null;
      
      const lastHarvest = plantHarvests[0];
      const lastDate = new Date(lastHarvest.created_at);
      const nextDate = new Date(lastDate);
      
      // Coconut tree: 2 months cycle
      if (plant.plant_type === 'coconut_tree') {
        nextDate.setMonth(nextDate.getMonth() + 2);
      } else {
        // Other fruit trees: check harvest season or default 6 months
        nextDate.setMonth(nextDate.getMonth() + 6);
      }
      
      const daysUntil = Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        plant,
        nextDate,
        daysUntil,
        isReady: daysUntil <= 7 && daysUntil >= 0,
      };
    }).filter(Boolean);
  };

  const getPlantDetails = (plantId: string | null) => {
    if (!plantId) return { name: 'General', location: '', type: '' };
    if (!plants || plants.length === 0) return { name: 'Unknown', location: '', type: '' };
    const plant = plants.find(p => p.id === plantId);
    return {
      name: plant?.name || 'Unknown',
      location: plant?.location || '',
      type: plant?.plant_type || '',
    };
  };

  const groupTasks = (taskList: TaskTemplate[]) => {
    if (groupBy === 'none') return { '': taskList };
    
    if (groupBy === 'location') {
      return taskList.reduce((acc, task) => {
        const location = getPlantDetails(task.plant_id).location || 'General';
        if (!acc[location]) acc[location] = [];
        acc[location].push(task);
        return acc;
      }, {} as Record<string, TaskTemplate[]>);
    }
    
    if (groupBy === 'type') {
      return taskList.reduce((acc, task) => {
        const type = task.task_type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(task);
        return acc;
      }, {} as Record<string, TaskTemplate[]>);
    }
    
    return { '': taskList };
  };

  const renderSwipeableTask = (task: TaskTemplate) => {
    if (!task || !task.next_due_at) return null;
    const plantDetails = getPlantDetails(task.plant_id);
    const dueDate = new Date(task.next_due_at);
    const isOverdue = dueDate < new Date();
    
    const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
      const trans = dragX.interpolate({
        inputRange: [-100, 0],
        outputRange: [0, 100],
      });
      
      return (
        <TouchableOpacity
          style={styles.swipeAction}
          onPress={() => handleTaskComplete(task)}
        >
          <Animated.View style={[styles.swipeActionContent, { transform: [{ translateX: trans }] }]}>
            <Ionicons name="checkmark-circle" size={28} color="#fff" />
            <Text style={styles.swipeActionText}>Done</Text>
          </Animated.View>
        </TouchableOpacity>
      );
    };

    return (
      <Swipeable
        key={task.id}
        renderRightActions={renderRightActions}
        overshootRight={false}
      >
        <View style={[styles.taskCard, isOverdue && styles.taskCardOverdue]}>
          <View style={[styles.taskColorBar, { backgroundColor: TASK_COLORS[task.task_type] }]} />
          <View style={styles.taskContent}>
            <View style={styles.taskHeader}>
              <View style={styles.taskIconContainer}>
                <Ionicons 
                  name={
                    task.task_type === 'water' ? 'water' :
                    task.task_type === 'fertilise' ? 'nutrition' :
                    task.task_type === 'prune' ? 'cut' :
                    task.task_type === 'repot' ? 'move' :
                    task.task_type === 'spray' ? 'fitness' :
                    'leaf'
                  }
                  size={24}
                  color={TASK_COLORS[task.task_type]}
                />
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>
                  {task.task_type.charAt(0).toUpperCase() + task.task_type.slice(1)}
                </Text>
                <Text style={styles.taskPlant}>{plantDetails.name}</Text>
                {plantDetails.location && (
                  <Text style={styles.taskLocation}>📍 {plantDetails.location}</Text>
                )}
              </View>
              <View style={styles.taskRight}>
                <Text style={[styles.taskTime, isOverdue && styles.taskTimeOverdue]}>
                  {isOverdue ? 'Overdue' : dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Swipeable>
    );
  };

  const renderWeekView = () => {
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      return date;
    });

    return (
      <View style={styles.weekView}>
        <View style={styles.weekHeader}>
          <TouchableOpacity onPress={() => {
            const newDate = new Date(currentWeekStart);
            newDate.setDate(newDate.getDate() - 7);
            setCurrentWeekStart(newDate);
          }}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.weekTitle}>
            {currentWeekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => {
            const newDate = new Date(currentWeekStart);
            newDate.setDate(newDate.getDate() + 7);
            setCurrentWeekStart(newDate);
          }}>
            <Ionicons name="chevron-forward" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekDaysScroll}>
          {weekDays.map((date, index) => {
            const dayTasks = tasks.filter(task => {
              const dueDate = new Date(task.next_due_at);
              return dueDate.toDateString() === date.toDateString();
            });
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate?.toDateString() === date.toDateString();

            return (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.weekDay, 
                  isToday && styles.weekDayToday,
                  isSelected && styles.weekDaySelected
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.weekDayName, 
                  isToday && styles.weekDayNameToday,
                  isSelected && styles.weekDayNameSelected
                ]}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={[
                  styles.weekDayNumber, 
                  isToday && styles.weekDayNumberToday,
                  isSelected && styles.weekDayNumberSelected
                ]}>
                  {date.getDate()}
                </Text>
                <View style={styles.weekDayDots}>
                  {dayTasks.slice(0, 4).map((task, idx) => (
                    <View
                      key={idx}
                      style={[styles.weekDayDot, { backgroundColor: TASK_COLORS[task.task_type] }]}
                    />
                  ))}
                  {dayTasks.length > 4 && (
                    <Text style={styles.weekDayMore}>+{dayTasks.length - 4}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderMonthView = () => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDay = monthStart.getDay();
    const daysInMonth = monthEnd.getDate();
    
    const calendarDays = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      calendarDays.push(null);
    }
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }

    return (
      <View style={styles.monthView}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={() => {
            const newDate = new Date(currentMonth);
            newDate.setMonth(newDate.getMonth() - 1);
            setCurrentMonth(newDate);
          }}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => {
            const newDate = new Date(currentMonth);
            newDate.setMonth(newDate.getMonth() + 1);
            setCurrentMonth(newDate);
          }}>
            <Ionicons name="chevron-forward" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Weekday headers */}
        <View style={styles.monthWeekdays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Text key={day} style={styles.monthWeekday}>{day}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.monthGrid}>
          {calendarDays.map((day, index) => {
            if (!day) {
              return <View key={`empty-${index}`} style={styles.monthCell} />;
            }
            
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dayTasks = getTasksForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();
            const isSelected = selectedDate?.toDateString() === date.toDateString();

            return (
              <TouchableOpacity 
                key={day} 
                style={[
                  styles.monthCell, 
                  isToday && styles.monthCellToday,
                  isSelected && styles.monthCellSelected
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.monthCellNumber, 
                  isToday && styles.monthCellNumberToday,
                  isSelected && styles.monthCellNumberSelected
                ]}>
                  {day}
                </Text>
                <View style={styles.monthCellDots}>
                  {dayTasks.slice(0, 3).map((task, idx) => (
                    <View
                      key={idx}
                      style={[styles.monthCellDot, { backgroundColor: TASK_COLORS[task.task_type] }]}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <Text style={styles.monthCellMore}>+{dayTasks.length - 3}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const harvestsReady = getHarvestsReady();
  const todayTasks = getTodayTasks();
  const weekTasks = selectedView === 'week' ? getWeekTasks() : getMonthTasks();
  const groupedTasks = groupTasks(weekTasks);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Care Plan</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.viewToggle}
              onPress={() => setSelectedView(selectedView === 'week' ? 'month' : 'week')}
            >
              <Ionicons 
                name={selectedView === 'week' ? 'calendar' : 'list'} 
                size={20} 
                color="#2e7d32" 
              />
              <Text style={styles.viewToggleText}>
                {selectedView === 'week' ? 'Month' : 'Week'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.groupButton}
              onPress={() => {
                const nextGroup = groupBy === 'none' ? 'location' : groupBy === 'location' ? 'type' : 'none';
                setGroupBy(nextGroup);
              }}
            >
              <Ionicons name="funnel" size={20} color="#2e7d32" />
              <Text style={styles.groupButtonText}>
                {groupBy === 'none' ? 'Group' : groupBy === 'location' ? 'Location' : 'Type'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.recurringButton}
              onPress={handleGenerateRecurringTasks}
            >
              <Ionicons name="repeat" size={20} color="#2e7d32" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Week or Month View */}
        {selectedView === 'week' ? renderWeekView() : renderMonthView()}

        <ScrollView style={styles.content}>
          {/* Selected Date Tasks */}
          {selectedDate && (
            <View style={styles.section}>
              <View style={styles.selectedDateHeader}>
                <Text style={styles.sectionTitle}>
                  📅 {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={() => setSelectedDate(null)}>
                  <Ionicons name="close-circle" size={24} color="#999" />
                </TouchableOpacity>
              </View>
              {getTasksForDate(selectedDate).length > 0 ? (
                <>
                  {getTasksForDate(selectedDate).map(renderSwipeableTask)}
                  <Text style={styles.swipeHint}>← Swipe left to complete</Text>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No tasks scheduled for this day</Text>
                  <TouchableOpacity 
                    style={styles.addTaskButton}
                    onPress={() => {
                      setStartDate(selectedDate);
                      setShowModal(true);
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#2e7d32" />
                    <Text style={styles.addTaskButtonText}>Add Task</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Harvest Ready Section */}
          {harvestsReady.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🧺 Harvest Ready</Text>
              {harvestsReady.map((item: any) => item && (
                <View key={item.plant.id} style={[styles.harvestCard, item.isReady && styles.harvestCardReady]}>
                  <View style={styles.harvestIcon}>
                    <Text style={styles.harvestEmoji}>
                      {item.plant.plant_type === 'coconut_tree' ? '🥥' : '🍎'}
                    </Text>
                  </View>
                  <View style={styles.harvestInfo}>
                    <Text style={styles.harvestPlant}>{item.plant.name}</Text>
                    <Text style={styles.harvestDate}>
                      {item.isReady ? '✅ Ready to harvest!' : `Ready in ${item.daysUntil} days`}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Today's Tasks */}
          {todayTasks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today ({todayTasks.length})</Text>
              {todayTasks.map(renderSwipeableTask)}
              <Text style={styles.swipeHint}>← Swipe left to complete</Text>
            </View>
          )}

          {/* Grouped Tasks */}
          {Object.keys(groupedTasks).map(groupName => (
            <View key={groupName} style={styles.section}>
              {groupName && (
                <Text style={styles.sectionTitle}>
                  {groupBy === 'location' ? `📍 ${groupName}` : groupBy === 'type' ? `${groupName.charAt(0).toUpperCase() + groupName.slice(1)}` : 'This Week'}
                </Text>
              )}
              {!groupName && <Text style={styles.sectionTitle}>This Week ({weekTasks.length})</Text>}
              {groupedTasks[groupName].map(renderSwipeableTask)}
            </View>
          ))}
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setShowModal(true)}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Create Task Modal */}
        <Modal
          visible={showModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Task</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalBody}>
                  <Text style={styles.label}>Task Type *</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={taskType}
                    onValueChange={setTaskType}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    <Picker.Item label="💧 Water" value="water" color="#333" />
                    <Picker.Item label="🌱 Fertilize" value="fertilise" color="#333" />
                    <Picker.Item label="✂️ Prune" value="prune" color="#333" />
                    <Picker.Item label="🪴 Repot" value="repot" color="#333" />
                    <Picker.Item label="🧴 Spray (Pesticide/Neem)" value="spray" color="#333" />
                    <Picker.Item label="🍂 Mulch" value="mulch" color="#333" />
                  </Picker>
                </View>

                <Text style={styles.label}>Plant (Optional)</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={selectedPlant}
                    onValueChange={setSelectedPlant}
                    style={styles.picker}
                    itemStyle={styles.pickerItem}
                  >
                    <Picker.Item label="General Task" value="" color="#333" />
                    {plants.map(plant => (
                      <Picker.Item key={plant.id} label={plant.name} value={plant.id} color="#333" />
                    ))}
                  </Picker>
                </View>

                <Text style={styles.label}>Start Date</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.dateButtonText}>
                    {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={startDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (selectedDate) setStartDate(selectedDate);
                    }}
                  />
                )}

                <Text style={styles.label}>Preferred Time (Optional)</Text>
                <View style={styles.timeButtons}>
                  <TouchableOpacity 
                    style={[styles.timeButton, preferredTime === 'morning' && styles.timeButtonActive]}
                    onPress={() => setPreferredTime(preferredTime === 'morning' ? null : 'morning')}
                  >
                    <Text style={[styles.timeButtonText, preferredTime === 'morning' && styles.timeButtonTextActive]}>
                      🌅 Morning
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.timeButton, preferredTime === 'afternoon' && styles.timeButtonActive]}
                    onPress={() => setPreferredTime(preferredTime === 'afternoon' ? null : 'afternoon')}
                  >
                    <Text style={[styles.timeButtonText, preferredTime === 'afternoon' && styles.timeButtonTextActive]}>
                      ☀️ Afternoon
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.timeButton, preferredTime === 'evening' && styles.timeButtonActive]}
                    onPress={() => setPreferredTime(preferredTime === 'evening' ? null : 'evening')}
                  >
                    <Text style={[styles.timeButtonText, preferredTime === 'evening' && styles.timeButtonTextActive]}>
                      🌙 Evening
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>Repeat Every (days) *</Text>
                
                {/* Quick Presets */}
                <View style={styles.presets}>
                  <TouchableOpacity 
                    style={[
                      styles.presetButton,
                      frequencyDays === '1' && styles.presetButtonActive
                    ]}
                    onPress={() => applyFrequencyPreset(1, 'Daily')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.presetText,
                      frequencyDays === '1' && styles.presetTextActive
                    ]}>Daily</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.presetButton,
                      frequencyDays === '7' && styles.presetButtonActive
                    ]}
                    onPress={() => applyFrequencyPreset(7, 'Weekly')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.presetText,
                      frequencyDays === '7' && styles.presetTextActive
                    ]}>Weekly</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.presetButton,
                      frequencyDays === '14' && styles.presetButtonActive
                    ]}
                    onPress={() => applyFrequencyPreset(14, 'Bi-weekly')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.presetText,
                      frequencyDays === '14' && styles.presetTextActive
                    ]}>Bi-weekly</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.presetButton,
                      frequencyDays === '30' && styles.presetButtonActive
                    ]}
                    onPress={() => applyFrequencyPreset(30, 'Monthly')}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.presetText,
                      frequencyDays === '30' && styles.presetTextActive
                    ]}>Monthly</Text>
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="7"
                  value={frequencyDays}
                  onChangeText={setFrequencyDays}
                  keyboardType="numeric"
                />

                {/* Preview */}
                {frequencyDays && parseInt(frequencyDays) > 0 && (
                  <View style={styles.preview}>
                    <Text style={styles.previewTitle}>📅 Schedule Preview</Text>
                    <Text style={styles.previewText}>
                      • First task: {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {preferredTime && ` (${preferredTime})`}
                    </Text>
                    <Text style={styles.previewText}>
                      • Next task: {new Date(startDate.getTime() + parseInt(frequencyDays) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={styles.previewText}>
                      • Repeats every {frequencyDays} {parseInt(frequencyDays) === 1 ? 'day' : 'days'}
                    </Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={[styles.createButton, loading && styles.createButtonDisabled]}
                  onPress={handleCreateTask}
                  disabled={loading}
                >
                  <Text style={styles.createButtonText}>
                    {loading ? 'Creating...' : 'Create Task'}
                  </Text>
                </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Task Notes Modal */}
        <Modal
          visible={showNotesModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowNotesModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Complete Task</Text>
                <TouchableOpacity onPress={() => setShowNotesModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.modalBody}>
                {selectedTask && (
                  <View style={styles.selectedTaskInfo}>
                    <Text style={styles.selectedTaskTitle}>
                      {selectedTask.task_type.charAt(0).toUpperCase() + selectedTask.task_type.slice(1)}
                    </Text>
                    <Text style={styles.selectedTaskPlant}>
                      {getPlantDetails(selectedTask.plant_id).name}
                    </Text>
                  </View>
                )}

                <Text style={styles.label}>Notes (Optional)</Text>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  placeholder="e.g., Soil was dry, found some pests..."
                  value={taskNotes}
                  onChangeText={setTaskNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <Text style={styles.label}>Product Used (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Neem oil, Compost..."
                  value={productUsed}
                  onChangeText={setProductUsed}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.skipButton]}
                    onPress={confirmTaskComplete}
                  >
                    <Text style={styles.skipButtonText}>Complete</Text>
                  </TouchableOpacity>
                </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
  },
  viewToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2e7d32',
  },
  groupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 16,
  },
  groupButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2e7d32',
  },
  recurringButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekView: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  weekDaysScroll: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  weekDay: {
    width: 70,
    alignItems: 'center',
    marginHorizontal: 4,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  weekDayToday: {
    backgroundColor: '#2e7d32',
  },
  weekDaySelected: {
    backgroundColor: '#1976D2',
  },
  weekDayName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  weekDayNameToday: {
    color: '#fff',
  },
  weekDayNameSelected: {
    color: '#fff',
  },
  weekDayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  weekDayNumberToday: {
    color: '#fff',
  },
  weekDayNumberSelected: {
    color: '#fff',
  },
  weekDayDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 3,
    minHeight: 16,
  },
  weekDayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  weekDayMore: {
    fontSize: 10,
    color: '#999',
  },
  monthView: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  monthWeekdays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  monthWeekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#eee',
  },
  monthCellToday: {
    backgroundColor: '#e8f5e9',
  },
  monthCellSelected: {
    backgroundColor: '#bbdefb',
    borderWidth: 2,
    borderColor: '#1976D2',
  },
  monthCellNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  monthCellNumberToday: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  monthCellNumberSelected: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  monthCellDots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 2,
  },
  monthCellDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  monthCellMore: {
    fontSize: 8,
    color: '#999',
  },
  content: {
    flex: 1,
    paddingBottom: 120,
  },
  section: {
    padding: 16,
    paddingBottom: 16,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#e8f5e9',
    borderRadius: 20,
  },
  addTaskButtonText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskCardOverdue: {
    borderWidth: 2,
    borderColor: '#f44336',
  },
  taskColorBar: {
    width: 6,
  },
  taskContent: {
    flex: 1,
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  taskPlant: {
    fontSize: 14,
    color: '#666',
  },
  taskLocation: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  taskRight: {
    alignItems: 'flex-end',
  },
  taskTime: {
    fontSize: 12,
    color: '#666',
  },
  taskTimeOverdue: {
    color: '#f44336',
    fontWeight: '600',
  },
  swipeAction: {
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 100,
    borderRadius: 12,
    marginBottom: 12,
  },
  swipeActionContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  swipeActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  swipeHint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  harvestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  harvestCardReady: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9',
  },
  harvestIcon: {
    marginRight: 12,
  },
  harvestEmoji: {
    fontSize: 32,
  },
  harvestInfo: {
    flex: 1,
  },
  harvestPlant: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  harvestDate: {
    fontSize: 14,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 24,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    minHeight: 56,
  },
  picker: {
    height: 56,
    color: '#333',
  },
  pickerItem: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  timeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  timeButtonActive: {
    borderColor: '#2e7d32',
    backgroundColor: '#e8f5e9',
  },
  timeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  timeButtonTextActive: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  presets: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  presetButtonActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  presetText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  presetTextActive: {
    color: '#2e7d32',
  },
  preview: {
    backgroundColor: '#f0f4ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  previewText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    lineHeight: 20,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedTaskInfo: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectedTaskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  selectedTaskPlant: {
    fontSize: 14,
    color: '#666',
  },
  notesInput: {
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButton: {
    backgroundColor: '#2e7d32',
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
