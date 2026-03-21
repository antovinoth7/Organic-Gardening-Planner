import { GrowthStage, PlantType } from "../types/database.types";

// Companion planting data
const COMPANION_PLANTS: Record<string, string[]> = {
  // Vegetables
  Tomato: ["Basil", "Marigold", "Carrot", "Onion", "Parsley", "Lettuce"],
  Carrot: ["Onion", "Tomato", "Lettuce", "Rosemary", "Sage"],
  Lettuce: ["Carrot", "Radish", "Cucumber", "Strawberry", "Beans"],
  Cabbage: ["Dill", "Mint", "Rosemary", "Sage", "Thyme", "Beans"],
  Broccoli: ["Onion", "Garlic", "Rosemary", "Sage", "Thyme"],
  Cucumber: ["Beans", "Peas", "Radish", "Sunflower", "Lettuce"],
  Pepper: ["Basil", "Onion", "Spinach", "Tomato"],
  Chilli: ["Basil", "Onion", "Spinach", "Tomato"],
  Eggplant: ["Beans", "Peas", "Spinach", "Thyme"],
  Brinjal: ["Beans", "Peas", "Spinach", "Thyme"],
  "Long Brinjal": ["Beans", "Peas", "Spinach", "Thyme"],
  "Ladies Finger": ["Basil", "Pepper", "Eggplant", "Cucumber"],
  Tapioca: ["Cowpea", "Beans", "Marigold"],
  Drumstick: ["Brinjal", "Chilli", "Coriander"],
  Amaranthus: ["Onion", "Radish", "Beans"],
  Methi: ["Radish", "Onion", "Coriander"],
  Cowpea: ["Cucumber", "Corn", "Brinjal", "Radish"],
  "Bitter Gourd": ["Beans", "Radish", "Marigold"],
  "Snake Gourd": ["Beans", "Coriander", "Marigold"],
  "Ridge Gourd": ["Beans", "Radish", "Marigold"],
  "Bottle Gourd": ["Beans", "Coriander", "Marigold"],
  Pumpkin: ["Beans", "Corn", "Marigold"],
  "Ash Gourd": ["Beans", "Marigold", "Coriander"],
  Spinach: ["Strawberry", "Peas", "Beans", "Eggplant"],
  Radish: ["Lettuce", "Cucumber", "Carrot", "Spinach"],
  Potato: ["Beans", "Cabbage", "Corn", "Peas"],
  Onion: ["Carrot", "Tomato", "Lettuce", "Cabbage", "Pepper"],
  Garlic: ["Tomato", "Roses", "Cabbage", "Fruit trees"],
  Shallot: ["Carrot", "Tomato", "Lettuce", "Cabbage", "Pepper"],
  Beans: ["Corn", "Cucumber", "Cabbage", "Carrot", "Radish"],
  Peas: ["Carrot", "Radish", "Cucumber", "Corn", "Beans"],

  // Herbs
  Basil: ["Tomato", "Pepper", "Oregano", "Parsley"],
  Mint: ["Cabbage", "Tomato", "Radish"],
  Coriander: ["Tomato", "Beans", "Peas"],
  Parsley: ["Tomato", "Carrot", "Roses"],
  Rosemary: ["Cabbage", "Beans", "Carrot", "Sage"],
  Thyme: ["Cabbage", "Eggplant", "Potato", "Strawberry"],
  Oregano: ["Basil", "Pepper", "Cucumber"],
  Sage: ["Rosemary", "Cabbage", "Carrot", "Tomato"],
  Dill: ["Lettuce", "Cucumber", "Cabbage", "Onion"],
  Lemongrass: ["Tomato", "Basil", "Cilantro"],
  "Curry Leaf": ["Citrus trees", "Turmeric", "Ginger"],

  // Flowers
  Rose: ["Garlic", "Parsley", "Chives", "Marigold"],
  Sunflower: ["Cucumber", "Squash", "Corn"],
  Marigold: ["Tomato", "Cabbage", "Beans", "Cucumber", "Most vegetables"],
  Lily: ["Roses", "Peonies", "Ferns"],
  Tulip: ["Daffodils", "Hyacinths"],
  Jasmine: ["Roses", "Gardenias"],
  Hibiscus: ["Aloe", "Succulents", "Citrus"],
  Dahlia: ["Marigold", "Zinnia", "Nasturtium"],
  Chrysanthemum: ["Roses", "Asters", "Daisies"],
  Orchid: ["Ferns", "Bromeliads", "Anthuriums"],

  // Tropical Fruit Trees
  Chikoo: ["Banana", "Papaya", "Curry Leaf", "Lemongrass"],
  "Water Apple": ["Banana", "Papaya", "Guava", "Pineapple"],
  Soursop: ["Banana", "Papaya", "Citrus", "Lemongrass"],
  Mangosteen: ["Durian", "Rambutan", "Banana", "Coconut"],
  Rambutan: ["Mangosteen", "Durian", "Banana", "Coconut"],
};

