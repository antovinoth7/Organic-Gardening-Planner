import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, SectionList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "@/theme";
import { TAB_BAR_HEIGHT } from "@/components/FloatingTabBar";
import FieldHelp from "@/components/FieldHelp";
import { getGroupedPestEntries, CATEGORY_DESCRIPTIONS } from "@/config/pests";
import { createStyles } from "@/styles/referenceListStyles";
import type { PestListScreenNavigationProp } from "@/types/navigation.types";
import type { PestEntry, PestCategory } from "@/types/database.types";

interface SectionData {
  title: string;
  category: PestCategory;
  data: PestEntry[];
}

export default function PestListScreen(): React.JSX.Element {
  const navigation = useNavigation<PestListScreenNavigationProp>();
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const sections: SectionData[] = useMemo(() => {
    const groups = getGroupedPestEntries();
    const query = search.trim().toLowerCase();

    return groups
      .map((g) => ({
        title: g.label,
        category: g.category,
        data: query
          ? g.pests.filter(
              (p) =>
                p.name.toLowerCase().includes(query) ||
                (p.tamilName && p.tamilName.includes(query)) ||
                p.plantsAffected.some((pl) => pl.toLowerCase().includes(query)),
            )
          : g.pests,
      }))
      .filter((s) => s.data.length > 0);
  }, [search]);

  const handlePress = useCallback(
    (pestId: string) => {
      navigation.navigate("PestDetail", { pestId });
    },
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: PestEntry }) => (
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

  const keyExtractor = useCallback((item: PestEntry) => item.id, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={navigation.goBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Pests</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search pests…"
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
            <Text style={styles.emptyText}>No pests match your search</Text>
          </View>
        }
      />
    </View>
  );
}
