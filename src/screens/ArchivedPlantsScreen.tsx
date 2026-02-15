import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';
import { getArchivedPlants, restorePlant } from '../services/plants';
import { Plant } from '../types/database.types';

export default function ArchivedPlantsScreen({ navigation }: any) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const loadArchivedPlants = useCallback(async () => {
    setLoading(true);
    try {
      const archivedPlants = await getArchivedPlants();
      setPlants(archivedPlants);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadArchivedPlants();
    }, [loadArchivedPlants])
  );

  const handleRestore = (plant: Plant) => {
    Alert.alert(
      'Restore Plant',
      `Restore ${plant.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            if (restoringId) return;
            setRestoringId(plant.id);
            try {
              await restorePlant(plant.id);
              Alert.alert('Restored', 'Plant restored successfully.');
              loadArchivedPlants();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setRestoringId(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Plant }) => {
    const deletedAt = item.deleted_at
      ? new Date(item.deleted_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.meta}>
            {item.plant_variety || item.plant_type}
          </Text>
          {!!item.location && (
            <Text style={styles.location}>{item.location}</Text>
          )}
          {deletedAt && (
            <Text style={styles.deletedAt}>Deleted {deletedAt}</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={() => handleRestore(item)}
          disabled={restoringId === item.id}
        >
          <Ionicons name="arrow-undo" size={18} color={theme.primary} />
          <Text style={styles.restoreText}>
            {restoringId === item.id ? 'Restoring...' : 'Restore'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Archived Plants</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading archived plants...</Text>
        </View>
      ) : plants.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="archive-outline" size={64} color={theme.border} />
          <Text style={styles.emptyTitle}>No archived plants</Text>
          <Text style={styles.emptyText}>
            Deleted plants will appear here for restore.
          </Text>
        </View>
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: theme.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerSpacer: {
      width: 24,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
    },
    listContent: {
      padding: 16,
      paddingBottom: 24,
    },
    card: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    cardContent: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    meta: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
      textTransform: 'uppercase',
    },
    location: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 6,
    },
    deletedAt: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 6,
    },
    restoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: theme.primaryLight,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    restoreText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
    },
    emptyText: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
  });
