import { AgroClimaticZone } from "./types";

export const HIGH_RAINFALL_ZONE: AgroClimaticZone = {
  id: "high_rainfall",
  name: "High Rainfall Zone",
  districts: ["Kanyakumari"],
  annualRainfallMm: 2124,
  soilTypes: ["laterite", "alluvial", "red_sandy_loam"],
  irrigationDominant: "well",

  seasons: [
    {
      id: "summer",
      name: "Summer",
      label: "Summer (Mar\u2013May)",
      startMonth: 3,
      endMonth: 5,
    },
    {
      id: "sw_monsoon",
      name: "SW Monsoon",
      label: "SW Monsoon (Jun\u2013Sep)",
      startMonth: 6,
      endMonth: 9,
    },
    {
      id: "ne_monsoon",
      name: "NE Monsoon",
      label: "NE Monsoon (Oct\u2013Dec)",
      startMonth: 10,
      endMonth: 12,
    },
    {
      id: "cool_dry",
      name: "Cool & Dry",
      label: "Cool & Dry (Jan\u2013Feb)",
      startMonth: 1,
      endMonth: 2,
    },
  ],

  wateringMultipliers: {
    summer: { pot: 0.5, bed: 0.6, ground: 0.6 },
    sw_monsoon: { pot: 1.2, bed: 2.5, ground: 2.5 },
    ne_monsoon: { pot: 1.5, bed: 3.0, ground: 3.0 },
    cool_dry: { pot: 1.0, bed: 1.0, ground: 1.0 },
  },

  seasonalPestAlerts: {
    summer: {
      _general: [
        {
          issue: "Mites",
          type: "pest",
          tip: "Spider mites thrive in hot, dry weather. Spray neem oil regularly.",
        },
        {
          issue: "Mealybugs",
          type: "pest",
          tip: "Check leaf axils \u2014 mealybugs proliferate in summer heat.",
        },
        {
          issue: "Powdery Mildew",
          type: "disease",
          tip: "Low humidity + heat triggers powdery mildew. Use baking soda spray.",
        },
      ],
      coconut_tree: [
        {
          issue: "Eriophyid Mite",
          type: "pest",
          tip: "Peak season for coconut mites. Apply neem oil + wettable sulfur.",
        },
        {
          issue: "Rhinoceros Beetle",
          type: "pest",
          tip: "Breeding peaks in summer. Install pheromone traps near manure pits.",
        },
      ],
      fruit_tree: [
        {
          issue: "Fruit Fly",
          type: "pest",
          tip: "Set up pheromone and bait traps before fruiting season.",
        },
        {
          issue: "Mango Hopper",
          type: "pest",
          tip: "Spray neem oil during flowering to prevent hopper damage.",
        },
      ],
      vegetable: [
        {
          issue: "Whiteflies",
          type: "pest",
          tip: "Use yellow sticky traps for whitefly monitoring in summer vegetable patches.",
        },
      ],
    },
    sw_monsoon: {
      _general: [
        {
          issue: "Root Rot",
          type: "disease",
          tip: "Excess moisture promotes root rot. Ensure proper drainage.",
        },
        {
          issue: "Damping Off",
          type: "disease",
          tip: "Seedlings are vulnerable. Use Trichoderma seed treatment.",
        },
        {
          issue: "Anthracnose",
          type: "disease",
          tip: "Humid conditions favour anthracnose. Remove infected parts promptly.",
        },
      ],
      coconut_tree: [
        {
          issue: "Bud Rot",
          type: "disease",
          tip: "Monsoon moisture causes bud rot. Apply Bordeaux paste to crown.",
        },
        {
          issue: "Red Palm Weevil",
          type: "pest",
          tip: "Inspect for frass and bore holes after heavy rains.",
        },
      ],
      fruit_tree: [
        {
          issue: "Anthracnose",
          type: "disease",
          tip: "Spray copper fungicide on fruit trees during breaks in rain.",
        },
      ],
      vegetable: [
        {
          issue: "Caterpillar",
          type: "pest",
          tip: "Monsoon brings caterpillar surges. Use Bt spray on leaves.",
        },
      ],
    },
    ne_monsoon: {
      _general: [
        {
          issue: "Leaf Spot",
          type: "disease",
          tip: "Heavy NE monsoon rains spread leaf spot. Avoid overhead watering.",
        },
        {
          issue: "Rust",
          type: "disease",
          tip: "Cool wet nights trigger rust. Remove infected leaves early.",
        },
        {
          issue: "Aphids",
          type: "pest",
          tip: "Aphid populations build after rain. Spray neem oil on new growth.",
        },
      ],
      coconut_tree: [
        {
          issue: "Stem Bleeding",
          type: "disease",
          tip: "Waterlogging aggravates stem bleeding. Improve basin drainage.",
        },
      ],
      fruit_tree: [
        {
          issue: "Sooty Mold",
          type: "disease",
          tip: "Control sap-sucking insects to prevent sooty mold on leaves.",
        },
      ],
      vegetable: [
        {
          issue: "Wilt",
          type: "disease",
          tip: "Excess soil moisture promotes wilt. Use Trichoderma soil drench.",
        },
      ],
    },
    cool_dry: {
      _general: [
        {
          issue: "Aphids",
          type: "pest",
          tip: "Cool dry weather is peak aphid season. Monitor new growth closely.",
        },
        {
          issue: "Thrips",
          type: "pest",
          tip: "Thrips damage increases in cool weather. Use blue sticky traps.",
        },
      ],
      coconut_tree: [
        {
          issue: "Black-Headed Caterpillar",
          type: "pest",
          tip: "Watch for browning fronds. Release Goniozus parasitoids.",
        },
      ],
      flower: [
        {
          issue: "Bud Worm",
          type: "pest",
          tip: "Jasmine bud worm peaks in cool weather. Apply Bt spray on buds.",
        },
      ],
      vegetable: [
        {
          issue: "Leaf Miner",
          type: "pest",
          tip: "Leaf miners are active in cool dry weather. Remove mined leaves.",
        },
      ],
    },
  },
};
