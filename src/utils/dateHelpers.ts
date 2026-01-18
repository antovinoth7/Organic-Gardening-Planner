/**
 * Date Helper Utilities
 *
 * Provides a minimal, timezone-safe helper used in the UI.
 */

/**
 * Calculate age in years from a date (for trees)
 * @param dateValue - Planting date
 * @returns Age in years, or null if invalid
 */
export const getYearsOld = (dateValue: string | Date | null): number | null => {
  if (!dateValue) return null;

  try {
    const plantDate =
      typeof dateValue === "string" ? new Date(dateValue) : dateValue;
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
