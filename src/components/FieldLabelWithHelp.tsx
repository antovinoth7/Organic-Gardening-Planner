import React, { useMemo } from "react";
import { StyleProp, Text, TextStyle, View, ViewStyle } from "react-native";
import { useTheme } from "../theme";
import { createStyles } from "../styles/fieldLabelWithHelpStyles";
import FieldHelp from "./FieldHelp";

interface Props {
  label: string;
  helpText?: string;
  helpLabel?: string;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export default function FieldLabelWithHelp({
  label,
  helpText,
  helpLabel,
  style,
  labelStyle,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
      {helpText ? (
        <FieldHelp
          accessibilityLabel={`More information about ${helpLabel ?? label}`}
          compact
          description={helpText}
          title={helpLabel ?? label}
        />
      ) : null}
    </View>
  );
}