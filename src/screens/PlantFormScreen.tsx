import React, { useEffect, useState, useRef } from 'react';
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
  BackHandler,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getPlant, createPlant, updatePlant, savePlantImage } from '../services/plants';
import { Plant, SpaceType, PlantType, SunlightLevel, SoilType, WaterRequirement, HealthStatus, FertiliserType } from '../types/database.types';
import { Ionicons } from '@expo/vector-icons';

const PLANT_VARIETIES: Record<PlantType, string[]> = {
  vegetable: ['Tomato', 'Carrot', 'Lettuce', 'Cabbage', 'Broccoli', 'Cucumber', 'Pepper', 'Eggplant', 'Spinach', 'Radish', 'Potato', 'Onion', 'Garlic', 'Beans', 'Peas'],
  herb: ['Basil', 'Mint', 'Coriander', 'Parsley', 'Rosemary', 'Thyme', 'Oregano', 'Sage', 'Dill', 'Lemongrass', 'Curry Leaf'],
  flower: ['Rose', 'Sunflower', 'Marigold', 'Lily', 'Tulip', 'Jasmine', 'Hibiscus', 'Dahlia', 'Chrysanthemum', 'Orchid'],
  fruit_tree: ['Mango', 'Apple', 'Orange', 'Banana', 'Guava', 'Papaya', 'Lemon', 'Pomegranate', 'Fig', 'Avocado', 'Jackfruit'],
  timber_tree: ['Teak', 'Mahogany', 'Oak', 'Pine', 'Rosewood', 'Sandalwood', 'Eucalyptus', 'Acacia', 'Cedar', 'Bamboo'],
  coconut_tree: ['Dwarf Coconut', 'Tall Coconut', 'Hybrid Coconut', 'King Coconut'],
  shrub: ['Hibiscus', 'Bougainvillea', 'Jasmine', 'Azalea', 'Gardenia', 'Lavender', 'Boxwood', 'Holly'],
};

