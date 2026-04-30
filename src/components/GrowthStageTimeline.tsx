import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/theme";
import { createStyles } from "@/styles/growthStageTimelineStyles";
import type {
  GrowthStage,
  GrowthStageDurations,
  AnnualCycleDurations,
} from "@/types/database.types";
import type { EffectiveGrowthStage } from "@/utils/plantHelpers";

const STAGE_ORDER: GrowthStage[] = [
  "seedling",
  "vegetative",
  "flowering",
  "fruiting",
  "dormant",
  "mature",
];

const STAGE_LABELS: Record<GrowthStage, string> = {
  seedling: "Seedling",
  vegetative: "Vegetative",
  flowering: "Flowering",
  fruiting: "Fruiting",
  dormant: "Dormant",
  mature: "Mature",
};

const STAGE_ICONS: Record<GrowthStage, string> = {
  seedling: "🌱",
  vegetative: "🌿",
  flowering: "🌸",
  fruiting: "🍅",
  dormant: "😴",
  mature: "🌳",
};

interface Props {
  effectiveStage: EffectiveGrowthStage;
  plantingDate?: string | null;
  durations?: GrowthStageDurations;
  annualCycleDurations?: AnnualCycleDurations;
  isPinned: boolean;
}

function formatEstimatedDate(plantingDate: string, daysFromPlanting: number): string {
  const date = new Date(plantingDate + "T12:00:00");
  date.setDate(date.getDate() + daysFromPlanting);
  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const GrowthStageTimeline: React.FC<Props> = ({
  effectiveStage,
  plantingDate,
  durations,
  annualCycleDurations,
  isPinned,
}) => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Determine which duration source to use for the timeline
  const isAnnualCycle = effectiveStage.source === "annual_cycle";
  const activeDurations = isAnnualCycle ? annualCycleDurations : durations;

  // Build the list of stages to show based on available durations
  const stages = useMemo(() => {
    if (!activeDurations) return [];
    return STAGE_ORDER.filter(
      (s) => activeDurations[s] !== undefined && activeDurations[s]! > 0,
    );
  }, [activeDurations]);

  // Find current stage index
  const currentIndex = stages.indexOf(effectiveStage.stage);

  // Pre-compute accumulated days for date estimates
  const accumulatedDays = useMemo(() => {
    if (!activeDurations || stages.length === 0) return [];
    let sum = 0;
    return stages.map((s) => {
      const start = sum;
      sum += activeDurations[s] ?? 0;
      return start;
    });
  }, [stages, activeDurations]);

  if (stages.length === 0) return null;

  return (
    <View style={styles.container}>
      {stages.map((stage, index) => {
        const isCompleted = currentIndex >= 0 && index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = currentIndex >= 0 ? index > currentIndex : true;

        const dotStyle = [
          styles.dot,
          isCompleted && styles.dotCompleted,
          isCurrent && styles.dotCurrent,
          isFuture && styles.dotFuture,
        ];

        const lineStyle = [
          styles.line,
          isCompleted && styles.lineCompleted,
          isCurrent && styles.lineCurrent,
          isFuture && styles.lineFuture,
        ];

        const labelStyle = [
          styles.stageLabel,
          isCurrent && styles.stageLabelCurrent,
          isFuture && styles.stageLabelFuture,
        ];

        // Estimate date for this stage
        let dateLabel = "";
        if (plantingDate && accumulatedDays[index] !== undefined && !isAnnualCycle) {
          dateLabel = formatEstimatedDate(plantingDate, accumulatedDays[index]!);
        }

        return (
          <View key={stage} style={styles.row}>
            {/* Timeline line column */}
            <View style={styles.lineColumn}>
              {index > 0 && <View style={lineStyle} />}
              <View style={dotStyle}>
                {isCompleted && (
                  <Ionicons
                    name="checkmark"
                    size={10}
                    color={theme.textInverse}
                    style={styles.checkIcon}
                  />
                )}
              </View>
              {index < stages.length - 1 && <View style={lineStyle} />}
            </View>

            {/* Content column */}
            <View style={styles.content}>
              <Text style={labelStyle}>
                {STAGE_ICONS[stage]} {STAGE_LABELS[stage]}
              </Text>

              {dateLabel ? (
                <Text style={styles.dateText}>
                  {isCompleted ? "Started" : isCurrent ? "Since" : "Expected"}{" "}
                  {dateLabel}
                </Text>
              ) : null}

              {isCurrent && effectiveStage.percentComplete !== undefined && (
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(100, effectiveStage.percentComplete)}%` },
                    ]}
                  />
                </View>
              )}

              {isCurrent && isPinned && (
                <View style={styles.pinnedBadge}>
                  <Ionicons name="pin" size={12} color={theme.accent} />
                  <Text style={styles.pinnedText}>Pinned by you</Text>
                </View>
              )}

              {isCurrent && isAnnualCycle && !isPinned && (
                <Text style={styles.sourceTag}>Annual cycle</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default GrowthStageTimeline;
