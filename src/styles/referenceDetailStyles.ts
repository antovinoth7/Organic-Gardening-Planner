import { StyleSheet } from "react-native";
import type { Theme } from "../theme/colors";

export const createStyles = (theme: Theme): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },

    // Sticky animated header (absolute, fades in on scroll)
    stickyHeader: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingBottom: 10,
    },
    stickyHeaderEmoji: {
      fontSize: 22,
      marginRight: 8,
    },
    stickyHeaderTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.text,
      flex: 1,
    },
    stickyBackButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },

    // Floating back button over hero image
    backButtonFloat: {
      position: "absolute",
      left: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 5,
    },

    // Hero image — full bleed (no border radius, no outer padding)
    heroContainer: {
      position: "relative",
      overflow: "hidden",
    },
    heroImage: {
      width: "100%",
      height: 240,
      backgroundColor: theme.backgroundSecondary,
    },
    emojiFallback: {
      width: "100%",
      height: 160,
      backgroundColor: theme.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    emojiFallbackText: {
      fontSize: 64,
    },

    // Info block — title, subtitle, meta chips below hero
    infoBlock: {
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    infoTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.text,
    },
    infoSubtitle: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 3,
    },
    metaStrip: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 10,
      marginBottom: 4,
    },
    metaChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
    },
    metaChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textSecondary,
    },

    // Scroll content — no top padding (hero is full bleed)
    scrollContent: {
      paddingBottom: 32,
    },

    // Sections
    section: {
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    firstSection: {
      paddingHorizontal: 16,
      marginBottom: 16,
      marginTop: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 6,
    },
    bodyText: {
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 21,
    },
    bulletItem: {
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 22,
      paddingLeft: 8,
    },

    // Treatment cards
    treatmentCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    treatmentCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    treatmentCardHeaderLeft: {
      flex: 1,
    },
    treatmentName: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.text,
    },
    treatmentMeta: {
      flexDirection: "row",
      gap: 8,
      marginTop: 4,
    },
    treatmentDetailDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginTop: 10,
      marginBottom: 6,
    },
    treatmentDetailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginTop: 6,
    },
    treatmentDetailLabel: {
      width: 88,
      flexShrink: 0,
      fontSize: 11,
      fontWeight: "700",
      color: theme.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    treatmentDetailValue: {
      flex: 1,
      fontSize: 13,
      color: theme.textSecondary,
      lineHeight: 19,
    },

    // Badges
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: theme.primaryLight,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.primary,
      textTransform: "capitalize",
    },

    // Seasonal risk — card wrapper + 2×2 grid
    seasonCard: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 12,
    },
    seasonGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    seasonCell: {
      width: "48%",
      borderRadius: 10,
      padding: 10,
    },
    seasonCellSeason: {
      fontSize: 12,
      fontWeight: "600",
    },
    seasonCellBadge: {
      fontSize: 13,
      fontWeight: "700",
      marginTop: 2,
    },

    // Plant tags
    plantTag: {
      backgroundColor: theme.background,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      marginRight: 8,
      marginBottom: 8,
    },
    plantTagText: {
      fontSize: 13,
      color: theme.text,
      fontWeight: "500",
    },
    plantTagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    },

    // "Not found" fallback header
    fallbackHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: theme.tabBarBackground,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    fallbackBackButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    fallbackTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: theme.text,
    },
  });
