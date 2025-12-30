import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { getJournalEntries, deleteJournalEntry } from '../services/journal';
import { getPlants } from '../services/plants';
import { JournalEntry, Plant } from '../types/database.types';
import { Ionicons } from '@expo/vector-icons';

export default function JournalScreen({ navigation }: any) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [entriesData, { plants: plantsData }] = await Promise.all([
        getJournalEntries(),
        getPlants(),
      ]);
      setEntries(entriesData);
      setPlants(plantsData);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation]);

  const getPlantName = (plantId: string | null) => {
    if (!plantId) return null;
    const plant = plants.find(p => p.id === plantId);
    return plant?.name;
  };

  const getEntryTypeIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      observation: 'eye',
      harvest: 'basket',
      issue: 'alert-circle',
      milestone: 'flag',
      other: 'document-text',
    };
    return (
      <View style={styles.typeIconBadge}>
        <Ionicons name={iconMap[type] as any || 'document-text'} size={12} color="#2e7d32" />
      </View>
    );
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJournalEntry(id);
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Garden Journal</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('JournalForm')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadData} />
        }
      >
        {entries.map(entry => {
          const plantName = getPlantName(entry.plant_id);
          const date = new Date(entry.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <TouchableOpacity 
              key={entry.id} 
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('JournalForm', { entry })}
            >
              {entry.photo_urls && entry.photo_urls.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                  {entry.photo_urls.map((photoUrl, idx) => (
                    <Image key={idx} source={{ uri: photoUrl }} style={styles.photo} />
                  ))}
                </ScrollView>
              )}
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.date}>{date}</Text>
                    {getEntryTypeIcon(entry.entry_type)}
                  </View>
                  <View style={styles.headerRight}>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        navigation.navigate('JournalForm', { entry });
                      }}
                      style={styles.iconButton}
                    >
                      <Ionicons name="pencil-outline" size={20} color="#2e7d32" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(entry.id);
                      }}
                      style={styles.iconButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                </View>
                {plantName && (
                  <View style={styles.plantTag}>
                    <Ionicons name="leaf" size={12} color="#2e7d32" />
                    <Text style={styles.plantTagText}>{plantName}</Text>
                  </View>
                )}
                <Text style={styles.content}>{entry.content}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {entries.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No journal entries yet</Text>
            <Text style={styles.emptySubtext}>Start documenting your garden journey</Text>
          </View>
        )}
      </ScrollView>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photosScroll: {
    maxHeight: 200,
  },
  photo: {
    width: 300,
    height: 200,
    marginRight: 8,
    backgroundColor: '#e8f5e9',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  date: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeIconBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 4,
  },
  iconButton: {
    padding: 4,
  },
  plantTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  plantTagText: {
    fontSize: 12,
    color: '#2e7d32',
    marginLeft: 4,
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
