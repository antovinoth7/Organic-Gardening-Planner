import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { exportBackup, importBackup, getBackupStats } from '../services/backup';
import { getImageStorageSize } from '../lib/imageStorage';
import { useTheme } from '../theme';

export default function SettingsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ plantCount: 0, taskCount: 0, journalCount: 0, lastExport: null });
  const [imageStorageSize, setImageStorageSize] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const backupStats = await getBackupStats();
      const imageSize = await getImageStorageSize();
      setStats(backupStats);
      setImageStorageSize(imageSize);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + ' MB';
  };

  const handleExportBackup = async () => {
    try {
      setLoading(true);
      await exportBackup();
      Alert.alert(
        'Backup Created',
        'Your garden data has been exported. Save this file to your cloud storage (Google Drive, OneDrive, etc.) for safekeeping.',
        [{ text: 'OK', onPress: loadStats }]
      );
    } catch (error: any) {
      Alert.alert('Export Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async (overwrite: boolean) => {
    Alert.alert(
      'Import Backup',
      overwrite 
        ? 'This will REPLACE all your current data with the backup. Continue?' 
        : 'This will MERGE the backup with your current data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: overwrite ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await importBackup(overwrite);
              Alert.alert(
                'Import Complete',
                `Imported:\n• ${result.plants} plants\n• ${result.tasks} tasks\n• ${result.journal} journal entries`,
                [{ text: 'OK', onPress: loadStats }]
              );
            } catch (error: any) {
              if (error.message !== 'Import cancelled') {
                Alert.alert('Import Failed', error.message);
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    console.log('Sign out button pressed');
    try {
      console.log('Calling signOut...');
      await signOut(auth);
      console.log('Signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Backup</Text>
          <Text style={styles.sectionDescription}>
            Your garden data is stored both locally and synced to Firestore. Images are stored only on this device.
            Create manual backups to save to your own cloud storage for long-term safety.
          </Text>
          
          <View style={styles.card}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.plantCount}</Text>
                <Text style={styles.statLabel}>Plants</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.taskCount}</Text>
                <Text style={styles.statLabel}>Tasks</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.journalCount}</Text>
                <Text style={styles.statLabel}>Journal</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatBytes(imageStorageSize)}</Text>
                <Text style={styles.statLabel}>Images</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.backupButton, styles.exportButton]} 
            onPress={handleExportBackup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.backupButtonText}>Export Backup</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.backupButton, styles.importButton]} 
            onPress={() => handleImportBackup(false)}
            disabled={loading}
          >
            <Ionicons name="cloud-upload-outline" size={20} color="#2e7d32" />
            <Text style={[styles.backupButtonText, { color: '#2e7d32' }]}>Import & Merge</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.backupButton, styles.replaceButton]} 
            onPress={() => handleImportBackup(true)}
            disabled={loading}
          >
            <Ionicons name="refresh-outline" size={20} color="#f57c00" />
            <Text style={[styles.backupButtonText, { color: '#f57c00' }]}>Import & Replace All</Text>
          </TouchableOpacity>

          <Text style={styles.backupNote}>
            💡 Tip: Export backups regularly and save them to Google Drive, OneDrive, or an external drive.
            Images are not included in backups - they stay local to this device.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.card}>
            <View style={styles.infoItem}>
              <Ionicons name="person-circle" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>{auth.currentUser?.email || 'Not signed in'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Architecture</Text>
          
          <View style={styles.card}>
            <View style={styles.infoItem}>
              <Ionicons name="cloud-outline" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>Text data synced via Firebase (free tier)</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="phone-portrait-outline" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>Images stored locally on device only</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="wifi-outline" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>Works offline with local cache</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>Free forever - no subscriptions</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="leaf" size={24} color="#2e7d32" />
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Garden Planner</Text>
                <Text style={styles.rowSubtitle}>Version 1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          
          <View style={styles.card}>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>Track plants and their locations</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>Set recurring tasks (water, fertilise, etc.)</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>Garden journal with photos</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>Calendar view of upcoming tasks</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>Cloud sync across all devices</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={20} color="#2e7d32" />
              <Text style={styles.infoText}>Works offline with auto-sync</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#f44336" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    padding: 24,
    paddingTop: 48,
    backgroundColor: theme.backgroundSecondary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  card: {
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowContent: {
    marginLeft: 16,
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  rowSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.text,
    marginLeft: 12,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  backupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    marginTop: 12,
  },
  exportButton: {
    backgroundColor: '#2e7d32',
  },
  importButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2e7d32',
  },
  replaceButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#f57c00',
  },
  backupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  backupNote: {
    fontSize: 13,
    color: '#666',
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f44336',
    marginLeft: 8,
  },
});
