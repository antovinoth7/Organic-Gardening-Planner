/**
 * Kanyakumari / South Tamil Nadu 4-season model.
 *
 * The district sits at the confluence of the Arabian Sea, Bay of Bengal, and
 * Indian Ocean, giving it two distinct monsoon windows:
 *
 *   summer    – March to May   : peak heat (35-38 °C), dry, high-wind coast
 *   sw_monsoon – June to Sept  : Southwest monsoon (heavy rain from Kerala coast)
 *   ne_monsoon – October to Dec: Northeast monsoon (dominant in TN, even heavier)
 *   cool_dry   – January to Feb: mild post-monsoon dry period
 */
export type KKSeason = "summer" | "sw_monsoon" | "ne_monsoon" | "cool_dry";

export function getCurrentSeason(): KKSeason {
  const month = new Date().getMonth() + 1; // 1-12

  if (month >= 3 && month <= 5) return "summer";
  if (month >= 6 && month <= 9) return "sw_monsoon";
  if (month >= 10 && month <= 12) return "ne_monsoon";
  return "cool_dry"; // Jan-Feb
}

/** Returns true during either monsoon — useful for watering-reduction logic. */
export function isMonsoonSeason(): boolean {
  const s = getCurrentSeason();
  return s === "sw_monsoon" || s === "ne_monsoon";
}

/** Human-readable label for the current season. */
export function getSeasonLabel(): string {
  const labels: Record<KKSeason, string> = {
    summer: "Summer (Mar–May)",
    sw_monsoon: "SW Monsoon (Jun–Sep)",
    ne_monsoon: "NE Monsoon (Oct–Dec)",
    cool_dry: "Cool & Dry (Jan–Feb)",
  };
  return labels[getCurrentSeason()];
}

/**
 * Season-aware watering frequency multiplier for outdoor plants.
 *
 * During the hot Kanyakumari summer watering needs roughly double;
 * during both monsoons, rainfall usually covers outdoor plants so the
 * multiplier drops to near-zero (pot plants still need monitoring).
 */
export function getWateringFrequencyMultiplier(
  spaceType: "pot" | "bed" | "ground",
): number {
  const season = getCurrentSeason();
  switch (season) {
    case "summer":
      // High heat + coastal wind: water more often
      return spaceType === "pot" ? 0.5 : 0.6; // halved interval = twice as often
    case "sw_monsoon":
      // Heavy rain: outdoor plants rarely need irrigation
      return spaceType === "pot" ? 1.2 : 2.5;
    case "ne_monsoon":
      // Heaviest rain for this district: outdoor plants can go without
      return spaceType === "pot" ? 1.5 : 3.0;
    case "cool_dry":
      // Mild — standard frequency works well
      return 1.0;
    default:
      return 1.0;
  }
}
