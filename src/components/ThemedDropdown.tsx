import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  Modal,
  Platform,
  Dimensions,
  Animated,
  Keyboard,
} from "react-native";
import { FlatList, GestureHandlerRootView, RectButton } from "react-native-gesture-handler";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- callers pass setters for various string union types
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

function getScreenHeight(): number {
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
}: ThemedDropdownProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, compact), [theme, compact]);
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(getScreenHeight())).current;
  const isClosing = useRef(false);
  const [sheetTouchEnabled, setSheetTouchEnabled] = useState(false);

  // Track keyboard height so the list shrinks to always stay above the keyboard
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const selectedItem = useMemo(
    () => items.find((item) => item.value === selectedValue),
    [items, selectedValue],
  );

  const open = useCallback(() => {
    if (!enabled) return;
    // Cancel any in-flight close animation and its pending callback
    isClosing.current = false;
    fadeAnim.stopAnimation();
    slideAnim.stopAnimation();
    slideAnim.setValue(getScreenHeight());
    fadeAnim.setValue(0);
    setSearchQuery("");
    setSheetTouchEnabled(false);
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
    ]).start(() => {
      if (!isClosing.current) {
        setSheetTouchEnabled(true);
      }
    });
  }, [enabled, fadeAnim, slideAnim]);

  const close = useCallback(() => {
    isClosing.current = true;
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
    ]).start(() => {
      // Only hide if open() hasn't been called since close() started
      if (isClosing.current) {
        setVisible(false);
      }
    });
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

  // Limit visible list height accounting for keyboard
  const screenHeight = getScreenHeight();
  const sheetHeaderHeight = searchable ? 130 : 80; // handle + title + optional search bar
  const availableHeight = screenHeight - keyboardHeight - sheetHeaderHeight - Math.max(insets.bottom, Platform.OS === "ios" ? 34 : 16);
  const maxVisibleItems = Math.min(filteredItems.length, 8);
  const listMaxHeight = Math.min(maxVisibleItems * 52, availableHeight, screenHeight * 0.55);

  const renderItem = useCallback(
    ({ item }: { item: DropdownItem }) => {
      const isSelected = item.value === selectedValue;
      return (
        <RectButton
          style={[
            styles.optionRow,
            isSelected && styles.optionRowSelected,
          ]}
          onPress={() => handleSelect(item.value)}
          activeOpacity={0.12}
          underlayColor={theme.primaryLight}
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
        </RectButton>
      );
    },
    [selectedValue, handleSelect, styles, theme.primary, theme.primaryLight],
  );

  const keyExtractor = useCallback(
    (item: DropdownItem, index: number) => `${item.value}-${index}`,
    [],
  );

  return (
    <>
      {/* Option A: label left — value right */}
      <Pressable
        style={({ pressed }) => [
          styles.trigger,
          !enabled && styles.triggerDisabled,
          pressed && enabled && { opacity: 0.7 },
        ]}
        onPress={open}
      >
        {label ? (
          <>
            <Text
              style={[styles.triggerLabel, !enabled && styles.triggerLabelDisabled]}
              numberOfLines={1}
            >
              {label}
            </Text>
            <Text
              style={[
                styles.triggerText,
                !selectedItem && styles.triggerPlaceholder,
                !enabled && styles.triggerTextDisabled,
              ]}
              numberOfLines={1}
            >
              {selectedItem ? selectedItem.label : "—"}
            </Text>
          </>
        ) : (
          <Text
            style={[
              styles.triggerText,
              styles.triggerTextNoLabel,
              !selectedItem && styles.triggerPlaceholder,
              !enabled && styles.triggerTextDisabled,
            ]}
            numberOfLines={1}
          >
            {selectedItem ? selectedItem.label : placeholder}
          </Text>
        )}
        <Ionicons
          name="chevron-forward"
          size={16}
          color={enabled ? theme.textTertiary : theme.border}
        />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={close}
        statusBarTranslucent
        hardwareAccelerated
        onShow={() => {
          setTimeout(() => setSheetTouchEnabled(true), Platform.OS === 'android' ? 50 : 0);
        }}
      >
        <GestureHandlerRootView style={styles.gestureRoot}>
        {/* Single flex root — backdrop and sheet are parent-child, not siblings */}
        <Pressable
          style={styles.backdropPressable}
          onPress={close}
        >
          <Animated.View
            style={[styles.overlay, { opacity: fadeAnim }]}
            pointerEvents="none"
          />
        </Pressable>
        <View style={styles.sheetContainer} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 34 : 16),
                transform: [{ translateY: slideAnim }],
                marginBottom: keyboardHeight,
              },
            ]}
            collapsable={false}
          >
            <View pointerEvents={sheetTouchEnabled ? "box-none" : "none"}>
              <Pressable
                style={({ pressed }) => [styles.sheetCloseRow, pressed && styles.sheetCloseRowPressed]}
                onPress={close}
              >
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>{placeholder}</Text>
              </Pressable>
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
                keyboardShouldPersistTaps="always"
                getItemLayout={(_, index) => ({
                  length: 52,
                  offset: 52 * index,
                  index,
                })}
              />
            </View>
          </Animated.View>
        </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}
