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
// ---------------------------------------------------------------------------
// Seasonal Pest & Disease Alerts (Kanyakumari / South Tamil Nadu)
// ---------------------------------------------------------------------------

import { PlantType } from "../types/database.types";

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

interface SeasonalPestAlert {
  issue: string;
  type: "pest" | "disease";
  tip: string;
}

const SEASONAL_PEST_ALERTS: Record<KKSeason, Record<string, SeasonalPestAlert[]>> = {
  summer: {
    _general: [
      { issue: "Mites", type: "pest", tip: "Spider mites thrive in hot, dry weather. Spray neem oil regularly." },
      { issue: "Mealybugs", type: "pest", tip: "Check leaf axils — mealybugs proliferate in summer heat." },
      { issue: "Powdery Mildew", type: "disease", tip: "Low humidity + heat triggers powdery mildew. Use baking soda spray." },
    ],
    coconut_tree: [
      { issue: "Eriophyid Mite", type: "pest", tip: "Peak season for coconut mites. Apply neem oil + wettable sulfur." },
      { issue: "Rhinoceros Beetle", type: "pest", tip: "Breeding peaks in summer. Install pheromone traps near manure pits." },
    ],
    fruit_tree: [
      { issue: "Fruit Fly", type: "pest", tip: "Set up pheromone and bait traps before fruiting season." },
      { issue: "Mango Hopper", type: "pest", tip: "Spray neem oil during flowering to prevent hopper damage." },
    ],
    vegetable: [
      { issue: "Whiteflies", type: "pest", tip: "Use yellow sticky traps for whitefly monitoring in summer vegetable patches." },
    ],
  },
  sw_monsoon: {
    _general: [
      { issue: "Root Rot", type: "disease", tip: "Excess moisture promotes root rot. Ensure proper drainage." },
      { issue: "Damping Off", type: "disease", tip: "Seedlings are vulnerable. Use Trichoderma seed treatment." },
      { issue: "Anthracnose", type: "disease", tip: "Humid conditions favour anthracnose. Remove infected parts promptly." },
    ],
    coconut_tree: [
      { issue: "Bud Rot", type: "disease", tip: "Monsoon moisture causes bud rot. Apply Bordeaux paste to crown." },
      { issue: "Red Palm Weevil", type: "pest", tip: "Inspect for frass and bore holes after heavy rains." },
    ],
    fruit_tree: [
      { issue: "Anthracnose", type: "disease", tip: "Spray copper fungicide on fruit trees during breaks in rain." },
    ],
    vegetable: [
      { issue: "Caterpillar", type: "pest", tip: "Monsoon brings caterpillar surges. Use Bt spray on leaves." },
    ],
  },
  ne_monsoon: {
    _general: [
      { issue: "Leaf Spot", type: "disease", tip: "Heavy NE monsoon rains spread leaf spot. Avoid overhead watering." },
      { issue: "Rust", type: "disease", tip: "Cool wet nights trigger rust. Remove infected leaves early." },
      { issue: "Aphids", type: "pest", tip: "Aphid populations build after rain. Spray neem oil on new growth." },
    ],
    coconut_tree: [
      { issue: "Stem Bleeding", type: "disease", tip: "Waterlogging aggravates stem bleeding. Improve basin drainage." },
    ],
    fruit_tree: [
      { issue: "Sooty Mold", type: "disease", tip: "Control sap-sucking insects to prevent sooty mold on leaves." },
    ],
    vegetable: [
      { issue: "Wilt", type: "disease", tip: "Excess soil moisture promotes wilt. Use Trichoderma soil drench." },
    ],
  },
  cool_dry: {
    _general: [
      { issue: "Aphids", type: "pest", tip: "Cool dry weather is peak aphid season. Monitor new growth closely." },
      { issue: "Thrips", type: "pest", tip: "Thrips damage increases in cool weather. Use blue sticky traps." },
    ],
    coconut_tree: [
      { issue: "Black-Headed Caterpillar", type: "pest", tip: "Watch for browning fronds. Release Goniozus parasitoids." },
    ],
    flower: [
      { issue: "Bud Worm", type: "pest", tip: "Jasmine bud worm peaks in cool weather. Apply Bt spray on buds." },
    ],
    vegetable: [
      { issue: "Leaf Miner", type: "pest", tip: "Leaf miners are active in cool dry weather. Remove mined leaves." },
    ],
  },
};

/**
 * Get seasonal pest alerts relevant to a plant type for the current season.
 * Returns general alerts + plant-type-specific alerts.
 */
export function getSeasonalPestAlerts(
  plantType: PlantType | null | undefined,
): SeasonalPestAlert[] {
  const season = getCurrentSeason();
  const seasonAlerts = SEASONAL_PEST_ALERTS[season];
  const general = seasonAlerts._general || [];
  const specific = plantType ? seasonAlerts[plantType] || [] : [];
  return [...specific, ...general];
}
