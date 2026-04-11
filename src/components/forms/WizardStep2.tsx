import React, { useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PlantFormStateReturn, sanitizeNumberText } from "../../hooks/usePlantFormState";
import { createStyles } from "../../styles/plantFormStyles";
import { createWizardStyles } from "../../styles/plantAddWizardStyles";
import ThemedDropdown from "../ThemedDropdown";
import FloatingLabelInput from "../FloatingLabelInput";
import { sanitizeAlphaNumericSpaces, sanitizeLandmarkText } from "../../utils/textSanitizer";
import type { SpaceType } from "../../types/database.types";

interface Props {
  formState: PlantFormStateReturn;
}

export function WizardStep2({ formState }: Props): React.JSX.Element {
  const {
    theme,
    parentLocationOptions,
    parentLocation,
    setParentLocation,
    childLocation,
    setChildLocation,
    childLocationOptions,
    location,
    landmarks,
    setLandmarks,
    spaceType,
    setSpaceType,
    potSize,
    setPotSize,
    bedName,
    setBedName,
    locationDefaultsFired,
    autoSuggestFired,
    generatedPlantName,
    showCustomNameInput,
    setShowCustomNameInput,
    name,
    setName,
  } = formState;

  const formStyles = useMemo(() => createStyles(theme), [theme]);
  const wizardStyles = useMemo(() => createWizardStyles(theme), [theme]);

  return (
    <View>
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

      {locationDefaultsFired && !autoSuggestFired && (
        <Text style={formStyles.locationDefaultsHint}>
          Soil defaults applied from location profile
        </Text>
      )}

      {parentLocation !== "" && (
        <View style={formStyles.directionChipsWrapper}>
          <Text style={formStyles.directionChipsFloatingLabel}>
            Direction / Section{" "}
          </Text>
          <View style={formStyles.directionChipsContainer}>
            {childLocationOptions.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[
                  formStyles.directionChip,
                  childLocation === loc && formStyles.directionChipActive,
                ]}
                onPress={() => setChildLocation(loc)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    formStyles.directionChipText,
                    childLocation === loc &&
                      formStyles.directionChipTextActive,
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
        <View style={formStyles.locationPreview}>
          <Ionicons name="location" size={16} color={theme.primary} />
          <Text style={formStyles.locationPreviewText}>{location}</Text>
        </View>
      ) : null}

      <FloatingLabelInput
        label="Nearby landmark or reference point"
        value={landmarks}
        onChangeText={(text) => setLandmarks(sanitizeLandmarkText(text))}
      />
      <View style={formStyles.fieldGroupDivider} />

      {!showCustomNameInput ? (
        <View style={formStyles.namePreviewRow}>
          <Text style={formStyles.namePreviewFloatingLabel}>
            Plant nickname
          </Text>
          {generatedPlantName ? (
            <Text style={formStyles.namePreviewValue} numberOfLines={1}>
              {generatedPlantName}
            </Text>
          ) : (
            <Text style={formStyles.namePreviewValuePending}>
              Auto after choosing plant &amp; location above
            </Text>
          )}
          <TouchableOpacity
            style={formStyles.namePreviewActionCustom}
            onPress={() => setShowCustomNameInput(true)}
            activeOpacity={0.7}
          >
            <Text style={formStyles.namePreviewActionTextMuted}>
              Customise
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={formStyles.nameCustomRow}>
          <Text style={formStyles.namePreviewFloatingLabel}>
            Plant nickname
          </Text>
          <TextInput
            style={formStyles.nameCustomInput}
            placeholder={generatedPlantName || "Enter a custom name"}
            value={name}
            onChangeText={(text) => setName(sanitizeAlphaNumericSpaces(text))}
            placeholderTextColor={theme.inputPlaceholder}
            autoFocus
          />
          <View style={formStyles.nameCustomActions}>
            {name.trim().length > 0 && (
              <TouchableOpacity
                onPress={() => setName("")}
                accessibilityLabel="Reset to auto-generated name"
                style={formStyles.nameCustomClear}
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={formStyles.namePreviewActionUse}
              onPress={() => {
                setName("");
                setShowCustomNameInput(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={formStyles.namePreviewActionText}>Use Auto ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={formStyles.fieldGroupDivider} />
      <Text style={formStyles.fieldGroupLabel}>{"\uD83E\uDEB4"} Growing Space</Text>

      <View style={formStyles.spaceTypeCardsRow}>
        {[
          {
            value: "ground" as SpaceType,
            icon: "earth" as const,
            label: "Ground",
            hint: "Open soil",
          },
          {
            value: "bed" as SpaceType,
            icon: "apps" as const,
            label: "Raised Bed",
            hint: "Bed / Border",
          },
          {
            value: "pot" as SpaceType,
            icon: "cube-outline" as const,
            label: "Pot",
            hint: "Container",
          },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[
              formStyles.spaceTypeCard,
              spaceType === opt.value && formStyles.spaceTypeCardActive,
            ]}
            onPress={() => setSpaceType(opt.value)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={opt.icon}
              size={28}
              color={
                spaceType === opt.value ? theme.primary : theme.textTertiary
              }
              style={formStyles.spaceTypeCardIcon}
            />
            <Text
              style={[
                formStyles.spaceTypeCardLabel,
                spaceType === opt.value &&
                  formStyles.spaceTypeCardLabelActive,
              ]}
            >
              {opt.label}
            </Text>
            <Text
              style={wizardStyles.spaceTypeCardHint}
            >
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
          onChangeText={(text) =>
            setBedName(sanitizeAlphaNumericSpaces(text))
          }
        />
      )}
    </View>
  );
}
