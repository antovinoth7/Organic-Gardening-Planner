import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { createStyles } from "../styles/plantsStyles";
import {
  PlantType,
  HealthStatus,
  SpaceType,
  SunlightLevel,
  WaterRequirement,
} from "../types/database.types";
import { TAB_BAR_HEIGHT } from "../components/FloatingTabBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FilterType = "all" | PlantType;
type SortOption = "name" | "newest" | "oldest" | "health" | "age";

interface ActiveFilters {
  type: FilterType;
  health: HealthStatus | "all";
  space: SpaceType | "all";
  sunlight: SunlightLevel | "all";
  water: WaterRequirement | "all";
  parentLocation: string;
  childLocation: string;
  pestStatus: "all" | "active_issues" | "no_issues";
}

interface PlantCounts {
  type: Record<string, number>;
  health: Record<string, number>;
  space: Record<string, number>;
  sunlight: Record<string, number>;
  water: Record<string, number>;
  pestActive: number;
  pestNone: number;
}

interface Props {
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  filters: ActiveFilters;
  updateFilter: <K extends keyof ActiveFilters>(category: K, value: ActiveFilters[K]) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  plantCounts: PlantCounts;
  parentLocations: string[];
  childLocations: string[];
  onClose: () => void;
}

export function PlantFilterSheet({
  sortBy,
  setSortBy,
  filters,
  updateFilter,
  clearAllFilters,
  hasActiveFilters,
  plantCounts,
  parentLocations,
  childLocations,
  onClose,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  return (
    <View style={[StyleSheet.absoluteFill, styles.sheetOverlay]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.sheetContainer, { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity activeOpacity={0.6} onPress={onClose} style={styles.sheetHandleArea}>
          <View style={styles.sheetHandle} />
        </TouchableOpacity>

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Sort & Filter</Text>
          {hasActiveFilters && (
            <TouchableOpacity onPress={clearAllFilters} style={styles.sheetClearBtn}>
              <Text style={styles.sheetClearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.sheetScroll}
          bounces={false}
          nestedScrollEnabled
        >
          {/* Sort By */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="swap-vertical" size={14} color={theme.textSecondary} /> Sort By
          </Text>
          <View style={styles.sheetChipWrap}>
            {([
              ["newest", "🕐 Newest"],
              ["oldest", "⌛ Oldest"],
              ["name", "A–Z"],
              ["health", "❤️ Health"],
              ["age", "🌱 Age"],
            ] as const).map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.sheetChip, sortBy === val && styles.sheetChipActive]}
                onPress={() => setSortBy(val)}
              >
                <Text style={[styles.sheetChipText, sortBy === val && styles.sheetChipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Plant Type */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="apps" size={14} color={theme.textSecondary} /> Plant Type
          </Text>
          <View style={styles.sheetChipWrap}>
            {([
              ["all", "All"],
              ["vegetable", "🥕 Vegetable"],
              ["fruit_tree", "🍇 Fruit"],
              ["coconut_tree", "🥥 Coconut"],
              ["herb", "🌿 Herb"],
              ["timber_tree", "🌳 Timber"],
              ["flower", "🌸 Flower"],
              ["shrub", "🪴 Shrub"],
            ] as const).map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.sheetChip, filters.type === val && styles.sheetChipActive]}
                onPress={() => updateFilter("type", val as FilterType)}
              >
                <Text style={[styles.sheetChipText, filters.type === val && styles.sheetChipTextActive]}>
                  {label}{val !== "all" && plantCounts.type[val] ? ` (${plantCounts.type[val]})` : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Health */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="fitness" size={14} color={theme.textSecondary} /> Health
          </Text>
          <View style={styles.sheetChipWrap}>
            {([
              ["all", "All"],
              ["healthy", "✅ Healthy"],
              ["stressed", "⚠️ Stressed"],
              ["recovering", "🔄 Recovering"],
              ["sick", "❌ Sick"],
            ] as const).map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.sheetChip, filters.health === val && styles.sheetChipActive]}
                onPress={() => updateFilter("health", val as HealthStatus | "all")}
              >
                <Text style={[styles.sheetChipText, filters.health === val && styles.sheetChipTextActive]}>
                  {label}{val !== "all" && plantCounts.health[val] ? ` (${plantCounts.health[val]})` : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Space */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="cube" size={14} color={theme.textSecondary} /> Space Type
          </Text>
          <View style={styles.sheetChipWrap}>
            {([
              ["all", "All"],
              ["pot", "Pot"],
              ["bed", "Bed"],
              ["ground", "Ground"],
            ] as const).map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.sheetChip, filters.space === val && styles.sheetChipActive]}
                onPress={() => updateFilter("space", val as SpaceType | "all")}
              >
                <Text style={[styles.sheetChipText, filters.space === val && styles.sheetChipTextActive]}>
                  {label}{val !== "all" && plantCounts.space[val] ? ` (${plantCounts.space[val]})` : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Sunlight */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="sunny" size={14} color={theme.textSecondary} /> Sunlight
          </Text>
          <View style={styles.sheetChipWrap}>
            {([
              ["all", "All"],
              ["full_sun", "☀️ Full Sun"],
              ["partial_sun", "⛅ Partial"],
              ["shade", "🌤️ Shade"],
            ] as const).map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.sheetChip, filters.sunlight === val && styles.sheetChipActive]}
                onPress={() => updateFilter("sunlight", val as SunlightLevel | "all")}
              >
                <Text style={[styles.sheetChipText, filters.sunlight === val && styles.sheetChipTextActive]}>
                  {label}{val !== "all" && plantCounts.sunlight[val] ? ` (${plantCounts.sunlight[val]})` : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Water */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="water" size={14} color={theme.textSecondary} /> Water Requirement
          </Text>
          <View style={styles.sheetChipWrap}>
            {([
              ["all", "All"],
              ["low", "💧 Low"],
              ["medium", "💧💧 Medium"],
              ["high", "💧💧💧 High"],
            ] as const).map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.sheetChip, filters.water === val && styles.sheetChipActive]}
                onPress={() => updateFilter("water", val as WaterRequirement | "all")}
              >
                <Text style={[styles.sheetChipText, filters.water === val && styles.sheetChipTextActive]}>
                  {label}{val !== "all" && plantCounts.water[val] ? ` (${plantCounts.water[val]})` : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Pest Status */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="bug" size={14} color={theme.textSecondary} /> Pest & Disease
          </Text>
          <View style={styles.sheetChipWrap}>
            {([
              ["all", "All"],
              ["active_issues", "🐛 Active Issues"],
              ["no_issues", "✅ No Issues"],
            ] as const).map(([val, label]) => (
              <TouchableOpacity
                key={val}
                style={[styles.sheetChip, filters.pestStatus === val && styles.sheetChipActive]}
                onPress={() => updateFilter("pestStatus", val)}
              >
                <Text style={[styles.sheetChipText, filters.pestStatus === val && styles.sheetChipTextActive]}>
                  {label}
                  {val === "active_issues" && plantCounts.pestActive > 0 ? ` (${plantCounts.pestActive})` : ""}
                  {val === "no_issues" && plantCounts.pestNone > 0 ? ` (${plantCounts.pestNone})` : ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Location */}
          <Text style={styles.sheetSectionTitle}>
            <Ionicons name="location" size={14} color={theme.textSecondary} /> Location
          </Text>
          <View style={styles.sheetChipWrap}>
            <TouchableOpacity
              style={[styles.sheetChip, filters.parentLocation === "" && styles.sheetChipActive]}
              onPress={() => { updateFilter("parentLocation", ""); updateFilter("childLocation", ""); }}
            >
              <Text style={[styles.sheetChipText, filters.parentLocation === "" && styles.sheetChipTextActive]}>All</Text>
            </TouchableOpacity>
            {parentLocations.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.sheetChip, filters.parentLocation === loc && styles.sheetChipActive]}
                onPress={() => { updateFilter("parentLocation", loc); updateFilter("childLocation", ""); }}
              >
                <Text style={[styles.sheetChipText, filters.parentLocation === loc && styles.sheetChipTextActive]}>📍 {loc}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {filters.parentLocation !== "" && (
            <>
              <Text style={styles.sheetSubSectionTitle}>Direction</Text>
              <View style={styles.sheetChipWrap}>
                <TouchableOpacity
                  style={[styles.sheetChip, filters.childLocation === "" && styles.sheetChipActive]}
                  onPress={() => updateFilter("childLocation", "")}
                >
                  <Text style={[styles.sheetChipText, filters.childLocation === "" && styles.sheetChipTextActive]}>All</Text>
                </TouchableOpacity>
                {childLocations.filter((loc) => loc.trim()).map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[styles.sheetChip, filters.childLocation === loc && styles.sheetChipActive]}
                    onPress={() => updateFilter("childLocation", loc)}
                  >
                    <Text style={[styles.sheetChipText, filters.childLocation === loc && styles.sheetChipTextActive]}>◉ {loc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <View style={styles.filterBottomSpacer} />
        </ScrollView>
      </View>
    </View>
  );
}
