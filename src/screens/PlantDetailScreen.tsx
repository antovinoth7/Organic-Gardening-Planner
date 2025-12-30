import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { getPlant } from '../services/plants';
import { getTaskTemplates, createTaskTemplate } from '../services/tasks';
import { Plant, TaskTemplate, TaskType } from '../types/database.types';
import { Ionicons } from '@expo/vector-icons';

export default function PlantDetailScreen({ route, navigation }: any) {
  const { plantId } = route.params || {};
  const [plant, setPlant] = useState<Plant | null>(null);
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (plantId) {
      loadData();
    }
  }, [plantId]);

  const loadData = async () => {
    try {
      const [plantData, allTasks] = await Promise.all([
        getPlant(plantId),
        getTaskTemplates(),
      ]);
      setPlant(plantData);
      setTasks(allTasks.filter(t => t.plant_id === plantId));
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (taskType: TaskType) => {
    if (!plantId) return;
    
    try {
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 1); // Default: tomorrow

      await createTaskTemplate({
        plant_id: plantId,
        task_type: taskType,
        frequency_days: taskType === 'water' ? 2 : taskType === 'fertilise' ? 14 : 30,
        preferred_time: null,
        enabled: true,
        next_due_at: nextDue.toISOString(),
      });

      Alert.alert('Success', `${taskType} task added!`);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading || !plant) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!plantId) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Plant not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('PlantForm', { plantId })}
          style={styles.editButton}
        >
          <Ionicons name="pencil" size={24} color="#2e7d32" />
        </TouchableOpacity>
      </View>

      {plant.photo_url ? (
        <Image source={{ uri: plant.photo_url }} style={styles.photo} />
      ) : (
        <View style={[styles.photo, styles.photoPlaceholder]}>
          <Ionicons name="leaf" size={64} color="#2e7d32" />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.name}>{plant.name}</Text>
        {plant.variety && (
          <Text style={styles.variety}>{plant.variety}</Text>
        )}

        <View style={styles.infoSection}>
          {plant.plant_variety && (
            <View style={styles.infoRow}>
              <Ionicons name="leaf" size={20} color="#666" />
              <Text style={styles.infoText}>Type: {plant.plant_variety}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#666" />
            <Text style={styles.infoText}>{plant.location}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons
              name={plant.space_type === 'pot' ? 'cube-outline' : plant.space_type === 'bed' ? 'apps' : 'earth'}
              size={20}
              color="#666"
            />
            <Text style={styles.infoText}>
              {plant.space_type === 'pot'
                ? plant.pot_size || 'Pot'
                : plant.space_type === 'bed'
                ? plant.bed_name || 'Bed'
                : 'Ground'}
            </Text>
          </View>
          {plant.planting_date && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color="#666" />
              <Text style={styles.infoText}>
                Planted {plant.planting_date} ({Math.floor((new Date().getTime() - new Date(plant.planting_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years old)
              </Text>
            </View>
          )}
          {plant.harvest_season && (
            <View style={styles.infoRow}>
              <Ionicons name="sunny" size={20} color="#666" />
              <Text style={styles.infoText}>Harvest: {plant.harvest_season}</Text>
            </View>
          )}
          {(plant.harvest_start_date || plant.harvest_end_date) && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.infoText}>
                {plant.harvest_start_date} {plant.harvest_end_date && `- ${plant.harvest_end_date}`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.careSection}>
          <Text style={styles.sectionTitle}>🌱 Care Information</Text>
          {plant.sunlight && (
            <View style={styles.infoRow}>
              <Ionicons name="sunny" size={20} color="#FFA500" />
              <Text style={styles.infoText}>
                {plant.sunlight === 'full_sun' ? '☀️ Full Sun' : plant.sunlight === 'partial_sun' ? '⛅ Partial Sun' : '🌤️ Shade'}
              </Text>
            </View>
          )}
          {plant.soil_type && (
            <View style={styles.infoRow}>
              <Ionicons name="layers" size={20} color="#8B4513" />
              <Text style={styles.infoText}>
                Soil: {plant.soil_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
          )}
          {plant.water_requirement && (
            <View style={styles.infoRow}>
              <Ionicons name="water" size={20} color="#2196F3" />
              <Text style={styles.infoText}>
                Water Need: {plant.water_requirement.charAt(0).toUpperCase() + plant.water_requirement.slice(1)}
              </Text>
            </View>
          )}
          {plant.watering_frequency_days && (
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color="#2196F3" />
              <Text style={styles.infoText}>Water every {plant.watering_frequency_days} days</Text>
            </View>
          )}
          {plant.fertilising_frequency_days && (
            <View style={styles.infoRow}>
              <Ionicons name="nutrition" size={20} color="#FF9800" />
              <Text style={styles.infoText}>Fertilise every {plant.fertilising_frequency_days} days</Text>
            </View>
          )}
          {plant.preferred_fertiliser && (
            <View style={styles.infoRow}>
              <Ionicons name="leaf" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>
                Fertiliser: {plant.preferred_fertiliser.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
            </View>
          )}
          {plant.mulching_used && (
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.infoText}>Mulching applied</Text>
            </View>
          )}
          {plant.health_status && (
            <View style={styles.infoRow}>
              <Ionicons 
                name={plant.health_status === 'healthy' ? 'checkmark-circle' : plant.health_status === 'sick' ? 'close-circle' : 'alert-circle'} 
                size={20} 
                color={plant.health_status === 'healthy' ? '#4CAF50' : plant.health_status === 'sick' ? '#f44336' : '#FF9800'} 
              />
              <Text style={[styles.infoText, { 
                color: plant.health_status === 'healthy' ? '#4CAF50' : plant.health_status === 'sick' ? '#f44336' : '#FF9800',
                fontWeight: '600' 
              }]}>
                {plant.health_status.charAt(0).toUpperCase() + plant.health_status.slice(1)}
              </Text>
            </View>
          )}
        </View>

        {plant.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{plant.notes}</Text>
          </View>
        )}

        <View style={styles.tasksSection}>
          <Text style={styles.sectionTitle}>Tasks ({tasks.length})</Text>
          {tasks.map(task => (
            <View key={task.id} style={styles.taskItem}>
              <View style={styles.taskLeft}>
                <Text style={styles.taskType}>
                  {task.task_type.charAt(0).toUpperCase() + task.task_type.slice(1)}
                </Text>
                <Text style={styles.taskFrequency}>Every {task.frequency_days} days</Text>
              </View>
              <Text style={[styles.taskStatus, !task.enabled && styles.taskDisabled]}>
                {task.enabled ? 'Active' : 'Disabled'}
              </Text>
            </View>
          ))}

          <View style={styles.addTaskSection}>
            <Text style={styles.addTaskTitle}>Quick Add Task</Text>
            <View style={styles.taskButtons}>
              <TouchableOpacity
                style={[styles.taskButton, { backgroundColor: '#2196F320' }]}
                onPress={() => handleAddTask('water')}
              >
                <Ionicons name="water" size={24} color="#2196F3" />
                <Text style={[styles.taskButtonText, { color: '#2196F3' }]}>Water</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.taskButton, { backgroundColor: '#FF980320' }]}
                onPress={() => handleAddTask('fertilise')}
              >
                <Ionicons name="nutrition" size={24} color="#FF9800" />
                <Text style={[styles.taskButtonText, { color: '#FF9800' }]}>Fertilise</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.taskButton, { backgroundColor: '#9C27B020' }]}
                onPress={() => handleAddTask('prune')}
              >
                <Ionicons name="cut" size={24} color="#9C27B0" />
                <Text style={[styles.taskButtonText, { color: '#9C27B0' }]}>Prune</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.taskButton, { backgroundColor: '#4CAF5020' }]}
                onPress={() => handleAddTask('repot')}
              >
                <Ionicons name="move" size={24} color="#4CAF50" />
                <Text style={[styles.taskButtonText, { color: '#4CAF50' }]}>Repot</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photo: {
    width: '100%',
    height: 300,
  },
  photoPlaceholder: {
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  variety: {
    fontSize: 18,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  infoSection: {
    marginBottom: 24,
  },
  careSection: {
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  notesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  notesText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  tasksSection: {
    marginBottom: 24,
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  taskLeft: {
    flex: 1,
  },
  taskType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  taskFrequency: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  taskStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  taskDisabled: {
    color: '#999',
  },
  addTaskSection: {
    marginTop: 16,
  },
  addTaskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  taskButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  taskButton: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  taskButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
});
