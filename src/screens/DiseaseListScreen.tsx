import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, SectionList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "@/theme";
import { TAB_BAR_HEIGHT } from "@/components/FloatingTabBar";
import FieldHelp from "@/components/FieldHelp";
import { getGroupedDiseaseEntries, CATEGORY_DESCRIPTIONS } from "@/config/diseases";
import { createStyles } from "@/styles/referenceListStyles";
import type { DiseaseListScreenNavigationProp } from "@/types/navigation.types";
import type { DiseaseEntry, DiseaseCategory } from "@/types/database.types";

interface SectionData {
  title: string;
  category: DiseaseCategory;
  data: DiseaseEntry[];
}

export default function DiseaseListScreen(): React.JSX.Element {
  const navigation = useNavigation<DiseaseListScreenNavigationProp>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const sections: SectionData[] = useMemo(() => {
    const groups = getGroupedDiseaseEntries();
    const query = search.trim().toLowerCase();

    return groups
      .map((g) => ({
        title: g.label,
        category: g.category,
        data: query
          ? g.diseases.filter(
              (d) =>
                d.name.toLowerCase().includes(query) ||
                (d.tamilName && d.tamilName.includes(query)) ||
                d.plantsAffected.some((pl) => pl.toLowerCase().includes(query)),
            )
          : g.diseases,
      }))
      .filter((s) => s.data.length > 0);
  }, [search]);

  const handlePress = useCallback(
    (diseaseId: string) => {
      navigation.navigate("DiseaseDetail", { diseaseId });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: DiseaseEntry }) => (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handlePress(item.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
        <View style={styles.cardContent}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.tamilName ? (
            <Text style={styles.cardCategory} numberOfLines={1}>
              {item.tamilName}
            </Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
      </TouchableOpacity>
    ),
    [styles, theme, handlePress],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionData }) => (
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>{section.title}</Text>
        <FieldHelp
          title={section.title}
          description={CATEGORY_DESCRIPTIONS[section.category]}
          compact
        />
      </View>
    ),
    [styles],
  );

  const keyExtractor = useCallback((item: DiseaseEntry) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={navigation.goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="chevron-back" size={24} color={theme.textInverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Diseases</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search diseases…"
          placeholderTextColor={theme.inputPlaceholder}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={keyExtractor}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) + 16 },
        ]}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={40} color={theme.textSecondary} />
            <Text style={styles.emptyText}>No diseases match your search</Text>
          </View>
        }
      />
    </View>
  );
}