// Plants to avoid together (incompatible companions)
const INCOMPATIBLE_PLANTS: Record<string, string[]> = {
  Tomato: ["Cabbage", "Potato", "Fennel", "Corn"],
  Carrot: ["Dill", "Parsnip", "Celery"],
  Onion: ["Beans", "Peas", "Sage"],
  Garlic: ["Beans", "Peas"],
  Shallot: ["Beans", "Peas", "Sage"],
  Beans: ["Onion", "Garlic", "Fennel"],
  Peas: ["Onion", "Garlic"],
  Potato: ["Tomato", "Cucumber", "Squash"],
  Cucumber: ["Sage", "Potato"],
  Cabbage: ["Tomato", "Strawberry"],
  Cowpea: ["Onion", "Garlic"],
  Sunflower: ["Potato"],
};

// Days to maturity/harvest for different plants (from planting date)
const DAYS_TO_HARVEST: Record<string, number> = {
  // Vegetables (days)
  Tomato: 75,
  Carrot: 70,
  Lettuce: 45,
  Cabbage: 90,
  Broccoli: 85,
  Cucumber: 55,
  Pepper: 75,
  Chilli: 85,
  Eggplant: 80,
  Brinjal: 80,
  "Long Brinjal": 85,
  "Ladies Finger": 60,
  Tapioca: 270,
  Drumstick: 180,
  Amaranthus: 30,
  Methi: 30,
  Cowpea: 55,
  "Bitter Gourd": 60,
  "Snake Gourd": 70,
  "Ridge Gourd": 65,
  "Bottle Gourd": 75,
  Pumpkin: 110,
  "Ash Gourd": 120,
  Spinach: 40,
  Radish: 30,
  Potato: 90,
  Onion: 100,
  Garlic: 180,
  Shallot: 90,
  Beans: 60,
  Peas: 65,

  // Herbs (days to first harvest)
  Basil: 60,
  Mint: 90,
  Coriander: 45,
  Parsley: 70,
  Rosemary: 365,
  Thyme: 365,
  Oregano: 90,
  Sage: 365,
  Dill: 70,
  Lemongrass: 120,
  "Curry Leaf": 730,
};

// Days to maturity for fruit trees (years converted to days)
const YEARS_TO_FIRST_HARVEST: Record<string, number> = {
  Mango: 3,
  Orange: 3,
  Banana: 1,
  Guava: 2,
  Papaya: 1,
  Lemon: 3,
  Pomegranate: 2,
  Fig: 2,
  Avocado: 3,
  Jackfruit: 4,
  Chikoo: 3, // Sapodilla/Chikoo - 3-5 years to first harvest
  "Custard Apple": 2,
  Amla: 3,
  "Water Apple": 2, // Rose apple/Jambu - 2-3 years to first harvest
  Soursop: 3, // Graviola/Guanabana - 3-5 years to first harvest
  Mangosteen: 8, // Mangosteen - 7-9 years to first harvest (slow growing)
  Rambutan: 5, // Rambutan - 4-6 years to first harvest
  "Dwarf Coconut": 3,
  "Tall Coconut": 6,
  "Hybrid Coconut": 4,
  "King Coconut": 4,
};

const DEFAULT_HARVEST_SEASON_BY_TYPE: Record<PlantType, string> = {
  vegetable: "Year Round",
  herb: "Year Round",
  flower: "Year Round",
  fruit_tree: "Summer (Mar-May)",
  timber_tree: "Year Round",
  coconut_tree: "Year Round",
  shrub: "Year Round",
};

