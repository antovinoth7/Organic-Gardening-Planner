import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PestDiseaseRecord } from "../types/database.types";
import { getPestDiseaseEmoji } from "../utils/plantHelpers";
import { createStyles } from "../styles/plantDetailStyles";

interface SeasonalPestAlert {
  type: "pest" | "disease";
  issue: string;
  tip: string;
}

interface PestDiseaseHistorySectionProps {
  records: PestDiseaseRecord[];
  seasonalAlerts: SeasonalPestAlert[];
  styles: ReturnType<typeof createStyles>;
}

export default function PestDiseaseHistorySection({
  records,
  seasonalAlerts,
  styles,
}: PestDiseaseHistorySectionProps) {
  return (
    <>
      {records.length > 0 && (
        <View style={styles.careSection}>
          <Text style={styles.sectionTitle}>🐛 Pest & Disease History</Text>
          {records
            .slice()
            .sort((a, b) =>
              a.resolved === b.resolved ? 0 : a.resolved ? 1 : -1,
            )
            .map((record, index) => (
              <View
                key={record.id || index}
                style={[
                  styles.pestCard,
                  {
                    borderLeftColor: record.resolved ? "#4CAF50" : "#f44336",
                  },
                ]}
              >
                <View style={styles.pestCardHeader}>
                  <Ionicons
                    name={record.type === "pest" ? "bug" : "medical"}
                    size={18}
                    color={record.resolved ? "#4CAF50" : "#f44336"}
                  />
                  <Text style={styles.pestCardName}>{getPestDiseaseEmoji(record.name, record.type)} {record.name}</Text>
                  {record.severity && (
                    <View
                      style={[
                        styles.severityBadge,
                        {
                          backgroundColor:
                            record.severity === "high"
                              ? "#FFEBEE"
                              : record.severity === "medium"
                                ? "#FFF3E0"
                                : "#E8F5E9",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityText,
                          {
                            color:
                              record.severity === "high"
                                ? "#C62828"
                                : record.severity === "medium"
                                  ? "#E65100"
                                  : "#2E7D32",
                          },
                        ]}
                      >
                        {record.severity.toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {record.resolved && (
                    <View style={styles.resolvedBadgeDetail}>
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color="#4CAF50"
                      />
                      <Text style={styles.resolvedTextDetail}>Resolved</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.pestCardDate}>
                  {new Date(record.occurredAt).toLocaleDateString()}
                  {record.resolvedAt &&
                    ` — Resolved ${new Date(record.resolvedAt).toLocaleDateString()}`}
                </Text>
                {record.affectedPart && (
                  <Text style={styles.pestCardMeta}>
                    Affected: {record.affectedPart}
                  </Text>
                )}
                {record.treatment && (
                  <Text style={styles.pestCardMeta}>
                    Treatment: {record.treatment}
                    {record.treatmentEffectiveness && (
                      <>
                        {"  "}
                        {record.treatmentEffectiveness === "effective"
                          ? "✅"
                          : record.treatmentEffectiveness ===
                              "partially_effective"
                            ? "⚠️"
                            : "❌"}{" "}
                        {record.treatmentEffectiveness === "effective"
                          ? "Effective"
                          : record.treatmentEffectiveness ===
                              "partially_effective"
                            ? "Partial"
                            : "Ineffective"}
                      </>
                    )}
                  </Text>
                )}
                {record.notes && (
                  <Text style={styles.pestCardNotes}>{record.notes}</Text>
                )}
              </View>
            ))}
        </View>
      )}

      {seasonalAlerts.length > 0 && (
        <View style={styles.careSection}>
          <Text style={styles.sectionTitle}>⚠️ Seasonal Pest Alerts</Text>
          {seasonalAlerts.map((alert, index) => (
            <View key={index} style={styles.seasonAlertCard}>
              <View style={styles.pestCardHeader}>
                <Ionicons
                  name={alert.type === "pest" ? "bug" : "medical"}
                  size={16}
                  color="#E65100"
                />
                <Text style={styles.seasonAlertName}>{alert.issue}</Text>
                <View style={styles.seasonAlertTypeBadge}>
                  <Text style={styles.seasonAlertTypeText}>
                    {alert.type === "pest" ? "Pest" : "Disease"}
                  </Text>
                </View>
              </View>
              <Text style={styles.seasonAlertTip}>{alert.tip}</Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
}
