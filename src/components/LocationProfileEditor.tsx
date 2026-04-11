import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../theme";
import { createStyles } from "../styles/manageLocationsStyles";
import {
  DrainageQuality,
  LocationProfile,
  MoistureRetention,
  NutrientLevel,
  WindExposure,
  WaterSource,
} from "../types/database.types";
import { LOCATION_SOIL_TYPES, SOIL_LABELS } from "../utils/plantLabels";
import { toLocalDateString } from "../utils/dateHelpers";

interface EditModalState {
  type: "parent" | "child";
  original: string;
  value: string;
  shortName?: string;
  profile?: LocationProfile;
  activeTab?: "name" | "soil";
  showDatePicker?: boolean;
}

interface Props {
  editModal: EditModalState;
  setEditModal: React.Dispatch<React.SetStateAction<EditModalState | null>>;
  updateProfile: (patch: Partial<LocationProfile>) => void;
}

const PH_VALUES = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

const DRAINAGE_OPTIONS: { value: DrainageQuality; label: string }[] = [
  { value: "poor", label: "Poor" },
  { value: "fair", label: "Fair" },
  { value: "good", label: "Good" },
  { value: "excellent", label: "Excellent" },
];

const MOISTURE_OPTIONS: { value: MoistureRetention; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const NPK_OPTIONS: { value: NutrientLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Med" },
  { value: "high", label: "High" },
];

const WIND_OPTIONS: { value: WindExposure; label: string }[] = [
  { value: "sheltered", label: "Sheltered" },
  { value: "moderate", label: "Moderate" },
  { value: "exposed", label: "Exposed" },
];

const WATER_SOURCE_OPTIONS: { value: WaterSource; label: string }[] = [
  { value: "rain_fed", label: "Rain-fed" },
  { value: "borewell", label: "Borewell" },
  { value: "tap", label: "Tap" },
  { value: "pond_canal", label: "Pond/Canal" },
  { value: "drip", label: "Drip" },
  { value: "mixed", label: "Mixed" },
];

const formatDateDisplay = (isoDate: string): string => {
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const isSoilTestStale = (isoDate?: string | null): boolean => {
  if (!isoDate) return false;
  const tested = new Date(isoDate).getTime();
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  return Date.now() - tested > oneYear;
};

export function LocationProfileEditor({
  editModal,
  setEditModal,
  updateProfile,
}: Props): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (editModal.type !== "parent") return null;
  const profile = editModal.profile ?? {};
  const isStale = isSoilTestStale(profile.lastSoilTestDate);

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* pH */}
      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>Soil pH</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profileChipScroll}>
          <View style={styles.profileChipRow}>
            {PH_VALUES.map((ph) => {
              const selected = profile.soilPH === ph;
              return (
                <TouchableOpacity
                  key={ph}
                  style={[styles.profileChip, selected && styles.profileChipSelected]}
                  onPress={() => updateProfile({ soilPH: selected ? null : ph })}
                >
                  <Text style={[styles.profileChipText, selected && styles.profileChipTextSelected]}>
                    {ph.toFixed(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.profileSectionDivider} />

      {/* Soil Type */}
      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>Soil Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profileChipScroll}>
          <View style={styles.profileChipRow}>
            {LOCATION_SOIL_TYPES.map((st) => {
              const selected = profile.soilType === st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[styles.profileChip, selected && styles.profileChipSelected]}
                  onPress={() => updateProfile({ soilType: selected ? null : st })}
                >
                  <Text style={[styles.profileChipText, selected && styles.profileChipTextSelected]}>
                    {SOIL_LABELS[st]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.profileSectionDivider} />

      {/* Drainage & Moisture */}
      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>Drainage</Text>
        <View style={styles.profileChipRow}>
          {DRAINAGE_OPTIONS.map(({ value, label }) => {
            const selected = profile.drainageQuality === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.profileChip, selected && styles.profileChipSelected]}
                onPress={() => updateProfile({ drainageQuality: selected ? null : value })}
              >
                <Text style={[styles.profileChipText, selected && styles.profileChipTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>Moisture Retention</Text>
        <View style={styles.profileChipRow}>
          {MOISTURE_OPTIONS.map(({ value, label }) => {
            const selected = profile.moistureRetention === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.profileChip, selected && styles.profileChipSelected]}
                onPress={() => updateProfile({ moistureRetention: selected ? null : value })}
              >
                <Text style={[styles.profileChipText, selected && styles.profileChipTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.profileSectionDivider} />

      {/* NPK */}
      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>NPK Levels</Text>
        {(["nitrogenLevel", "phosphorusLevel", "potassiumLevel"] as const).map((field, i) => {
          const letter = ["N", "P", "K"][i];
          return (
            <View key={field} style={styles.profileNpkRow}>
              <Text style={styles.profileNpkLabel}>{letter}</Text>
              <View style={styles.profileNpkChips}>
                {NPK_OPTIONS.map(({ value, label }) => {
                  const selected = profile[field] === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[styles.profileNpkChip, selected && styles.profileNpkChipSelected]}
                      onPress={() => updateProfile({ [field]: selected ? null : value })}
                    >
                      <Text style={[styles.profileNpkChipText, selected && styles.profileNpkChipTextSelected]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.profileSectionDivider} />

      {/* Wind & Water Source */}
      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>Wind Exposure</Text>
        <View style={styles.profileChipRow}>
          {WIND_OPTIONS.map(({ value, label }) => {
            const selected = profile.windExposure === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.profileChip, selected && styles.profileChipSelected]}
                onPress={() => updateProfile({ windExposure: selected ? null : value })}
              >
                <Text style={[styles.profileChipText, selected && styles.profileChipTextSelected]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>Water Source</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profileChipScroll}>
          <View style={styles.profileChipRow}>
            {WATER_SOURCE_OPTIONS.map(({ value, label }) => {
              const selected = profile.waterSource === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.profileChip, selected && styles.profileChipSelected]}
                  onPress={() => updateProfile({ waterSource: selected ? null : value })}
                >
                  <Text style={[styles.profileChipText, selected && styles.profileChipTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.profileSectionDivider} />

      {/* Last Soil Test Date */}
      <View style={styles.profileSection}>
        <View style={styles.profileDateCard}>
          <TouchableOpacity
            style={styles.profileDateCardTouchable}
            onPress={() => setEditModal((prev) => prev ? { ...prev, showDatePicker: true } : prev)}
          >
            <View style={styles.profileDateCardIconWrap}>
              <Ionicons name="calendar" size={18} color={theme.primary} />
            </View>
            <View style={styles.profileDateCardContent}>
              <Text style={styles.profileDateCardLabel}>Last Soil Test Date</Text>
              <Text style={profile.lastSoilTestDate ? styles.profileDateCardValue : styles.profileDateCardPlaceholder}>
                {profile.lastSoilTestDate ? formatDateDisplay(profile.lastSoilTestDate) : "Tap to select date"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
          </TouchableOpacity>
        </View>
        {isStale && (
          <Text style={styles.profileStaleDateHint}>
            Soil test is over 1 year old — consider retesting.
          </Text>
        )}
        {editModal?.showDatePicker && (
          <DateTimePicker
            value={profile.lastSoilTestDate ? new Date(profile.lastSoilTestDate) : new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            maximumDate={new Date()}
            onChange={(_, selectedDate) => {
              setEditModal((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  showDatePicker: Platform.OS === "ios",
                  profile: {
                    ...(prev.profile ?? {}),
                    lastSoilTestDate: selectedDate ? toLocalDateString(selectedDate) : prev.profile?.lastSoilTestDate ?? null,
                  },
                };
              });
            }}
          />
        )}
      </View>

      {/* Notes */}
      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>Notes</Text>
        <TextInput
          style={styles.profileNotesInput}
          placeholder="e.g. Floods during heavy rain, coconut shade after 2pm..."
          placeholderTextColor={theme.textTertiary}
          value={profile.notes ?? ""}
          onChangeText={(text) => updateProfile({ notes: text.slice(0, 200) })}
          multiline
          maxLength={200}
          selectionColor={theme.primary}
        />
      </View>
    </ScrollView>
  );
}
