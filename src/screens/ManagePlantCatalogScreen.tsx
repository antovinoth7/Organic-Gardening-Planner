import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
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
} from '../services/plantCatalog';
import { getAllPlants } from '../services/plants';
import { Plant, PlantCatalog, PlantType } from '../types/database.types';
import { MoreStackParamList } from '../types/navigation.types';
import { getPlantEmoji } from '../utils/plantHelpers';
import { CATEGORY_LABELS } from '../utils/plantLabels';
import { getErrorMessage } from '../utils/errorLogging';

export default function ManagePlantCatalogScreen(): React.JSX.Element {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const moreNav = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const [catalog, setCatalog] = useState<PlantCatalog>(DEFAULT_PLANT_CATALOG);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<PlantType>('vegetable');

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
            onPress={() =>
              moreNav.navigate('CatalogPlantDetail', {
                plantName: '',
                plantType: activeCategory,
                isCreating: true,
              })
            }
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={28} color={theme.textInverse} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
