import React, { useMemo, useCallback } from "react";
import type { ImageStyle } from "react-native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import {
  PlantFormStateReturn,
  CATEGORY_OPTIONS,
  HEALTH_OPTIONS,
  GROWTH_STAGE_OPTIONS,
  sanitizeNumberText,
  adjustFrequency,
  getFrequencyLabel,
  NOTES_MAX_LENGTH,
} from "../hooks/usePlantFormState";
import { createStyles } from "../styles/plantFormStyles";
import { createEditStyles } from "../styles/plantEditFormStyles";
import CollapsibleSection from "./CollapsibleSection";
import PestDiseaseModal from "./PestDiseaseModal";
import ThemedDropdown from "./ThemedDropdown";
import FloatingLabelInput from "./FloatingLabelInput";
import {
  sanitizeAlphaNumericSpaces,
  sanitizeLandmarkText,
} from "../utils/textSanitizer";
import { toLocalDateString, formatDateDisplay } from "../utils/dateHelpers";
import {
  getCompanionSuggestions,
  getIncompatiblePlants,
} from "../utils/plantHelpers";
import { getPruningTechniques } from "../utils/plantCareDefaults";
import {
  PlantType,
  SpaceType,
  SunlightLevel,
  WaterRequirement,
  HealthStatus,
  GrowthStage,
} from "../types/database.types";

interface Props {
  formState: PlantFormStateReturn;
}

