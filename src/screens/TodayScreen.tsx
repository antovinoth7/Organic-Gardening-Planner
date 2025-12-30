import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { getTodayTasks, markTaskDone } from '../services/tasks';
import { getPlants } from '../services/plants';
import { TaskTemplate, Plant } from '../types/database.types';
import TaskCard from '../components/TaskCard';
import { Ionicons } from '@expo/vector-icons';

export default function TodayScreen({ navigation }: any) {
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [tasksData, { plants: plantsData }] = await Promise.all([
        getTodayTasks(),
        getPlants(),
      ]);
      setTasks(tasksData);
      setPlants(plantsData);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkDone = async (task: TaskTemplate) => {
    try {
      await markTaskDone(task);
      Alert.alert('Success', 'Task marked as done!');
      loadData(); // Refresh the list
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getPlantName = (plantId: string | null) => {
    if (!plantId) return 'General';
    const plant = plants.find(p => p.id === plantId);
    return plant?.name || 'Unknown';
  };

  const overdueTasks = tasks.filter(t => new Date(t.next_due_at) < new Date());
  const todayTasks = tasks.filter(t => {
    const dueDate = new Date(t.next_due_at);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  });

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadData} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Today's Tasks</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        })}</Text>
      </View>

      {overdueTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overdue ({overdueTasks.length})</Text>
          {overdueTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              plantName={getPlantName(task.plant_id)}
              onMarkDone={() => handleMarkDone(task)}
              isOverdue
            />
          ))}
        </View>
      )}

      {todayTasks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today ({todayTasks.length})</Text>
          {todayTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              plantName={getPlantName(task.plant_id)}
              onMarkDone={() => handleMarkDone(task)}
            />
          ))}
        </View>
      )}

      {tasks.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>All caught up! 🎉</Text>
          <Text style={styles.emptySubtext}>No tasks due today</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    paddingTop: 48,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 48,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
