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
import { createJournalEntry, saveJournalImage } from '../services/journal';
import { getPlants } from '../services/plants';
import { Plant } from '../types/database.types';
import { Ionicons } from '@expo/vector-icons';

export default function JournalFormScreen({ navigation }: any) {
  const [content, setContent] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPlantPicker, setShowPlantPicker] = useState(false);

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
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please write something in your journal');
      return;
    }

    setLoading(true);
    try {
      let photoUrl = null;
      
      if (photoUri) {
        photoUrl = await saveJournalImage(photoUri);
      }

      await createJournalEntry({
        content: content.trim(),
        photo_url: photoUrl,
        plant_id: selectedPlantId,
      });

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
        <Text style={styles.title}>New Entry</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveText, loading && styles.saveTextDisabled]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {photoUri && (
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.photo} />
            <TouchableOpacity 
              style={styles.removePhotoButton}
              onPress={() => setPhotoUri(null)}
            >
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
          <Ionicons name="camera" size={20} color="#2e7d32" />
          <Text style={styles.addPhotoText}>
            {photoUri ? 'Change Photo' : 'Add Photo'}
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
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
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
});
