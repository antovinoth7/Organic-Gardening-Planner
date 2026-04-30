import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  ImageStyle,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "@/theme";
import { TAB_BAR_HEIGHT } from "@/components/FloatingTabBar";
import { getPestById, getCategoryLabel } from "@/config/pests";
import { getPestImage } from "@/config/referenceAssets";
import { createStyles } from "@/styles/referenceDetailStyles";
import type {
  PestDetailScreenNavigationProp,
  PestDetailScreenRouteProp,
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

export default function PestDetailScreen(): React.JSX.Element {
  const navigation = useNavigation<PestDetailScreenNavigationProp>();
  const route = useRoute<PestDetailScreenRouteProp>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [expandedTreatment, setExpandedTreatment] = useState<number | null>(null);

  const pest = useMemo(() => getPestById(route.params.pestId), [route.params.pestId]);
  const heroImage = useMemo(
    () => (pest ? getPestImage(pest.id, pest.imageAsset) : undefined),
    [pest],
  );

  if (!pest) {
    return (
      <View style={styles.container}>
        <View style={[styles.fallbackHeader, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity style={styles.fallbackBackButton} onPress={navigation.goBack}>
            <Ionicons name="chevron-back" size={24} color={theme.textInverse} />
          </TouchableOpacity>
          <Text style={styles.fallbackTitle}>Not Found</Text>
        </View>
      </View>
    );
  }

  const seasonalEntries = pest.seasonalRisk
    ? Object.entries(pest.seasonalRisk).filter(
        (entry): entry is [string, RiskLevel] => entry[1] !== undefined,
      )
    : [];

  const heroHeight = heroImage ? 240 : 160;
  const stickyThreshold = heroHeight - 60;

  const stickyBgOpacity = scrollY.interpolate({
    inputRange: [stickyThreshold, stickyThreshold + 40],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const stickyTitleOpacity = scrollY.interpolate({
    inputRange: [stickyThreshold + 10, stickyThreshold + 40],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      {/* Sticky animated header */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: insets.top + 10,
            backgroundColor: theme.tabBarBackground,
            opacity: stickyBgOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.stickyBackButton}
          onPress={navigation.goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textInverse} />
        </TouchableOpacity>
        <Animated.Text style={[styles.stickyHeaderEmoji, { opacity: stickyTitleOpacity }]}>
          {pest.emoji}
        </Animated.Text>
        <Animated.Text
          style={[styles.stickyHeaderTitle, { opacity: stickyTitleOpacity }]}
          numberOfLines={1}
        >
          {pest.name}
        </Animated.Text>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) + 16 },
        ]}
      >
        {/* Hero — full bleed with floating back button */}
        <View style={styles.heroContainer}>
          {heroImage ? (
            <Image
              source={heroImage}
              style={styles.heroImage as ImageStyle}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.emojiFallback}>
              <Text style={styles.emojiFallbackText}>{pest.emoji}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.backButtonFloat, { top: insets.top + 10 }]}
            onPress={navigation.goBack}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color={theme.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Info block */}
        <View style={styles.infoBlock}>
          <Text style={styles.infoTitle} numberOfLines={2}>
            {pest.name}
          </Text>
          <Text style={styles.infoSubtitle}>
            {getCategoryLabel(pest.category)}
            {pest.tamilName ? ` · ${pest.tamilName}` : ""}
          </Text>
          <View style={styles.metaStrip}>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>
                {pest.emoji} {getCategoryLabel(pest.category)}
              </Text>
            </View>
            {pest.plantsAffected.length > 0 && (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>🌱 {pest.plantsAffected.length} plants</Text>
              </View>
            )}
            {seasonalEntries.length > 0 && (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>📅 {seasonalEntries.length} seasons</Text>
              </View>
            )}
          </View>
        </View>

        {/* Identification */}
        <View style={styles.firstSection}>
          <Text style={styles.sectionTitle}>🔍 Identification</Text>
          <View style={styles.seasonCard}>
            <Text style={styles.bodyText}>{pest.identification}</Text>
          </View>
        </View>

        {/* Damage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Damage</Text>
          <View style={styles.seasonCard}>
            <Text style={styles.bodyText}>{pest.damageDescription}</Text>
          </View>
        </View>

        {/* Organic Prevention */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Organic Prevention</Text>
          <View style={styles.seasonCard}>
            {pest.organicPrevention.map((item, i) => (
              <Text key={i} style={styles.bulletItem}>
                • {item}
              </Text>
            ))}
          </View>
        </View>

        {/* Organic Treatment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💊 Organic Treatment</Text>
          {pest.organicTreatments.map((t, i) => {
            const isExpanded = expandedTreatment === i;
            return (
              <TouchableOpacity
                key={i}
                style={styles.treatmentCard}
                onPress={() => setExpandedTreatment(isExpanded ? null : i)}
                activeOpacity={0.75}
              >
                <View style={styles.treatmentCardHeader}>
                  <View style={styles.treatmentCardHeaderLeft}>
                    <Text style={styles.treatmentName}>{t.name}</Text>
                    <View style={styles.treatmentMeta}>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{t.method}</Text>
                      </View>
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{t.effort}</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={theme.textTertiary}
                  />
                </View>
                {isExpanded && (t.howToApply ?? t.frequency ?? t.timing ?? t.safetyNotes) ? (
                  <>
                    <View style={styles.treatmentDetailDivider} />
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
                  </>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Seasonal Risk — 2×2 grid */}
        {seasonalEntries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📅 Seasonal Risk</Text>
            <View style={styles.seasonCard}>
            <View style={styles.seasonGrid}>
              {seasonalEntries.map(([season, level]) => {
                const colors = getRiskColor(level, theme);
                return (
                  <View key={season} style={[styles.seasonCell, { backgroundColor: colors.bg }]}>
                    <Text style={[styles.seasonCellSeason, { color: colors.text }]}>
                      {SEASON_LABELS[season] ?? season}
                    </Text>
                    <Text style={[styles.seasonCellBadge, { color: colors.text }]}>
                      {level.toUpperCase()}
                    </Text>
                  </View>
                );
              })}
            </View>
            </View>
          </View>
        )}

        {/* Plants Affected */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌱 Plants Affected</Text>
          <View style={styles.seasonCard}>
          <View style={styles.plantTagsContainer}>
            {pest.plantsAffected.map((plant) => (
              <View key={plant} style={styles.plantTag}>
                <Text style={styles.plantTagText}>{plant}</Text>
              </View>
            ))}
          </View>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
