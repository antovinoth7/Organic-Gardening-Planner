import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  Animated,
  TouchableOpacity,
  View,
  StyleSheet,
  AccessibilityInfo,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme";
import type { Theme } from "../theme/colors";

// ─── Constants ──────────────────────────────────────────────
export const TAB_BAR_HEIGHT = 56;
const SCROLL_THRESHOLD = 10;
const ANIMATION_DURATION = 250;
const USE_NATIVE_DRIVER = Platform.OS !== "web";

// ─── Context ────────────────────────────────────────────────
interface TabBarScrollContextValue {
  /** Attach this to ScrollView/FlatList onScroll */
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Call when the screen gains focus to reset visibility */
  resetTabBar: () => void;
}

const TabBarScrollContext = createContext<TabBarScrollContextValue>({
  onScroll: () => undefined,
  resetTabBar: () => undefined,
});

export const useTabBarScroll = () => useContext(TabBarScrollContext);

/** Access the tab bar's translateY for coordinating other elements (e.g. FAB) */
export const useTabBarTranslateY = () => useContext(AnimatedTranslateContext);

// ─── Provider ───────────────────────────────────────────────

// Separate context to pass the Animated.Value to the tab bar without re-renders
const AnimatedTranslateContext = createContext<Animated.Value>(
  new Animated.Value(0),
);

export const FloatingTabBarProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffsetRef = useRef(0);
  const anchorRef = useRef(0);
  const directionRef = useRef<"up" | "down" | null>(null);
  const isHiddenRef = useRef(false);
  const screenReaderRef = useRef(false);

  useEffect(() => {
    const check = async () => {
      screenReaderRef.current = await AccessibilityInfo.isScreenReaderEnabled();
    };
    check();
    const sub = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      (enabled) => {
        screenReaderRef.current = enabled;
        if (enabled) {
          Animated.timing(translateY, {
            toValue: 0,
            duration: ANIMATION_DURATION,
            useNativeDriver: USE_NATIVE_DRIVER,
          }).start();
          isHiddenRef.current = false;
        }
      },
    );
    return () => sub.remove();
  }, [translateY]);

  const show = useCallback(() => {
    if (!isHiddenRef.current) return;
    isHiddenRef.current = false;
    Animated.timing(translateY, {
      toValue: 0,
      duration: ANIMATION_DURATION,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [translateY]);

  const hide = useCallback(() => {
    if (isHiddenRef.current || screenReaderRef.current) return;
    isHiddenRef.current = true;
    Animated.timing(translateY, {
      toValue: TAB_BAR_HEIGHT + 40,
      duration: ANIMATION_DURATION,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [translateY]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;

      if (y <= 0) {
        show();
        anchorRef.current = 0;
        directionRef.current = null;
        lastOffsetRef.current = 0;
        return;
      }

      const frameDelta = y - lastOffsetRef.current;
      const currentDirection =
        frameDelta > 0 ? "down" : frameDelta < 0 ? "up" : directionRef.current;

      // Direction changed — reset the anchor point
      if (currentDirection !== directionRef.current) {
        anchorRef.current = y;
        directionRef.current = currentDirection;
      }

      // Measure accumulated distance from the direction-change anchor
      const distance = y - anchorRef.current;

      if (distance > SCROLL_THRESHOLD) {
        hide();
      } else if (distance < -SCROLL_THRESHOLD) {
        show();
      }

      lastOffsetRef.current = y;
    },
    [show, hide],
  );

  const resetTabBar = useCallback(() => {
    lastOffsetRef.current = 0;
    anchorRef.current = 0;
    directionRef.current = null;
    show();
  }, [show]);

  const scrollValue = React.useMemo(
    () => ({ onScroll, resetTabBar }),
    [onScroll, resetTabBar],
  );

  return (
    <AnimatedTranslateContext.Provider value={translateY}>
      <TabBarScrollContext.Provider value={scrollValue}>
        {children}
      </TabBarScrollContext.Provider>
    </AnimatedTranslateContext.Provider>
  );
};

// ─── FloatingTabBar Component ───────────────────────────────
export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useContext(AnimatedTranslateContext);
  const styles = createStyles(theme);

  // Hide tab bar when a nested stack is showing a non-root screen
  const focusedRoute = state.routes[state.index];
  const nestedState = focusedRoute.state;
  if (nestedState && nestedState.index !== undefined && nestedState.index > 0) {
    return null;
  }

  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingBottom: bottomPadding,
          transform: [{ translateY }],
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        // Render the icon via the configured tabBarIcon
        const icon = options.tabBarIcon?.({
          focused: isFocused,
          color: isFocused ? theme.tabBarActive : theme.tabBarInactive,
          size: 24,
        });

        const label =
          typeof options.tabBarLabel === "string"
            ? options.tabBarLabel
            : typeof options.title === "string"
              ? options.title
              : route.name;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
          >
            {icon}
            <View style={{ height: 2 }} />
            <Animated.Text
              style={[
                styles.label,
                {
                  color: isFocused ? theme.tabBarActive : theme.tabBarInactive,
                },
                isFocused && styles.labelFocused,
              ]}
              numberOfLines={1}
            >
              {label}
            </Animated.Text>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: "row",
      backgroundColor: theme.tabBarBackground,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.border,
      paddingTop: 8,
      // Shadow for elevation
      ...Platform.select({
        ios: {
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.08)",
        } as any,
      }),
    },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 4,
    },
    label: {
      fontSize: 10,
      fontWeight: "500",
    },
    labelFocused: {
      fontWeight: "600",
    },
  });

// ─── Animated FAB ───────────────────────────────────────────
// Sits above the tab bar and slides down with it when hidden.
interface AnimatedFABProps {
  onPress: () => void;
  iconName?: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
}

export function AnimatedFAB({ onPress, iconName = "add" }: AnimatedFABProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useTabBarTranslateY();

  // When tab bar is visible (translateY=0): FAB sits above tab bar
  // When tab bar is hidden (translateY=96): FAB slides down, settling above safe area
  const fabBottom = Math.max(insets.bottom, 8) + TAB_BAR_HEIGHT + 16;

  // FAB slides down by the same amount the tab bar does, but caps so it stays above safe area
  const fabTranslateY = translateY.interpolate({
    inputRange: [0, TAB_BAR_HEIGHT + 40],
    outputRange: [0, TAB_BAR_HEIGHT + 8],
    extrapolate: "clamp",
  });

  const Ionicons = require("@expo/vector-icons").Ionicons;

  return (
    <Animated.View
      style={[
        fabStyles.fab,
        {
          bottom: fabBottom,
          backgroundColor: theme.primary,
          transform: [{ translateY: fabTranslateY }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        style={fabStyles.fabTouchable}
        activeOpacity={0.7}
      >
        <Ionicons name={iconName} size={28} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const fabStyles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  fabTouchable: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