const HARVEST_SEASON_BY_VARIETY: Record<string, string> = {
  // Fruit trees
  Mango: "Summer (Mar-May)",
  Banana: "Year Round",
  Guava: "Year Round",
  Papaya: "Year Round",
  Lemon: "Year Round",
  Pomegranate: "Year Round",
  Jackfruit: "Southwest Monsoon (Jun-Sep)",
  Chikoo: "Year Round",
  "Water Apple": "Summer (Mar-May)",
  "Custard Apple": "Northeast Monsoon (Oct-Dec)",
  Amla: "Cool Dry (Jan-Feb)",
  Orange: "Cool Dry (Jan-Feb)",
  Fig: "Summer (Mar-May)",
  Avocado: "Southwest Monsoon (Jun-Sep)",
  Soursop: "Year Round",
  Mangosteen: "Southwest Monsoon (Jun-Sep)",
  Rambutan: "Southwest Monsoon (Jun-Sep)",

  // Coconut
  "Dwarf Coconut": "Year Round",
  "Tall Coconut": "Year Round",
  "Hybrid Coconut": "Year Round",
  "King Coconut": "Year Round",

  // Common vegetables/herbs
  Tomato: "Year Round",
  Brinjal: "Year Round",
  "Long Brinjal": "Year Round",
  Chilli: "Year Round",
  "Ladies Finger": "Summer (Mar-May)",
  Cucumber: "Summer (Mar-May)",
  "Bitter Gourd": "Southwest Monsoon (Jun-Sep)",
  "Snake Gourd": "Southwest Monsoon (Jun-Sep)",
  "Ridge Gourd": "Southwest Monsoon (Jun-Sep)",
  "Bottle Gourd": "Southwest Monsoon (Jun-Sep)",
  Pumpkin: "Southwest Monsoon (Jun-Sep)",
  "Ash Gourd": "Southwest Monsoon (Jun-Sep)",
  Cabbage: "Cool Dry (Jan-Feb)",
  Cauliflower: "Cool Dry (Jan-Feb)",
  Carrot: "Cool Dry (Jan-Feb)",
  Radish: "Cool Dry (Jan-Feb)",
  Onion: "Cool Dry (Jan-Feb)",
  Garlic: "Cool Dry (Jan-Feb)",
  Potato: "Cool Dry (Jan-Feb)",
  Spinach: "Year Round",
  Amaranthus: "Year Round",
  Methi: "Year Round",
  Coriander: "Year Round",
  Mint: "Year Round",
  Basil: "Year Round",
};

/**
 * Calculate expected harvest date based on plant variety and planting date
 */