export default function PlantFormScreen({ route, navigation }: any) {
  const { plantId } = route.params || {};
  const [name, setName] = useState('');
  const [plantType, setPlantType] = useState<PlantType>('vegetable');
  const [plantVariety, setPlantVariety] = useState('');
  const [spaceType, setSpaceType] = useState<SpaceType>('pot');
  const [location, setLocation] = useState('');
  const [bedName, setBedName] = useState('');
  const [potSize, setPotSize] = useState('');
  const [variety, setVariety] = useState('');
  const [plantingDate, setPlantingDate] = useState('');
  const [harvestSeason, setHarvestSeason] = useState('');
  const [harvestStartDate, setHarvestStartDate] = useState('');
  const [harvestEndDate, setHarvestEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPlantingDatePicker, setShowPlantingDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  // New fields
  const [sunlight, setSunlight] = useState<SunlightLevel>('full_sun');
  const [soilType, setSoilType] = useState<SoilType>('potting_mix');
  const [waterRequirement, setWaterRequirement] = useState<WaterRequirement>('medium');
  const [wateringFrequency, setWateringFrequency] = useState('3');
  const [fertilisingFrequency, setFertilisingFrequency] = useState('14');
  const [preferredFertiliser, setPreferredFertiliser] = useState<FertiliserType>('compost');
  const [mulchingUsed, setMulchingUsed] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('healthy');
  
  // Track if form has been modified
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialDataLoaded = useRef(false);
  const isSaving = useRef(false);

  useEffect(() => {
    if (plantId) {
      loadPlant();
    } else {
      // Mark initial data as loaded for new plants
      setTimeout(() => {
        initialDataLoaded.current = true;
      }, 100);
    }
  }, [plantId]);

  // Detect form changes
  useEffect(() => {
    if (initialDataLoaded.current) {
      setHasUnsavedChanges(true);
    }
  }, [name, plantType, plantVariety, spaceType, location, bedName, potSize, variety,
      plantingDate, harvestSeason, harvestStartDate, harvestEndDate, notes, photoUri,
      sunlight, soilType, waterRequirement, wateringFrequency, fertilisingFrequency,
      preferredFertiliser, mulchingUsed, healthStatus]);

  // Handle back button press
  useEffect(() => {
    const backAction = () => {
      if (hasUnsavedChanges && !isSaving.current) {
        handleBackPress();
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    // Handle navigation back button
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!hasUnsavedChanges || isSaving.current) {
        return;
      }

      e.preventDefault();
      handleBackPress();
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, [hasUnsavedChanges, navigation]);

  const handleBackPress = () => {
    if (isSaving.current) {
      return; // Don't show alert if save is in progress
    }
    
    Alert.alert(
      'Discard Changes?',
      'You have unsaved changes. Are you sure you want to discard them?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setHasUnsavedChanges(false);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const loadPlant = async () => {
    try {
      const plant = await getPlant(plantId);
      if (plant) {
        setName(plant.name);
        setPlantType(plant.plant_type);
        setPlantVariety(plant.plant_variety || '');
        setSpaceType(plant.space_type);
        setLocation(plant.location);
        setBedName(plant.bed_name || '');
        setPotSize(plant.pot_size || '');
        setVariety(plant.variety || '');
        setPlantingDate(plant.planting_date || '');
        setHarvestSeason(plant.harvest_season || '');
        setHarvestStartDate(plant.harvest_start_date || '');
        setHarvestEndDate(plant.harvest_end_date || '');
        setNotes(plant.notes || '');
        setPhotoUri(plant.photo_url);
        // Load new fields
        setSunlight(plant.sunlight || 'full_sun');
        setSoilType(plant.soil_type || 'potting_mix');
        setWaterRequirement(plant.water_requirement || 'medium');
        setWateringFrequency(plant.watering_frequency_days?.toString() || '3');
        setFertilisingFrequency(plant.fertilising_frequency_days?.toString() || '14');
        setPreferredFertiliser(plant.preferred_fertiliser || 'compost');
        setMulchingUsed(plant.mulching_used || false);
        setHealthStatus(plant.health_status || 'healthy');
        
        // Mark initial data as loaded after a short delay
        setTimeout(() => {
          initialDataLoaded.current = true;
        }, 100);
      }
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
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a plant name');
      return;
    }

    if (!plantVariety.trim()) {
      Alert.alert('Validation Error', 'Please select a specific plant type');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Validation Error', 'Please enter a location');
      return;
    }

    if (!wateringFrequency.trim() || isNaN(parseInt(wateringFrequency)) || parseInt(wateringFrequency) < 1) {
      Alert.alert('Validation Error', 'Please enter a valid watering frequency (number of days)');
      return;
    }

    if (!fertilisingFrequency.trim() || isNaN(parseInt(fertilisingFrequency)) || parseInt(fertilisingFrequency) < 1) {
      Alert.alert('Validation Error', 'Please enter a valid fertilising frequency (number of days)');
      return;
    }

    if (loading || isSaving.current) {
      return; // Prevent multiple saves
    }

    setLoading(true);
    isSaving.current = true;
    setHasUnsavedChanges(false); // Clear flag immediately to prevent navigation alert
    try {
      let photoUrl = photoUri;
      
      // Upload new photo if changed
      if (photoUri && !photoUri.startsWith('http') && !photoUri.startsWith('data:')) {
        photoUrl = await savePlantImage(photoUri);
      }

      const isTree = ['fruit_tree', 'timber_tree', 'coconut_tree'].includes(plantType);

      const plantData: any = {
        name: name.trim(),
        plant_type: plantType,
        plant_variety: plantVariety.trim() || null,
        space_type: spaceType,
        location: location.trim(),
        bed_name: spaceType === 'bed' ? bedName.trim() || null : null,
        pot_size: spaceType === 'pot' ? potSize.trim() || null : null,
        variety: variety.trim() || null,
        planting_date: plantingDate.trim() || null,
        harvest_season: harvestSeason.trim() || null,
        notes: notes.trim() || null,
        photo_url: photoUrl,
        // New care fields
        sunlight: sunlight,
        soil_type: soilType,
        water_requirement: waterRequirement,
        watering_frequency_days: parseInt(wateringFrequency) || null,
        fertilising_frequency_days: parseInt(fertilisingFrequency) || null,
        preferred_fertiliser: preferredFertiliser,
        mulching_used: mulchingUsed,
        health_status: healthStatus,
      };

      // Add harvest dates only for fruit trees
      if (plantType === 'fruit_tree') {
        plantData.harvest_start_date = harvestStartDate.trim() || null;
        plantData.harvest_end_date = harvestEndDate.trim() || null;
      }

      if (plantId) {
        await updatePlant(plantId, plantData);
      } else {
        await createPlant(plantData);
      }

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setHasUnsavedChanges(true); // Restore flag on error
    } finally {
      setLoading(false);
      isSaving.current = false;
    }
  };

  const isTree = ['fruit_tree', 'timber_tree', 'coconut_tree'].includes(plantType);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{plantId ? 'Edit Plant' : 'Add Plant'}</Text>
          {hasUnsavedChanges && <View style={styles.unsavedDot} />}
        </View>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveText, loading && styles.saveTextDisabled]}>
            {loading ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={32} color="#999" />
              <Text style={styles.photoText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="Plant Name *"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Plant Category *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={plantType}
            onValueChange={(value) => {
              setPlantType(value);
              setPlantVariety('');
            }}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="🥬 Vegetable" value="vegetable" />
            <Picker.Item label="🌿 Herb" value="herb" />
            <Picker.Item label="🌸 Flower" value="flower" />
            <Picker.Item label="🥭 Fruit Tree" value="fruit_tree" />
            <Picker.Item label="🌲 Timber Tree" value="timber_tree" />
            <Picker.Item label="🥥 Coconut Tree" value="coconut_tree" />
            <Picker.Item label="🌱 Shrub" value="shrub" />
          </Picker>
        </View>

        <Text style={styles.label}>Specific Plant *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={plantVariety}
            onValueChange={setPlantVariety}
            style={styles.picker}
            itemStyle={styles.pickerItem}
            enabled={!!plantType}
          >
            <Picker.Item label="Select plant type" value="" color="#999" />
            {PLANT_VARIETIES[plantType].map((variety) => (
              <Picker.Item key={variety} label={variety} value={variety} />
            ))}
          </Picker>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Variety (e.g., Alphonso, Dwarf)"
          value={variety}
          onChangeText={setVariety}
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowPlantingDatePicker(true)}
        >
          <Text style={plantingDate ? styles.dateText : styles.datePlaceholder}>
            {plantingDate || 'Planting Date (tap to select)'}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#666" />
        </TouchableOpacity>
        {showPlantingDatePicker && (
          <DateTimePicker
            value={plantingDate ? new Date(plantingDate) : new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowPlantingDatePicker(false);
              if (selectedDate) {
                setPlantingDate(selectedDate.toISOString().split('T')[0]);
              }
            }}
          />
        )}

        <Text style={styles.label}>Harvest Season</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={harvestSeason}
            onValueChange={setHarvestSeason}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Select season" value="" color="#999" />
            <Picker.Item label="Year Round" value="Year Round" />
            <Picker.Item label="Summer (Mar-Jun)" value="Summer (Mar-Jun)" />
            <Picker.Item label="Monsoon/Kharif (Jun-Oct)" value="Monsoon/Kharif (Jun-Oct)" />
            <Picker.Item label="Winter/Rabi (Oct-Mar)" value="Winter/Rabi (Oct-Mar)" />
            <Picker.Item label="Spring (Jan-Mar)" value="Spring (Jan-Mar)" />
            <Picker.Item label="Autumn (Sep-Nov)" value="Autumn (Sep-Nov)" />
          </Picker>
        </View>

        <Text style={styles.sectionHeader}>🌱 Care Settings</Text>

        <Text style={styles.label}>Sunlight Level *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={sunlight}
            onValueChange={setSunlight}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="☀️ Full Sun (6+ hours)" value="full_sun" />
            <Picker.Item label="⛅ Partial Sun (3-6 hours)" value="partial_sun" />
            <Picker.Item label="🌤️ Shade (< 3 hours)" value="shade" />
          </Picker>
        </View>

        <Text style={styles.label}>Soil Type *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={soilType}
            onValueChange={setSoilType}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Garden Soil" value="garden_soil" />
            <Picker.Item label="Potting Mix" value="potting_mix" />
            <Picker.Item label="Coco Peat Mix" value="coco_peat" />
            <Picker.Item label="Custom Mix" value="custom" />
          </Picker>
        </View>

        <Text style={styles.label}>Water Requirement *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={waterRequirement}
            onValueChange={setWaterRequirement}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="💧 Low (Drought tolerant)" value="low" />
            <Picker.Item label="💧💧 Medium (Regular watering)" value="medium" />
            <Picker.Item label="💧💧💧 High (Frequent watering)" value="high" />
          </Picker>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Watering Frequency (days) *"
          value={wateringFrequency}
          onChangeText={setWateringFrequency}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.input}
          placeholder="Fertilising Frequency (days) *"
          value={fertilisingFrequency}
          onChangeText={setFertilisingFrequency}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Preferred Organic Fertiliser</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={preferredFertiliser}
            onValueChange={setPreferredFertiliser}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="Compost" value="compost" />
            <Picker.Item label="Vermicompost" value="vermicompost" />
            <Picker.Item label="Fish Emulsion" value="fish_emulsion" />
            <Picker.Item label="Seaweed Extract" value="seaweed" />
            <Picker.Item label="Neem Cake" value="neem_cake" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setMulchingUsed(!mulchingUsed)}
        >
          <Ionicons
            name={mulchingUsed ? 'checkbox' : 'square-outline'}
            size={24}
            color={mulchingUsed ? '#2e7d32' : '#999'}
          />
          <Text style={styles.checkboxLabel}>Mulching Used</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Plant Health Status</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={healthStatus}
            onValueChange={setHealthStatus}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="✅ Healthy" value="healthy" />
            <Picker.Item label="⚠️ Stressed" value="stressed" />
            <Picker.Item label="🔄 Recovering" value="recovering" />
            <Picker.Item label="❌ Sick" value="sick" />
          </Picker>
        </View>

        {plantType === 'fruit_tree' && (
          <>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={harvestStartDate ? styles.dateText : styles.datePlaceholder}>
                {harvestStartDate || 'Harvest Start Date (tap to select)'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={harvestStartDate ? new Date(harvestStartDate) : new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartDatePicker(false);
                  if (selectedDate) {
                    setHarvestStartDate(selectedDate.toISOString().split('T')[0]);
                  }
                }}
              />
            )}

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={harvestEndDate ? styles.dateText : styles.datePlaceholder}>
                {harvestEndDate || 'Harvest End Date (tap to select)'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={harvestEndDate ? new Date(harvestEndDate) : new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEndDatePicker(false);
                  if (selectedDate) {
                    setHarvestEndDate(selectedDate.toISOString().split('T')[0]);
                  }
                }}
              />
            )}
          </>
        )}

        {false && (
          <TextInput
            style={styles.input}
            placeholder="Variety (optional)"
            value={variety}
            onChangeText={setVariety}
            placeholderTextColor="#999"
          />
        )}

        <View style={styles.spaceTypeContainer}>
          <TouchableOpacity
            style={[styles.spaceTypeButton, spaceType === 'pot' && styles.spaceTypeActive]}
            onPress={() => setSpaceType('pot')}
          >
            <Ionicons 
              name="cube-outline" 
              size={20} 
              color={spaceType === 'pot' ? '#2e7d32' : '#999'} 
            />
            <Text style={[styles.spaceTypeText, spaceType === 'pot' && styles.spaceTypeTextActive]}>
              Pot
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.spaceTypeButton, spaceType === 'bed' && styles.spaceTypeActive]}
            onPress={() => setSpaceType('bed')}
          >
            <Ionicons 
              name="apps" 
              size={20} 
              color={spaceType === 'bed' ? '#2e7d32' : '#999'} 
            />
            <Text style={[styles.spaceTypeText, spaceType === 'bed' && styles.spaceTypeTextActive]}>
              Bed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.spaceTypeButton, spaceType === 'ground' && styles.spaceTypeActive]}
            onPress={() => setSpaceType('ground')}
          >
            <Ionicons 
              name="earth" 
              size={20} 
              color={spaceType === 'ground' ? '#2e7d32' : '#999'} 
            />
            <Text style={[styles.spaceTypeText, spaceType === 'ground' && styles.spaceTypeTextActive]}>
              Ground
            </Text>
          </TouchableOpacity>
        </View>

        {spaceType === 'pot' && (
          <TextInput
            style={styles.input}
            placeholder="Pot Size (e.g., 12 inch)"
            value={potSize}
            onChangeText={setPotSize}
            placeholderTextColor="#999"
          />
        )}
        {spaceType === 'bed' && (
          <TextInput
            style={styles.input}
            placeholder="Bed Name (e.g., Veggie Bed 1)"
            value={bedName}
            onChangeText={setBedName}
            placeholderTextColor="#999"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Location *"
          value={location}
          onChangeText={setLocation}
          placeholderTextColor="#999"
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          placeholderTextColor="#999"
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unsavedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff9800',
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
  photoButton: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  photo: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  photoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  spaceTypeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  spaceTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  spaceTypeActive: {
    borderColor: '#2e7d32',
    backgroundColor: '#e8f5e9',
  },
  spaceTypeText: {
    fontSize: 16,
    color: '#999',
    marginLeft: 8,
  },
  spaceTypeTextActive: {
    color: '#2e7d32',
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    minHeight: 56,
    justifyContent: 'center',
  },
  picker: {
    height: 56,
    fontSize: 16,
  },
  pickerItem: {
    fontSize: 18,
    height: 120,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2e7d32',
    marginTop: 16,
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});
