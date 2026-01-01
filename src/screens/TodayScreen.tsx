import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Alert, Modal, TextInput } from 'react-native';
import { getTodayTasks, markTaskDone, updateTaskTemplate, getTaskLogs } from '../services/tasks';
import { getPlants } from '../services/plants';
import { TaskTemplate, Plant, TaskLog } from '../types/database.types';
import TaskCard from '../components/TaskCard';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme';

export default function TodayScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [tasks, setTasks] = useState<TaskTemplate[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskTemplate | null>(null);
  const [skipReason, setSkipReason] = useState('');
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [tasksData, { plants: plantsData }, logs] = await Promise.all([
        getTodayTasks(),
        getPlants(),
        getTaskLogs(),
      ]);
      
      // Filter logs for today only
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayLogs = logs.filter(log => {
        const logDate = new Date(log.done_at);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === today.getTime();
      });
      
      setTasks(tasksData);
      setPlants(plantsData);
      setTaskLogs(todayLogs);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const handleMarkDone = async (task: TaskTemplate) => {
    if (completingTaskId) return; // Prevent multiple clicks
    
    setCompletingTaskId(task.id);
    try {
      await markTaskDone(task);
      Alert.alert('Success', 'Task marked as done! 🎉');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleSkipTask = async () => {
    if (!selectedTask) return;
    
    try {
      // Postpone to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      await updateTaskTemplate(selectedTask.id, {
        next_due_at: tomorrow.toISOString()
      });
      
      Alert.alert('Task Skipped', `Task postponed to tomorrow${skipReason ? `: ${skipReason}` : ''}`);
      setShowSkipModal(false);
      setSkipReason('');
      setSelectedTask(null);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSnooze = async (task: TaskTemplate, hours: number) => {
    try {
      const snoozeTime = new Date();
      snoozeTime.setHours(snoozeTime.getHours() + hours);
      
      await updateTaskTemplate(task.id, {
        next_due_at: snoozeTime.toISOString()
      });
      
      Alert.alert('Task Snoozed', `Task snoozed for ${hours} hour${hours > 1 ? 's' : ''}`);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const getPlantName = (plantId: string | null) => {
    if (!plantId) return 'General';
    if (!plants || plants.length === 0) return 'Unknown';
    const plant = plants.find(p => p.id === plantId);
    return plant?.name || 'Unknown';
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalTasks = tasks?.length || 0;
    const completed = taskLogs?.length || 0; // Use actual task logs from today
    const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
    
    const unhealthyPlants = (plants || []).filter(p => 
      p.health_status === 'sick' || p.health_status === 'stressed'
    );
    
    const needsAttention = (plants || []).filter(p => {
      // Skip if no watering frequency is set
      if (!p.watering_frequency_days) return false;
      
      // If never watered but has a planting date, check against that
      if (!p.last_watered_date && p.planting_date) {
        const daysSincePlanting = Math.floor(
          (new Date().getTime() - new Date(p.planting_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSincePlanting >= p.watering_frequency_days;
      }
      
      // If has last watered date, check against that
      if (p.last_watered_date) {
        const daysSinceWater = Math.floor(
          (new Date().getTime() - new Date(p.last_watered_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceWater >= p.watering_frequency_days;
      }
      
      return false;
    });

    return {
      totalTasks,
      completed,
      completionRate,
      unhealthyCount: unhealthyPlants.length,
      unhealthyPlants,
      needsAttentionCount: needsAttention.length,
      needsAttention
    };
  }, [tasks, plants, taskLogs]);

  const overdueTasks = (tasks || []).filter(t => {
    if (!t || !t.next_due_at) return false;
    const dueDate = new Date(t.next_due_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  });
  
  const todayTasks = (tasks || []).filter(t => {
    if (!t || !t.next_due_at) return false;
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
        <Text style={styles.title}>My Garden</Text>
        <Text style={styles.date}>{new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        })}</Text>
      </View>

      {/* Quick Stats Dashboard */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.progressCircleContainer}>
            <Svg width={80} height={80}>
              <Circle
                cx={40}
                cy={40}
                r={35}
                stroke="#e0e0e0"
                strokeWidth={8}
                fill="none"
              />
              <Circle
                cx={40}
                cy={40}
                r={35}
                stroke="#2e7d32"
                strokeWidth={8}
                fill="none"
                strokeDasharray={`${2 * Math.PI * 35}`}
                strokeDashoffset={`${2 * Math.PI * 35 * (1 - stats.completionRate / 100)}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
            </Svg>
            <View style={styles.progressText}>
              <Text style={styles.progressNumber}>{stats.completionRate}%</Text>
            </View>
          </View>
          <Text style={styles.statLabel}>Completed</Text>
          <Text style={styles.statSubtext}>{stats.completed}/{stats.totalTasks} tasks</Text>
        </View>

        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={styles.miniStatCard}
            onPress={() => navigation.navigate('Plants')}
          >
            <Ionicons name="alert-circle" size={24} color="#ff9800" />
            <Text style={styles.miniStatNumber}>{stats.needsAttentionCount}</Text>
            <Text style={styles.miniStatLabel}>Need Care</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.miniStatCard}
            onPress={() => navigation.navigate('Plants')}
          >
            <Ionicons name="fitness" size={24} color="#f44336" />
            <Text style={styles.miniStatNumber}>{stats.unhealthyCount}</Text>
            <Text style={styles.miniStatLabel}>Unhealthy</Text>
          </TouchableOpacity>

          <View style={styles.miniStatCard}>
            <Ionicons name="leaf" size={24} color="#4caf50" />
            <Text style={styles.miniStatNumber}>{plants.length}</Text>
            <Text style={styles.miniStatLabel}>Total Plants</Text>
          </View>
        </View>
      </View>

      {/* Plant Health Alerts */}
      {(stats.unhealthyPlants.length > 0 || stats.needsAttention.length > 0) && (
        <View style={styles.alertsSection}>
          <Text style={styles.sectionTitle}>⚠️ Plants Need Attention</Text>
          
          {stats.unhealthyPlants.map(plant => (
            <TouchableOpacity
              key={plant.id}
              style={styles.alertCard}
              onPress={() => navigation.navigate('Plants', { 
                screen: 'PlantDetail', 
                params: { plantId: plant.id } 
              })}
            >
              <View style={styles.alertIcon}>
                <Ionicons 
                  name={plant.health_status === 'sick' ? 'medical' : 'warning'} 
                  size={20} 
                  color="#fff" 
                />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertPlantName}>{plant.name}</Text>
                <Text style={styles.alertText}>
                  Status: {plant.health_status === 'sick' ? '❌ Sick' : '⚠️ Stressed'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}

          {stats.needsAttention.slice(0, 3).map(plant => (
            <TouchableOpacity
              key={plant.id}
              style={[styles.alertCard, styles.alertCardWarning]}
              onPress={() => navigation.navigate('Plants', { 
                screen: 'PlantDetail', 
                params: { plantId: plant.id } 
              })}
            >
              <View style={[styles.alertIcon, styles.alertIconWarning]}>
                <Ionicons name="water" size={20} color="#fff" />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertPlantName}>{plant.name}</Text>
                <Text style={styles.alertText}>Needs watering</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {overdueTasks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🚨 Overdue ({overdueTasks.length})</Text>
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>HIGH</Text>
            </View>
          </View>
          {overdueTasks.map(task => (
            <View key={task.id} style={styles.taskWrapper}>
              <TaskCard
                task={task}
                plantName={getPlantName(task.plant_id)}
                onMarkDone={() => handleMarkDone(task)}
                isOverdue
                disabled={completingTaskId === task.id}
              />
              <View style={styles.quickActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleSnooze(task, 2)}
                >
                  <Ionicons name="time-outline" size={16} color="#2196f3" />
                  <Text style={styles.actionText}>Snooze 2h</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedTask(task);
                    setShowSkipModal(true);
                  }}
                >
                  <Ionicons name="play-skip-forward-outline" size={16} color="#ff9800" />
                  <Text style={styles.actionText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {todayTasks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Today ({todayTasks.length})</Text>
            <View style={[styles.priorityBadge, styles.priorityMedium]}>
              <Text style={styles.priorityText}>MEDIUM</Text>
            </View>
          </View>
          {todayTasks.map(task => (
            <View key={task.id} style={styles.taskWrapper}>
              <TaskCard
                task={task}
                plantName={getPlantName(task.plant_id)}
                onMarkDone={() => handleMarkDone(task)}
                disabled={completingTaskId === task.id}
              />
              <View style={styles.quickActions}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleSnooze(task, 4)}
                >
                  <Ionicons name="time-outline" size={16} color="#2196f3" />
                  <Text style={styles.actionText}>Snooze 4h</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    setSelectedTask(task);
                    setShowSkipModal(true);
                  }}
                >
                  <Ionicons name="play-skip-forward-outline" size={16} color="#ff9800" />
                  <Text style={styles.actionText}>Skip</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {tasks.length === 0 && !loading && (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#4caf50" />
          <Text style={styles.emptyText}>All caught up! 🎉</Text>
          <Text style={styles.emptySubtext}>No tasks due today</Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => navigation.navigate('Care Plan')}
          >
            <Text style={styles.emptyButtonText}>View Schedule</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Skip Task Modal */}
      <Modal
        visible={showSkipModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSkipModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Skip Task</Text>
            <Text style={styles.modalSubtext}>
              This task will be postponed to tomorrow
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Reason (optional)"
              value={skipReason}
              onChangeText={setSkipReason}
              placeholderTextColor="#999"
              multiline
            />

            <View style={styles.skipReasons}>
              {['Weather', 'Already done', 'Not needed', 'Too busy'].map(reason => (
                <TouchableOpacity
                  key={reason}
                  style={styles.reasonChip}
                  onPress={() => setSkipReason(reason)}
                >
                  <Text style={styles.reasonText}>{reason}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowSkipModal(false);
                  setSkipReason('');
                  setSelectedTask(null);
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleSkipTask}
              >
                <Text style={styles.modalButtonText}>Skip to Tomorrow</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: theme.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
  },
  date: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  statsContainer: {
    backgroundColor: theme.backgroundSecondary,
    padding: 16,
    marginTop: 8,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  progressCircleContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.primary,
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginTop: 4,
  },
  statSubtext: {
    fontSize: 13,
    color: theme.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  miniStatCard: {
    alignItems: 'center',
    flex: 1,
  },
  miniStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginTop: 8,
  },
  miniStatLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  alertsSection: {
    backgroundColor: theme.backgroundSecondary,
    padding: 16,
    marginTop: 8,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.errorLight,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.error,
  },
  alertCardWarning: {
    backgroundColor: theme.warningLight,
    borderColor: theme.warning,
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertIconWarning: {
    backgroundColor: theme.warning,
  },
  alertContent: {
    flex: 1,
  },
  alertPlantName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  alertText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  section: {
    padding: 16,
    backgroundColor: theme.backgroundSecondary,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  priorityBadge: {
    backgroundColor: theme.errorLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityMedium: {
    backgroundColor: theme.warningLight,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.error,
    letterSpacing: 0.5,
  },
  taskWrapper: {
    marginBottom: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  actionText: {
    fontSize: 12,
    color: theme.textSecondary,
    fontWeight: '500',
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
    color: theme.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 4,
  },
  emptyButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.primary,
    borderRadius: 24,
  },
  emptyButtonText: {
    color: theme.textInverse,
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.text,
    marginBottom: 8,
  },
  modalSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: theme.inputBackground,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: theme.inputText,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.inputBorder,
  },
  skipReasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  reasonText: {
    fontSize: 13,
    color: theme.primary,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: theme.background,
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalButtonConfirm: {
    backgroundColor: theme.warning,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textInverse,
  },
  modalButtonTextCancel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textSecondary,
  },
});
