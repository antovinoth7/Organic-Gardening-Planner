import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    pestCardResolved: {
      borderLeftColor: theme.success,
    },
    pestCardUnresolved: {
      borderLeftColor: theme.error,
    },
    severityHighBg: {
      backgroundColor: theme.errorLight,
    },
    severityMediumBg: {
      backgroundColor: theme.warningLight,
    },
    severityLowBg: {
      backgroundColor: theme.primaryLight,
    },
    severityHighText: {
      color: theme.error,
    },
    severityMediumText: {
      color: theme.warning,
    },
    severityLowText: {
      color: theme.primary,
    },
  });
