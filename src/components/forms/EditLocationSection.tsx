import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PlantFormStateReturn, sanitizeNumberText } from "../../hooks/usePlantFormState";
import { createStyles } from "../../styles/plantFormStyles";
import { createEditStyles } from "../../styles/plantEditFormStyles";
import CollapsibleSection from "../CollapsibleSection";
import ThemedDropdown from "../ThemedDropdown";
import FloatingLabelInput from "../FloatingLabelInput";
import { sanitizeAlphaNumericSpaces, sanitizeLandmarkText } from "../../utils/textSanitizer";
import type { SpaceType } from "../../types/database.types";

interface Props {
  formState: PlantFormStateReturn;
}

export function EditLocationSection({ formState }: Props): React.JSX.Element {
  const {
    theme,
    sectionExpanded,
    setSectionExpandedState,
    showValidationErrors,
    validationErrors,
    sectionStatuses,
    parentLocation,
    setParentLocation,
    childLocation,
    setChildLocation,
    childLocationOptions,
    parentLocationOptions,
    location,
    landmarks,
    setLandmarks,
    spaceType,
    setSpaceType,
    potSize,
    setPotSize,
    bedName,
    setBedName,
  } = formState;

  const styles = useMemo(() => createStyles(theme), [theme]);
  const editStyles = useMemo(() => createEditStyles(theme), [theme]);

  return (
    <CollapsibleSection
      title="Location & Placement"
      icon="location"
      defaultExpanded={true}
      expanded={sectionExpanded.location}
      onExpandedChange={(expanded) => setSectionExpandedState("location", expanded)}
      hasError={showValidationErrors && validationErrors.location.length > 0}
      sectionStatus={showValidationErrors ? undefined : sectionStatuses.location}
    >
      <ThemedDropdown
        items={[
          { label: "Select Main Location", value: "" },
          ...parentLocationOptions.map((loc) => ({ label: loc, value: loc })),
        ]}
        selectedValue={parentLocation}
        onValueChange={(value) => {
          setParentLocation(value);
          if (!value) setChildLocation("");
        }}
        label="Location"
        placeholder="Location"
      />

      {parentLocation !== "" && (
        <View style={styles.directionChipsWrapper}>
          <Text style={styles.directionChipsFloatingLabel}>
            Direction / Section{" "}
          </Text>
          <View style={styles.directionChipsContainer}>
            {childLocationOptions.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[
                  styles.directionChip,
                  childLocation === loc && styles.directionChipActive,
                ]}
                onPress={() => setChildLocation(loc)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.directionChipText,
                    childLocation === loc && styles.directionChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {location ? (
        <View style={styles.locationPreview}>
          <Ionicons name="location" size={16} color={theme.primary} />
          <Text style={styles.locationPreviewText}>{location}</Text>
        </View>
      ) : null}

      <FloatingLabelInput
        label="Nearby landmark or reference point"
        value={landmarks}
        onChangeText={(text) => setLandmarks(sanitizeLandmarkText(text))}
      />

      <View style={styles.fieldGroupDivider} />
      <Text style={styles.fieldGroupLabel}>{"\uD83E\uDEB4"} Growing Space</Text>

      <View style={styles.spaceTypeCardsRow}>
        {(
          [
            { value: "ground" as SpaceType, icon: "earth" as const, label: "Ground", hint: "Open soil" },
            { value: "bed" as SpaceType, icon: "apps" as const, label: "Raised Bed", hint: "Bed / Border" },
            { value: "pot" as SpaceType, icon: "cube-outline" as const, label: "Pot", hint: "Container" },
          ]
        ).map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.spaceTypeCard,
              spaceType === opt.value && styles.spaceTypeCardActive,
            ]}
            onPress={() => setSpaceType(opt.value)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={opt.icon}
              size={28}
              color={spaceType === opt.value ? theme.primary : theme.textTertiary}
              style={styles.spaceTypeCardIcon}
            />
            <Text
              style={[
                styles.spaceTypeCardLabel,
                spaceType === opt.value && styles.spaceTypeCardLabelActive,
              ]}
            >
              {opt.label}
            </Text>
            <Text style={editStyles.spaceTypeCardHint}>
              {opt.hint}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {spaceType === "pot" && (
        <FloatingLabelInput
          label="Pot Size in inches (e.g., 12)"
          value={potSize}
          onChangeText={(text) => setPotSize(sanitizeNumberText(text))}
          keyboardType="numeric"
        />
      )}
      {spaceType === "bed" && (
        <FloatingLabelInput
          label="Bed Name (e.g., Veggie Bed 1)"
          value={bedName}
          onChangeText={(text) => setBedName(sanitizeAlphaNumericSpaces(text))}
        />
      )}
    </CollapsibleSection>
  );
}
