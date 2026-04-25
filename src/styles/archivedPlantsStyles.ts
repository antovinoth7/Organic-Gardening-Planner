import { StyleSheet } from 'react-native';
import type { Theme } from '../theme/colors';

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: theme.tabBarBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerSpacer: {
      width: 24,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
    },
    listContent: {
      padding: 16,
      paddingBottom: 24,
    },
    card: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    cardContent: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
    },
    meta: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4,
      textTransform: 'uppercase',
    },
    location: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 6,
    },
    deletedAt: {
      fontSize: 12,
      color: theme.textTertiary,
      marginTop: 6,
    },
    restoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: theme.primaryLight,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    restoreText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.primary,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginTop: 16,
    },
    emptyText: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
  });