export function calculateExpectedHarvestDate(
  plantVariety: string | null | undefined,
  plantingDate: string | null | undefined,
  plantType: PlantType | null | undefined,
): string | null {
  // Comprehensive null checks
  if (!plantVariety || !plantingDate || !plantType) return null;

  const plantDate = new Date(plantingDate + "T12:00:00");
  if (Number.isNaN(plantDate.getTime())) return null;

  let daysToAdd = 0;

  // Check if it's a fruit tree or coconut tree
  if (plantType === "fruit_tree" || plantType === "coconut_tree") {
    const years = YEARS_TO_FIRST_HARVEST[plantVariety];
    if (years && years > 0) {
      daysToAdd = years * 365;
    }
  } else {
    // For vegetables and herbs
    const days = DAYS_TO_HARVEST[plantVariety];
    if (days && days > 0) {
      daysToAdd = days;
    }
  }

  if (daysToAdd === 0) return null;

  try {
    const harvestDate = new Date(plantDate);
    harvestDate.setDate(harvestDate.getDate() + daysToAdd);

    // Validate the resulting date
    if (Number.isNaN(harvestDate.getTime())) return null;

    const y = harvestDate.getFullYear();
    const m = String(harvestDate.getMonth() + 1).padStart(2, "0");
    const d = String(harvestDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  } catch (error) {
    console.warn("Error calculating harvest date:", error);
    return null;
  }
}

/**
 * Get companion plant suggestions for a given plant variety
 */
export function getCompanionSuggestions(
  plantVariety: string | null | undefined,
): string[] {
  if (!plantVariety) return [];
  return COMPANION_PLANTS[plantVariety] || [];
}

/**
 * Get incompatible plants for a given plant variety
 */
export function getIncompatiblePlants(
  plantVariety: string | null | undefined,
): string[] {
  if (!plantVariety) return [];
  return INCOMPATIBLE_PLANTS[plantVariety] || [];
}

const toLookupKey = (value: string): string =>
  value.toLowerCase().replace(/\s+/g, " ").trim();

const PLANT_VARIETY_ALIASES: Record<string, string> = {
  okra: "ladies finger",
  bhindi: "ladies finger",
  bhendi: "ladies finger",
  vendakkai: "ladies finger",
  eggplant: "brinjal",
  aubergine: "brinjal",
  kathirikai: "brinjal",
  cassava: "tapioca",
  maravalli: "tapioca",
  murungai: "drumstick",
  moringa: "drumstick",
  chili: "chilli",
  "chilli pepper": "chilli",
  "dwarf coconut": "coconut",
  "tall coconut": "coconut",
  "hybrid coconut": "coconut",
  "king coconut": "coconut",
};

const getCanonicalPlantKey = (
  plantVariety: string | null | undefined,
): string | null => {
  if (!plantVariety) return null;
  const key = toLookupKey(plantVariety);
  return PLANT_VARIETY_ALIASES[key] ?? key;
};

const mergeUnique = (items: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  items.forEach((item) => {
    const trimmed = item.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  });
  return result;
};

/**
 * Tamil Nadu-oriented baseline pests and diseases by plant type.
 */
const TAMIL_NADU_COMMON_PESTS_DISEASES: Record<
  PlantType,
  { pests: string[]; diseases: string[] }
> = {
  vegetable: {
    pests: [
      "Whiteflies",
      "Thrips",
      "Aphids",
      "Fruit Borer",
      "Leaf Miner",
      "Mites",
      "Mealybugs",
    ],
    diseases: [
      "Damping Off",
      "Bacterial Wilt",
      "Leaf Spot",
      "Early Blight",
      "Powdery Mildew",
      "Mosaic Virus",
    ],
  },
  herb: {
    pests: ["Aphids", "Whiteflies", "Thrips", "Leaf Miner", "Mites"],
    diseases: [
      "Leaf Spot",
      "Powdery Mildew",
      "Damping Off",
      "Root Rot",
      "Mosaic Virus",
    ],
  },
  flower: {
    pests: ["Thrips", "Aphids", "Mites", "Bud Borer", "Mealybugs"],
    diseases: [
      "Wilt",
      "Leaf Spot",
      "Powdery Mildew",
      "Root Rot",
      "Anthracnose",
    ],
  },
  fruit_tree: {
    pests: ["Fruit Fly", "Scale Insects", "Mealybugs", "Aphids", "Stem Borer"],
    diseases: ["Anthracnose", "Leaf Spot", "Wilt", "Canker", "Sooty Mold"],
  },
  timber_tree: {
    pests: ["Termites", "Bark Borer", "Scale Insects", "Leaf Defoliators"],
    diseases: ["Root Rot", "Leaf Blight", "Canker", "Stem Rot"],
  },
  coconut_tree: {
    pests: [
      "Red Palm Weevil", // most destructive — monitor closely
      "Rhinoceros Beetle",
      "Black-Headed Caterpillar",
      "Coconut Mealybug", // spreading rapidly in Tamil Nadu
      "Eriophyid Mite", // causes coconut eriophyid mite disease
      "Coconut Mite",
      "Scale Insects",
    ],
    diseases: [
      "Bud Rot",
      "Stem Bleeding",
      "Root Wilt",
      "Leaf Blight",
      "Nut Fall",
      "Thanjavur Wilt",
    ],
  },
  shrub: {
    pests: ["Aphids", "Whiteflies", "Thrips", "Scale Insects", "Mites"],
    diseases: ["Leaf Spot", "Powdery Mildew", "Root Rot", "Wilt"],
  },
};

/**
 * Crop-level issues frequently seen across Tamil Nadu, including Kanyakumari.
 */
const TAMIL_NADU_CROP_SPECIFIC_ISSUES: Record<
  string,
  { pests: string[]; diseases: string[] }
> = {
  tomato: {
    pests: ["Fruit Borer", "Whiteflies", "Thrips", "Aphids", "Leaf Miner"],
    diseases: [
      "Early Blight",
      "Late Blight",
      "Bacterial Wilt",
      "Leaf Curl Virus",
      "Damping Off",
    ],
  },
  chilli: {
    pests: ["Thrips", "Mites", "Aphids", "Fruit Borer", "Whiteflies"],
    diseases: [
      "Leaf Curl Virus",
      "Anthracnose",
      "Dieback",
      "Powdery Mildew",
      "Damping Off",
    ],
  },
  brinjal: {
    pests: [
      "Shoot and Fruit Borer",
      "Epilachna Beetle",
      "Aphids",
      "Whiteflies",
      "Mites",
    ],
    diseases: [
      "Bacterial Wilt",
      "Phomopsis Blight",
      "Little Leaf Disease",
      "Damping Off",
    ],
  },
  "ladies finger": {
    pests: [
      "Fruit and Shoot Borer",
      "Aphids",
      "Jassids",
      "Whiteflies",
      "Mites",
    ],
    diseases: [
      "Yellow Vein Mosaic Virus",
      "Powdery Mildew",
      "Wilt",
      "Cercospora Leaf Spot",
    ],
  },
  tapioca: {
    pests: [
      "Spiralling Whitefly",
      "Mealybugs",
      "Red Spider Mite",
      "Scale Insects",
    ],
    diseases: [
      "Cassava Mosaic Disease",
      "Bacterial Blight",
      "Cercospora Leaf Spot",
      "Root Rot",
    ],
  },
  drumstick: {
    pests: ["Hairy Caterpillar", "Pod Fly", "Aphids", "Thrips"],
    diseases: ["Leaf Spot", "Powdery Mildew", "Root Rot"],
  },
  banana: {
    pests: [
      "Rhizome Weevil",
      "Pseudostem Borer",
      "Aphids",
      "Thrips",
      "Nematodes",
    ],
    diseases: [
      "Sigatoka Leaf Spot",
      "Panama Wilt",
      "Bunchy Top Virus",
      "Anthracnose",
      "Rhizome Rot",
    ],
  },
  mango: {
    pests: ["Fruit Fly", "Mango Hopper", "Mealybugs", "Stem Borer"],
    diseases: ["Anthracnose", "Powdery Mildew", "Dieback", "Sooty Mold"],
  },
  guava: {
    pests: [
      "Fruit Fly",
      "Mealybugs",
      "Scale Insects",
      "Bark Eating Caterpillar",
    ],
    diseases: ["Wilt", "Anthracnose", "Canker", "Leaf Spot"],
  },
  papaya: {
    pests: ["Papaya Mealybug", "Aphids", "Whiteflies", "Mites"],
    diseases: [
      "Papaya Ringspot Virus",
      "Damping Off",
      "Anthracnose",
      "Root Rot",
    ],
  },
  lemon: {
    pests: ["Citrus Psylla", "Leaf Miner", "Aphids", "Scale Insects"],
    diseases: ["Citrus Canker", "Gummosis", "Greening Disease", "Sooty Mold"],
  },
  coconut: {
    pests: [
      "Red Palm Weevil", // priority 1 \u2014 kills trees
      "Rhinoceros Beetle",
      "Black-Headed Caterpillar",
      "Coconut Mealybug", // priority 2 in TN
      "Eriophyid Mite",
      "Coconut Mite",
    ],
    diseases: [
      "Bud Rot",
      "Stem Bleeding",
      "Root Wilt",
      "Leaf Blight",
      "Nut Fall",
      "Thanjavur Wilt",
    ],
  },
  jasmine: {
    pests: ["Bud Worm", "Thrips", "Mites", "Aphids"],
    diseases: ["Wilt", "Leaf Blight", "Root Rot", "Rust"],
  },
};

const getTamilNaduPestDiseaseSet = (
  plantType: PlantType | null | undefined,
  plantVariety: string | null | undefined,
): { pests: string[]; diseases: string[] } => {
  if (!plantType) return { pests: [], diseases: [] };

  const base = TAMIL_NADU_COMMON_PESTS_DISEASES[plantType] || {
    pests: [],
    diseases: [],
  };

  const canonicalPlantKey = getCanonicalPlantKey(plantVariety);
  const cropSpecific = canonicalPlantKey
    ? TAMIL_NADU_CROP_SPECIFIC_ISSUES[canonicalPlantKey]
    : null;

  if (!cropSpecific) {
    return base;
  }

  return {
    pests: mergeUnique([...cropSpecific.pests, ...base.pests]),
    diseases: mergeUnique([...cropSpecific.diseases, ...base.diseases]),
  };
};

/**
 * Get common pests for a plant type
 */
export function getCommonPests(
  plantType: PlantType | null | undefined,
  plantVariety?: string | null,
): string[] {
  return getTamilNaduPestDiseaseSet(plantType, plantVariety).pests;
}

/**
 * Get common diseases for a plant type
 */
export function getCommonDiseases(
  plantType: PlantType | null | undefined,
  plantVariety?: string | null,
): string[] {
  return getTamilNaduPestDiseaseSet(plantType, plantVariety).diseases;
}

/**
 * Get default harvest season for a plant (Tamil Nadu-oriented defaults).
 */
export function getDefaultHarvestSeason(
  plantVariety: string | null | undefined,
  plantType: PlantType | null | undefined,
): string | null {
  if (!plantType) return null;

  if (plantVariety) {
    const season = HARVEST_SEASON_BY_VARIETY[plantVariety];
    if (season) {
      return season;
    }
  }

  return DEFAULT_HARVEST_SEASON_BY_TYPE[plantType] ?? null;
}

// ---------------------------------------------------------------------------
// Coconut tree age-aware care guidance (Kanyakumari / Tamil Nadu)
// ---------------------------------------------------------------------------

export type CoconutAgeStage =
  | "seedling" // 0–6 months
  | "juvenile" // 6–18 months
  | "establishment" // 18 months – 3 years
  | "pre_bearing" // 3–6 years
  | "peak_bearing" // 6–30 years
  | "mature_bearing"; // 30+ years

export interface CoconutAgeInfo {
  ageMonths: number;
  ageLabel: string; // e.g. "30 years" or "8 months"
  stage: CoconutAgeStage;
  stageLabel: string; // human-readable stage name
  growthStage: GrowthStage; // maps to the app's GrowthStage enum
  wateringFrequencyDays: number;
  fertilisingFrequencyDays: number;
  pruningFrequencyDays: number;
  /** Days between climbing/harvest cycles. 0 = tree not yet bearing. */
  harvestFrequencyDays: number;
  expectedNutsPerYear: string; // descriptive range
  careTips: string[];
}

const MONTHS_PER_YEAR = 12;

/**
 * Given a planting date, returns age-appropriate care guidance for a
 * coconut tree grown in Kanyakumari / Tamil Nadu conditions.
 *
 * Care stages align with Tamil Nadu Agricultural University (TNAU) guidelines:
 *  - Less than 6 months  : Seedling / nursery
 *  - 6–18 months         : Juvenile (field establishment)
 *  - 18 months – 3 years : Establishment (root system development)
 *  - 3–6 years           : Pre-bearing (button stage, first spathe)
 *  - 6–30 years          : Peak bearing (maximum production)
 *  - 30+ years           : Mature bearing (declining but still productive)
 */
export function getCoconutAgeInfo(
  plantingDate: string | null | undefined,
): CoconutAgeInfo | null {
  if (!plantingDate) return null;
  const planted = new Date(plantingDate + "T12:00:00");
  if (isNaN(planted.getTime())) return null;

  const now = new Date();
  const diffMs = now.getTime() - planted.getTime();
  const ageMonths = Math.floor(diffMs / (30.44 * 24 * 60 * 60 * 1000));
  if (ageMonths < 0) return null;

  const ageYears = ageMonths / MONTHS_PER_YEAR;

  const ageLabel =
    ageMonths < 12
      ? `${ageMonths} month${ageMonths !== 1 ? "s" : ""}`
      : ageYears >= 2
        ? `${Math.floor(ageYears)} year${Math.floor(ageYears) !== 1 ? "s" : ""}`
        : `${Math.floor(ageYears)} year ${ageMonths % 12} month${ageMonths % 12 !== 1 ? "s" : ""}`;

  if (ageMonths < 6) {
    return {
      ageMonths,
      ageLabel,
      stage: "seedling",
      stageLabel: "Seedling (0–6 months)",
      growthStage: "seedling",
      wateringFrequencyDays: 2,
      fertilisingFrequencyDays: 30,
      pruningFrequencyDays: 180,
      harvestFrequencyDays: 0, // not bearing
      expectedNutsPerYear: "Not bearing",
      careTips: [
        "Keep in partial shade for first 2–3 months after transplanting",
        "Water every 2 days; never let the young root ball dry out",
        "Mulch heavily around the base to retain moisture",
        "Apply diluted jeevamrutham or cow dung slurry monthly",
        "Protect from salt spray if near the coast",
        "Watch for Red Palm Weevil attack even at this stage",
      ],
    };
  }

  if (ageMonths < 18) {
    return {
      ageMonths,
      ageLabel,
      stage: "juvenile",
      stageLabel: "Juvenile (6–18 months)",
      growthStage: "vegetative",
      wateringFrequencyDays: 3,
      fertilisingFrequencyDays: 45,
      pruningFrequencyDays: 180,
      harvestFrequencyDays: 0, // not bearing
      expectedNutsPerYear: "Not bearing",
      careTips: [
        "Gradually expose to full sun from 6 months",
        "Increase watering basin size as trunk establishes",
        "Apply neem cake + compost mix every 45 days",
        "Begin regular frond count — expect 4–6 new leaves per year",
        "Stake tree if in coastal wind-exposed location",
      ],
    };
  }

  if (ageMonths < 36) {
    return {
      ageMonths,
      ageLabel,
      stage: "establishment",
      stageLabel: "Establishment (18 months – 3 years)",
      growthStage: "vegetative",
      wateringFrequencyDays: 4,
      fertilisingFrequencyDays: 60,
      pruningFrequencyDays: 180,
      harvestFrequencyDays: 0, // not bearing
      expectedNutsPerYear: "Not bearing",
      careTips: [
        "Deep basin irrigation builds a strong root system",
        "Apply panchagavya spray once a month to boost leaf health",
        "Frond count should reach 20–25 by the end of this phase",
        "Start vermicompost application to build soil biology",
        "Watch soil drainage — waterlogging causes bud rot",
      ],
    };
  }

  if (ageYears < 6) {
    return {
      ageMonths,
      ageLabel,
      stage: "pre_bearing",
      stageLabel: "Pre-bearing (3–6 years)",
      growthStage: "flowering",
      wateringFrequencyDays: 5,
      fertilisingFrequencyDays: 75,
      pruningFrequencyDays: 180,
      harvestFrequencyDays: 45, // first nuts, harvest every 45 days
      expectedNutsPerYear: "First flowering; 0–20 nuts expected",
      careTips: [
        "First spathe (flower cluster) may appear — a good sign!",
        "Hybrid varieties start bearing from ~3.5 years in KK conditions",
        "Tall varieties may take up to 6–8 years to first bearing",
        "Increase fertiliser — this phase needs high phosphorus (bone meal/rock phosphate)",
        "Apply groundnut cake + neem cake mixture every 75 days",
        "Rhinoceros Beetle attacks increase — inspect crown weekly",
      ],
    };
  }

  if (ageYears < 30) {
    const decades = Math.floor(ageYears / 10);
    return {
      ageMonths,
      ageLabel,
      stage: "peak_bearing",
      stageLabel: `Peak Bearing (${Math.floor(ageYears)} years)`,
      growthStage: decades >= 2 ? "mature" : "fruiting",
      wateringFrequencyDays: 7,
      fertilisingFrequencyDays: 75,
      pruningFrequencyDays: 180,
      harvestFrequencyDays: 30, // climb every 30 days at peak productivity
      expectedNutsPerYear:
        ageYears < 15
          ? "60–100 nuts/year (production ramping up)"
          : "80–120 nuts/year (peak productivity)",
      careTips: [
        "Climb or arrange climbing every 30–45 days for harvest",
        "Apply vermicompost + jeevamrutham twice a year (June & December)",
        "Target 30–35 live green fronds — trim dead fronds only",
        "Monitor frond count: sudden drop may indicate Root Wilt disease",
        "Bund and basin irrigate during May summer — critical month",
        "Inter-crop with banana, turmeric or cowpea to maximise land use",
      ],
    };
  }

  // 30+ years
  return {
    ageMonths,
    ageLabel,
    stage: "mature_bearing",
    stageLabel: `Mature Bearing (${Math.floor(ageYears)} years)`,
    growthStage: "mature",
    wateringFrequencyDays: 10,
    fertilisingFrequencyDays: 90,
    pruningFrequencyDays: 180,
    harvestFrequencyDays: 40, // slower crown growth, climb every 40 days
    expectedNutsPerYear: "50–80 nuts/year (stable, may slowly decline)",
    careTips: [
      "Old trees are still productive — do not remove unless diseased",
      "Coconut trees in KK regularly produce for 60–80 years",
      "Stem bleeding or oozing is common at this age — treat with Bordeaux paste",
      "Root Wilt risk increases with age; maintain soil biology with jeevamrutham",
      "Heavy frond trimming weakens old trees — remove only yellow/dry fronds",
      "Boost with fish emulsion + seaweed mix twice a year",
      "Regular soil mulching with coir pith improves moisture retention",
    ],
  };
}

// ---------------------------------------------------------------------------
// Coconut nutrient deficiency guide (Kanyakumari / Tamil Nadu)
// ---------------------------------------------------------------------------

export interface CoconutNutrientDeficiency {
  nutrient: string;
  symptoms: string[];
  organicCorrection: string[];
  urgency: "low" | "medium" | "high";
}

/**
 * Returns all known coconut nutrient deficiency patterns relevant to
 * Kanyakumari soils (red laterite, coastal sandy, alluvial).
 * Source: TNAU Coimbatore recommendations + CPCRI guidelines.
 */
export function getCoconutNutrientDeficiencies(): CoconutNutrientDeficiency[] {
  return [
    {
      nutrient: "Boron (B)",
      urgency: "high",
      symptoms: [
        "Button/immature nut shedding (most obvious sign)",
        "Malformed or aborted inflorescences",
        "Short, crinkled, pale new leaves",
        '"Bottle-brush" appearance of young spear leaf',
        "Nut yield drops sharply",
      ],
      organicCorrection: [
        "Dissolve 25g borax in 10L water; drench at root zone (do NOT over-apply)",
        "Seaweed extract foliar spray (kelp is naturally boron-rich) — twice annually",
        "Add coir pith compost — retains trace minerals including boron",
        "Avoid over-liming; high pH (>7) locks up boron",
      ],
    },
    {
      nutrient: "Potassium (K)",
      urgency: "high",
      symptoms: [
        "Leaf tip and margin burn (brown/yellow from tips inward)",
        "Fronds turn yellow-orange and hang down (drooping)",
        "Nut size reduces; husk becomes thin",
        "Premature nut drop",
        "Most visible in summer stress on coastal sandy soils",
      ],
      organicCorrection: [
        "Apply wood ash (potash-rich) — 2kg per tree basin, twice yearly",
        "Banana peel compost tea drench — high in potassium",
        "Coconut shell charcoal in soil mix — slow-release potassium",
        "Groundnut cake application supplies K alongside N",
        "Jeevamrutham drench improves K availability from soil minerals",
      ],
    },
    {
      nutrient: "Magnesium (Mg)",
      urgency: "medium",
      symptoms: [
        "Inter-vein yellowing (chlorosis) on older fronds — yellow between green veins",
        "Older leaves turn orange-yellow from the tip",
        "New growth stays green; older fronds affected first",
        "Common in heavily rain-leached laterite soils",
      ],
      organicCorrection: [
        "Dolomite lime application — 500g per tree basin (also adjusts pH)",
        "Epsom salt (magnesium sulfate) — 200g dissolved in water, root drench",
        "Neem cake contains organic Mg; apply 1kg per tree quarterly",
        "Seaweed extract foliar spray helps foliar Mg uptake",
      ],
    },
    {
      nutrient: "Nitrogen (N)",
      urgency: "medium",
      symptoms: [
        "Pale yellow-green fronds across entire tree (whole crown yellowing)",
        "Fewer new leaves per year (below 4)",
        "Slow trunk height gain",
        "Smaller crown diameter",
      ],
      organicCorrection: [
        "Vermicompost — 5kg per tree basin twice yearly (June & December)",
        "Jeevamrutham root drench monthly (fermented cow dung + urine)",
        "Panchagavya foliar spray — fast N uptake via leaves",
        "Tachycardia cover crop inter-cropping (cowpea/green gram) fixes atmospheric N",
        "Fish emulsion drench — fast-acting liquid N source",
      ],
    },
    {
      nutrient: "Iron (Fe)",
      urgency: "low",
      symptoms: [
        "Youngest leaves turn yellow-white while older fronds stay green",
        "Interveinal chlorosis starting at leaf base",
        "More common in alkaline (black cotton) soils",
      ],
      organicCorrection: [
        "Panchagavya foliar spray — chelated trace minerals from cow products",
        "Compost tea drench improves iron mobilisation through microbial activity",
        "Acidify soil with neem cake + lime sulphur if pH is above 7",
        "Avoid waterlogging — anaerobic soils lock up iron",
      ],
    },
    {
      nutrient: "Zinc (Zn)",
      urgency: "low",
      symptoms: [
        'Short, small, crowded leaflets ("little leaf" symptom)',
        "Yellowing with a brown tinge on leaflets",
        "Stunted trunk growth",
        "Common in over-irrigated or leached sandy coastal soils",
      ],
      organicCorrection: [
        "Jeevamrutham drench — microbial activity solubilises zinc from soil",
        "Compost addition improves Zn retention in sandy soils",
        "Neem cake + bone meal mixture quarterly application",
        "Foliar spray: dissolve 5g zinc sulphate in 10L water (apply cautiously)",
      ],
    },
  ];
}
