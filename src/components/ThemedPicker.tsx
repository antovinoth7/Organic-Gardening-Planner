/**
 * Themed Picker Component
 * A wrapper around @react-native-picker/picker with automatic theme support
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker, PickerProps } from '@react-native-picker/picker';
import { useTheme } from '../theme';

interface ThemedPickerProps extends PickerProps {
  style?: any;
}

export const ThemedPicker: React.FC<ThemedPickerProps> = ({ style, ...props }) => {
  const theme = useTheme();

  const containerStyle = {
    backgroundColor: theme.pickerBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.pickerBorder,
    overflow: 'hidden' as const,
    minHeight: 56,
    justifyContent: 'center' as const,
  };

  const pickerStyle = {
    height: 56,
    color: theme.pickerText,
    ...style,
  };

  return (
    <View style={containerStyle}>
      <Picker
        {...props}
        style={pickerStyle}
      />
    </View>
  );
};
