import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { createJournalEntry, updateJournalEntry, saveJournalImage } from '../services/journal';
import { getPlants } from '../services/plants';
import { Plant, JournalEntryType } from '../types/database.types';
import { Ionicons } from '@expo/vector-icons';

export default function JournalFormScreen({ navigation, route }: any) {
  const editEntry = route.params?.entry as JournalEntry | undefined;
  const isEditing = !!editEntry;

  const [entryType, setEntryType] = useState<JournalEntryType>(editEntry?.entry_type || 'observation');
  const [content, setContent] = useState(editEntry?.content || '');
  const [photoUris, setPhotoUris] = useState<string[]>(editEntry?.photo_urls || []);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(editEntry?.plant_id || null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPlantPicker, setShowPlantPicker] = useState(false);
  
  // Harvest-specific fields
  const [harvestQuantity, setHarvestQuantity] = useState(editEntry?.harvest_quantity?.toString() || '');
  const [harvestUnit, setHarvestUnit] = useState(editEntry?.harvest_unit || 'pieces');
  const [harvestQuality, setHarvestQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>(editEntry?.harvest_quality || 'good');
  const [harvestNotes, setHarvestNotes] = useState(editEntry?.harvest_notes || '');

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    try {
      const { plants: data } = await getPlants();
      setPlants(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      const newUris = result.assets.map(asset => asset.uri);
      setPhotoUris(prev => [...prev, ...newUris]);
    }
  };

  const removeImage = (index: number) => {
    setPhotoUris(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something in your journal');
      return;
    }

    if (entryType === 'harvest' && !harvestQuantity) {
      Alert.alert('Error', 'Please enter harvest quantity');
      return;
    }

    setLoading(true);
    try {
      const photoUrls: string[] = [];
      
      // Save new images (those not already saved with file:// protocol)
      for (const uri of photoUris) {
        if (uri.startsWith('file://')) {
          // Already saved, keep as is
          photoUrls.push(uri);
        } else {
          // New image, save it
          const savedUri = await saveJournalImage(uri);
          photoUrls.push(savedUri);
        }
      }

      const entryData = {
        entry_type: entryType,
        content: content.trim(),
        photo_urls: photoUrls,
        plant_id: selectedPlantId,
        harvest_quantity: entryType === 'harvest' ? parseFloat(harvestQuantity) : null,
        harvest_unit: entryType === 'harvest' ? harvestUnit : null,
        harvest_quality: entryType === 'harvest' ? harvestQuality : null,
        harvest_notes: entryType === 'harvest' ? harvestNotes : null,
      };

      if (isEditing && editEntry) {
        await updateJournalEntry(editEntry.id, entryData);
      } else {
        await createJournalEntry(entryData);
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedPlant = plants.find(p => p.id === selectedPlantId);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Edit Entry' : 'New Entry'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveText, loading && styles.saveTextDisabled]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Entry Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity 
            style={[styles.typeButton, entryType === 'observation' && styles.typeButtonActive]}
            onPress={() => setEntryType('observation')}
          >
            <Ionicons name="eye" size={20} color={entryType === 'observation' ? '#fff' : '#2e7d32'} />
            <Text style={[styles.typeButtonText, entryType === 'observation' && styles.typeButtonTextActive]}>
              Observation
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, entryType === 'harvest' && styles.typeButtonActive]}
            onPress={() => setEntryType('harvest')}
          >
            <Ionicons name="basket" size={20} color={entryType === 'harvest' ? '#fff' : '#2e7d32'} />
            <Text style={[styles.typeButtonText, entryType === 'harvest' && styles.typeButtonTextActive]}>
              Harvest
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, entryType === 'issue' && styles.typeButtonActive]}
            onPress={() => setEntryType('issue')}
          >
            <Ionicons name="alert-circle" size={20} color={entryType === 'issue' ? '#fff' : '#2e7d32'} />
            <Text style={[styles.typeButtonText, entryType === 'issue' && styles.typeButtonTextActive]}>
              Issue
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeButton, entryType === 'milestone' && styles.typeButtonActive]}
            onPress={() => setEntryType('milestone')}
          >
            <Ionicons name="flag" size={20} color={entryType === 'milestone' ? '#fff' : '#2e7d32'} />
            <Text style={[styles.typeButtonText, entryType === 'milestone' && styles.typeButtonTextActive]}>
              Milestone
            </Text>
          </TouchableOpacity>
        </View>

        {photoUris.length > 0 && (
          <View style={styles.photosGrid}>
            {photoUris.map((uri, index) => (
              <View key={index} style={styles.photoContainer}>
                <Image source={{ uri }} style={styles.photoThumbnail} />
                <TouchableOpacity 
                  style={styles.removePhotoButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
          <Ionicons name="camera" size={20} color="#2e7d32" />
          <Text style={styles.addPhotoText}>
            {photoUris.length > 0 ? `Add More Photos (${photoUris.length})` : 'Add Photos'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.plantSelector}
          onPress={() => setShowPlantPicker(!showPlantPicker)}
        >
          <Ionicons name="leaf" size={20} color="#2e7d32" />
          <Text style={styles.plantSelectorText}>
            {selectedPlant ? selectedPlant.name : 'Link to plant (optional)'}
          </Text>
          {selectedPlantId && (
            <TouchableOpacity onPress={() => setSelectedPlantId(null)}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {showPlantPicker && (
          <View style={styles.plantPicker}>
            {plants.map(plant => (
              <TouchableOpacity
                key={plant.id}
                style={[
                  styles.plantOption,
                  selectedPlantId === plant.id && styles.plantOptionSelected,
                ]}
                onPress={() => {
                  setSelectedPlantId(plant.id);
                  setShowPlantPicker(false);
                }}
              >
                <Text style={styles.plantOptionText}>{plant.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Harvest-specific fields */}
        {entryType === 'harvest' && (
          <View style={styles.harvestSection}>
            <Text style={styles.sectionTitle}>Harvest Details</Text>
            
            <View style={styles.harvestRow}>
              <View style={styles.quantityInput}>
                <Text style={styles.label}>Quantity *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={harvestQuantity}
                  onChangeText={setHarvestQuantity}
                  keyboardType="decimal-pad"
                />
              </View>
              
              <View style={styles.unitInput}>
                <Text style={styles.label}>Unit</Text>
                <View style={styles.unitButtons}>
                  {['pieces', 'kg', 'lbs'].map(unit => (
                    <TouchableOpacity
                      key={unit}
                      style={[styles.unitButton, harvestUnit === unit && styles.unitButtonActive]}
                      onPress={() => setHarvestUnit(unit)}
                    >
                      <Text style={[styles.unitButtonText, harvestUnit === unit && styles.unitButtonTextActive]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Text style={styles.label}>Quality</Text>
            <View style={styles.qualityButtons}>
              {[
                { value: 'excellent', label: 'Excellent', emoji: '🌟' },
                { value: 'good', label: 'Good', emoji: '👍' },
                { value: 'fair', label: 'Fair', emoji: '👌' },
                { value: 'poor', label: 'Poor', emoji: '👎' },
              ].map(quality => (
                <TouchableOpacity
                  key={quality.value}
                  style={[
                    styles.qualityButton,
                    harvestQuality === quality.value && styles.qualityButtonActive,
                  ]}
                  onPress={() => setHarvestQuality(quality.value as any)}
                >
                  <Text style={styles.qualityEmoji}>{quality.emoji}</Text>
                  <Text style={[
                    styles.qualityButtonText,
                    harvestQuality === quality.value && styles.qualityButtonTextActive,
                  ]}>
                    {quality.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.label}>Storage / Notes</Text>
            <TextInput
              style={styles.harvestNotesInput}
              placeholder="Storage method, taste notes, etc. (optional)"
              value={harvestNotes}
              onChangeText={setHarvestNotes}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>
        )}

        <TextInput
          style={styles.textArea}
          placeholder="What's happening in your garden today?"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          placeholderTextColor="#999"
          autoFocus
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  saveTextDisabled: {
    color: '#999',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    width: '48%',
    aspectRatio: 1,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    marginBottom: 16,
  },
  addPhotoText: {
    fontSize: 16,
    color: '#2e7d32',
    marginLeft: 8,
    fontWeight: '600',
  },
  plantSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  plantSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  plantPicker: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  plantOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  plantOptionSelected: {
    backgroundColor: '#e8f5e9',
  },
  plantOptionText: {
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e8f5e9',
    gap: 4,
  },
  typeButtonActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  harvestSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  harvestRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quantityInput: {
    flex: 1,
  },
  unitInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  unitButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  unitButtonActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  unitButtonTextActive: {
    color: '#2e7d32',
  },
  qualityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  qualityButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  qualityButtonActive: {
    backgroundColor: '#e8f5e9',
    borderColor: '#2e7d32',
  },
  qualityEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  qualityButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  qualityButtonTextActive: {
    color: '#2e7d32',
  },
  harvestNotesInput: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 60,
  },
});
