/**
 * Get the current season based on the month
 * This is based on typical South Asian climate patterns
 */
export function getCurrentSeason(): "summer" | "monsoon" | "winter" {
  const month = new Date().getMonth() + 1; // 1-12

  // Summer: March to May (3-5)
  if (month >= 3 && month <= 5) {
    return "summer";
  }

  // Monsoon: June to September (6-9)
  if (month >= 6 && month <= 9) {
    return "monsoon";
  }

  // Winter: October to February (10-12, 1-2)
  return "winter";
}

/**
 * Get season emoji for display purposes
 */
export function getSeasonEmoji(
  season: "summer" | "monsoon" | "winter"
): string {
  switch (season) {
    case "summer":
      return "☀️";
    case "monsoon":
      return "🌧️";
    case "winter":
      return "❄️";
    default:
      return "📅";
  }
}

/**
 * Get season name formatted for display
 */
export function getSeasonName(season: "summer" | "monsoon" | "winter"): string {
  return season.charAt(0).toUpperCase() + season.slice(1);
}
