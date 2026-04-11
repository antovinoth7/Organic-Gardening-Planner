import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

const NEXT_HARVEST_FONT_SIZE = 18;

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    nextHarvestValue: {
      fontSize: NEXT_HARVEST_FONT_SIZE,
    },
    nextHarvestReady: {
      fontSize: NEXT_HARVEST_FONT_SIZE,
      color: theme.success,
    },
    nextHarvestPending: {
      fontSize: NEXT_HARVEST_FONT_SIZE,
      color: theme.textSecondary,
    },
  });
