import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { useTheme } from "../theme";
import { createStyles } from "../styles/floatingLabelInputStyles";

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

  const labelBackground = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["transparent", "transparent", theme.backgroundSecondary],
  });

  const labelFontSize = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 12],
  });

  const borderColor =
    isFocused && accentBorder ? theme.primary : theme.inputBorder;

  const labelColor = isFloated
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
            backgroundColor: labelBackground,
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
