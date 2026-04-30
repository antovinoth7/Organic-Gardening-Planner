import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createStyles } from "@/styles/plantDetailStyles";
import { createEnrichedSectionStyles } from "@/styles/enrichedSectionStyles";
import { getPlantCareProfile } from "@/utils/plantCareDefaults";
import type { PlantType, PlantCareProfiles, FeedingIntensity } from "@/types/database.types";
import type { Theme } from "@/theme/colors";

interface Props {
  theme: Theme;
  plantType: string;
  plantVariety: string;
  plantCareProfiles: Partial<PlantCareProfiles>;
}

const FEEDING_CONFIG: Record<FeedingIntensity, { label: string; color: string; icon: React.ComponentProps<typeof Ionicons>["name"] }> = {
  light: { label: "Light Feeder", color: "#4CAF50", icon: "leaf-outline" },
  medium: { label: "Medium Feeder", color: "#FF9800", icon: "nutrition-outline" },
  heavy: { label: "Heavy Feeder", color: "#f44336", icon: "flame-outline" },
};

export function DetailNutritionSection({ theme, plantType, plantVariety, plantCareProfiles }: Props): React.JSX.Element | null {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const enrichedStyles = useMemo(() => createEnrichedSectionStyles(theme), [theme]);

  const profile = useMemo(() => {
    if (!plantVariety) return null;
    const overrides = plantType
      ? { [plantType]: plantCareProfiles[plantType as PlantType] ?? {} }
      : undefined;
    return getPlantCareProfile(plantVariety, plantType as PlantType, overrides);
  }, [plantVariety, plantType, plantCareProfiles]);

  if (!profile || !plantVariety) return null;

  const hasVitamins = profile.vitamins && profile.vitamins.length > 0;
  const hasMinerals = profile.minerals && profile.minerals.length > 0;
  const hasFeedingIntensity = profile.feedingIntensity != null;

  if (!hasVitamins && !hasMinerals && !hasFeedingIntensity) return null;

  const feedingCfg = profile.feedingIntensity ? FEEDING_CONFIG[profile.feedingIntensity] : null;

  return (
    <View style={styles.careSection}>
      <Text style={styles.sectionTitle}>🥗 Nutrition</Text>
      {feedingCfg && (
        <View style={[enrichedStyles.feedingBadge, { borderColor: feedingCfg.color }]}>
          <Ionicons name={feedingCfg.icon} size={16} color={feedingCfg.color} />
          <Text style={[enrichedStyles.feedingBadgeText, { color: feedingCfg.color }]}>
            {feedingCfg.label}
          </Text>
        </View>
      )}

      {hasVitamins && (
        <View style={enrichedStyles.chipSection}>
          <Text style={enrichedStyles.chipSectionLabel}>Vitamins</Text>
          <View style={enrichedStyles.chipRow}>
            {profile.vitamins!.map((v) => (
              <View key={v} style={enrichedStyles.vitaminChip}>
                <Text style={enrichedStyles.vitaminChipText}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {hasMinerals && (
        <View style={enrichedStyles.chipSection}>
          <Text style={enrichedStyles.chipSectionLabel}>Minerals</Text>
          <View style={enrichedStyles.chipRow}>
            {profile.minerals!.map((m) => (
              <View key={m} style={enrichedStyles.mineralChip}>
                <Text style={enrichedStyles.mineralChipText}>{m}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
