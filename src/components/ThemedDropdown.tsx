import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import { createStyles } from "../styles/themedDropdownStyles";

export interface DropdownItem {
  label: string;
  value: string;
  color?: string;
}

interface ThemedDropdownProps {
  items: DropdownItem[];
  selectedValue: string;
  onValueChange: (value: any) => void;
  placeholder?: string;
  /** Floating label displayed on the trigger (Material Design style) */
  label?: string;
  enabled?: boolean;
  /** Compact mode uses a shorter height (44px vs 52px) */
  compact?: boolean;
  /** Show a search input at the top of the dropdown sheet */
  searchable?: boolean;
}

const useNativeDriver = Platform.OS !== "web";

function getScreenHeight() {
  return Dimensions.get("window").height;
}

export default function ThemedDropdown({
  items,
  selectedValue,
  onValueChange,
  placeholder = "Select...",
  label,
  enabled = true,
  compact = false,
  searchable = false,
}: ThemedDropdownProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, compact), [theme, compact]);
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(getScreenHeight())).current;

  const selectedItem = useMemo(
    () => items.find((item) => item.value === selectedValue),
    [items, selectedValue],
  );

  const open = useCallback(() => {
    if (!enabled) return;
    setSearchQuery("");
    setVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 20,
        stiffness: 200,
        useNativeDriver,
      }),
    ]).start();
  }, [enabled, fadeAnim, slideAnim]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver,
      }),
      Animated.timing(slideAnim, {
        toValue: getScreenHeight(),
        duration: 200,
        useNativeDriver,
      }),
    ]).start(() => setVisible(false));
  }, [fadeAnim, slideAnim]);

  const handleSelect = useCallback(
    (value: string) => {
      onValueChange(value);
      close();
    },
    [onValueChange, close],
  );

  const filteredItems = useMemo(() => {
    if (!searchable || !searchQuery.trim()) return items;
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, searchQuery, searchable]);

  // Limit visible list height to 60% of screen, or item count
  const screenHeight = getScreenHeight();
  const maxVisibleItems = Math.min(filteredItems.length, 8);
  const listMaxHeight = Math.min(maxVisibleItems * 52, screenHeight * 0.55);

  const renderItem = useCallback(
    ({ item }: { item: DropdownItem }) => {
      const isSelected = item.value === selectedValue;
      return (
        <TouchableOpacity
          style={[styles.optionRow, isSelected && styles.optionRowSelected]}
          onPress={() => handleSelect(item.value)}
          activeOpacity={0.6}
        >
          <Text
            style={[styles.optionText, isSelected && styles.optionTextSelected]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
          {isSelected && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={theme.primary}
            />
          )}
        </TouchableOpacity>
      );
    },
    [selectedValue, handleSelect, styles, theme.primary],
  );

  const keyExtractor = useCallback(
    (item: DropdownItem, index: number) => `${item.value}-${index}`,
    [],
  );

  const hasValue = !!selectedItem;
  const showFloatingLabel = !!label && hasValue;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          !enabled && styles.triggerDisabled,
          showFloatingLabel && styles.triggerWithLabel,
        ]}
        onPress={open}
        activeOpacity={enabled ? 0.7 : 1}
      >
        {showFloatingLabel && (
          <Text style={styles.floatingLabel} numberOfLines={1}>
            {label}
          </Text>
        )}
        <Text
          style={[
            styles.triggerText,
            !selectedItem && styles.triggerPlaceholder,
            !enabled && styles.triggerTextDisabled,
          ]}
          numberOfLines={1}
        >
          {selectedItem ? selectedItem.label : (label || placeholder)}
        </Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={enabled ? theme.textTertiary : theme.border}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={close}
        statusBarTranslucent
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={close}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 34 : 16),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={0.7} onPress={close}>
            <View style={styles.sheetHandle} />
          </TouchableOpacity>
          <Text style={styles.sheetTitle}>
            {placeholder}
          </Text>
          {searchable && (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={theme.textTertiary} style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                placeholderTextColor={theme.inputPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          )}
          {searchable && filteredItems.length === 0 && (
            <Text style={styles.emptyText}>No matches found</Text>
          )}
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            style={{ maxHeight: listMaxHeight }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            getItemLayout={(_, index) => ({
              length: 52,
              offset: 52 * index,
              index,
            })}
          />
        </Animated.View>
      </Modal>
    </>
  );
}
