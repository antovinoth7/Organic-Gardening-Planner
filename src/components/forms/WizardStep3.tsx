import React, { useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  PlantFormStateReturn,
  sanitizeNumberText,
  adjustFrequency,
  getFrequencyLabel,
} from "../../hooks/usePlantFormState";
import { createStyles } from "../../styles/plantFormStyles";
import { createEnrichedSectionStyles } from "../../styles/enrichedSectionStyles";
import type { SunlightLevel, WaterRequirement } from "../../types/database.types";

interface Props {
  formState: PlantFormStateReturn;
}

export function WizardStep3({ formState }: Props): React.JSX.Element {
  const {
    theme,
    isCompactScreen,
    plantType,
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
    harvestSeason,
    setHarvestSeason,
    harvestSeasonOptions,
    wateringEnabled,
    setWateringEnabled,
    fertilisingEnabled,
    setFertilisingEnabled,
  } = formState;

  const formStyles = useMemo(() => createStyles(theme), [theme]);
  const enrichedStyles = useMemo(() => createEnrichedSectionStyles(theme), [theme]);

  return (
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
                  {"\uD83D\uDCA7"} {wateringFrequency}d {"\u00B7"} {"\uD83C\uDF3F"} {fertilisingFrequency}d {"\u00B7"}{" "}
                  {sunlight === "full_sun"
                    ? "\u2600\uFE0F Full"
                    : sunlight === "partial_sun"
                      ? "\u26C5 Partial"
                      : "\uD83C\uDF24\uFE0F Shade"}
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

      <Text style={formStyles.fieldGroupLabel}>{"\uD83C\uDF31"} Growing Conditions</Text>
      <View style={formStyles.stepperCard}>
        <Text style={formStyles.fieldGroupLabel}>{"\u2600\uFE0F"} Sunlight Needs</Text>
        <View style={formStyles.directionChipsContainer}>
          {[
            { label: "\u2600\uFE0F Full Sun", value: "full_sun" },
            { label: "\u26C5 Partial", value: "partial_sun" },
            { label: "\uD83C\uDF24\uFE0F Shade", value: "shade" },
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

        <Text style={formStyles.fieldGroupLabel}>{"\uD83D\uDCA7"} Water Needs</Text>
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
        {"\uD83D\uDCC5"} Watering & Feeding Schedule
      </Text>

      <View style={[formStyles.stepperCard, !wateringEnabled && enrichedStyles.stepperCardDisabled]}>
        <View style={enrichedStyles.toggleHeader}>
          <View style={enrichedStyles.toggleHeaderLeft}>
            <View style={formStyles.stepperIconWrap}>
              <Ionicons name="water" size={18} color={wateringEnabled ? theme.primary : theme.textTertiary} />
            </View>
            <Text style={formStyles.stepperLabel}>Water every</Text>
          </View>
          <TouchableOpacity
            onPress={() => setWateringEnabled(!wateringEnabled)}
            activeOpacity={0.85}
            accessibilityRole="switch"
            accessibilityState={{ checked: wateringEnabled }}
          >
            <View style={[formStyles.settingSwitchTrack, wateringEnabled && formStyles.settingSwitchTrackActive]}>
              <View style={[formStyles.settingSwitchThumb, wateringEnabled && formStyles.settingSwitchThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>
        {wateringEnabled ? (
          <>
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
              placeholder="\u2014"
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
          </>
        ) : (
          <Text style={enrichedStyles.toggleDisabledText}>No task · rain-fed or manual</Text>
        )}
      </View>

      <View style={[formStyles.stepperCard, !fertilisingEnabled && enrichedStyles.stepperCardDisabled]}>
        <View style={enrichedStyles.toggleHeader}>
          <View style={enrichedStyles.toggleHeaderLeft}>
            <View
              style={[
                formStyles.stepperIconWrap,
                { backgroundColor: theme.accentLight },
              ]}
            >
              <Ionicons name="nutrition" size={18} color={fertilisingEnabled ? theme.accent : theme.textTertiary} />
            </View>
            <Text style={formStyles.stepperLabel}>Feed every</Text>
          </View>
          <TouchableOpacity
            onPress={() => setFertilisingEnabled(!fertilisingEnabled)}
            activeOpacity={0.85}
            accessibilityRole="switch"
            accessibilityState={{ checked: fertilisingEnabled }}
          >
            <View style={[formStyles.settingSwitchTrack, fertilisingEnabled && formStyles.settingSwitchTrackActive]}>
              <View style={[formStyles.settingSwitchThumb, fertilisingEnabled && formStyles.settingSwitchThumbActive]} />
            </View>
          </TouchableOpacity>
        </View>
        {fertilisingEnabled ? (
          <>
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
              placeholder="\u2014"
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
          </>
        ) : (
          <Text style={enrichedStyles.toggleDisabledText}>No task · manual feeding only</Text>
        )}
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
  );
}
