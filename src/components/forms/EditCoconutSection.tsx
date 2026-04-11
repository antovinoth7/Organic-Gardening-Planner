import React, { useMemo } from "react";
import { View, Text, TextInput, TouchableOpacity, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { PlantFormStateReturn, sanitizeNumberText } from "../../hooks/usePlantFormState";
import { createStyles } from "../../styles/plantFormStyles";
import { createEditStyles } from "../../styles/plantEditFormStyles";
import CollapsibleSection from "../CollapsibleSection";
import { toLocalDateString, formatDateDisplay } from "../../utils/dateHelpers";

interface Props {
  formState: PlantFormStateReturn;
}

export function EditCoconutSection({ formState }: Props): React.JSX.Element | null {
  const {
    theme,
    plantType,
    sectionExpanded,
    setSectionExpandedState,
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
  } = formState;

  const styles = useMemo(() => createStyles(theme), [theme]);
  const editStyles = useMemo(() => createEditStyles(theme), [theme]);

  if (plantType !== "coconut_tree") return null;

  return (
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
          <Text style={styles.infoCardText}>
            {"\u2022"} Water every {coconutAgeInfo.wateringFrequencyDays} day{coconutAgeInfo.wateringFrequencyDays !== 1 ? "s" : ""}
          </Text>
          <Text style={styles.infoCardText}>
            {"\u2022"} Fertilise every {coconutAgeInfo.fertilisingFrequencyDays} days
          </Text>
          <Text style={[styles.infoCardText, editStyles.infoCardTextBold]}>Care tips for this stage:</Text>
          {coconutAgeInfo.careTips.map((tip, i) => (
            <Text key={i} style={styles.infoCardText}>{"\u2022"} {tip}</Text>
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
                placeholder="\u2014"
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
              placeholder="\u2014"
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
  );
}
