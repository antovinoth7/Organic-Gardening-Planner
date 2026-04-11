import React, { useState, useRef, useCallback, useMemo } from "react";
import type { ImageStyle } from "react-native";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  PlantFormStateReturn,
  CATEGORY_OPTIONS,
  sanitizeNumberText,
  adjustFrequency,
  getFrequencyLabel,
} from "../hooks/usePlantFormState";
import { createStyles } from "../styles/plantFormStyles";
import { createWizardStyles } from "../styles/plantAddWizardStyles";
import ThemedDropdown from "./ThemedDropdown";
import FloatingLabelInput from "./FloatingLabelInput";
import {
  sanitizeAlphaNumericSpaces,
  sanitizeLandmarkText,
} from "../utils/textSanitizer";
import { toLocalDateString, formatDateDisplay } from "../utils/dateHelpers";
import {
  PlantType,
  SpaceType,
  SunlightLevel,
  WaterRequirement,
} from "../types/database.types";

interface Props {
  formState: PlantFormStateReturn;
}

const STEP_LABELS = ["What", "Where", "How"];

export function PlantAddWizard({ formState }: Props): React.JSX.Element {
  const {
    theme,
    insets,
    isCompactScreen,
    wizardStep,
    slideX,
    slideOpacity,
    runSlideTransition,
    getWizardStepErrors,
    handleSave,
    navigateToPlantsAfterSave,
    loading,
    hasUnsavedChanges,
    handleBackPress,
    plantType,
    setPlantType,
    plantVariety,
    setPlantVariety,
    variety,
    setVariety,
    customVarietyMode,
    setCustomVarietyMode,
    photoUri,
    pickImage,
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
    autoApplyCareDefaults,
    setAutoApplyCareDefaults,
    autoSuggestFired,
    locationDefaultsFired,
    careProfileCardDismissed,
    setCareProfileCardDismissed,
    wateringFrequency,
    setWateringFrequency,
    fertilisingFrequency,
    setFertilisingFrequency,
    sunlight,
    setSunlight,
    waterRequirement,
    setWaterRequirement,
    harvestSeason,
    setHarvestSeason,
    harvestSeasonOptions,
  } = formState;

  const [stepError, setStepError] = useState<string | null>(null);
  const [saveBannerVisible, setSaveBannerVisible] = useState(false);
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wizardStyles = useMemo(() => createWizardStyles(theme), [theme]);
  const formStyles = useMemo(() => createStyles(theme), [theme]);

  const showBanner = useCallback(() => {
    setSaveBannerVisible(true);
    bannerOpacity.setValue(1);
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => {
      Animated.timing(bannerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setSaveBannerVisible(false);
        navigateToPlantsAfterSave();
      });
    }, 3100);
  }, [bannerOpacity, navigateToPlantsAfterSave]);

  const handleNext = useCallback(() => {
    const error = getWizardStepErrors(wizardStep);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    if (wizardStep < 3) {
      runSlideTransition("forward", (wizardStep + 1) as 2 | 3);
    }
  }, [wizardStep, getWizardStepErrors, runSlideTransition]);

  const handleBack = useCallback(() => {
    setStepError(null);
    if (wizardStep > 1) {
      runSlideTransition("back", (wizardStep - 1) as 1 | 2);
    } else {
      handleBackPress();
    }
  }, [wizardStep, runSlideTransition, handleBackPress]);

  const handleWizardSave = useCallback(() => {
    const error = getWizardStepErrors(3);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    handleSave(showBanner);
  }, [getWizardStepErrors, handleSave, showBanner]);

  const renderStep1 = useCallback(
    () => (
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
                <Text style={formStyles.photoHeroEditBadgeText}>
                  Change Photo
                </Text>
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
                      : ""}
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
    ),
    [
      formStyles,
      wizardStyles,
      theme,
      photoUri,
      pickImage,
      plantType,
      specificPlantOptions,
      plantVariety,
      setPlantVariety,
      setPlantType,
      setVariety,
      setCustomVarietyMode,
      varietySuggestions,
      customVarietyMode,
      variety,
      plantingDate,
      setPlantingDate,
      showPlantingDatePicker,
      setShowPlantingDatePicker,
    ],
  );

  const renderStep2 = useCallback(
    () => (
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
        <Text style={formStyles.fieldGroupLabel}>🪴 Growing Space</Text>

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
    ),
    [
      formStyles,
      wizardStyles,
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
    ],
  );

  const renderStep3 = useCallback(
    () => (
      <View>
        <TouchableOpacity
          style={[
            formStyles.smartDefaultsToggle,
            autoApplyCareDefaults && formStyles.smartDefaultsToggleActive,
          ]}
          onPress={() => setAutoApplyCareDefaults(!autoApplyCareDefaults)}
          activeOpacity={0.85}
          accessibilityRole="switch"
          accessibilityState={{ checked: autoApplyCareDefaults }}
        >
          <View style={formStyles.smartDefaultsLeft}>
            <View
              style={[
                formStyles.smartDefaultsIconWrap,
                autoApplyCareDefaults && formStyles.smartDefaultsIconWrapActive,
              ]}
            >
              <Ionicons
                name={autoApplyCareDefaults ? "sparkles" : "leaf-outline"}
                size={18}
                color={
                  autoApplyCareDefaults ? theme.primary : theme.textSecondary
                }
              />
            </View>
            <Text
              style={[
                formStyles.smartDefaultsLabel,
                isCompactScreen && formStyles.smartDefaultsLabelCompact,
                autoApplyCareDefaults && formStyles.smartDefaultsLabelActive,
              ]}
              numberOfLines={2}
            >
              Apply smart care
            </Text>
          </View>
          <View
            style={[
              formStyles.smartDefaultsSwitchTrack,
              autoApplyCareDefaults &&
                formStyles.smartDefaultsSwitchTrackActive,
            ]}
          >
            <View
              style={[
                formStyles.smartDefaultsSwitchThumb,
                autoApplyCareDefaults &&
                  formStyles.smartDefaultsSwitchThumbActive,
              ]}
            />
          </View>
        </TouchableOpacity>

        {autoApplyCareDefaults &&
          !(autoSuggestFired && !careProfileCardDismissed) && (
            <Text style={formStyles.helperText}>
              Auto-fills watering, fertilising, pruning, and sunlight settings.
            </Text>
          )}

        {autoApplyCareDefaults &&
          autoSuggestFired &&
          !careProfileCardDismissed && (
            <View style={formStyles.smartDefaultsBanner}>
              <View style={formStyles.smartDefaultsBannerLeft}>
                <Ionicons name="sparkles" size={16} color={theme.info} />
                <View style={formStyles.smartDefaultsBannerTextWrap}>
                  <Text style={formStyles.smartDefaultsBannerTitle}>
                    Smart defaults applied for {plantVariety}
                  </Text>
                  <Text style={formStyles.smartDefaultsBannerSummary}>
                    💧 {wateringFrequency}d · 🌿 {fertilisingFrequency}d ·{" "}
                    {sunlight === "full_sun"
                      ? "☀️ Full"
                      : sunlight === "partial_sun"
                        ? "⛅ Partial"
                        : "🌤️ Shade"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={formStyles.smartDefaultsBannerDismiss}
                onPress={() => setCareProfileCardDismissed(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={16} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>
          )}

        <Text style={formStyles.fieldGroupLabel}>🌱 Growing Conditions</Text>
        <View style={formStyles.stepperCard}>
          <Text style={formStyles.fieldGroupLabel}>☀️ Sunlight Needs</Text>
          <View style={formStyles.directionChipsContainer}>
            {[
              { label: "☀️ Full Sun", value: "full_sun" },
              { label: "⛅ Partial", value: "partial_sun" },
              { label: "🌤️ Shade", value: "shade" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  formStyles.directionChip,
                  sunlight === opt.value && formStyles.directionChipActive,
                ]}
                onPress={() => setSunlight(opt.value as SunlightLevel)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    formStyles.directionChipText,
                    sunlight === opt.value &&
                      formStyles.directionChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={formStyles.fieldGroupLabel}>💧 Water Needs</Text>
          <View style={formStyles.directionChipsContainer}>
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
                    formStyles.directionChip,
                    isActive && formStyles.directionChipActive,
                  ]}
                  onPress={() =>
                    setWaterRequirement(opt.value as WaterRequirement)
                  }
                  activeOpacity={0.7}
                >
                  <View style={formStyles.waterDropsRow}>
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
                      formStyles.directionChipText,
                      isActive && formStyles.directionChipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Text style={formStyles.fieldGroupLabel}>
          📅 Watering & Feeding Schedule
        </Text>

        <View style={formStyles.stepperCard}>
          <View style={formStyles.stepperHeader}>
            <View style={formStyles.stepperIconWrap}>
              <Ionicons name="water" size={18} color={theme.primary} />
            </View>
            <Text style={formStyles.stepperLabel}>Water every</Text>
          </View>
          <View style={formStyles.stepperRow}>
            <TouchableOpacity
              style={formStyles.stepperButton}
              onPress={() =>
                adjustFrequency(wateringFrequency, -1, setWateringFrequency)
              }
              activeOpacity={0.6}
              accessibilityLabel="Decrease watering frequency"
            >
              <Ionicons name="remove" size={20} color={theme.primary} />
            </TouchableOpacity>
            <View style={formStyles.stepperValueWrap}>
              <TextInput
                style={formStyles.stepperValueInput}
                value={wateringFrequency}
                onChangeText={(text) =>
                  setWateringFrequency(sanitizeNumberText(text))
                }
                keyboardType="numeric"
                placeholder="—"
                placeholderTextColor={theme.inputPlaceholder}
                maxLength={3}
                textAlign="center"
              />
              <Text style={formStyles.stepperUnit}>days</Text>
            </View>
            <TouchableOpacity
              style={formStyles.stepperButton}
              onPress={() =>
                adjustFrequency(wateringFrequency, 1, setWateringFrequency)
              }
              activeOpacity={0.6}
              accessibilityLabel="Increase watering frequency"
            >
              <Ionicons name="add" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
          {wateringFrequency ? (
            <Text style={[formStyles.stepperHint, { color: theme.primary }]}>
              {getFrequencyLabel(wateringFrequency)}
            </Text>
          ) : null}
        </View>

        <View style={formStyles.stepperCard}>
          <View style={formStyles.stepperHeader}>
            <View
              style={[
                formStyles.stepperIconWrap,
                { backgroundColor: theme.accentLight },
              ]}
            >
              <Ionicons name="nutrition" size={18} color={theme.accent} />
            </View>
            <Text style={formStyles.stepperLabel}>Feed every</Text>
          </View>
          <View style={formStyles.stepperRow}>
            <TouchableOpacity
              style={[formStyles.stepperButton, { borderColor: theme.accent }]}
              onPress={() =>
                adjustFrequency(
                  fertilisingFrequency,
                  -1,
                  setFertilisingFrequency,
                )
              }
              activeOpacity={0.6}
              accessibilityLabel="Decrease feeding frequency"
            >
              <Ionicons name="remove" size={20} color={theme.accent} />
            </TouchableOpacity>
            <View style={formStyles.stepperValueWrap}>
              <TextInput
                style={formStyles.stepperValueInput}
                value={fertilisingFrequency}
                onChangeText={(text) =>
                  setFertilisingFrequency(sanitizeNumberText(text))
                }
                keyboardType="numeric"
                placeholder="—"
                placeholderTextColor={theme.inputPlaceholder}
                maxLength={3}
                textAlign="center"
              />
              <Text style={formStyles.stepperUnit}>days</Text>
            </View>
            <TouchableOpacity
              style={[formStyles.stepperButton, { borderColor: theme.accent }]}
              onPress={() =>
                adjustFrequency(
                  fertilisingFrequency,
                  1,
                  setFertilisingFrequency,
                )
              }
              activeOpacity={0.6}
              accessibilityLabel="Increase feeding frequency"
            >
              <Ionicons name="add" size={20} color={theme.accent} />
            </TouchableOpacity>
          </View>
          {fertilisingFrequency ? (
            <Text style={[formStyles.stepperHint, { color: theme.accent }]}>
              {getFrequencyLabel(fertilisingFrequency)}
            </Text>
          ) : null}
        </View>

        {["vegetable", "herb"].includes(plantType) &&
          harvestSeasonOptions.length > 0 && (
            <>
              <View style={formStyles.fieldGroupDivider} />
              <View style={formStyles.directionChipsWrapper}>
                <Text style={formStyles.directionChipsFloatingLabel}>
                  Harvest Season
                </Text>
                <View style={formStyles.directionChipsContainer}>
                  {harvestSeasonOptions.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        formStyles.directionChip,
                        harvestSeason === s && formStyles.directionChipActive,
                      ]}
                      onPress={() =>
                        setHarvestSeason(harvestSeason === s ? "" : s)
                      }
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          formStyles.directionChipText,
                          harvestSeason === s &&
                            formStyles.directionChipTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
      </View>
    ),
    [
      formStyles,
      theme,
      isCompactScreen,
      plantVariety,
      autoApplyCareDefaults,
      setAutoApplyCareDefaults,
      autoSuggestFired,
      careProfileCardDismissed,
      setCareProfileCardDismissed,
      wateringFrequency,
      setWateringFrequency,
      fertilisingFrequency,
      setFertilisingFrequency,
      sunlight,
      setSunlight,
      waterRequirement,
      setWaterRequirement,
      plantType,
      harvestSeason,
      setHarvestSeason,
      harvestSeasonOptions,
    ],
  );

  return (
    <View style={wizardStyles.root}>
      <View style={[formStyles.header, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={formStyles.headerIconButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={wizardStep > 1 ? "arrow-back" : "close"}
            size={22}
            color={theme.text}
          />
        </TouchableOpacity>
        <View style={formStyles.headerCenter}>
          <Text style={formStyles.title}>Add Plant</Text>
          {hasUnsavedChanges && <View style={formStyles.unsavedDot} />}
        </View>
        <View style={wizardStyles.wizardHeaderSpacer} />
      </View>

      <View style={wizardStyles.stepRow}>
        {STEP_LABELS.map((label, i) => {
          const step = (i + 1) as 1 | 2 | 3;
          const isActive = wizardStep === step;
          const isComplete = wizardStep > step;
          return (
            <React.Fragment key={step}>
              <View style={wizardStyles.stepCol}>
                <View
                  style={[
                    wizardStyles.stepDot,
                    isActive && wizardStyles.stepDotActive,
                    isComplete && wizardStyles.stepDotComplete,
                  ]}
                />
                <Text
                  style={[
                    wizardStyles.stepLabel,
                    isActive && wizardStyles.stepLabelActive,
                    isComplete && wizardStyles.stepLabelComplete,
                  ]}
                >
                  {label}
                </Text>
              </View>
              {i < STEP_LABELS.length - 1 && (
                <View
                  style={[
                    wizardStyles.stepConnector,
                    isComplete && wizardStyles.stepConnectorFilled,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      <KeyboardAvoidingView
        style={wizardStyles.stepContent}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={wizardStyles.stepScrollContent}
        >
          <Animated.View
            style={{
              opacity: slideOpacity,
              transform: [{ translateX: slideX }],
            }}
          >
            {wizardStep === 1
              ? renderStep1()
              : wizardStep === 2
                ? renderStep2()
                : renderStep3()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View>
        {saveBannerVisible && (
          <Animated.View
            style={[wizardStyles.saveBanner, { opacity: bannerOpacity }]}
          >
            <Ionicons name="checkmark-circle" size={22} color={theme.success} />
            <Text style={wizardStyles.saveBannerText}>
              Plant saved! Going to your plants in a moment...
            </Text>
          </Animated.View>
        )}
        {stepError ? (
          <Text style={wizardStyles.stepErrorText}>{stepError}</Text>
        ) : null}
        <View
          style={[
            wizardStyles.wizardNavBar,
            { paddingBottom: Math.max(insets.bottom, 8) },
          ]}
        >
          <Text style={wizardStyles.wizardStepCounter}>
            {wizardStep} / {STEP_LABELS.length}
          </Text>

          {wizardStep === 3 ? (
            <TouchableOpacity
              style={[wizardStyles.wizardSaveBtn, loading && wizardStyles.wizardSaveBtnDisabled]}
              onPress={handleWizardSave}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={wizardStyles.wizardNextText}>
                {loading ? "Saving..." : "Save Plant"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={wizardStyles.wizardNextBtn}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={wizardStyles.wizardNextText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
