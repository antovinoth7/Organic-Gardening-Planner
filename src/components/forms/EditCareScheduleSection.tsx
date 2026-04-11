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
import { createEditStyles } from "../../styles/plantEditFormStyles";
import CollapsibleSection from "../CollapsibleSection";
import ThemedDropdown from "../ThemedDropdown";
import { getPruningTechniques } from "../../utils/plantCareDefaults";
import type { PlantType, SunlightLevel, WaterRequirement } from "../../types/database.types";

interface Props {
  formState: PlantFormStateReturn;
}

export function EditCareScheduleSection({ formState }: Props): React.JSX.Element {
  const {
    theme,
    sectionExpanded,
    setSectionExpandedState,
    showValidationErrors,
    validationErrors,
    sectionStatuses,
    plantType,
    plantVariety,
    plantCareProfiles,
    sunlight,
    setSunlight,
    waterRequirement,
    setWaterRequirement,
    soilType,
    setSoilType,
    wateringFrequency,
    setWateringFrequency,
    fertilisingFrequency,
    setFertilisingFrequency,
    preferredFertiliser,
    setPreferredFertiliser,
    mulchingUsed,
    setMulchingUsed,
    pruningFrequency,
    setPruningFrequency,
  } = formState;

  const styles = useMemo(() => createStyles(theme), [theme]);
  const editStyles = useMemo(() => createEditStyles(theme), [theme]);

  return (
    <CollapsibleSection
      title="Care & Schedule"
      icon="leaf"
      defaultExpanded={false}
      expanded={sectionExpanded.care}
      onExpandedChange={(expanded) => setSectionExpandedState("care", expanded)}
      hasError={showValidationErrors && validationErrors.care.length > 0}
      sectionStatus={showValidationErrors ? undefined : sectionStatuses.care}
    >
      <Text style={styles.fieldGroupLabel}>{"\uD83C\uDF31"} Growing Conditions</Text>
      <View style={styles.stepperCard}>
        <Text style={styles.fieldGroupLabel}>{"\u2600\uFE0F"} Sunlight Needs</Text>
        <View style={styles.directionChipsContainer}>
          {[
            { label: "\u2600\uFE0F Full Sun", value: "full_sun" },
            { label: "\u26C5 Partial", value: "partial_sun" },
            { label: "\uD83C\uDF24\uFE0F Shade", value: "shade" },
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

        <Text style={styles.fieldGroupLabel}>{"\uD83D\uDCA7"} Water Needs</Text>
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
                style={[styles.directionChip, isActive && styles.directionChipActive]}
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
                  style={[styles.directionChipText, isActive && styles.directionChipTextActive]}
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
      <Text style={styles.fieldGroupLabel}>{"\uD83D\uDCC5"} Watering & Feeding Schedule</Text>

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
              placeholder="\u2014"
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
              placeholder="\u2014"
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
          <Text style={styles.fieldGroupLabel}>{"\u2702\uFE0F"} Pruning</Text>
          <View style={editStyles.pruningFrequencyRow}>
            <Text style={[styles.frequencyCardLabel, editStyles.noMarginBottom]}>Every</Text>
            <View style={[styles.frequencyInputWrap, editStyles.frequencyInputWrapCompact]}>
              <TextInput
                style={[styles.frequencyInput, editStyles.frequencyInputLarge]}
                value={pruningFrequency}
                onChangeText={(text) => setPruningFrequency(sanitizeNumberText(text))}
                keyboardType="numeric"
                placeholder="\u2014"
                placeholderTextColor={theme.inputPlaceholder}
                maxLength={3}
              />
            </View>
            <Text style={[styles.frequencyCardLabel, editStyles.noMarginBottom]}>days</Text>
          </View>
          {(() => {
            const userOverride = plantType && plantVariety
              ? plantCareProfiles[plantType as PlantType]?.[plantVariety]
              : undefined;
            const info = getPruningTechniques(plantType, plantVariety, userOverride);
            const hasTips = info.tips.length > 0 || info.shapePruning || info.flowerPruning;
            return hasTips ? (
              <View style={editStyles.pruningTipsCard}>
                <View style={editStyles.pruningTipsHeader}>
                  <Ionicons name="bulb-outline" size={16} color={theme.accent} />
                  <Text style={editStyles.pruningTipsTitle}>
                    Pruning Tips{plantVariety ? ` \u2014 ${plantVariety}` : ""}
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
                        Shape pruning<Text style={editStyles.pruningTechniqueDetail}> \u2014 {info.shapePruning.tip}</Text>
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
                        Flower pruning<Text style={editStyles.pruningTechniqueDetail}> \u2014 {info.flowerPruning.tip}</Text>
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
  );
}
