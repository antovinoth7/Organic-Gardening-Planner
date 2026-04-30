import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PlantFormStateReturn } from "../../hooks/usePlantFormState";
import { createEnrichedSectionStyles } from "../../styles/enrichedSectionStyles";
import { getPlantCareProfile } from "../../utils/plantCareDefaults";
import type { PlantType } from "../../types/database.types";

interface Props {
  formState: PlantFormStateReturn;
}

export function EditSafetySection({ formState }: Props): React.JSX.Element | null {
  const { theme, plantType, plantVariety, plantCareProfiles } = formState;
  const enrichedStyles = useMemo(() => createEnrichedSectionStyles(theme), [theme]);

  const profile = useMemo(() => {
    if (!plantVariety) return null;
    const overrides = plantType
      ? { [plantType]: plantCareProfiles[plantType as PlantType] ?? {} }
      : undefined;
    return getPlantCareProfile(plantVariety, plantType as PlantType, overrides);
  }, [plantVariety, plantType, plantCareProfiles]);

  if (!profile || !profile.petToxicity) return null;

  return (
    <View style={enrichedStyles.safetyBanner}>
      <View style={enrichedStyles.safetyIconWrap}>
        <Ionicons name="warning" size={20} color="#f44336" />
      </View>
      <View style={enrichedStyles.safetyContent}>
        <Text style={enrichedStyles.safetyTitle}>Toxic to Pets</Text>
        <Text style={enrichedStyles.safetyText}>
          {plantVariety} can be harmful to cats and dogs if ingested. Keep out of reach of pets.
        </Text>
      </View>
    </View>
  );
}
