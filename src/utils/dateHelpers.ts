/**
 * Date Helper Utilities
 *
 * Provides a minimal, timezone-safe helper used in the UI.
 */

/**
 * Format a Date to a local YYYY-MM-DD string without UTC shift.
 */
export const toLocalDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Format a YYYY-MM-DD string to a display format like "Mar 21, 2026".
 * Uses noon to avoid timezone shifts when parsing.
 */
export const formatDateDisplay = (dateStr: string): string => {
  const date = new Date(dateStr + "T12:00:00");
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Calculate age in years from a date (for trees)
 * @param dateValue - Planting date
 * @returns Age in years, or null if invalid
 */
export const getYearsOld = (dateValue: string | Date | null): number | null => {
  if (!dateValue) return null;

  try {
    const plantDate =
      typeof dateValue === "string" ? new Date(dateValue + "T12:00:00") : dateValue;
    if (Number.isNaN(plantDate.getTime())) return null;

    const today = new Date();
    const diffMs = today.getTime() - plantDate.getTime();
    const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));

    return years >= 0 ? years : null;
  } catch (error) {
    console.warn("Error calculating age:", error);
    return null;
  }
};
