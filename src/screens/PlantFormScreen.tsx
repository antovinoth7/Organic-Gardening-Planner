import React, { useEffect, useState, useRef } from "react";
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
  Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  getPlant,
  createPlant,
  updatePlant,
  savePlantImage,
} from "../services/plants";
import {
  SpaceType,
  PlantType,
  SunlightLevel,
  SoilType,
  WaterRequirement,
  HealthStatus,
  FertiliserType,
  PestDiseaseRecord,
  GrowthStage,
} from "../types/database.types";
import { Ionicons } from "@expo/vector-icons";
import {
  calculateExpectedHarvestDate,
  getCompanionSuggestions,
  getIncompatiblePlants,
  getCommonPests,
  getCommonDiseases,
} from "../utils/plantHelpers";
import {
  getPlantCareProfile,
  hasPlantCareProfile,
} from "../utils/plantCareDefaults";
import { useTheme } from "../theme";
import CollapsibleSection from "../components/CollapsibleSection";

const PLANT_VARIETIES: Record<PlantType, string[]> = {
  vegetable: [
    "Tomato",
    "Carrot",
    "Lettuce",
    "Cabbage",
    "Broccoli",
    "Cucumber",
    "Pepper",
    "Eggplant",
    "Spinach",
    "Radish",
    "Potato",
    "Onion",
    "Garlic",
    "Beans",
    "Peas",
  ],
  herb: [
    "Basil",
    "Mint",
    "Coriander",
    "Parsley",
    "Rosemary",
    "Thyme",
    "Oregano",
    "Sage",
    "Dill",
    "Lemongrass",
    "Curry Leaf",
  ],
  flower: [
    "Rose",
    "Sunflower",
    "Marigold",
    "Lily",
    "Tulip",
    "Jasmine",
    "Hibiscus",
    "Dahlia",
    "Chrysanthemum",
    "Orchid",
  ],
  fruit_tree: [
    "Mango",
    "Orange",
    "Banana",
    "Guava",
    "Papaya",
    "Lemon",
    "Pomegranate",
    "Fig",
    "Avocado",
    "Jackfruit",
    "Chikoo",
    "Water Apple",
    "Soursop",
    "Mangosteen",
    "Rambutan",
  ],
  timber_tree: [
    "Teak",
    "Mahogany",
    "Rosewood",
    "Sandalwood",
    "Bamboo",
    "Wild Jack",
    "Neem",
  ],
  coconut_tree: [
    "Dwarf Coconut",
    "Tall Coconut",
    "Hybrid Coconut",
    "King Coconut",
  ],
  shrub: [
    "Hibiscus",
    "Bougainvillea",
    "Jasmine",
    "Azalea",
    "Gardenia",
    "Lavender",
    "Boxwood",
    "Holly",
  ],
};

const PARENT_LOCATIONS = [
  "Mangarai",
  "Velliavilai Home",
  "Velliavilai Near Pond",
  "Palappallam",
];

const CHILD_LOCATIONS = [
  "North",
  "South",
  "East",
  "West",
  "North-East",
  "North-West",
  "South-East",
  "South-West",
  "Center",
  "Front",
  "Back",
];

const NOTES_MAX_LENGTH = 500;