export function PlantEditForm({ formState }: Props): React.JSX.Element {
  const {
    theme,
    insets,
    plantId,
    loading,
    dataLoading,
    hasUnsavedChanges,
    handleSave,
    handleBackPress,
    formProgress,
    validationErrors,
    totalErrorCount,
    sectionStatuses,
    sectionExpanded,
    setSectionExpandedState,
    showValidationErrors,
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
    generatedPlantName,
    name,
    setName,
    showCustomNameInput,
    setShowCustomNameInput,
    plantingDate,
    setPlantingDate,
    showPlantingDatePicker,
    setShowPlantingDatePicker,
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
    wateringFrequency,
    setWateringFrequency,
    fertilisingFrequency,
    setFertilisingFrequency,
    sunlight,
    setSunlight,
    waterRequirement,
    setWaterRequirement,
    soilType,
    setSoilType,
    preferredFertiliser,
    setPreferredFertiliser,
    mulchingUsed,
    setMulchingUsed,
    pruningFrequency,
    setPruningFrequency,
    plantCareProfiles,
    healthStatus,
    setHealthStatus,
    growthStage,
    setGrowthStage,
    harvestSeason,
    setHarvestSeason,
    harvestSeasonOptions,
    harvestStartDate,
    setHarvestStartDate,
    harvestEndDate,
    setHarvestEndDate,
    showStartDatePicker,
    setShowStartDatePicker,
    showEndDatePicker,
    setShowEndDatePicker,
    expectedHarvestDate,
    coconutAgeInfo,
    coconutFrondsCount,
    setCoconutFrondsCount,
    nutsPerMonth,
    setNutsPerMonth,
    spatheCount,
    setSpatheCount,
    lastClimbingDate,
    setLastClimbingDate,
    showClimbingDatePicker,
    setShowClimbingDatePicker,
    nutFallCount,
    setNutFallCount,
    lastNutFallDate,
    setLastNutFallDate,
    showNutFallDatePicker,
    setShowNutFallDatePicker,
    notes,
    setNotes,
    pestDiseaseHistory,
    setPestDiseaseHistory,
    showPestDiseaseModal,
    setShowPestDiseaseModal,
    currentPestDisease,
    setCurrentPestDisease,
    editingPestIndex,
    setEditingPestIndex,
    pestPhotoUri,
    setPestPhotoUri,
  } = formState;

  const styles = useMemo(() => createStyles(theme), [theme]);
  const editStyles = useMemo(() => createEditStyles(theme), [theme]);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges && !formState.isSaving.current) {
      handleBackPress();
    } else {
      formState.handleDiscard();
    }
  }, [hasUnsavedChanges, handleBackPress, formState]);

  return (
    <View style={editStyles.flexOne}>
      {dataLoading && (
        <View style={editStyles.dataLoadingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      )}
      <KeyboardAvoidingView
        style={editStyles.flexOne}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.headerIconButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Edit Plant</Text>
            {hasUnsavedChanges && <View style={styles.unsavedDot} />}
          </View>
          <View style={editStyles.editHeaderSpacer} />
        </View>

        <View style={editStyles.progressBarTrack}>
          <View
            style={[
              editStyles.progressBarFill,
              { width: `${formProgress.percent}%` as `${number}%` },
            ]}
          />
        </View>

        <ScrollView
          ref={formState.scrollViewRef}
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, editStyles.scrollContentPadding]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Hero */}
          <TouchableOpacity
            style={styles.photoHeroContainer}
            onPress={pickImage}
            activeOpacity={0.85}
          >
            {photoUri ? (
              <>
                <Image
                  source={{ uri: photoUri }}
                  style={styles.photoHeroImage as ImageStyle}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                />
                <View style={styles.photoHeroEditBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                  <Text style={styles.photoHeroEditBadgeText}>Change Photo</Text>
                </View>
              </>
            ) : (
              <View style={styles.photoHeroPlaceholder}>
                <Ionicons name="camera-outline" size={40} color={theme.primary} />
                <Text style={styles.photoHeroPlaceholderText}>Tap to add a photo</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Basic Information */}
          <CollapsibleSection
            title="Basic Information"
            icon="information-circle"
            defaultExpanded={true}
            expanded={sectionExpanded.basic}
            onExpandedChange={(expanded) => setSectionExpandedState("basic", expanded)}
            hasError={showValidationErrors && validationErrors.basic.length > 0}
            sectionStatus={showValidationErrors ? undefined : sectionStatuses.basic}
          >
            <View style={styles.chipGrid}>
              {CATEGORY_OPTIONS.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.chipGridItem,
                    plantType === cat.value && styles.chipGridItemActive,
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
                      styles.chipGridItemText,
                      plantType === cat.value && styles.chipGridItemTextActive,
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
                    onChangeText={(text) => setVariety(sanitizeAlphaNumericSpaces(text))}
                  />
                )}
              </>
            ) : (
              <FloatingLabelInput
                label="Variety"
                value={variety}
                onChangeText={(text) => setVariety(sanitizeAlphaNumericSpaces(text))}
              />
            )}

            {!showCustomNameInput ? (
              <View style={styles.namePreviewRow}>
                <Text style={styles.namePreviewFloatingLabel}>Name</Text>
                {generatedPlantName ? (
                  <Text style={styles.namePreviewValue} numberOfLines={1}>
                    {generatedPlantName}
                  </Text>
                ) : (
                  <Text style={styles.namePreviewValuePending}>
                    Auto after selecting plant & location
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.namePreviewActionCustom}
                  onPress={() => setShowCustomNameInput(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.namePreviewActionTextMuted}>Customise</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.nameCustomRow}>
                <Text style={styles.namePreviewFloatingLabel}>Name</Text>
                <TextInput
                  style={styles.nameCustomInput}
                  placeholder={generatedPlantName || "Enter a custom name"}
                  value={name}
                  onChangeText={(text) => setName(sanitizeAlphaNumericSpaces(text))}
                  placeholderTextColor={theme.inputPlaceholder}
                  autoFocus
                />
                <View style={styles.nameCustomActions}>
                  {name.trim().length > 0 && (
                    <TouchableOpacity
                      onPress={() => setName("")}
                      accessibilityLabel="Reset to auto-generated name"
                      style={styles.nameCustomClear}
                    >
                      <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.namePreviewActionUse}
                    onPress={() => {
                      setName("");
                      setShowCustomNameInput(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.namePreviewActionText}>Use Auto ✓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.fieldGroupDivider} />
            <View style={styles.dateCard}>
              <TouchableOpacity
                style={styles.dateCardTouchable}
                onPress={() => setShowPlantingDatePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.dateCardIconWrap}>
                  <Ionicons name="calendar" size={20} color={theme.primary} />
                </View>
                <View style={styles.dateCardContent}>
                  <Text style={styles.dateCardLabel}>Planting Date</Text>
                  <Text style={plantingDate ? styles.dateCardValue : styles.dateCardPlaceholder}>
                    {plantingDate ? formatDateDisplay(plantingDate) : "Tap to select date"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>
            {showPlantingDatePicker && (
              <DateTimePicker
                value={plantingDate ? new Date(plantingDate) : new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(_, selectedDate) => {
                  setShowPlantingDatePicker(Platform.OS === "ios");
                  if (selectedDate) setPlantingDate(toLocalDateString(selectedDate));
                }}
              />
            )}
          </CollapsibleSection>

          {/* Location & Placement */}
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
              <Text style={styles.fieldGroupLabel}>🪴 Growing Space</Text>

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

          {/* Care & Schedule */}
          <CollapsibleSection
            title="Care & Schedule"
            icon="leaf"
            defaultExpanded={false}
            expanded={sectionExpanded.care}
            onExpandedChange={(expanded) => setSectionExpandedState("care", expanded)}
            hasError={showValidationErrors && validationErrors.care.length > 0}
            sectionStatus={showValidationErrors ? undefined : sectionStatuses.care}
          >
              <Text style={styles.fieldGroupLabel}>🌱 Growing Conditions</Text>
              <View style={styles.stepperCard}>

                  <Text style={styles.fieldGroupLabel}>☀️ Sunlight Needs</Text>
                  <View style={styles.directionChipsContainer}>
                    {[
                      { label: "☀️ Full Sun", value: "full_sun" },
                      { label: "⛅ Partial", value: "partial_sun" },
                      { label: "🌤️ Shade", value: "shade" },
                    ].map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.directionChip,
                          sunlight === opt.value && styles.directionChipActive,
                        ]}
                        onPress={() => setSunlight(opt.value as SunlightLevel)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.directionChipText,
                            sunlight === opt.value && styles.directionChipTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.fieldGroupLabel}>💧 Water Needs</Text>
                  <View style={styles.directionChipsContainer}>
                    {(
                      [
                        { label: "Low", value: "low", drops: 1 },
                        { label: "Medium", value: "medium", drops: 2 },
                        { label: "High", value: "high", drops: 3 },
                      ] as const
                    ).map((opt) => {
                      const isActive = waterRequirement === opt.value;
                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[
                            styles.directionChip,
                            isActive && styles.directionChipActive,
                          ]}
                          onPress={() => setWaterRequirement(opt.value as WaterRequirement)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.waterDropsRow}>
                            {Array.from({ length: opt.drops }).map((_, i) => (
                              <Ionicons
                                key={i}
                                name="water"
                                size={12}
                                color={isActive ? theme.primary : theme.textTertiary}
                              />
                            ))}
                          </View>
                          <Text
                            style={[
                              styles.directionChipText,
                              isActive && styles.directionChipTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={editStyles.spacerSmall} />
                  <ThemedDropdown
                    items={[
                      { label: "Garden Soil", value: "garden_soil" },
                      { label: "Potting Mix", value: "potting_mix" },
                      { label: "Coco Peat Mix", value: "coco_peat" },
                      { label: "Red Laterite (Seivaal)", value: "red_laterite" },
                      { label: "Coastal Sandy Soil", value: "coastal_sandy" },
                      { label: "Black Cotton Soil", value: "black_cotton" },
                      { label: "Alluvial Soil", value: "alluvial" },
                      { label: "Custom Mix", value: "custom" },
                    ]}
                    selectedValue={soilType}
                    onValueChange={setSoilType}
                    placeholder="Select soil type"
                    label="Soil Type"
                  />
                  <View style={editStyles.spacerTiny} />
              </View>

              <View style={styles.fieldGroupDivider} />
              <Text style={styles.fieldGroupLabel}>📅 Watering & Feeding Schedule</Text>

              <View style={styles.stepperCard}>
                <View style={styles.stepperHeader}>
                  <View style={styles.stepperIconWrap}>
                    <Ionicons name="water" size={18} color={theme.primary} />
                  </View>
                  <Text style={styles.stepperLabel}>Water every</Text>
                </View>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => adjustFrequency(wateringFrequency, -1, setWateringFrequency)}
                    activeOpacity={0.6}
                    accessibilityLabel="Decrease watering frequency"
                  >
                    <Ionicons name="remove" size={20} color={theme.primary} />
                  </TouchableOpacity>
                  <View style={styles.stepperValueWrap}>
                    <TextInput
                      style={styles.stepperValueInput}
                      value={wateringFrequency}
                      onChangeText={(text) => setWateringFrequency(sanitizeNumberText(text))}
                      keyboardType="numeric"
                      placeholder="—"
                      placeholderTextColor={theme.inputPlaceholder}
                      maxLength={3}
                      textAlign="center"
                    />
                    <Text style={styles.stepperUnit}>days</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => adjustFrequency(wateringFrequency, 1, setWateringFrequency)}
                    activeOpacity={0.6}
                    accessibilityLabel="Increase watering frequency"
                  >
                    <Ionicons name="add" size={20} color={theme.primary} />
                  </TouchableOpacity>
                </View>
                {wateringFrequency ? (
                  <Text style={[styles.stepperHint, { color: theme.primary }]}>
                    {getFrequencyLabel(wateringFrequency)}
                  </Text>
                ) : null}
              </View>

              <View style={styles.stepperCard}>
                <View style={styles.stepperHeader}>
                  <View style={[styles.stepperIconWrap, { backgroundColor: theme.accentLight }]}>
                    <Ionicons name="nutrition" size={18} color={theme.accent} />
                  </View>
                  <Text style={styles.stepperLabel}>Feed every</Text>
                </View>
                <View style={styles.stepperRow}>
                  <TouchableOpacity
                    style={[styles.stepperButton, { borderColor: theme.accent }]}
                    onPress={() => adjustFrequency(fertilisingFrequency, -1, setFertilisingFrequency)}
                    activeOpacity={0.6}
                    accessibilityLabel="Decrease feeding frequency"
                  >
                    <Ionicons name="remove" size={20} color={theme.accent} />
                  </TouchableOpacity>
                  <View style={styles.stepperValueWrap}>
                    <TextInput
                      style={styles.stepperValueInput}
                      value={fertilisingFrequency}
                      onChangeText={(text) => setFertilisingFrequency(sanitizeNumberText(text))}
                      keyboardType="numeric"
                      placeholder="—"
                      placeholderTextColor={theme.inputPlaceholder}
                      maxLength={3}
                      textAlign="center"
                    />
                    <Text style={styles.stepperUnit}>days</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.stepperButton, { borderColor: theme.accent }]}
                    onPress={() => adjustFrequency(fertilisingFrequency, 1, setFertilisingFrequency)}
                    activeOpacity={0.6}
                    accessibilityLabel="Increase feeding frequency"
                  >
                    <Ionicons name="add" size={20} color={theme.accent} />
                  </TouchableOpacity>
                </View>
                {fertilisingFrequency ? (
                  <Text style={[styles.stepperHint, { color: theme.accent }]}>
                    {getFrequencyLabel(fertilisingFrequency)}
                  </Text>
                ) : null}
              </View>

              <View style={editStyles.spacerMedium} />
              <ThemedDropdown
                items={[
                  { label: "Compost", value: "compost" },
                  { label: "Vermicompost", value: "vermicompost" },
                  { label: "Cow Dung Slurry", value: "cow_dung_slurry" },
                  { label: "Neem Cake", value: "neem_cake" },
                  { label: "Panchagavya", value: "panchagavya" },
                  { label: "Jeevamrutham", value: "jeevamrutham" },
                  { label: "Groundnut Cake", value: "groundnut_cake" },
                  { label: "Fish Emulsion", value: "fish_emulsion" },
                  { label: "Seaweed Extract", value: "seaweed" },
                  { label: "Other", value: "other" },
                ]}
                selectedValue={preferredFertiliser}
                onValueChange={setPreferredFertiliser}
                label="Preferred Fertiliser"
                placeholder="Preferred Fertiliser"
              />

              <TouchableOpacity
                style={[styles.settingToggle, mulchingUsed && styles.settingToggleActive]}
                onPress={() => setMulchingUsed(!mulchingUsed)}
                activeOpacity={0.85}
                accessibilityRole="switch"
                accessibilityState={{ checked: mulchingUsed }}
              >
                <View style={styles.settingToggleLeft}>
                  <View style={[styles.settingToggleIconWrap, mulchingUsed && styles.settingToggleIconWrapActive]}>
                    <Ionicons
                      name={mulchingUsed ? "layers" : "layers-outline"}
                      size={18}
                      color={mulchingUsed ? theme.primary : theme.textSecondary}
                    />
                  </View>
                  <Text style={[styles.settingToggleLabel, mulchingUsed && styles.settingToggleLabelActive]}>
                    Mulching Used
                  </Text>
                </View>
                <View style={[styles.settingSwitchTrack, mulchingUsed && styles.settingSwitchTrackActive]}>
                  <View style={[styles.settingSwitchThumb, mulchingUsed && styles.settingSwitchThumbActive]} />
                </View>
              </TouchableOpacity>

              {["fruit_tree", "shrub", "herb"].includes(plantType) && (
                <>
                  <View style={styles.fieldGroupDivider} />
                  <Text style={styles.fieldGroupLabel}>✂️ Pruning</Text>
                  <View style={editStyles.pruningFrequencyRow}>
                    <Text style={[styles.frequencyCardLabel, editStyles.noMarginBottom]}>Every</Text>
                    <View style={[styles.frequencyInputWrap, editStyles.frequencyInputWrapCompact]}>
                      <TextInput
                        style={[styles.frequencyInput, editStyles.frequencyInputLarge]}
                        value={pruningFrequency}
                        onChangeText={(text) => setPruningFrequency(sanitizeNumberText(text))}
                        keyboardType="numeric"
                        placeholder="—"
                        placeholderTextColor={theme.inputPlaceholder}
                        maxLength={3}
                      />
                    </View>
                    <Text style={[styles.frequencyCardLabel, editStyles.noMarginBottom]}>days</Text>
                  </View>
                  {(() => {
                    const userOverride = plantType && plantVariety ? plantCareProfiles[plantType as PlantType]?.[plantVariety] : undefined;
                    const info = getPruningTechniques(plantType, plantVariety, userOverride);
                    const hasTips = info.tips.length > 0 || info.shapePruning || info.flowerPruning;
                    return hasTips ? (
                      <View style={editStyles.pruningTipsCard}>
                        <View style={editStyles.pruningTipsHeader}>
                          <Ionicons name="bulb-outline" size={16} color={theme.accent} />
                          <Text style={editStyles.pruningTipsTitle}>
                            Pruning Tips{plantVariety ? ` — ${plantVariety}` : ""}
                          </Text>
                        </View>
                        {info.tips.map((tip, i) => (
                          <View key={i} style={editStyles.pruningTipRow}>
                            <Text style={editStyles.pruningTipBullet}>{"\u2022"}</Text>
                            <Text style={editStyles.pruningTipText}>{tip}</Text>
                          </View>
                        ))}
                        {info.shapePruning && (
                          <View style={[editStyles.pruningTipRow, info.tips.length > 0 && editStyles.pruningTechniqueTopGap]}>
                            <Text style={editStyles.pruningTechniqueIcon}>{"\u2702\uFE0F"}</Text>
                            <View style={editStyles.flexOne}>
                              <Text style={editStyles.pruningTechniqueTitle}>
                                Shape pruning<Text style={editStyles.pruningTechniqueDetail}> — {info.shapePruning.tip}</Text>
                              </Text>
                              <Text style={editStyles.pruningTechniqueBestTime}>
                                Best: {info.shapePruning.months}
                              </Text>
                            </View>
                          </View>
                        )}
                        {info.flowerPruning && (
                          <View style={[editStyles.pruningTipRow, editStyles.pruningFlowerTopGap]}>
                            <Text style={editStyles.pruningTechniqueIcon}>{"\uD83C\uDF38"}</Text>
                            <View style={editStyles.flexOne}>
                              <Text style={editStyles.pruningTechniqueTitle}>
                                Flower pruning<Text style={editStyles.pruningTechniqueDetail}> — {info.flowerPruning.tip}</Text>
                              </Text>
                              <Text style={editStyles.pruningTechniqueBestTime}>
                                Best: {info.flowerPruning.months}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    ) : null;
                  })()}
                </>
              )}
            </CollapsibleSection>

          <CollapsibleSection
            title="Plant Health"
            icon="fitness"
            defaultExpanded={false}
            expanded={sectionExpanded.health}
            onExpandedChange={(expanded) => setSectionExpandedState("health", expanded)}
            hasError={false}
            sectionStatus="optional"
          >
            <Text style={styles.fieldGroupLabel}>🌿 Health Status</Text>
            <View style={styles.chipGrid}>
              {HEALTH_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chipGridItem, healthStatus === opt.value && styles.chipGridItemActive]}
                  onPress={() => setHealthStatus(opt.value as HealthStatus)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipGridItemText, healthStatus === opt.value && styles.chipGridItemTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {healthStatus === "healthy" && <Text style={styles.helperText}>Plant looks good — no visible stress, pests, or disease. Growing normally.</Text>}
            {healthStatus === "stressed" && <Text style={styles.helperText}>Early warning signs like wilting, yellowing tips, or slow growth — usually from environment.</Text>}
            {healthStatus === "recovering" && <Text style={styles.helperText}>Previously stressed or sick, now improving. May still show some damage but new growth looks healthy.</Text>}
            {healthStatus === "sick" && <Text style={styles.helperText}>Active disease, fungal infection, rot, or heavy pest infestation. Needs treatment.</Text>}

            <Text style={styles.fieldGroupLabel}>🌱 Growth Stage</Text>
            <View style={styles.chipGrid}>
              {GROWTH_STAGE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chipGridItem, growthStage === opt.value && styles.chipGridItemActive]}
                  onPress={() => setGrowthStage(opt.value as GrowthStage)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipGridItemText, growthStage === opt.value && styles.chipGridItemTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </CollapsibleSection>

          {["vegetable", "fruit_tree", "herb"].includes(plantType) && (
            <CollapsibleSection
              title="Harvest"
              icon="calendar"
              defaultExpanded={false}
              expanded={sectionExpanded.harvest}
              onExpandedChange={(expanded) => setSectionExpandedState("harvest", expanded)}
              hasError={showValidationErrors && validationErrors.harvest.length > 0}
              sectionStatus="optional"
            >
              <View style={styles.directionChipsWrapper}>
                <Text style={styles.directionChipsFloatingLabel}>Harvest Season</Text>
                <View style={styles.directionChipsContainer}>
                  {harvestSeasonOptions.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.directionChip, harvestSeason === s && styles.directionChipActive]}
                      onPress={() => setHarvestSeason(harvestSeason === s ? "" : s)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.directionChipText, harvestSeason === s && styles.directionChipTextActive]} numberOfLines={1}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {plantType === "fruit_tree" && (
                <>
                  <View style={styles.fieldGroupDivider} />
                  <Text style={styles.fieldGroupLabel}>Harvest Date Range</Text>
                  <View style={styles.dateCard}>
                    <TouchableOpacity
                      style={styles.dateCardTouchable}
                      onPress={() => setShowStartDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dateCardIconWrap}>
                        <Ionicons name="play" size={18} color={theme.primary} />
                      </View>
                      <View style={styles.dateCardContent}>
                        <Text style={styles.dateCardLabel}>Start Date</Text>
                        <Text style={harvestStartDate ? styles.dateCardValue : styles.dateCardPlaceholder}>
                          {harvestStartDate ? formatDateDisplay(harvestStartDate) : "Tap to select"}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
                    </TouchableOpacity>
                  </View>
                  {showStartDatePicker && (
                    <DateTimePicker
                      value={harvestStartDate ? new Date(harvestStartDate) : new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(_, selectedDate) => {
                        setShowStartDatePicker(Platform.OS === "ios");
                        if (selectedDate) setHarvestStartDate(toLocalDateString(selectedDate));
                      }}
                    />
                  )}
                  <View style={styles.dateCard}>
                    <TouchableOpacity
                      style={styles.dateCardTouchable}
                      onPress={() => setShowEndDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.dateCardIconWrap, { backgroundColor: theme.accentLight }]}>
                        <Ionicons name="stop" size={18} color={theme.accent} />
                      </View>
                      <View style={styles.dateCardContent}>
                        <Text style={styles.dateCardLabel}>End Date</Text>
                        <Text style={harvestEndDate ? styles.dateCardValue : styles.dateCardPlaceholder}>
                          {harvestEndDate ? formatDateDisplay(harvestEndDate) : "Tap to select"}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
                    </TouchableOpacity>
                  </View>
                  {showEndDatePicker && (
                    <DateTimePicker
                      value={harvestEndDate ? new Date(harvestEndDate) : new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(_, selectedDate) => {
                        setShowEndDatePicker(Platform.OS === "ios");
                        if (selectedDate) setHarvestEndDate(toLocalDateString(selectedDate));
                      }}
                    />
                  )}
                </>
              )}

              {expectedHarvestDate ? (
                <View style={styles.infoCard}>
                  <View style={styles.infoCardHeader}>
                    <Ionicons name="calendar" size={20} color="#FF9800" />
                    <Text style={styles.infoCardTitle}>Expected Harvest Date</Text>
                  </View>
                  <Text style={styles.infoCardText}>
                    {new Date(expectedHarvestDate).toLocaleDateString()}
                  </Text>
                  <Text style={styles.infoCardSubtext}>
                    Auto-calculated based on plant variety and planting date
                  </Text>
                </View>
              ) : null}
            </CollapsibleSection>
          )}

          {plantType === "coconut_tree" && (
            <CollapsibleSection
              title="Coconut Tracking"
              icon="analytics"
              defaultExpanded={false}
              expanded={sectionExpanded.coconut}
              onExpandedChange={(expanded) => setSectionExpandedState("coconut", expanded)}
              hasError={false}
              sectionStatus="optional"
            >
              {coconutAgeInfo && (
                <View style={[styles.infoCard, editStyles.coconutInfoCard]}>
                  <View style={styles.infoCardHeader}>
                    <Ionicons name="leaf" size={16} color={theme.coconut} />
                    <Text style={[styles.infoCardTitle, editStyles.coconutInfoCardTitle]}>
                      Age-based Care — {coconutAgeInfo.ageLabel}
                    </Text>
                  </View>
                  <Text style={styles.infoCardText}>Stage: {coconutAgeInfo.stageLabel}</Text>
                  <Text style={styles.infoCardText}>Expected yield: {coconutAgeInfo.expectedNutsPerYear}</Text>
                  <Text style={[styles.infoCardText, editStyles.infoCardTextBold]}>Suggested schedule:</Text>
                  <Text style={styles.infoCardText}>• Water every {coconutAgeInfo.wateringFrequencyDays} day{coconutAgeInfo.wateringFrequencyDays !== 1 ? "s" : ""}</Text>
                  <Text style={styles.infoCardText}>• Fertilise every {coconutAgeInfo.fertilisingFrequencyDays} days</Text>
                  <Text style={[styles.infoCardText, editStyles.infoCardTextBold]}>Care tips for this stage:</Text>
                  {coconutAgeInfo.careTips.map((tip, i) => (
                    <Text key={i} style={styles.infoCardText}>• {tip}</Text>
                  ))}
                </View>
              )}

              <Text style={styles.fieldGroupLabel}>Tree Metrics</Text>
              <View style={styles.statCardsRow}>
                {[
                  { icon: "leaf", bg: theme.primaryLight, color: theme.primary, label: "Fronds", value: coconutFrondsCount, setter: setCoconutFrondsCount },
                  { icon: "ellipse", bg: theme.accentLight, color: theme.accent, label: "Nuts/mo", value: nutsPerMonth, setter: setNutsPerMonth },
                  { icon: "flower", bg: theme.warningLight, color: theme.warning, label: "Spathes", value: spatheCount, setter: setSpatheCount },
                ].map((item) => (
                  <View key={item.label} style={styles.statCard}>
                    <View style={[styles.statCardIconWrap, { backgroundColor: item.bg }]}>
                      <Ionicons name={item.icon as "leaf"} size={16} color={item.color} />
                    </View>
                    <Text style={styles.statCardLabel}>{item.label}</Text>
                    <View style={styles.statCardInputWrap}>
                      <TextInput
                        style={styles.statCardInput}
                        value={item.value}
                        onChangeText={(text) => item.setter(sanitizeNumberText(text))}
                        keyboardType="numeric"
                        placeholder="—"
                        placeholderTextColor={theme.inputPlaceholder}
                        maxLength={3}
                      />
                    </View>
                  </View>
                ))}
              </View>
              <Text style={styles.helperText}>Fronds: 30–35 is healthy. Spathes: 1–2/month for bearing trees.</Text>

              <View style={styles.fieldGroupDivider} />
              <Text style={styles.fieldGroupLabel}>Harvest Tracking</Text>
              <View style={styles.dateCard}>
                <TouchableOpacity
                  style={styles.dateCardTouchable}
                  onPress={() => setShowClimbingDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dateCardIconWrap}>
                    <Ionicons name="arrow-up" size={18} color={theme.primary} />
                  </View>
                  <View style={styles.dateCardContent}>
                    <Text style={styles.dateCardLabel}>Last Climbing / Harvest</Text>
                    <Text style={lastClimbingDate ? styles.dateCardValue : styles.dateCardPlaceholder}>
                      {lastClimbingDate ? formatDateDisplay(lastClimbingDate) : "Tap to select"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
                </TouchableOpacity>
              </View>
              {showClimbingDatePicker && (
                <DateTimePicker
                  value={lastClimbingDate ? new Date(lastClimbingDate) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, selectedDate) => {
                    setShowClimbingDatePicker(Platform.OS === "ios");
                    if (selectedDate) setLastClimbingDate(toLocalDateString(selectedDate));
                  }}
                />
              )}
              {coconutAgeInfo && coconutAgeInfo.harvestFrequencyDays > 0 && (
                <Text style={styles.helperText}>
                  Suggested harvest cycle: every {coconutAgeInfo.harvestFrequencyDays} days for this stage.
                </Text>
              )}

              <View style={styles.fieldGroupDivider} />
              <Text style={styles.fieldGroupLabel}>Nut Fall Monitoring</Text>
              <View style={styles.frequencyRow}>
                <View style={styles.frequencyCard}>
                  <View style={[styles.frequencyIconWrap, { backgroundColor: theme.errorLight }]}>
                    <Ionicons name="arrow-down" size={18} color={theme.error} />
                  </View>
                  <Text style={styles.frequencyCardLabel}>Falls</Text>
                  <View style={styles.frequencyInputWrap}>
                    <TextInput
                      style={styles.frequencyInput}
                      value={nutFallCount}
                      onChangeText={(text) => setNutFallCount(sanitizeNumberText(text))}
                      keyboardType="numeric"
                      placeholder="—"
                      placeholderTextColor={theme.inputPlaceholder}
                      maxLength={3}
                    />
                  </View>
                  <Text style={styles.frequencyUnit}>nuts</Text>
                </View>
              </View>
              <Text style={styles.helperText}>
                High count (&gt;10) may indicate Red Palm Weevil, water stress, or boron deficiency.
              </Text>
              <View style={styles.dateCard}>
                <TouchableOpacity
                  style={styles.dateCardTouchable}
                  onPress={() => setShowNutFallDatePicker(true)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.dateCardIconWrap, { backgroundColor: theme.errorLight }]}>
                    <Ionicons name="alert-circle" size={18} color={theme.error} />
                  </View>
                  <View style={styles.dateCardContent}>
                    <Text style={styles.dateCardLabel}>Last Nut Fall Incident</Text>
                    <Text style={lastNutFallDate ? styles.dateCardValue : styles.dateCardPlaceholder}>
                      {lastNutFallDate ? formatDateDisplay(lastNutFallDate) : "Tap to select"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
                </TouchableOpacity>
              </View>
              {showNutFallDatePicker && (
                <DateTimePicker
                  value={lastNutFallDate ? new Date(lastNutFallDate) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(_, selectedDate) => {
                    setShowNutFallDatePicker(Platform.OS === "ios");
                    if (selectedDate) setLastNutFallDate(toLocalDateString(selectedDate));
                  }}
                />
              )}
            </CollapsibleSection>
          )}

          <CollapsibleSection
            title="Notes & History"
            icon="document-text"
            defaultExpanded={false}
            expanded={sectionExpanded.notesHistory}
            onExpandedChange={(expanded) => setSectionExpandedState("notesHistory", expanded)}
            hasError={showValidationErrors && validationErrors.notesHistory.length > 0}
            sectionStatus="optional"
          >
            <View style={styles.notesCard}>
              <View style={styles.notesCardHeader}>
                <Ionicons name="document-text-outline" size={16} color={theme.textTertiary} />
                <Text style={styles.fieldGroupLabel}>Notes</Text>
              </View>
              <TextInput
                style={styles.notesCardInput}
                value={notes}
                onChangeText={(text) => setNotes(sanitizeAlphaNumericSpaces(text))}
                multiline
                numberOfLines={4}
                maxLength={NOTES_MAX_LENGTH}
                placeholder="Add any notes about this plant..."
                placeholderTextColor={theme.inputPlaceholder}
              />
              <Text style={styles.noteCounter}>
                {notes.length}/{NOTES_MAX_LENGTH}
              </Text>
            </View>

            {plantVariety && getCompanionSuggestions(plantVariety).length > 0 && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name="leaf" size={20} color="#4CAF50" />
                  <Text style={styles.infoCardTitle}>Companion Plants</Text>
                </View>
                <Text style={styles.infoCardSubtext}>Good companion plants for {plantVariety}:</Text>
                <View style={styles.chipContainer}>
                  {getCompanionSuggestions(plantVariety).map((companion) => (
                    <View key={companion} style={styles.companionChip}>
                      <Text style={styles.companionChipText}>{companion}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {plantVariety && getIncompatiblePlants(plantVariety).length > 0 && (
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name="warning" size={20} color="#f57c00" />
                  <Text style={styles.infoCardTitle}>Avoid Planting With</Text>
                </View>
                <Text style={styles.infoCardSubtext}>These plants can compete with {plantVariety}:</Text>
                <View style={styles.chipContainer}>
                  {getIncompatiblePlants(plantVariety).map((incompatible) => (
                    <View key={incompatible} style={styles.incompatibleChip}>
                      <Text style={styles.incompatibleChipText}>{incompatible}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title="Pest & Disease"
            icon="bug"
            defaultExpanded={false}
            expanded={sectionExpanded.pestDisease}
            onExpandedChange={(expanded) => setSectionExpandedState("pestDisease", expanded)}
            hasError={showValidationErrors && validationErrors.pestDisease.length > 0}
            sectionStatus="optional"
          >
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.fieldGroupLabel}>🐛 Pest & Disease Records</Text>
              <TouchableOpacity
                style={styles.addPestButtonPill}
                onPress={() => {
                  setEditingPestIndex(null);
                  setPestPhotoUri(null);
                  setCurrentPestDisease({
                    type: "pest",
                    name: "",
                    occurredAt: toLocalDateString(new Date()),
                    severity: "medium",
                    resolved: false,
                  });
                  setShowPestDiseaseModal(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="add" size={16} color={theme.primary} />
                <Text style={styles.addPestButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {pestDiseaseHistory.length > 0 ? (
              <View style={styles.pestDiseaseList}>
                {pestDiseaseHistory
                  .map((record, index) => ({ record, index }))
                  .sort((a, b) =>
                    a.record.resolved === b.record.resolved ? 0 : a.record.resolved ? 1 : -1,
                  )
                  .map(({ record, index }) => (
                    <TouchableOpacity
                      key={record.id || index}
                      style={[
                        styles.pestDiseaseCard,
                        record.resolved ? editStyles.pestCardResolved : editStyles.pestCardUnresolved,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setEditingPestIndex(index);
                        setCurrentPestDisease({ ...record });
                        setPestPhotoUri(record.photo_filename || null);
                        setShowPestDiseaseModal(true);
                      }}
                    >
                      <View style={styles.pestDiseaseHeader}>
                        <Ionicons
                          name={record.type === "pest" ? "bug" : "medical"}
                          size={20}
                          color={record.resolved ? "#4CAF50" : "#f44336"}
                        />
                        <Text style={styles.pestDiseaseName}>{record.name}</Text>
                        {record.resolved && (
                          <View style={styles.resolvedBadge}>
                            <Text style={styles.resolvedText}>Resolved</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.pestDiseaseDate}>
                        Occurred: {new Date(record.occurredAt).toLocaleDateString()}
                      </Text>
                      {(record.severity || record.affectedPart) && (
                        <Text style={styles.pestDiseaseMetaText}>
                          {record.severity ? `Severity: ${record.severity.toUpperCase()}` : ""}
                          {record.severity && record.affectedPart ? "  |  " : ""}
                          {record.affectedPart ? `Affected Part: ${record.affectedPart}` : ""}
                        </Text>
                      )}
                      {record.treatment ? (
                        <Text style={styles.pestDiseaseTreatment}>Treatment: {record.treatment}</Text>
                      ) : null}
                      {record.notes ? (
                        <Text style={styles.pestDiseaseNotes}>{record.notes}</Text>
                      ) : null}
                      <TouchableOpacity
                        style={styles.deletePestButton}
                        onPress={() => setPestDiseaseHistory(pestDiseaseHistory.filter((_, i) => i !== index))}
                      >
                        <Ionicons name="trash-outline" size={18} color="#f44336" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
              </View>
            ) : (
              <Text style={styles.noPestHistory}>No pest or disease records yet</Text>
            )}
          </CollapsibleSection>

          <PestDiseaseModal
            visible={showPestDiseaseModal}
            editingIndex={editingPestIndex}
            editingRecord={editingPestIndex !== null ? currentPestDisease : null}
            initialPhotoUri={pestPhotoUri}
            pestDiseaseHistory={pestDiseaseHistory}
            plantType={plantType}
            plantVariety={plantVariety}
            plantId={plantId}
            healthStatus={healthStatus}
            styles={styles}
            theme={theme}
            bottomInset={insets.bottom}
            onClose={() => {
              setEditingPestIndex(null);
              setShowPestDiseaseModal(false);
            }}
            onSave={(updatedHistory) => {
              setPestDiseaseHistory(updatedHistory);
              setEditingPestIndex(null);
              setShowPestDiseaseModal(false);
            }}
            onHealthStatusChange={(status) => setHealthStatus(status)}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.stickySaveContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <TouchableOpacity
          style={[styles.stickySaveButton, loading && styles.stickySaveButtonDisabled]}
          onPress={() => handleSave()}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.stickySaveButtonText}>
            {loading ? "Saving..." : "Save Changes"}
          </Text>
          {showValidationErrors && totalErrorCount > 0 && (
            <View style={styles.stickySaveErrorBadge}>
              <Text style={styles.stickySaveErrorBadgeText}>
                {totalErrorCount} issue{totalErrorCount > 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
