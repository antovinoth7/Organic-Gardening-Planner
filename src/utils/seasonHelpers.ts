/**
 * Get the current season based on the month
 * This is based on typical South Asian climate patterns.
 */
export function getCurrentSeason(): "summer" | "monsoon" | "winter" {
  const month = new Date().getMonth() + 1; // 1-12

  if (month >= 3 && month <= 5) {
    return "summer";
  }

  if (month >= 6 && month <= 9) {
    return "monsoon";
  }

  return "winter";
}