export default function PlantFormScreen({ route, navigation }: any) {
  const { plantId } = route.params || {};
  const theme = useTheme();
  const styles = createStyles(theme);
  const [name, setName] = useState("");
  const [plantType, setPlantType] = useState<PlantType>("vegetable");
  const [plantVariety, setPlantVariety] = useState("");
  const [spaceType, setSpaceType] = useState<SpaceType>("ground");
  const [location, setLocation] = useState("");
  const [parentLocation, setParentLocation] = useState("");
  const [childLocation, setChildLocation] = useState("");
  const [bedName, setBedName] = useState("");
  const [potSize, setPotSize] = useState("");
  const [variety, setVariety] = useState("");
  const [plantingDate, setPlantingDate] = useState("");
  const [harvestSeason, setHarvestSeason] = useState("");
  const [harvestStartDate, setHarvestStartDate] = useState("");
  const [harvestEndDate, setHarvestEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPlantingDatePicker, setShowPlantingDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  // New fields
  const [sunlight, setSunlight] = useState<SunlightLevel>("full_sun");
  const [soilType, setSoilType] = useState<SoilType>("garden_soil");
  const [waterRequirement, setWaterRequirement] =
    useState<WaterRequirement>("medium");
  const [wateringFrequency, setWateringFrequency] = useState("");
  const [fertilisingFrequency, setFertilisingFrequency] = useState("");
  const [preferredFertiliser, setPreferredFertiliser] =
    useState<FertiliserType>("compost");
  const [mulchingUsed, setMulchingUsed] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>("healthy");

  // New features
  const [companionPlants, setCompanionPlants] = useState<string[]>([]);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState("");
  const [pestDiseaseHistory, setPestDiseaseHistory] = useState<
    PestDiseaseRecord[]
  >([]);
  const [showCompanionSuggestions, setShowCompanionSuggestions] =
    useState(false);
  const [showPestDiseaseModal, setShowPestDiseaseModal] = useState(false);
  const [currentPestDisease, setCurrentPestDisease] =
    useState<PestDiseaseRecord>({
      type: "pest",
      name: "",
      occurredAt: new Date().toISOString().split("T")[0],
      resolved: false,
    });

  // PHASE 1: Growth Stage & Pruning
  const [growthStage, setGrowthStage] = useState<GrowthStage>("seedling");
  const [pruningFrequency, setPruningFrequency] = useState("");
  const [pruningNotes, setPruningNotes] = useState("");

  // Track if form has been modified
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const initialDataLoaded = useRef(false);
  const isSaving = useRef(false);
  const autoSuggestApplied = useRef(false);

  useEffect(() => {
    if (plantId) {
      loadPlant();
    } else {
      // For new plants, mark as loaded after delay to allow auto-suggest
      setTimeout(() => {
        initialDataLoaded.current = true;
      }, 500);
    }
  }, [plantId]);

  // Detect form changes
  useEffect(() => {
    if (initialDataLoaded.current) {
      setHasUnsavedChanges(true);
    }
  }, [
    name,
    plantType,
    plantVariety,
    spaceType,
    location,
    parentLocation,
    childLocation,
    bedName,
    potSize,
    variety,
    plantingDate,
    harvestSeason,
    harvestStartDate,
    harvestEndDate,
    notes,
    photoUri,
    sunlight,
    soilType,
    waterRequirement,
    wateringFrequency,
    fertilisingFrequency,
    preferredFertiliser,
    mulchingUsed,
    healthStatus,
    companionPlants,
    expectedHarvestDate,
    pestDiseaseHistory,
  ]);

  // Auto-calculate expected harvest date when plant variety or planting date changes
  useEffect(() => {
    if (plantVariety && plantingDate) {
      const calculatedDate = calculateExpectedHarvestDate(
        plantVariety,
        plantingDate,
        plantType
      );
      if (calculatedDate) {
        setExpectedHarvestDate(calculatedDate);
      }
    }
  }, [plantVariety, plantingDate, plantType]);

  // Update companion plant suggestions when plant variety changes
  useEffect(() => {
    if (plantVariety) {
      const suggestions = getCompanionSuggestions(plantVariety);
      if (suggestions.length > 0 && companionPlants.length === 0) {
        setShowCompanionSuggestions(true);
      }
    }
  }, [plantVariety]);

  // Reset auto-suggest flag when plant variety changes
  useEffect(() => {
    autoSuggestApplied.current = false;
  }, [plantVariety]);

  // AUTO-SUGGEST: Apply smart defaults when plant variety is selected
  useEffect(() => {
    if (
      !plantId &&
      plantVariety &&
      hasPlantCareProfile(plantVariety) &&
      !autoSuggestApplied.current
    ) {
      console.log("🌱 Applying auto-suggestions for:", plantVariety);
      const profile = getPlantCareProfile(plantVariety);

      if (profile) {
        autoSuggestApplied.current = true;

        // Apply ALL fields unconditionally
        setWateringFrequency(profile.wateringFrequencyDays.toString());
        setFertilisingFrequency(profile.fertilisingFrequencyDays.toString());
        if (profile.pruningFrequencyDays) {
          setPruningFrequency(profile.pruningFrequencyDays.toString());
        }

        // Apply basic care settings
        setSunlight(profile.sunlight);
        setSoilType(profile.soilType);
        setWaterRequirement(profile.waterRequirement);
        setPreferredFertiliser(profile.preferredFertiliser);

        // Phase 1: Growth
        setGrowthStage(profile.initialGrowthStage);

        // Show alert to user
        Alert.alert(
          "🌱 Smart Care Settings Applied",
          `Recommended care settings for ${plantVariety} have been automatically filled. You can adjust them as needed.`,
          [{ text: "Got it!" }]
        );
      }
    }
  }, [plantVariety, plantId]);

  // Combine parent and child locations
  useEffect(() => {
    if (parentLocation && childLocation) {
      setLocation(`${parentLocation} - ${childLocation}`);
    } else {
      setLocation("");
    }
  }, [parentLocation, childLocation]);

  // Handle back button press
  useEffect(() => {
    const backAction = () => {
      if (hasUnsavedChanges && !isSaving.current) {
        handleBackPress();
        return true; // Prevent default back action
      }
      return false; // Allow default back action
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    // Handle navigation back button
    const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
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

    // Reset immediately to prevent duplicate alerts
    setHasUnsavedChanges(false);

    Alert.alert(
      "Discard Changes?",
      "You have unsaved changes. Are you sure you want to discard them?",
      [
        {
          text: "Keep Editing",
          style: "cancel",
          onPress: () => {
            // Re-enable if user cancels
            setHasUnsavedChanges(true);
          },
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            navigation.goBack();
          },
        },
      ],
      { cancelable: false }
    );
  };

  const loadPlant = async () => {
    try {
      const plant = await getPlant(plantId);
      if (plant) {
        setName(plant.name);
        setPlantType(plant.plant_type);
        setPlantVariety(plant.plant_variety || "");
        setSpaceType(plant.space_type);
        setLocation(plant.location);

        // Parse location into parent and child
        const locationParts = plant.location?.split(" - ") || [];
        if (locationParts.length === 2) {
          setParentLocation(locationParts[0]);
          setChildLocation(locationParts[1]);
        } else if (locationParts.length === 1 && locationParts[0]) {
          setParentLocation(locationParts[0]);
          setChildLocation("");
        } else {
          setParentLocation("");
          setChildLocation("");
        }

        setBedName(plant.bed_name || "");
        setPotSize(plant.pot_size || "");
        setVariety(plant.variety || "");
        setPlantingDate(plant.planting_date || "");
        setHarvestSeason(plant.harvest_season || "");
        setHarvestStartDate(plant.harvest_start_date || "");
        setHarvestEndDate(plant.harvest_end_date || "");
        setNotes(plant.notes || "");
        setPhotoUri(plant.photo_url);
        // Load new fields
        setSunlight(plant.sunlight || "full_sun");
        setSoilType(plant.soil_type || "potting_mix");
        setWaterRequirement(plant.water_requirement || "medium");
        setWateringFrequency(plant.watering_frequency_days?.toString() || "3");
        setFertilisingFrequency(
          plant.fertilising_frequency_days?.toString() || "14"
        );
        setPreferredFertiliser(plant.preferred_fertiliser || "compost");
        setMulchingUsed(plant.mulching_used || false);
        setHealthStatus(plant.health_status || "healthy");

        // Load companion plants & pest history
        setCompanionPlants(plant.companion_plants || []);
        setExpectedHarvestDate(plant.expected_harvest_date || "");
        setPestDiseaseHistory(plant.pest_disease_history || []);

        // Load Phase 1 fields
        setGrowthStage(plant.growth_stage || "seedling");
        setPruningFrequency(plant.pruning_frequency_days?.toString() || "");
        setPruningNotes(plant.pruning_notes || "");

        // Mark initial data as loaded
        setTimeout(() => {
          initialDataLoaded.current = true;
        }, 500);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const openImageLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photos");
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

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your camera");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images" as any, // Use 'images' for new API
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const pickImage = () => {
    Alert.alert("Add Photo", "Choose a source", [
      { text: "Camera", onPress: openCamera },
      { text: "Photo Library", onPress: openImageLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!name.trim()) {
      Alert.alert("Validation Error", "Please enter a plant name");
      return;
    }

    if (!plantVariety.trim()) {
      Alert.alert("Validation Error", "Please select a specific plant type");
      return;
    }

    if (!parentLocation.trim()) {
      Alert.alert("Validation Error", "Please select a main location");
      return;
    }

    if (!childLocation.trim()) {
      Alert.alert("Validation Error", "Please select a direction/section");
      return;
    }

    if (notes.length > NOTES_MAX_LENGTH) {
      Alert.alert(
        "Validation Error",
        `Notes must be ${NOTES_MAX_LENGTH} characters or less`
      );
      return;
    }

    if (
      !wateringFrequency.trim() ||
      isNaN(parseInt(wateringFrequency)) ||
      parseInt(wateringFrequency) < 1
    ) {
      Alert.alert(
        "Validation Error",
        "Please enter a valid watering frequency (number of days)"
      );
      return;
    }

    if (
      !fertilisingFrequency.trim() ||
      isNaN(parseInt(fertilisingFrequency)) ||
      parseInt(fertilisingFrequency) < 1
    ) {
      Alert.alert(
        "Validation Error",
        "Please enter a valid fertilising frequency (number of days)"
      );
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
      const combinedLocation = `${parentLocation.trim()} - ${childLocation.trim()}`;

      // Upload new photo if changed
      if (
        photoUri &&
        !photoUri.startsWith("http") &&
        !photoUri.startsWith("data:")
      ) {
        photoUrl = await savePlantImage(photoUri);
      }

      const plantData: any = {
        name: name.trim(),
        plant_type: plantType,
        plant_variety: plantVariety.trim() || null,
        space_type: spaceType,
        location: combinedLocation,
        bed_name: spaceType === "bed" ? bedName.trim() || null : null,
        pot_size: spaceType === "pot" ? potSize.trim() || null : null,
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
        // Companion plants & pest history
        companion_plants: companionPlants.length > 0 ? companionPlants : null,
        expected_harvest_date: expectedHarvestDate || null,
        pest_disease_history:
          pestDiseaseHistory.length > 0 ? pestDiseaseHistory : null,
        // Phase 1: Growth & Pruning
        growth_stage: growthStage,
        pruning_frequency_days: pruningFrequency
          ? parseInt(pruningFrequency)
          : null,
        pruning_notes: pruningNotes.trim() || null,
      };

      // Add harvest dates only for fruit trees
      if (plantType === "fruit_tree") {
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
      Alert.alert("Error", error.message);
      setHasUnsavedChanges(true); // Restore flag on error
    } finally {
      setLoading(false);
      isSaving.current = false;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>
            {plantId ? "Edit Plant" : "Add Plant"}
          </Text>
          {hasUnsavedChanges && <View style={styles.unsavedDot} />}
        </View>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          <Text style={[styles.saveText, loading && styles.saveTextDisabled]}>
            {loading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <CollapsibleSection
          title="Basic Information"
          icon="information-circle"
          fieldCount={7}
          defaultExpanded={true}
          hasError={!name || !plantType || !plantVariety}
        >
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
            placeholderTextColor={theme.inputPlaceholder}
          />

          <Text style={styles.label}>Plant Category *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={plantType}
              onValueChange={(value) => {
                setPlantType(value);
                setPlantVariety("");
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
            placeholderTextColor={theme.inputPlaceholder}
          />

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowPlantingDatePicker(true)}
          >
            <Text
              style={plantingDate ? styles.dateText : styles.datePlaceholder}
            >
              {plantingDate || "Planting Date (tap to select)"}
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
                  setPlantingDate(selectedDate.toISOString().split("T")[0]);
                }
              }}
            />
          )}

          <Text style={styles.label}>Location *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={parentLocation}
              onValueChange={(value) => {
                setParentLocation(value);
                // Reset child location when parent changes
                if (!value) setChildLocation("");
              }}
              style={styles.picker}
            >
              <Picker.Item label="Select Main Location" value="" />
              {PARENT_LOCATIONS.map((loc) => (
                <Picker.Item key={loc} label={loc} value={loc} />
              ))}
            </Picker>
          </View>

          {parentLocation !== "" && (
            <>
              <Text style={styles.label}>Direction / Section *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={childLocation}
                  onValueChange={setChildLocation}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Direction" value="" />
                  {CHILD_LOCATIONS.map((loc) => (
                    <Picker.Item key={loc} label={loc} value={loc} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          {location && (
            <View style={styles.locationPreview}>
              <Ionicons name="location" size={16} color={theme.primary} />
              <Text style={styles.locationPreviewText}>{location}</Text>
            </View>
          )}
        </CollapsibleSection>

        <CollapsibleSection
          title="Care & Growing Conditions"
          icon="leaf"
          fieldCount={12}
          defaultExpanded={false}
        >
          <Text style={styles.sectionHeader}>🪴 Growing Space</Text>

          <View style={styles.spaceTypeContainer}>
            <TouchableOpacity
              style={[
                styles.spaceTypeButton,
                spaceType === "ground" && styles.spaceTypeActive,
              ]}
              onPress={() => setSpaceType("ground")}
            >
              <Ionicons
                name="earth"
                size={20}
                color={spaceType === "ground" ? "#2e7d32" : "#999"}
              />
              <Text
                style={[
                  styles.spaceTypeText,
                  spaceType === "ground" && styles.spaceTypeTextActive,
                ]}
              >
                Ground
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.spaceTypeButton,
                spaceType === "bed" && styles.spaceTypeActive,
              ]}
              onPress={() => setSpaceType("bed")}
            >
              <Ionicons
                name="apps"
                size={20}
                color={spaceType === "bed" ? "#2e7d32" : "#999"}
              />
              <Text
                style={[
                  styles.spaceTypeText,
                  spaceType === "bed" && styles.spaceTypeTextActive,
                ]}
              >
                Bed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.spaceTypeButton,
                spaceType === "pot" && styles.spaceTypeActive,
              ]}
              onPress={() => setSpaceType("pot")}
            >
              <Ionicons
                name="cube-outline"
                size={20}
                color={spaceType === "pot" ? "#2e7d32" : "#999"}
              />
              <Text
                style={[
                  styles.spaceTypeText,
                  spaceType === "pot" && styles.spaceTypeTextActive,
                ]}
              >
                Pot
              </Text>
            </TouchableOpacity>
          </View>

          {spaceType === "pot" && (
            <TextInput
              style={styles.input}
              placeholder="Pot Size (e.g., 12 inch)"
              value={potSize}
              onChangeText={setPotSize}
              placeholderTextColor={theme.inputPlaceholder}
            />
          )}
          {spaceType === "bed" && (
            <TextInput
              style={styles.input}
              placeholder="Bed Name (e.g., Veggie Bed 1)"
              value={bedName}
              onChangeText={setBedName}
              placeholderTextColor={theme.inputPlaceholder}
            />
          )}

          <Text style={styles.sectionHeader}>☀️ Environmental Needs</Text>

          <Text style={styles.label}>Sunlight Level *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={sunlight}
              onValueChange={setSunlight}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="☀️ Full Sun (6+ hours)" value="full_sun" />
              <Picker.Item
                label="⛅ Partial Sun (3-6 hours)"
                value="partial_sun"
              />
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
              <Picker.Item
                label="💧💧 Medium (Regular watering)"
                value="medium"
              />
              <Picker.Item
                label="💧💧💧 High (Frequent watering)"
                value="high"
              />
            </Picker>
          </View>

          <Text style={styles.sectionHeader}>💧 Watering & Feeding</Text>
          <Text style={styles.label}>Watering Frequency (days)</Text>

          <TextInput
            style={styles.input}
            placeholder="Watering Frequency (days) *"
            value={wateringFrequency}
            onChangeText={setWateringFrequency}
            keyboardType="numeric"
            placeholderTextColor={theme.inputPlaceholder}
          />
          <Text style={styles.label}>Fertilising Frequency (days)</Text>

          <TextInput
            style={styles.input}
            placeholder="Fertilising Frequency (days) *"
            value={fertilisingFrequency}
            onChangeText={setFertilisingFrequency}
            keyboardType="numeric"
            placeholderTextColor={theme.inputPlaceholder}
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
              name={mulchingUsed ? "checkbox" : "square-outline"}
              size={24}
              color={mulchingUsed ? "#2e7d32" : "#999"}
            />
            <Text style={styles.checkboxLabel}>Mulching Used</Text>
          </TouchableOpacity>

          <Text style={styles.sectionHeader}>🌿 Plant Status & Growth</Text>

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

          <Text style={styles.label}>Growth Stage</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={growthStage}
              onValueChange={setGrowthStage}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="🌱 Seedling" value="seedling" />
              <Picker.Item label="🌿 Vegetative" value="vegetative" />
              <Picker.Item label="🌸 Flowering" value="flowering" />
              <Picker.Item label="🍎 Fruiting" value="fruiting" />
              <Picker.Item label="🌳 Mature" value="mature" />
              <Picker.Item label="📉 Declining" value="declining" />
            </Picker>
          </View>

          <Text style={styles.sectionHeader}>✂️ Pruning </Text>

          <Text style={styles.label}>Pruning Frequency (days)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 60"
            value={pruningFrequency}
            onChangeText={setPruningFrequency}
            keyboardType="numeric"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Pruning Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add notes about pruning techniques, timing, or observations"
            value={pruningNotes}
            onChangeText={setPruningNotes}
            multiline
            numberOfLines={2}
            placeholderTextColor="#999"
          />
        </CollapsibleSection>

        {/* Harvest Information & Companions */}
        <CollapsibleSection
          title="Harvest & Companions"
          icon="calendar"
          fieldCount={plantType === "fruit_tree" ? 3 : 1}
          defaultExpanded={false}
        >
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
              <Picker.Item
                label="Monsoon/Kharif (Jun-Oct)"
                value="Monsoon/Kharif (Jun-Oct)"
              />
              <Picker.Item
                label="Winter/Rabi (Oct-Mar)"
                value="Winter/Rabi (Oct-Mar)"
              />
              <Picker.Item label="Spring (Jan-Mar)" value="Spring (Jan-Mar)" />
              <Picker.Item label="Autumn (Sep-Nov)" value="Autumn (Sep-Nov)" />
            </Picker>
          </View>

          {plantType === "fruit_tree" && (
            <>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text
                  style={
                    harvestStartDate ? styles.dateText : styles.datePlaceholder
                  }
                >
                  {harvestStartDate || "Harvest Start Date (tap to select)"}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={
                    harvestStartDate ? new Date(harvestStartDate) : new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowStartDatePicker(false);
                    if (selectedDate) {
                      setHarvestStartDate(
                        selectedDate.toISOString().split("T")[0]
                      );
                    }
                  }}
                />
              )}

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text
                  style={
                    harvestEndDate ? styles.dateText : styles.datePlaceholder
                  }
                >
                  {harvestEndDate || "Harvest End Date (tap to select)"}
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
                      setHarvestEndDate(
                        selectedDate.toISOString().split("T")[0]
                      );
                    }
                  }}
                />
              )}
            </>
          )}

          {/* Expected Harvest Date */}
          {expectedHarvestDate && (
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="calendar" size={20} color="#FF9800" />
                <Text style={styles.infoCardTitle}>Expected Harvest Date</Text>
              </View>
              <Text style={styles.infoCardText}>
                {new Date(expectedHarvestDate).toLocaleDateString()}
              </Text>
              <Text style={styles.infoCardSubtext}>
                Auto-calculated based on plant variety and planting date
              </Text>
            </View>
          )}

          {/* Companion Planting Suggestions */}
          {plantVariety && getCompanionSuggestions(plantVariety).length > 0 && (
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="leaf" size={20} color="#4CAF50" />
                <Text style={styles.infoCardTitle}>Companion Plants</Text>
                <TouchableOpacity
                  onPress={() =>
                    setShowCompanionSuggestions(!showCompanionSuggestions)
                  }
                >
                  <Ionicons
                    name={
                      showCompanionSuggestions ? "chevron-up" : "chevron-down"
                    }
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {showCompanionSuggestions && (
                <>
                  <Text style={styles.infoCardSubtext}>
                    Plants that grow well with {plantVariety}:
                  </Text>
                  <View style={styles.chipContainer}>
                    {getCompanionSuggestions(plantVariety).map(
                      (companion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.companionChip,
                            companionPlants.includes(companion) &&
                              styles.companionChipSelected,
                          ]}
                          onPress={() => {
                            if (companionPlants.includes(companion)) {
                              setCompanionPlants(
                                companionPlants.filter((c) => c !== companion)
                              );
                            } else {
                              setCompanionPlants([
                                ...companionPlants,
                                companion,
                              ]);
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.companionChipText,
                              companionPlants.includes(companion) &&
                                styles.companionChipTextSelected,
                            ]}
                          >
                            {companion}
                          </Text>
                          {companionPlants.includes(companion) && (
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color="#2e7d32"
                            />
                          )}
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </>
              )}
            </View>
          )}

          {plantVariety && getIncompatiblePlants(plantVariety).length > 0 && (
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="warning" size={20} color="#f57c00" />
                <Text style={styles.infoCardTitle}>Avoid Planting With</Text>
              </View>
              <Text style={styles.infoCardSubtext}>
                These plants tend to compete with {plantVariety}:
              </Text>
              <View style={styles.chipContainer}>
                {getIncompatiblePlants(plantVariety).map(
                  (incompatible, index) => (
                    <View key={index} style={styles.incompatibleChip}>
                      <Text style={styles.incompatibleChipText}>
                        {incompatible}
                      </Text>
                    </View>
                  )
                )}
              </View>
            </View>
          )}

          {/* Pest & Disease History */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderText}>
              🐛 Pest & Disease History
            </Text>
            <TouchableOpacity
              style={styles.addPestButton}
              onPress={() => {
                setCurrentPestDisease({
                  type: "pest",
                  name: "",
                  occurredAt: new Date().toISOString().split("T")[0],
                  resolved: false,
                });
                setShowPestDiseaseModal(true);
              }}
            >
              <Ionicons name="add-circle" size={24} color="#2e7d32" />
            </TouchableOpacity>
          </View>

          {pestDiseaseHistory.length > 0 ? (
            <View style={styles.pestDiseaseList}>
              {pestDiseaseHistory.map((record, index) => (
                <View key={index} style={styles.pestDiseaseCard}>
                  <View style={styles.pestDiseaseHeader}>
                    <Ionicons
                      name={record.type === "pest" ? "bug" : "medical"}
                      size={20}
                      color={record.resolved ? "#4CAF50" : "#f44336"}
                    />
                    <Text style={styles.pestDiseaseName}>{record.name}</Text>
                    {record.resolved && (
                      <View style={styles.resolvedBadge}>
                        <Text style={styles.resolvedText}>Resolved</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.pestDiseaseDate}>
                    Occurred: {new Date(record.occurredAt).toLocaleDateString()}
                  </Text>
                  {record.treatment && (
                    <Text style={styles.pestDiseaseTreatment}>
                      Treatment: {record.treatment}
                    </Text>
                  )}
                  {record.notes && (
                    <Text style={styles.pestDiseaseNotes}>{record.notes}</Text>
                  )}
                  <TouchableOpacity
                    style={styles.deletePestButton}
                    onPress={() => {
                      setPestDiseaseHistory(
                        pestDiseaseHistory.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    <Ionicons name="trash-outline" size={18} color="#f44336" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noPestHistory}>
              No pest or disease records yet
            </Text>
          )}
        </CollapsibleSection>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          maxLength={NOTES_MAX_LENGTH}
          placeholderTextColor="#999"
        />
        <Text style={styles.noteCounter}>
          {notes.length}/{NOTES_MAX_LENGTH}
        </Text>

        {/* Pest/Disease Modal */}
        <Modal
          visible={showPestDiseaseModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowPestDiseaseModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Pest/Disease Record</Text>
                <TouchableOpacity
                  onPress={() => setShowPestDiseaseModal(false)}
                >
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.label}>Type</Text>
                <View style={styles.typeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      currentPestDisease.type === "pest" &&
                        styles.typeButtonActive,
                    ]}
                    onPress={() =>
                      setCurrentPestDisease({
                        ...currentPestDisease,
                        type: "pest",
                      })
                    }
                  >
                    <Ionicons
                      name="bug"
                      size={20}
                      color={
                        currentPestDisease.type === "pest" ? "#2e7d32" : "#666"
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        currentPestDisease.type === "pest" &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      Pest
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      currentPestDisease.type === "disease" &&
                        styles.typeButtonActive,
                    ]}
                    onPress={() =>
                      setCurrentPestDisease({
                        ...currentPestDisease,
                        type: "disease",
                      })
                    }
                  >
                    <Ionicons
                      name="medical"
                      size={20}
                      color={
                        currentPestDisease.type === "disease"
                          ? "#2e7d32"
                          : "#666"
                      }
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        currentPestDisease.type === "disease" &&
                          styles.typeButtonTextActive,
                      ]}
                    >
                      Disease
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>
                  Common{" "}
                  {currentPestDisease.type === "pest" ? "Pests" : "Diseases"}:
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.suggestionsScroll}
                >
                  {(currentPestDisease.type === "pest"
                    ? getCommonPests(plantType)
                    : getCommonDiseases(plantType)
                  ).map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionChip}
                      onPress={() =>
                        setCurrentPestDisease({
                          ...currentPestDisease,
                          name: item,
                        })
                      }
                    >
                      <Text style={styles.suggestionChipText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TextInput
                  style={styles.input}
                  placeholder={`${
                    currentPestDisease.type === "pest" ? "Pest" : "Disease"
                  } Name *`}
                  value={currentPestDisease.name}
                  onChangeText={(text) =>
                    setCurrentPestDisease({ ...currentPestDisease, name: text })
                  }
                  placeholderTextColor="#999"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Treatment Used"
                  value={currentPestDisease.treatment || ""}
                  onChangeText={(text) =>
                    setCurrentPestDisease({
                      ...currentPestDisease,
                      treatment: text,
                    })
                  }
                  placeholderTextColor="#999"
                />

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Notes"
                  value={currentPestDisease.notes || ""}
                  onChangeText={(text) =>
                    setCurrentPestDisease({
                      ...currentPestDisease,
                      notes: text,
                    })
                  }
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999"
                />

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() =>
                    setCurrentPestDisease({
                      ...currentPestDisease,
                      resolved: !currentPestDisease.resolved,
                      resolvedAt: !currentPestDisease.resolved
                        ? new Date().toISOString().split("T")[0]
                        : undefined,
                    })
                  }
                >
                  <Ionicons
                    name={
                      currentPestDisease.resolved
                        ? "checkbox"
                        : "square-outline"
                    }
                    size={24}
                    color={currentPestDisease.resolved ? "#2e7d32" : "#999"}
                  />
                  <Text style={styles.checkboxLabel}>Resolved</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={() => {
                    if (currentPestDisease.name.trim()) {
                      setPestDiseaseHistory([
                        ...pestDiseaseHistory,
                        { ...currentPestDisease, id: Date.now().toString() },
                      ]);
                      setShowPestDiseaseModal(false);
                    } else {
                      Alert.alert("Validation Error", "Please enter a name");
                    }
                  }}
                >
                  <Text style={styles.modalSaveButtonText}>Add Record</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      paddingTop: 48,
      backgroundColor: theme.backgroundSecondary,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderLight,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.text,
    },
    headerCenter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    unsavedDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.warning,
    },
    saveText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.primary,
    },
    saveTextDisabled: {
      color: theme.textTertiary,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    scrollContent: {
      paddingBottom: 100,
    },
    photoButton: {
      alignSelf: "center",
      marginTop: 16,
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
      backgroundColor: theme.primaryLight,
      alignItems: "center",
      justifyContent: "center",
    },
    photoText: {
      marginTop: 8,
      fontSize: 14,
      color: theme.textTertiary,
    },
    input: {
      backgroundColor: theme.inputBackground,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      fontSize: 16,
      color: theme.inputText,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    dateButton: {
      backgroundColor: theme.inputBackground,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.inputBorder,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    dateText: {
      fontSize: 16,
      color: theme.text,
    },
    datePlaceholder: {
      fontSize: 16,
      color: theme.inputPlaceholder,
    },
    textArea: {
      height: 100,
      textAlignVertical: "top",
    },
    noteCounter: {
      fontSize: 12,
      color: theme.textTertiary,
      textAlign: "right",
      marginTop: -4,
      marginBottom: 12,
    },
    spaceTypeContainer: {
      flexDirection: "row",
      marginBottom: 12,
      gap: 12,
    },
    spaceTypeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    spaceTypeActive: {
      borderColor: theme.primary,
      backgroundColor: theme.primaryLight,
    },
    spaceTypeText: {
      fontSize: 16,
      color: theme.textTertiary,
      marginLeft: 8,
    },
    spaceTypeTextActive: {
      color: theme.primary,
      fontWeight: "600",
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.textSecondary,
      marginBottom: 8,
      marginTop: 4,
    },
    pickerContainer: {
      backgroundColor: theme.pickerBackground,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.pickerBorder,
      overflow: "hidden",
      minHeight: 56,
      justifyContent: "center",
    },
    picker: {
      height: 56,
      fontSize: 16,
      color: theme.pickerText,
    },
    pickerItem: {
      fontSize: 18,
      height: 120,
      color: theme.pickerText,
    },
    locationPreview: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: theme.primaryLight,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    locationPreviewText: {
      fontSize: 14,
      color: theme.primary,
      fontWeight: "600",
    },
    sectionHeader: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.primary,
      marginTop: 16,
      marginBottom: 12,
    },
    checkboxContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.backgroundSecondary,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    checkboxLabel: {
      fontSize: 16,
      color: theme.text,
      marginLeft: 12,
    },
    infoCard: {
      backgroundColor: theme.backgroundSecondary,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderDark,
    },
    infoCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    infoCardTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      flex: 1,
    },
    infoCardText: {
      fontSize: 16,
      color: theme.primary,
      fontWeight: "600",
      marginBottom: 4,
    },
    infoCardSubtext: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 8,
    },
    chipContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
    },
    companionChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 4,
    },
    companionChipSelected: {
      backgroundColor: theme.accentLight,
      borderColor: theme.accent,
    },
    companionChipText: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    companionChipTextSelected: {
      color: theme.accent,
      fontWeight: "600",
    },
    incompatibleChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.warningLight,
      borderWidth: 1,
      borderColor: theme.warning,
    },
    incompatibleChipText: {
      fontSize: 13,
      color: theme.warning,
      fontWeight: "600",
    },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 16,
      marginBottom: 12,
    },
    sectionHeaderText: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      flex: 1,
    },
    addPestButton: {
      padding: 4,
    },
    pestDiseaseList: {
      marginBottom: 16,
    },
    pestDiseaseCard: {
      backgroundColor: theme.backgroundSecondary,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.borderDark,
      position: "relative",
    },
    pestDiseaseHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 8,
    },
    pestDiseaseName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      flex: 1,
    },
    resolvedBadge: {
      backgroundColor: theme.primaryLight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    resolvedText: {
      fontSize: 11,
      color: theme.primary,
      fontWeight: "600",
    },
    pestDiseaseDate: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    pestDiseaseTreatment: {
      fontSize: 13,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    pestDiseaseNotes: {
      fontSize: 13,
      color: theme.textSecondary,
      fontStyle: "italic",
    },
    deletePestButton: {
      position: "absolute",
      top: 12,
      right: 12,
      padding: 4,
    },
    noPestHistory: {
      fontSize: 14,
      color: theme.textTertiary,
      textAlign: "center",
      paddingVertical: 20,
      fontStyle: "italic",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.backgroundSecondary,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      paddingHorizontal: 20,
      maxHeight: "85%",
    },
    modalScrollView: {
      flexGrow: 0,
      marginBottom: 20,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
    },
    typeButtons: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 16,
    },
    typeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 8,
    },
    typeButtonActive: {
      backgroundColor: theme.primaryLight,
      borderColor: theme.primary,
    },
    typeButtonText: {
      fontSize: 15,
      color: theme.textSecondary,
      fontWeight: "500",
    },
    typeButtonTextActive: {
      color: theme.primary,
      fontWeight: "600",
    },
    suggestionsScroll: {
      marginBottom: 12,
    },
    suggestionChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: theme.accentLight,
      marginRight: 8,
    },
    suggestionChipText: {
      fontSize: 13,
      color: theme.accent,
    },
    modalSaveButton: {
      backgroundColor: theme.primary,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 16,
    },
    modalSaveButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.textInverse,
    },
  });
