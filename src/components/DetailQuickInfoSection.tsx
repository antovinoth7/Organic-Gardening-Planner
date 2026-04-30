import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createStyles } from "@/styles/plantDetailStyles";
import { createEnrichedSectionStyles } from "@/styles/enrichedSectionStyles";
import { getPlantCareProfile } from "@/utils/plantCareDefaults";
import type { NumericRange, PlantType, PlantCareProfiles } from "@/types/database.types";
import type { Theme } from "@/theme/colors";

interface Props {
  theme: Theme;
  plantType: string;
  plantVariety: string;
  plantCareProfiles: Partial<PlantCareProfiles>;
}

function formatRange(range: NumericRange | undefined, unit: string): string | null {
  if (!range) return null;
  return range.min === range.max
    ? `${range.min} ${unit}`
    : `${range.min}–${range.max} ${unit}`;
}

function formatNumber(value: number | undefined, unit: string): string | null {
  if (value == null) return null;
  return `${value} ${unit}`;
}

interface StatItem {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
}

export function DetailQuickInfoSection({ theme, plantType, plantVariety, plantCareProfiles }: Props): React.JSX.Element | null {
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

  const stats: StatItem[] = [];

  const harvestDays = formatRange(profile.daysToHarvest, "days");
  if (harvestDays) stats.push({ icon: "timer-outline", label: "Days to Harvest", value: harvestDays });

  if (profile.yearsToFirstHarvest != null) {
    stats.push({ icon: "hourglass-outline", label: "Years to First Harvest", value: `${profile.yearsToFirstHarvest} years` });
  }

  const height = formatRange(profile.heightCm, "cm");
  if (height) stats.push({ icon: "resize-outline", label: "Height", value: height });

  const spacing = formatNumber(profile.spacingCm, "cm");
  if (spacing) stats.push({ icon: "grid-outline", label: "Spacing", value: spacing });

  const depth = formatNumber(profile.plantingDepthCm, "cm");
  if (depth) stats.push({ icon: "arrow-down-outline", label: "Planting Depth", value: depth });

  if (profile.growingSeason) {
    stats.push({ icon: "sunny-outline", label: "Growing Season", value: profile.growingSeason });
  }

  const germDays = formatRange(profile.germinationDays, "days");
  if (germDays) stats.push({ icon: "leaf-outline", label: "Germination", value: germDays });

  const germTemp = formatRange(profile.germinationTempC, "°C");
  if (germTemp) stats.push({ icon: "thermometer-outline", label: "Germ. Temp", value: germTemp });

  const soilPh = formatRange(profile.soilPhRange, "pH");
  if (soilPh) stats.push({ icon: "flask-outline", label: "Soil pH", value: soilPh });

  if (stats.length === 0) return null;

  return (
    <View style={styles.careSection}>
      <Text style={styles.sectionTitle}>📊 Growing Profile</Text>
      <View style={enrichedStyles.statGrid}>
        {stats.map((stat) => (
          <View key={stat.label} style={enrichedStyles.statGridItem}>
            <View style={enrichedStyles.statIconRow}>
              <Ionicons name={stat.icon} size={16} color={theme.primary} />
              <Text style={enrichedStyles.statLabel}>{stat.label}</Text>
            </View>
            <Text style={enrichedStyles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
