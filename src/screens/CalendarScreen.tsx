import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { getTaskTemplates, createTaskTemplate } from '../services/tasks';
import { getPlants } from '../services/plants';
import { TaskTemplate, Plant, TaskType } from '../types/database.types';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function CalendarScreen() {
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [taskType, setTaskType] = useState<TaskType>('water');
  const [selectedPlant, setSelectedPlant] = useState<string>('');
  const [frequencyDays, setFrequencyDays] = useState('7');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksData, { plants: plantsData }] = await Promise.all([
        getTaskTemplates(),
        getPlants(),
      ]);
      setTasks(tasksData.filter(t => t.enabled));
      setPlants(plantsData);
    } catch (error) {
      console.error(error);
    }
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toDateString();
    return tasks.filter(task => {
      const dueDate = new Date(task.next_due_at);
      return dueDate.toDateString() === dateStr;
    });
  };

  const getPlantName = (plantId: string | null) => {
    if (!plantId) return 'General';
    const plant = plants.find(p => p.id === plantId);
    return plant?.name || 'Unknown';
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleCreateTask = async () => {
    const frequency = parseInt(frequencyDays);
    if (isNaN(frequency) || frequency < 1) {
      Alert.alert('Error', 'Please enter a valid frequency (1 or more days)');
      return;
    }

    setLoading(true);
    try {
      const nextDueDate = new Date();
      await createTaskTemplate({
        task_type: taskType,
        plant_id: selectedPlant || null,
        frequency_days: frequency,
        next_due_at: nextDueDate.toISOString(),
        enabled: true,
        preferred_time: null,
      });
      Alert.alert('Success', 'Task created successfully!');
      setShowModal(false);
      setTaskType('water');
      setSelectedPlant('');
      setFrequencyDays('7');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{monthName}</Text>
        <TouchableOpacity onPress={nextMonth}>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.weekDays}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text key={day} style={styles.weekDay}>{day}</Text>
        ))}
      </View>

      <ScrollView style={styles.calendar}>
        <View style={styles.daysGrid}>
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCell} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dayTasks = getTasksForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <View key={day} style={[styles.dayCell, isToday && styles.todayCell]}>
                <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>{day}</Text>
                {dayTasks.length > 0 && (
                  <View style={styles.taskDots}>
                    {dayTasks.slice(0, 3).map((task, idx) => (
                      <View key={idx} style={styles.taskDot} />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
          {tasks
            .sort((a, b) => new Date(a.next_due_at).getTime() - new Date(b.next_due_at).getTime())
            .slice(0, 10)
            .map(task => {
              const dueDate = new Date(task.next_due_at);
              const formattedDate = dueDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              return (
                <View key={task.id} style={styles.upcomingTask}>
                  <Text style={styles.upcomingDate}>{formattedDate}</Text>
                  <Text style={styles.upcomingText}>
                    {task.task_type.charAt(0).toUpperCase() + task.task_type.slice(1)} - {getPlantName(task.plant_id)}
                  </Text>
                </View>
              );
            })}
        </View>
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

            <ScrollView style={styles.modalBody}>
              <Text style={styles.label}>Task Type *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={taskType}
                  onValueChange={setTaskType}
                  style={styles.picker}
                >
                  <Picker.Item label="💧 Water" value="water" />
                  <Picker.Item label="🌱 Fertilize" value="fertilise" />
                  <Picker.Item label="✂️ Prune" value="prune" />
                  <Picker.Item label="🪴 Repot" value="repot" />
                  <Picker.Item label="🧴 Spray (Pesticide/Neem)" value="spray" />
                  <Picker.Item label="🍂 Mulch" value="mulch" />
                </Picker>
              </View>

              <Text style={styles.label}>Plant (Optional)</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedPlant}
                  onValueChange={setSelectedPlant}
                  style={styles.picker}
                >
                  <Picker.Item label="General Task" value="" />
                  {plants.map(plant => (
                    <Picker.Item key={plant.id} label={plant.name} value={plant.id} />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Repeat Every (days) *</Text>
              <TextInput
                style={styles.input}
                placeholder="7"
                value={frequencyDays}
                onChangeText={setFrequencyDays}
                keyboardType="numeric"
              />

              <Text style={styles.helperText}>
                Task will repeat every {frequencyDays || '?'} days starting today
              </Text>

              <TouchableOpacity 
                style={[styles.createButton, loading && styles.createButtonDisabled]}
                onPress={handleCreateTask}
                disabled={loading}
              >
                <Text style={styles.createButtonText}>
                  {loading ? 'Creating...' : 'Create Task'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
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
    padding: 24,
    paddingTop: 48,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  weekDays: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendar: {
    flex: 1,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    padding: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCell: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 14,
    color: '#333',
  },
  todayNumber: {
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  taskDots: {
    flexDirection: 'row',
    marginTop: 2,
  },
  taskDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2e7d32',
    marginHorizontal: 1,
  },
  upcomingSection: {
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  upcomingTask: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  upcomingDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    width: 60,
  },
  upcomingText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  helperText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  createButton: {
    backgroundColor: '#2e7d32',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
