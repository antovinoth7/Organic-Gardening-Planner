import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, ImageStyle } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "@/theme";
import { TAB_BAR_HEIGHT } from "@/components/FloatingTabBar";
import { getDiseaseById, getCategoryLabel } from "@/config/diseases";
import { getDiseaseImage } from "@/config/referenceAssets";
import { createStyles } from "@/styles/referenceDetailStyles";
import type {
  DiseaseDetailScreenNavigationProp,
  DiseaseDetailScreenRouteProp,
} from "@/types/navigation.types";
import type { RiskLevel } from "@/types/database.types";
import type { Theme } from "@/theme/colors";

const SEASON_LABELS: Record<string, string> = {
  summer: "Summer (Mar–May)",
  sw_monsoon: "SW Monsoon (Jun–Sep)",
  ne_monsoon: "NE Monsoon (Oct–Dec)",
  cool_dry: "Cool Dry (Jan–Feb)",
};

function getRiskColor(level: RiskLevel, theme: Theme): { bg: string; text: string } {
  switch (level) {
    case "high":
      return { bg: theme.errorLight, text: theme.error };
    case "moderate":
      return { bg: theme.warningLight, text: theme.warning };
    case "low":
      return { bg: theme.primaryLight, text: theme.primary };
  }
}

export default function DiseaseDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<DiseaseDetailScreenNavigationProp>();
  const route = useRoute<DiseaseDetailScreenRouteProp>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const disease = useMemo(
    () => getDiseaseById(route.params.diseaseId),
    [route.params.diseaseId],
  );
  const heroImage = useMemo(
    () => (disease ? getDiseaseImage(disease.id, disease.imageAsset) : undefined),
    [disease],
  );

  if (!disease) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.backButton} onPress={navigation.goBack}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Not Found</Text>
          </View>
        </View>
      </View>
    );
  }

  const seasonalEntries = disease.seasonalRisk
    ? Object.entries(disease.seasonalRisk).filter(
        (entry): entry is [string, RiskLevel] => entry[1] !== undefined,
      )
    : [];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={navigation.goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerEmoji}>{disease.emoji}</Text>
        <View style={styles.headerContent}>
          <Text style={styles.title} numberOfLines={2}>
            {disease.name}
          </Text>
          <Text style={styles.subtitle}>
            {getCategoryLabel(disease.category)}
            {disease.tamilName ? ` · ${disease.tamilName}` : ""}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) + 16 },
        ]}
      >
        {/* Hero image or emoji fallback */}
        {heroImage ? (
          <Image
            source={heroImage}
            style={styles.heroImage as ImageStyle}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.emojiFallback}>
            <Text style={styles.emojiFallbackText}>{disease.emoji}</Text>
          </View>
        )}

        {/* Identification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Identification</Text>
          <Text style={styles.bodyText}>{disease.identification}</Text>
        </View>

        {/* Damage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Damage</Text>
          <Text style={styles.bodyText}>{disease.damageDescription}</Text>
        </View>

        {/* Organic Prevention */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Organic Prevention</Text>
          {disease.organicPrevention.map((item, i) => (
            <Text key={i} style={styles.bulletItem}>
              • {item}
            </Text>
          ))}
        </View>

        {/* Organic Treatment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💊 Organic Treatment</Text>
          {disease.organicTreatments.map((t, i) => (
            <View key={i} style={styles.treatmentCard}>
              <Text style={styles.treatmentName}>{t.name}</Text>
              <View style={styles.treatmentMeta}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t.method}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{t.effort}</Text>
                </View>
              </View>
              {(t.howToApply ?? t.frequency ?? t.timing ?? t.safetyNotes) ? (
                <View style={styles.treatmentDetailDivider} />
              ) : null}
              {t.howToApply ? (
                <View style={styles.treatmentDetailRow}>
                  <Text style={styles.treatmentDetailLabel}>How to apply</Text>
                  <Text style={styles.treatmentDetailValue}>{t.howToApply}</Text>
                </View>
              ) : null}
              {t.frequency ? (
                <View style={styles.treatmentDetailRow}>
                  <Text style={styles.treatmentDetailLabel}>Frequency</Text>
                  <Text style={styles.treatmentDetailValue}>{t.frequency}</Text>
                </View>
              ) : null}
              {t.timing ? (
                <View style={styles.treatmentDetailRow}>
                  <Text style={styles.treatmentDetailLabel}>Timing</Text>
                  <Text style={styles.treatmentDetailValue}>{t.timing}</Text>
                </View>
              ) : null}
              {t.safetyNotes ? (
                <View style={styles.treatmentDetailRow}>
                  <Text style={styles.treatmentDetailLabel}>Notes</Text>
                  <Text style={styles.treatmentDetailValue}>{t.safetyNotes}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>

        {/* Seasonal Risk */}
        {seasonalEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Seasonal Risk</Text>
            {seasonalEntries.map(([season, level]) => {
              const colors = getRiskColor(level, theme);
              return (
                <View key={season} style={styles.riskRow}>
                  <Text style={styles.riskSeason}>
                    {SEASON_LABELS[season] ?? season}
                  </Text>
                  <View style={[styles.riskBadge, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.riskBadgeText, { color: colors.text }]}>
                      {level}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Plants Affected */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌱 Plants Affected</Text>
          <View style={styles.plantTagsContainer}>
            {disease.plantsAffected.map((plant) => (
              <View key={plant} style={styles.plantTag}>
                <Text style={styles.plantTagText}>{plant}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
