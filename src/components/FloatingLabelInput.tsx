import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { useTheme } from "../theme";
import type { Theme } from "../theme/colors";

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  /** Whether the border turns green on focus (default true) */
  accentBorder?: boolean;
}

export default function FloatingLabelInput({
  label,
  value,
  accentBorder = true,
  style,
  onFocus,
  onBlur,
  multiline,
  ...rest
}: FloatingLabelInputProps) {
  const theme = useTheme();
  const s = React.useMemo(() => createStyles(theme), [theme]);

  const [isFocused, setIsFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const isFloated = isFocused || !!value;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isFloated ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isFloated, anim]);

  const handleFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );

  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  const labelTop = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [multiline ? 14 : 16, -9],
  });

  const labelFontSize = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });

  const borderColor =
    isFocused && accentBorder ? theme.primary : theme.inputBorder;

  const labelColor = isFocused
    ? theme.primary
    : isFloated
      ? theme.textSecondary
      : theme.inputPlaceholder;

  return (
    <View
      style={[
        s.container,
        multiline && s.containerMultiline,
        { borderColor },
        isFocused && accentBorder && s.containerFocused,
      ]}
    >
      <Animated.Text
        style={[
          s.label,
          {
            top: labelTop,
            fontSize: labelFontSize,
            color: labelColor,
            backgroundColor: isFloated ? theme.inputBackground : "transparent",
          },
        ]}
        numberOfLines={1}
        pointerEvents="none"
      >
        {label}
      </Animated.Text>
      <TextInput
        {...rest}
        value={value}
        style={[
          s.input,
          multiline && s.inputMultiline,
          { color: theme.inputText },
          style,
        ]}
        multiline={multiline}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor="transparent"
      />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      borderWidth: 1,
      borderRadius: 12,
      borderColor: theme.inputBorder,
      backgroundColor: theme.inputBackground,
      marginBottom: 12,
      paddingHorizontal: 16,
      minHeight: 56,
      justifyContent: "center",
    },
    containerMultiline: {
      minHeight: 80,
      justifyContent: "flex-start",
      paddingTop: 18,
    },
    containerFocused: {
      borderWidth: 2,
    },
    label: {
      position: "absolute",
      left: 12,
      paddingHorizontal: 4,
      fontWeight: "500",
    },
    input: {
      fontSize: 16,
      paddingVertical: Platform.OS === "ios" ? 18 : 14,
      paddingHorizontal: 0,
    },
    inputMultiline: {
      paddingTop: 4,
      textAlignVertical: "top",
    },
  });
