import React, { useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { createStyles } from "@/styles/plantDetailStyles";
import { createEnrichedSectionStyles } from "@/styles/enrichedSectionStyles";
import { getPlantCareProfile, getPruningTechniques } from "@/utils/plantCareDefaults";
import {
  getCommonPests,
  getCommonDiseases,
  getPestDiseaseEmoji,
} from "@/utils/plantHelpers";
import { getPestByName } from "@/config/pests";
import { getDiseaseByName } from "@/config/diseases";
import type { PlantType, PlantCareProfiles } from "@/types/database.types";
import type { PlantDetailScreenNavigationProp } from "@/types/navigation.types";
import type { Theme } from "@/theme/colors";

interface Props {
  theme: Theme;
  plantType: string;
  plantVariety: string;
  plantCareProfiles: Partial<PlantCareProfiles>;
}

export function DetailCareGuidanceSection({ theme, plantType, plantVariety, plantCareProfiles }: Props): React.JSX.Element | null {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const enrichedStyles = useMemo(() => createEnrichedSectionStyles(theme), [theme]);
  const navigation = useNavigation<PlantDetailScreenNavigationProp>();

  const profile = useMemo(() => {
    if (!plantVariety) return null;
    const overrides = plantType
      ? { [plantType]: plantCareProfiles[plantType as PlantType] ?? {} }
      : undefined;
    return getPlantCareProfile(plantVariety, plantType as PlantType, overrides);
  }, [plantVariety, plantType, plantCareProfiles]);

  const pests = useMemo(
    () => (plantType ? getCommonPests(plantType as PlantType, plantVariety || undefined) : []),
    [plantType, plantVariety],
  );

  const diseases = useMemo(
    () => (plantType ? getCommonDiseases(plantType as PlantType, plantVariety || undefined) : []),
    [plantType, plantVariety],
  );

  const pruningInfo = useMemo(() => {
    if (!plantType) return null;
    const userOverride = plantType && plantVariety
      ? plantCareProfiles[plantType as PlantType]?.[plantVariety]
      : undefined;
    return getPruningTechniques(plantType as PlantType, plantVariety || undefined, userOverride);
  }, [plantType, plantVariety, plantCareProfiles]);

  const handlePestPress = useCallback(
    (name: string) => {
      const pest = getPestByName(name);
      if (pest) {
        navigation.navigate("PestDetail", { pestId: pest.id });
      }
    },
    [navigation],
  );

  const handleDiseasePress = useCallback(
    (name: string) => {
      const disease = getDiseaseByName(name);
      if (disease) {
        navigation.navigate("DiseaseDetail", { diseaseId: disease.id });
      }
    },
    [navigation],
  );

  if (!plantVariety || !plantType) return null;

  const hasPruning = pruningInfo && (pruningInfo.tips.length > 0 || pruningInfo.shapePruning || pruningInfo.flowerPruning);
  const hasPests = pests.length > 0;
  const hasDiseases = diseases.length > 0;
  const hasDescription = profile?.description;

  if (!hasPruning && !hasPests && !hasDiseases && !hasDescription) return null;

  return (
    <View style={styles.careSection}>
      <Text style={styles.sectionTitle}>📖 Care Guidance</Text>

      {hasDescription && (
        <View style={enrichedStyles.narrativeBlock}>
          <Text style={enrichedStyles.narrativeText}>{profile!.description}</Text>
        </View>
      )}

      {hasPruning && (
        <View style={enrichedStyles.narrativeBlock}>
          <View style={enrichedStyles.narrativeHeader}>
            <Ionicons name="cut-outline" size={16} color={theme.accent} />
            <Text style={enrichedStyles.narrativeTitle}>Pruning Guide</Text>
          </View>
          {pruningInfo!.tips.map((tip, i) => (
            <View key={i} style={enrichedStyles.bulletRow}>
              <Text style={enrichedStyles.bullet}>{"\u2022"}</Text>
              <Text style={enrichedStyles.bulletText}>{tip}</Text>
            </View>
          ))}
          {pruningInfo!.shapePruning && (
            <View style={enrichedStyles.techniqueRow}>
              <Text style={enrichedStyles.techniqueIcon}>{"\u2702\uFE0F"}</Text>
              <View style={enrichedStyles.flexOne}>
                <Text style={enrichedStyles.techniqueTitle}>
                  Shape pruning — {pruningInfo!.shapePruning.tip}
                </Text>
                <Text style={enrichedStyles.techniqueTiming}>
                  Best: {pruningInfo!.shapePruning.months}
                </Text>
              </View>
            </View>
          )}
          {pruningInfo!.flowerPruning && (
            <View style={enrichedStyles.techniqueRow}>
              <Text style={enrichedStyles.techniqueIcon}>{"\uD83C\uDF38"}</Text>
              <View style={enrichedStyles.flexOne}>
                <Text style={enrichedStyles.techniqueTitle}>
                  Flower pruning — {pruningInfo!.flowerPruning.tip}
                </Text>
                <Text style={enrichedStyles.techniqueTiming}>
                  Best: {pruningInfo!.flowerPruning.months}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {hasPests && (
        <View style={enrichedStyles.chipSection}>
          <View style={enrichedStyles.chipSectionHeader}>
            <Ionicons name="bug-outline" size={16} color="#f44336" />
            <Text style={enrichedStyles.chipSectionLabel}>Common Pests</Text>
          </View>
          <View style={enrichedStyles.chipRow}>
            {pests.map((name) => {
              const entry = getPestByName(name);
              return (
                <TouchableOpacity
                  key={name}
                  style={enrichedStyles.pestChip}
                  onPress={() => handlePestPress(name)}
                  activeOpacity={entry ? 0.6 : 1}
                  disabled={!entry}
                >
                  <Text style={enrichedStyles.chipEmoji}>{getPestDiseaseEmoji(name, "pest")}</Text>
                  <Text style={enrichedStyles.pestChipText}>{name}</Text>
                  {entry && (
                    <Ionicons name="chevron-forward" size={12} color={theme.textTertiary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {hasDiseases && (
        <View style={enrichedStyles.chipSection}>
          <View style={enrichedStyles.chipSectionHeader}>
            <Ionicons name="medical-outline" size={16} color="#FF9800" />
            <Text style={enrichedStyles.chipSectionLabel}>Common Diseases</Text>
          </View>
          <View style={enrichedStyles.chipRow}>
            {diseases.map((name) => {
              const entry = getDiseaseByName(name);
              return (
                <TouchableOpacity
                  key={name}
                  style={enrichedStyles.diseaseChip}
                  onPress={() => handleDiseasePress(name)}
                  activeOpacity={entry ? 0.6 : 1}
                  disabled={!entry}
                >
                  <Text style={enrichedStyles.chipEmoji}>{getPestDiseaseEmoji(name, "disease")}</Text>
                  <Text style={enrichedStyles.diseaseChipText}>{name}</Text>
                  {entry && (
                    <Ionicons name="chevron-forward" size={12} color={theme.textTertiary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
