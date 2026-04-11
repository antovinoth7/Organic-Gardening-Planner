import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PestDiseaseRecord } from "../types/database.types";
import { getPestDiseaseEmoji } from "../utils/plantHelpers";
import { createStyles } from "../styles/plantDetailStyles";
import { createStyles as createLocalStyles } from "../styles/pestDiseaseHistorySectionStyles";
import { useTheme } from "../theme";
import type { Theme } from "../theme/colors";

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
}: PestDiseaseHistorySectionProps): React.JSX.Element {
  const theme = useTheme() as Theme;
  const localStyles = useMemo(() => createLocalStyles(theme), [theme]);
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
                  record.resolved
                    ? localStyles.pestCardResolved
                    : localStyles.pestCardUnresolved,
                ]}
              >
                <View style={styles.pestCardHeader}>
                  <Ionicons
                    name={record.type === "pest" ? "bug" : "medical"}
                    size={18}
                    color={record.resolved ? theme.success : theme.error}
                  />
                  <Text style={styles.pestCardName}>{getPestDiseaseEmoji(record.name, record.type)} {record.name}</Text>
                  {record.severity && (
                    <View
                      style={[
                        styles.severityBadge,
                        record.severity === "high"
                          ? localStyles.severityHighBg
                          : record.severity === "medium"
                            ? localStyles.severityMediumBg
                            : localStyles.severityLowBg,
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityText,
                          record.severity === "high"
                            ? localStyles.severityHighText
                            : record.severity === "medium"
                              ? localStyles.severityMediumText
                              : localStyles.severityLowText,
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
                        color={theme.success}
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
                  color={theme.warning}
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
