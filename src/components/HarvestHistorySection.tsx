import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { JournalEntry, PlantType } from "../types/database.types";

interface HarvestHistorySectionProps {
  plantType: PlantType;
  harvestEntries: JournalEntry[];
  styles: any;
  theme: any;
  onRecordHarvest: () => void;
  onViewAll: () => void;
}

export default function HarvestHistorySection({
  plantType,
  harvestEntries,
  styles,
  theme,
  onRecordHarvest,
  onViewAll,
}: HarvestHistorySectionProps) {
  if (plantType !== "fruit_tree" && plantType !== "coconut_tree") {
    return null;
  }

  return (
    <View style={styles.harvestSection}>
      <View style={styles.harvestHeader}>
        <Text style={styles.sectionTitle}>🧺 Harvest History</Text>
        {harvestEntries.length > 0 && (
          <TouchableOpacity onPress={onRecordHarvest}>
            <Ionicons name="add-circle" size={24} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>
      {harvestEntries.length > 0 ? (
        <>
          {/* Harvest Statistics */}
          <View style={styles.harvestStats}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{harvestEntries.length}</Text>
              <Text style={styles.statLabel}>Harvests</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {harvestEntries
                  .reduce((sum, e) => sum + (e.harvest_quantity || 0), 0)
                  .toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>
                Total {harvestEntries[0]?.harvest_unit || "units"}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {(
                  harvestEntries.reduce(
                    (sum, e) => sum + (e.harvest_quantity || 0),
                    0,
                  ) / harvestEntries.length
                ).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Avg/harvest</Text>
            </View>
            {plantType === "coconut_tree" &&
              harvestEntries.length > 0 &&
              (() => {
                const lastHarvestDate = new Date(
                  harvestEntries[0].created_at,
                );
                const nextHarvestDate = new Date(lastHarvestDate);
                nextHarvestDate.setMonth(nextHarvestDate.getMonth() + 2);
                const daysUntil = Math.ceil(
                  (nextHarvestDate.getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24),
                );
                return (
                  <View style={styles.statCard}>
                    <Text
                      style={[
                        styles.statValue,
                        {
                          fontSize: 18,
                          color:
                            daysUntil <= 7
                              ? theme.success
                              : theme.textSecondary,
                        },
                      ]}
                    >
                      {daysUntil > 0 ? `${daysUntil}d` : "Ready"}
                    </Text>
                    <Text style={styles.statLabel}>Next harvest</Text>
                  </View>
                );
              })()}
          </View>

          {/* Recent Harvests */}
          <Text style={styles.recentTitle}>Recent Harvests</Text>
          {harvestEntries.slice(0, 5).map((entry) => (
            <View key={entry.id} style={styles.harvestItem}>
              <View style={styles.harvestLeft}>
                <Text style={styles.harvestDate}>
                  {new Date(entry.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
                <Text style={styles.harvestQuantity}>
                  {entry.harvest_quantity} {entry.harvest_unit}
                </Text>
              </View>
              <View style={styles.harvestRight}>
                {entry.harvest_quality && (
                  <Text style={styles.qualityBadge}>
                    {entry.harvest_quality === "excellent"
                      ? "🌟"
                      : entry.harvest_quality === "good"
                        ? "👍"
                        : entry.harvest_quality === "fair"
                          ? "👌"
                          : "👎"}
                  </Text>
                )}
              </View>
            </View>
          ))}

          {harvestEntries.length > 5 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={onViewAll}
            >
              <Text style={styles.viewAllText}>View All in Journal</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.primary}
              />
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.emptyHarvest}>
          <Ionicons name="basket-outline" size={48} color={theme.border} />
          <Text style={styles.emptyHarvestText}>
            No harvests recorded yet
          </Text>
          <TouchableOpacity
            style={styles.addHarvestButton}
            onPress={onRecordHarvest}
          >
            <Text style={styles.addHarvestButtonText}>
              Record First Harvest
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
