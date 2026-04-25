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
  HEALTH_OPTIONS,
  GROWTH_STAGE_OPTIONS,
  NOTES_MAX_LENGTH,
} from "../../hooks/usePlantFormState";
import { createStyles } from "../../styles/plantFormStyles";
import { createEditStyles } from "../../styles/plantEditFormStyles";
import CollapsibleSection from "../CollapsibleSection";
import PestDiseaseModal from "../modals/PestDiseaseModal";
import { EditBasicInfoSection } from "./EditBasicInfoSection";
import { EditLocationSection } from "./EditLocationSection";
import { EditCareScheduleSection } from "./EditCareScheduleSection";
import { EditCoconutSection } from "./EditCoconutSection";
import { sanitizeAlphaNumericSpaces } from "../../utils/textSanitizer";
import { toLocalDateString, formatDateDisplay } from "../../utils/dateHelpers";
import {
  getCompanionSuggestions,
  getIncompatiblePlants,
} from "../../utils/plantHelpers";
import { HealthStatus, GrowthStage } from "../../types/database.types";

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
    sectionExpanded,
    setSectionExpandedState,
    showValidationErrors,
    photoUri,
    pickImage,
    plantType,
    plantVariety,
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
            <Ionicons name="chevron-back" size={22} color={theme.textInverse} />
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
          <EditBasicInfoSection formState={formState} />

          {/* Location & Placement */}
          <EditLocationSection formState={formState} />

          {/* Care & Schedule */}
          <EditCareScheduleSection formState={formState} />

          <CollapsibleSection
            title="Plant Health"
            icon="fitness"
            defaultExpanded={false}
            expanded={sectionExpanded.health}
            onExpandedChange={(expanded) => setSectionExpandedState("health", expanded)}
            hasError={false}
            sectionStatus="optional"
          >
            <Text style={styles.fieldGroupLabel}>{"\uD83C\uDF3F"} Health Status</Text>
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

          <EditCoconutSection formState={formState} />

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
