import React, { useMemo } from "react";
import type { ImageStyle } from "react-native";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { PlantFormStateReturn, CATEGORY_OPTIONS } from "../../hooks/usePlantFormState";
import { createStyles } from "../../styles/plantFormStyles";
import { createWizardStyles } from "../../styles/plantAddWizardStyles";
import ThemedDropdown from "../ThemedDropdown";
import FloatingLabelInput from "../FloatingLabelInput";
import { sanitizeAlphaNumericSpaces } from "../../utils/textSanitizer";
import { toLocalDateString, formatDateDisplay } from "../../utils/dateHelpers";
import type { PlantType } from "../../types/database.types";

interface Props {
  formState: PlantFormStateReturn;
}

export function WizardStep1({ formState }: Props): React.JSX.Element {
  const {
    theme,
    photoUri,
    pickImage,
    plantType,
    setPlantType,
    plantVariety,
    setPlantVariety,
    variety,
    setVariety,
    customVarietyMode,
    setCustomVarietyMode,
    specificPlantOptions,
    varietySuggestions,
    plantingDate,
    setPlantingDate,
    showPlantingDatePicker,
    setShowPlantingDatePicker,
  } = formState;

  const formStyles = useMemo(() => createStyles(theme), [theme]);
  const wizardStyles = useMemo(() => createWizardStyles(theme), [theme]);

  return (
    <View>
      <TouchableOpacity
        style={formStyles.photoHeroContainer}
        onPress={pickImage}
        activeOpacity={0.85}
      >
        {photoUri ? (
          <>
            <Image
              source={{ uri: photoUri }}
              style={formStyles.photoHeroImage as ImageStyle}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
            />
            <View style={formStyles.photoHeroEditBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
              <Text style={formStyles.photoHeroEditBadgeText}>Change Photo</Text>
            </View>
          </>
        ) : (
          <View style={formStyles.photoHeroPlaceholder}>
            <Ionicons name="camera-outline" size={40} color={theme.primary} />
            <Text style={formStyles.photoHeroPlaceholderText}>
              Tap to add a photo
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={formStyles.chipGrid}>
        {CATEGORY_OPTIONS.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              formStyles.chipGridItem,
              plantType === cat.value && formStyles.chipGridItemActive,
            ]}
            onPress={() => {
              setPlantType(cat.value as PlantType);
              setPlantVariety("");
              setVariety("");
              setCustomVarietyMode(false);
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                formStyles.chipGridItemText,
                plantType === cat.value && formStyles.chipGridItemTextActive,
              ]}
              numberOfLines={1}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ThemedDropdown
        items={[
          { label: "Select plant type", value: "" },
          ...(specificPlantOptions.length === 0
            ? [{ label: "No plants yet — add in More", value: "" }]
            : specificPlantOptions.map((v) => ({ label: v, value: v }))),
        ]}
        selectedValue={plantVariety}
        onValueChange={setPlantVariety}
        label="Plant"
        placeholder="Plant"
        enabled={!!plantType}
        searchable
      />

      {varietySuggestions.length > 0 ? (
        <>
          <ThemedDropdown
            items={[
              { label: "Select variety (optional)", value: "" },
              ...varietySuggestions.map((s) => ({ label: s, value: s })),
              { label: "Other (enter manually)", value: "__custom__" },
            ]}
            selectedValue={customVarietyMode ? "__custom__" : variety}
            onValueChange={(value) => {
              if (value === "__custom__") {
                setCustomVarietyMode(true);
                setVariety("");
                return;
              }
              setCustomVarietyMode(false);
              setVariety(value);
            }}
            label="Variety"
            placeholder="Variety"
            enabled={varietySuggestions.length > 0}
            searchable
          />
          {customVarietyMode && (
            <FloatingLabelInput
              label="Enter custom variety"
              value={variety}
              onChangeText={(text) =>
                setVariety(sanitizeAlphaNumericSpaces(text))
              }
            />
          )}
        </>
      ) : (
        <FloatingLabelInput
          label="Variety"
          value={variety}
          onChangeText={(text) =>
            setVariety(sanitizeAlphaNumericSpaces(text))
          }
        />
      )}

      {["fruit_tree", "timber_tree", "coconut_tree"].includes(plantType) ? (
        <>
          <View style={formStyles.fieldGroupDivider} />
          <View style={formStyles.dateCard}>
            <TouchableOpacity
              style={formStyles.dateCardTouchable}
              onPress={() => setShowPlantingDatePicker(true)}
              activeOpacity={0.7}
            >
              <View style={formStyles.dateCardIconWrap}>
                <Ionicons name="calendar" size={20} color={theme.primary} />
              </View>
              <View style={formStyles.dateCardContent}>
                <View style={wizardStyles.dateCardLabelRow}>
                  <Text style={formStyles.dateCardLabel}>Planting Date</Text>
                </View>
                <Text
                  style={
                    plantingDate
                      ? formStyles.dateCardValue
                      : formStyles.dateCardPlaceholder
                  }
                >
                  {plantingDate
                    ? formatDateDisplay(plantingDate)
                    : "Tap to select date"}
                </Text>
              </View>
              {plantingDate ? (
                <TouchableOpacity
                  onPress={() => setPlantingDate("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
              )}
            </TouchableOpacity>
          </View>
          {showPlantingDatePicker && (
            <DateTimePicker
              value={plantingDate ? new Date(plantingDate) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, selectedDate) => {
                setShowPlantingDatePicker(Platform.OS === "ios");
                if (selectedDate)
                  setPlantingDate(toLocalDateString(selectedDate));
              }}
            />
          )}
        </>
      ) : (
        <>
          <View style={formStyles.fieldGroupDivider} />
          <View style={formStyles.dateCard}>
            <TouchableOpacity
              style={formStyles.dateCardTouchable}
              onPress={() => setShowPlantingDatePicker(true)}
              activeOpacity={0.7}
            >
              <View style={formStyles.dateCardIconWrap}>
                <Ionicons name="calendar" size={20} color={theme.primary} />
              </View>
              <View style={formStyles.dateCardContent}>
                <View style={wizardStyles.dateCardLabelRow}>
                  <Text style={formStyles.dateCardLabel}>Planting Date</Text>
                  <View style={formStyles.optionalBadge}>
                    <Text style={formStyles.optionalBadgeText}>Optional</Text>
                  </View>
                </View>
                <Text
                  style={
                    plantingDate
                      ? formStyles.dateCardValue
                      : formStyles.dateCardPlaceholder
                  }
                >
                  {plantingDate
                    ? formatDateDisplay(plantingDate)
                    : "Tap to select date"}
                </Text>
              </View>
              {plantingDate ? (
                <TouchableOpacity
                  onPress={() => setPlantingDate("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
              )}
            </TouchableOpacity>
          </View>
          {showPlantingDatePicker && (
            <DateTimePicker
              value={plantingDate ? new Date(plantingDate) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(_, selectedDate) => {
                setShowPlantingDatePicker(Platform.OS === "ios");
                if (selectedDate)
                  setPlantingDate(toLocalDateString(selectedDate));
              }}
            />
          )}
        </>
      )}
    </View>
  );
}
