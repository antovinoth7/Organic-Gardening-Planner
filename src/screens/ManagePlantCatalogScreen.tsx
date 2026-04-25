import FloatingLabelInput from '../components/FloatingLabelInput';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useNavigation,
  NavigationProp,
  ParamListBase,
  useFocusEffect,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { createStyles } from '../styles/managePlantCatalogStyles';
import {
  DEFAULT_PLANT_CATALOG,
  PLANT_CATEGORIES,
  getPlantCatalog,
  savePlantCatalog,
} from '../services/plantCatalog';
import { getAllPlants } from '../services/plants';
import { Plant, PlantCatalog, PlantType } from '../types/database.types';
import { MoreStackParamList } from '../types/navigation.types';
import { getPlantEmoji } from '../utils/plantHelpers';
import { CATEGORY_LABELS } from '../utils/plantLabels';
import { sanitizeLandmarkText } from '../utils/textSanitizer';
import { getErrorMessage } from '../utils/errorLogging';

const sanitizePlantName = (value: string): string => sanitizeLandmarkText(value).trim();

const isDuplicate = (list: string[], value: string): boolean => {
  const needle = value.toLowerCase();
  return list.some((item) => item.toLowerCase() === needle);
};

export default function ManagePlantCatalogScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const moreNav = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [catalog, setCatalog] = useState<PlantCatalog>(DEFAULT_PLANT_CATALOG);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<PlantType>('vegetable');
  const [newPlantName, setNewPlantName] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [catalogData, allPlants] = await Promise.all([
        getPlantCatalog(),
        getAllPlants(),
      ]);
      setCatalog(catalogData);
      setPlants(allPlants);
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error) ?? 'Failed to load plant catalog.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    setShowAddInput(false);
    setNewPlantName('');
  }, [activeCategory]);

  const plantCounts = useMemo(() => {
    const counts: Record<PlantType, Record<string, number>> = {
      vegetable: {},
      herb: {},
      flower: {},
      fruit_tree: {},
      timber_tree: {},
      coconut_tree: {},
      shrub: {},
    };
    plants.forEach((plant) => {
      const type = plant.plant_type;
      const variety = plant.plant_variety ?? '';
      if (!type || !variety) return;
      counts[type][variety] = (counts[type][variety] || 0) + 1;
    });
    return counts;
  }, [plants]);

  const categoryPlants = catalog.categories[activeCategory]?.plants ?? [];
  const categoryVarieties = catalog.categories[activeCategory]?.varieties ?? {};

  const handleAddPlant = async (): Promise<void> => {
    const name = sanitizePlantName(newPlantName);
    if (!name) {
      Alert.alert('Name Required', 'Enter a plant name.');
      return;
    }
    if (isDuplicate(categoryPlants, name)) {
      Alert.alert('Already Exists', 'That plant already exists.');
      return;
    }
    const nextCatalog: PlantCatalog = {
      ...catalog,
      categories: {
        ...catalog.categories,
        [activeCategory]: {
          plants: [...categoryPlants, name],
          varieties: { ...categoryVarieties },
        },
      },
    };
    setSaving(true);
    try {
      const saved = await savePlantCatalog(nextCatalog);
      setCatalog(saved);
      setNewPlantName('');
      setShowAddInput(false);
      moreNav.navigate('CatalogPlantDetail', {
        plantName: name,
        plantType: activeCategory,
      });
    } catch (error: unknown) {
      Alert.alert('Error', getErrorMessage(error) ?? 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Plant Catalog</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading catalog...</Text>
        </View>
      ) : (
        <View style={styles.contentWrapper}>
          <ScrollView
            style={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: Math.max(insets.bottom, 48) + 80,
            }}
          >
            {/* Scrollable category pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {PLANT_CATEGORIES.map((category) => {
                const isActive = activeCategory === category;
                return (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                    onPress={() => setActiveCategory(category)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}
                    >
                      {CATEGORY_LABELS[category]}
                    </Text>
                    {(catalog.categories[category]?.plants.length ?? 0) > 0 && (
                      <View
                        style={[
                          styles.categoryPillBadge,
                          isActive && styles.categoryPillBadgeActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryPillBadgeText,
                            isActive && styles.categoryPillBadgeTextActive,
                          ]}
                        >
                          {catalog.categories[category]?.plants.length}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.section}>
              {/* Plant list */}
              {categoryPlants.length === 0 ? (
                <Text style={styles.emptyText}>No plants yet. Tap + to add one.</Text>
              ) : (
                <View style={styles.listCard}>
                  {categoryPlants.map((plantName, index) => {
                    const count = plantCounts[activeCategory]?.[plantName] || 0;
                    const isLast = index === categoryPlants.length - 1;
                    return (
                      <React.Fragment key={plantName}>
                        <TouchableOpacity
                          style={styles.plantRowCompact}
                          onPress={() =>
                            moreNav.navigate('CatalogPlantDetail', {
                              plantName,
                              plantType: activeCategory,
                            })
                          }
                          activeOpacity={0.7}
                        >
                          <Text style={styles.plantEmoji}>{getPlantEmoji(plantName)}</Text>
                          <View style={styles.plantInfo}>
                            <Text style={styles.plantName} numberOfLines={1}>
                              {plantName}
                            </Text>
                          </View>
                          {count > 0 && (
                            <View style={styles.plantCountChip}>
                              <Text style={styles.plantCountChipText}>{count}</Text>
                            </View>
                          )}
                          <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
                        </TouchableOpacity>
                        {!isLast && <View style={styles.rowDivider} />}
                      </React.Fragment>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>

          {/* FAB */}
          <TouchableOpacity
            style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16 }]}
            onPress={() => setShowAddInput(true)}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={28} color={theme.textInverse} />
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showAddInput}
        transparent
        animationType="slide"
        hardwareAccelerated
        onRequestClose={() => {
          setShowAddInput(false);
          setNewPlantName('');
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add {CATEGORY_LABELS[activeCategory]}</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddInput(false);
                  setNewPlantName('');
                }}
              >
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHint}>
              You can add varieties and care details after saving.
            </Text>
            <FloatingLabelInput
              label="Plant name"
              value={newPlantName}
              onChangeText={setNewPlantName}
              autoFocus
              autoCorrect={false}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddPlant}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={theme.textInverse} />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
