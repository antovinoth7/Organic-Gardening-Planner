import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PlantFormStateReturn } from "../../hooks/usePlantFormState";
import { createEnrichedSectionStyles } from "../../styles/enrichedSectionStyles";
import CollapsibleSection from "../CollapsibleSection";
import {
  getCompanionSuggestions,
  getIncompatiblePlants,
  getPlantEmoji,
} from "../../utils/plantHelpers";

interface Props {
  formState: PlantFormStateReturn;
}

export function EditRelationshipsSection({ formState }: Props): React.JSX.Element | null {
  const { theme, plantVariety } = formState;
  const enrichedStyles = useMemo(() => createEnrichedSectionStyles(theme), [theme]);

  const companions = useMemo(
    () => (plantVariety ? getCompanionSuggestions(plantVariety) : []),
    [plantVariety],
  );
  const incompatible = useMemo(
    () => (plantVariety ? getIncompatiblePlants(plantVariety) : []),
    [plantVariety],
  );

  if (!plantVariety || (companions.length === 0 && incompatible.length === 0)) return null;

  return (
    <CollapsibleSection
      title="Companion Plants"
      icon="people"
      defaultExpanded={false}
      sectionStatus="optional"
    >
      {companions.length > 0 && (
        <View style={enrichedStyles.chipSection}>
          <View style={enrichedStyles.chipSectionHeader}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={enrichedStyles.chipSectionLabel}>Good Companions</Text>
          </View>
          <View style={enrichedStyles.chipRow}>
            {companions.map((name) => (
              <View key={name} style={enrichedStyles.companionChip}>
                <Text style={enrichedStyles.chipEmoji}>{getPlantEmoji(name)}</Text>
                <Text style={enrichedStyles.companionChipText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {incompatible.length > 0 && (
        <View style={enrichedStyles.chipSection}>
          <View style={enrichedStyles.chipSectionHeader}>
            <Ionicons name="close-circle" size={16} color="#f44336" />
            <Text style={enrichedStyles.chipSectionLabel}>Avoid Planting With</Text>
          </View>
          <View style={enrichedStyles.chipRow}>
            {incompatible.map((name) => (
              <View key={name} style={enrichedStyles.incompatibleChip}>
                <Text style={enrichedStyles.chipEmoji}>{getPlantEmoji(name)}</Text>
                <Text style={enrichedStyles.incompatibleChipText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </CollapsibleSection>
  );
}
