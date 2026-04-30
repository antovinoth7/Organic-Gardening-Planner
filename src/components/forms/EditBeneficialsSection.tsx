import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createEnrichedSectionStyles } from "../../styles/enrichedSectionStyles";
import CollapsibleSection from "../CollapsibleSection";
import type { Theme } from "../../theme/colors";

interface Props {
  theme: Theme;
  plantVariety: string;
}

export function EditBeneficialsSection({ theme, plantVariety }: Props): React.JSX.Element | null {
  const enrichedStyles = useMemo(() => createEnrichedSectionStyles(theme), [theme]);

  if (!plantVariety) return null;

  return (
    <CollapsibleSection
      title="Beneficial Critters"
      icon="bug"
      defaultExpanded={false}
      sectionStatus="optional"
    >
      <View style={enrichedStyles.emptyState}>
        <Ionicons name="sparkles-outline" size={28} color={theme.textTertiary} />
        <Text style={enrichedStyles.emptyStateText}>
          Beneficial critter data coming soon
        </Text>
        <Text style={enrichedStyles.emptyStateSubtext}>
          Ladybirds, earthworms, pollinators and more — added in a future update.
        </Text>
      </View>
    </CollapsibleSection>
  );
}
