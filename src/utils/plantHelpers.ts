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

// ---------------------------------------------------------------------------
// Pest / Disease emoji & category grouping
// ---------------------------------------------------------------------------

export interface PestDiseaseGroup {
  category: string;
  emoji: string;
  items: string[];
}

const PEST_CATEGORY_MAP: Record<string, { category: string; emoji: string }> = {
  // Sap-Sucking
  "Aphids": { category: "Sap-Sucking", emoji: "🪰" },
  "Whiteflies": { category: "Sap-Sucking", emoji: "🪰" },
  "Spiralling Whitefly": { category: "Sap-Sucking", emoji: "🪰" },
  "Mealybugs": { category: "Sap-Sucking", emoji: "🪰" },
  "Coconut Mealybug": { category: "Sap-Sucking", emoji: "🪰" },
  "Papaya Mealybug": { category: "Sap-Sucking", emoji: "🪰" },
  "Scale Insects": { category: "Sap-Sucking", emoji: "🪰" },
  "Jassids": { category: "Sap-Sucking", emoji: "🪰" },
  "Thrips": { category: "Sap-Sucking", emoji: "🪰" },
  "Mites": { category: "Mites & Spiders", emoji: "🕷️" },
  "Red Spider Mite": { category: "Mites & Spiders", emoji: "🕷️" },
  "Eriophyid Mite": { category: "Mites & Spiders", emoji: "🕷️" },
  "Coconut Mite": { category: "Mites & Spiders", emoji: "🕷️" },
  "Citrus Psylla": { category: "Sap-Sucking", emoji: "🪰" },
  "Mango Hopper": { category: "Sap-Sucking", emoji: "🪰" },
  // Borers & Larvae
  "Fruit Borer": { category: "Borers & Larvae", emoji: "🐛" },
  "Fruit and Shoot Borer": { category: "Borers & Larvae", emoji: "🐛" },
  "Shoot and Fruit Borer": { category: "Borers & Larvae", emoji: "🐛" },
  "Stem Borer": { category: "Borers & Larvae", emoji: "🐛" },
  "Leaf Miner": { category: "Borers & Larvae", emoji: "🐛" },
  "Bud Worm": { category: "Borers & Larvae", emoji: "🐛" },
  "Bud Borer": { category: "Borers & Larvae", emoji: "🐛" },
  "Caterpillar": { category: "Borers & Larvae", emoji: "🐛" },
  "Hairy Caterpillar": { category: "Borers & Larvae", emoji: "🐛" },
  "Black-Headed Caterpillar": { category: "Borers & Larvae", emoji: "🐛" },
  "Bark Eating Caterpillar": { category: "Borers & Larvae", emoji: "🐛" },
  "Pseudostem Borer": { category: "Borers & Larvae", emoji: "🐛" },
  // Beetles & Weevils
  "Red Palm Weevil": { category: "Beetles & Weevils", emoji: "🪲" },
  "Rhinoceros Beetle": { category: "Beetles & Weevils", emoji: "🪲" },
  "Epilachna Beetle": { category: "Beetles & Weevils", emoji: "🪲" },
  "Rhizome Weevil": { category: "Beetles & Weevils", emoji: "🪲" },
  // Other
  "Nematodes": { category: "Other Pests", emoji: "🪱" },
  "Termites": { category: "Other Pests", emoji: "🐜" },
  "Fruit Fly": { category: "Other Pests", emoji: "🪰" },
  "Pod Fly": { category: "Other Pests", emoji: "🪰" },
  "Leaf Defoliators": { category: "Other Pests", emoji: "🐜" },
};

const DISEASE_CATEGORY_MAP: Record<string, { category: string; emoji: string }> = {
  // Fungal
  "Powdery Mildew": { category: "Fungal", emoji: "🍄" },
  "Anthracnose": { category: "Fungal", emoji: "🍄" },
  "Leaf Spot": { category: "Fungal", emoji: "🍂" },
  "Cercospora Leaf Spot": { category: "Fungal", emoji: "🍂" },
  "Sigatoka Leaf Spot": { category: "Fungal", emoji: "🍂" },
  "Root Rot": { category: "Fungal", emoji: "🍄" },
  "Rhizome Rot": { category: "Fungal", emoji: "🍄" },
  "Stem Rot": { category: "Fungal", emoji: "🍄" },
  "Damping Off": { category: "Fungal", emoji: "💧" },
  "Rust": { category: "Fungal", emoji: "🍂" },
  "Bud Rot": { category: "Fungal", emoji: "🍄" },
  "Early Blight": { category: "Fungal", emoji: "🍂" },
  "Late Blight": { category: "Fungal", emoji: "🍂" },
  "Phomopsis Blight": { category: "Fungal", emoji: "🍂" },
  "Leaf Blight": { category: "Fungal", emoji: "🍂" },
  "Dieback": { category: "Fungal", emoji: "🍄" },
  "Gummosis": { category: "Fungal", emoji: "🍄" },
  "Sooty Mold": { category: "Fungal", emoji: "🍄" },
  "Stem Bleeding": { category: "Fungal", emoji: "🍄" },
  "Canker": { category: "Fungal", emoji: "🍄" },
  // Bacterial
  "Bacterial Wilt": { category: "Bacterial", emoji: "🦠" },
  "Bacterial Blight": { category: "Bacterial", emoji: "🦠" },
  "Wilt": { category: "Bacterial", emoji: "🥀" },
  "Citrus Canker": { category: "Bacterial", emoji: "🦠" },
  "Panama Wilt": { category: "Bacterial", emoji: "🥀" },
  "Thanjavur Wilt": { category: "Bacterial", emoji: "🥀" },
  "Root Wilt": { category: "Bacterial", emoji: "🥀" },
  // Viral
  "Mosaic Virus": { category: "Viral", emoji: "🧬" },
  "Leaf Curl Virus": { category: "Viral", emoji: "🧬" },
  "Yellow Vein Mosaic Virus": { category: "Viral", emoji: "🧬" },
  "Cassava Mosaic Disease": { category: "Viral", emoji: "🧬" },
  "Bunchy Top Virus": { category: "Viral", emoji: "🧬" },
  "Papaya Ringspot Virus": { category: "Viral", emoji: "🧬" },
  "Greening Disease": { category: "Viral", emoji: "🧬" },
  "Little Leaf Disease": { category: "Viral", emoji: "🧬" },
  // Other
  "Nut Fall": { category: "Other", emoji: "🥥" },
};

function groupByCategory(
  items: string[],
  categoryMap: Record<string, { category: string; emoji: string }>,
  defaultCategory: string,
  defaultEmoji: string,
): PestDiseaseGroup[] {
  const groups: Record<string, PestDiseaseGroup> = {};
  for (const item of items) {
    const info = categoryMap[item] || { category: defaultCategory, emoji: defaultEmoji };
    if (!groups[info.category]) {
      groups[info.category] = { category: info.category, emoji: info.emoji, items: [] };
    }
    groups[info.category].items.push(item);
  }
  return Object.values(groups);
}

/**
 * Get common pests grouped by category with emojis.
 */
export function getGroupedPests(
  plantType: PlantType | null | undefined,
  plantVariety?: string | null,
): PestDiseaseGroup[] {
  const pests = getCommonPests(plantType, plantVariety);
  return groupByCategory(pests, PEST_CATEGORY_MAP, "Other Pests", "🐛");
}

/**
 * Get common diseases grouped by category with emojis.
 */
export function getGroupedDiseases(
  plantType: PlantType | null | undefined,
  plantVariety?: string | null,
): PestDiseaseGroup[] {
  const diseases = getCommonDiseases(plantType, plantVariety);
  return groupByCategory(diseases, DISEASE_CATEGORY_MAP, "Other", "💊");
}

/**
 * Get the emoji for a specific pest or disease name.
 */
export function getPestDiseaseEmoji(name: string, type: "pest" | "disease"): string {
  if (type === "pest") {
    return PEST_CATEGORY_MAP[name]?.emoji ?? "🐛";
  }
  return DISEASE_CATEGORY_MAP[name]?.emoji ?? "💊";
}

// ---------------------------------------------------------------------------
// Organic Treatment Suggestions (South Tamil Nadu / Kanyakumari)
// ---------------------------------------------------------------------------

export type TreatmentMethod =
  | "spray"
  | "trap"
  | "biocontrol"
  | "soil"
  | "manual"
  | "cultural";

export interface TreatmentInfo {
  name: string;
  method: TreatmentMethod;
  effort: "easy" | "moderate" | "advanced";
}

const TREATMENT_METHOD_META: Record<TreatmentMethod, { emoji: string; label: string }> = {
  spray: { emoji: "💨", label: "Sprays" },
  trap: { emoji: "🪤", label: "Traps" },
  biocontrol: { emoji: "🐞", label: "Biocontrol" },
  soil: { emoji: "🌱", label: "Soil Treatment" },
  manual: { emoji: "✋", label: "Manual / Physical" },
  cultural: { emoji: "🔄", label: "Cultural Practice" },
};

const TREATMENT_DETAILS: Record<string, { method: TreatmentMethod; effort: "easy" | "moderate" | "advanced" }> = {
  // Sprays
  "Neem oil spray (2–3 ml/L)": { method: "spray", effort: "easy" },
  "Neem oil spray": { method: "spray", effort: "easy" },
  "Neem oil": { method: "spray", effort: "easy" },
  "Neem oil + soap spray": { method: "spray", effort: "easy" },
  "Neem oil + garlic spray": { method: "spray", effort: "easy" },
  "Neem oil fruit spray": { method: "spray", effort: "easy" },
  "Neem oil spray at flowering": { method: "spray", effort: "easy" },
  "Neem oil spray at pod formation": { method: "spray", effort: "easy" },
  "Soapnut water spray": { method: "spray", effort: "easy" },
  "Soapnut solution": { method: "spray", effort: "easy" },
  "Soapnut spray": { method: "spray", effort: "easy" },
  "Garlic-chili spray": { method: "spray", effort: "easy" },
  "Garlic extract spray": { method: "spray", effort: "easy" },
  "Garlic extract": { method: "spray", effort: "easy" },
  "Sulfur-based spray": { method: "spray", effort: "easy" },
  "Sulfur-based fungicide": { method: "spray", effort: "easy" },
  "Wettable sulfur spray": { method: "spray", effort: "easy" },
  "Wettable sulfur": { method: "spray", effort: "easy" },
  "Spinosad (organic)": { method: "spray", effort: "easy" },
  "Spinosad spray": { method: "spray", effort: "easy" },
  "Horticultural oil": { method: "spray", effort: "easy" },
  "Azadirachtin spray": { method: "spray", effort: "easy" },
  "Azadirachtin 1%": { method: "spray", effort: "easy" },
  "Bt (Bacillus thuringiensis)": { method: "spray", effort: "easy" },
  "Bt spray": { method: "spray", effort: "easy" },
  "Bt spray on fronds": { method: "spray", effort: "easy" },
  "Neem seed kernel extract": { method: "spray", effort: "easy" },
  "Neem kernel extract": { method: "spray", effort: "easy" },
  "Baking soda spray (1 tsp/L)": { method: "spray", effort: "easy" },
  "Milk spray (1:9)": { method: "spray", effort: "easy" },
  "Copper-based fungicide": { method: "spray", effort: "easy" },
  "Copper-based spray": { method: "spray", effort: "easy" },
  "Copper hydroxide spray": { method: "spray", effort: "easy" },
  "Copper oxychloride spray": { method: "spray", effort: "easy" },
  "Copper oxychloride": { method: "spray", effort: "easy" },
  "Copper fungicide spray": { method: "spray", effort: "easy" },
  "Copper spray": { method: "spray", effort: "easy" },
  "Bordeaux paste on crown": { method: "spray", effort: "moderate" },
  "Apply Bordeaux paste": { method: "spray", effort: "moderate" },
  "Bordeaux paste on trunk": { method: "spray", effort: "moderate" },
  "Copper fungicide paste on cuts": { method: "spray", effort: "moderate" },
  "Apply Bt paste": { method: "spray", effort: "moderate" },
  "Borax spray during flowering": { method: "spray", effort: "easy" },
  "Wash with soapnut water": { method: "spray", effort: "easy" },
  "Isopropyl alcohol swab": { method: "spray", effort: "easy" },
  "Strong water jet": { method: "spray", effort: "easy" },
  // Traps
  "Yellow sticky traps": { method: "trap", effort: "easy" },
  "Blue sticky traps": { method: "trap", effort: "easy" },
  "Sticky traps": { method: "trap", effort: "easy" },
  "Pheromone traps": { method: "trap", effort: "moderate" },
  "Rhinolure pheromone trap": { method: "trap", effort: "moderate" },
  "Light traps": { method: "trap", effort: "moderate" },
  "Bait traps (jaggery+malathion)": { method: "trap", effort: "moderate" },
  "Trap crops": { method: "trap", effort: "moderate" },
  "Trap with pseudostems": { method: "trap", effort: "moderate" },
  // Biocontrol
  "Lady beetle release": { method: "biocontrol", effort: "advanced" },
  "Release lacewings": { method: "biocontrol", effort: "advanced" },
  "Predatory mite release": { method: "biocontrol", effort: "advanced" },
  "Release parasitic wasps": { method: "biocontrol", effort: "advanced" },
  "Trichogramma egg cards": { method: "biocontrol", effort: "advanced" },
  "Release parasitoids (Goniozus nephantidis)": { method: "biocontrol", effort: "advanced" },
  "Release Cryptolaemus beetle": { method: "biocontrol", effort: "advanced" },
  "Release Encarsia parasitoid": { method: "biocontrol", effort: "advanced" },
  "Release Acerophagus papayae": { method: "biocontrol", effort: "advanced" },
  "Entomopathogenic nematodes": { method: "biocontrol", effort: "advanced" },
  "Metarhizium anisopliae (fungal biocontrol)": { method: "biocontrol", effort: "advanced" },
  "Beauveria bassiana": { method: "biocontrol", effort: "advanced" },
  "Pseudomonas fluorescens": { method: "biocontrol", effort: "advanced" },
  // Soil treatment
  "Neem cake soil application": { method: "soil", effort: "easy" },
  "Neem cake in soil": { method: "soil", effort: "easy" },
  "Neem cake in manure pits": { method: "soil", effort: "easy" },
  "Neem cake basal application": { method: "soil", effort: "easy" },
  "Neem cake application": { method: "soil", effort: "easy" },
  "Neem cake + Trichoderma in basin": { method: "soil", effort: "moderate" },
  "Root feeding neem cake": { method: "soil", effort: "easy" },
  "Castor cake": { method: "soil", effort: "easy" },
  "Trichoderma viride soil drench": { method: "soil", effort: "moderate" },
  "Trichoderma soil treatment": { method: "soil", effort: "moderate" },
  "Trichoderma seed treatment": { method: "soil", effort: "moderate" },
  "Trichoderma + Pseudomonas soil drench": { method: "soil", effort: "moderate" },
  "Trichoderma treatment": { method: "soil", effort: "moderate" },
  "Marigold interplanting": { method: "soil", effort: "moderate" },
  "Diatomaceous earth": { method: "soil", effort: "easy" },
  "Cinnamon powder": { method: "soil", effort: "easy" },
  // Manual / Physical
  "Handpicking": { method: "manual", effort: "easy" },
  "Hand picking": { method: "manual", effort: "easy" },
  "Manual removal with brush": { method: "manual", effort: "easy" },
  "Manual collection and destruction": { method: "manual", effort: "easy" },
  "Remove affected leaves": { method: "manual", effort: "easy" },
  "Remove infected leaves": { method: "manual", effort: "easy" },
  "Remove and burn infected leaves": { method: "manual", effort: "easy" },
  "Remove and burn affected leaves": { method: "manual", effort: "easy" },
  "Remove infected foliage": { method: "manual", effort: "easy" },
  "Remove infected parts": { method: "manual", effort: "easy" },
  "Remove and burn infected parts": { method: "manual", effort: "easy" },
  "Remove infected tissue": { method: "manual", effort: "easy" },
  "Remove affected fronds": { method: "manual", effort: "easy" },
  "Remove affected shoots": { method: "manual", effort: "easy" },
  "Remove and destroy affected parts": { method: "manual", effort: "easy" },
  "Remove and destroy infected plants": { method: "manual", effort: "moderate" },
  "Remove infected plants": { method: "manual", effort: "moderate" },
  "Remove infected plants early": { method: "manual", effort: "moderate" },
  "Remove infected trees": { method: "manual", effort: "moderate" },
  "Remove infected bark": { method: "manual", effort: "moderate" },
  "Prune affected branches": { method: "manual", effort: "moderate" },
  "Prune and burn affected branches": { method: "manual", effort: "moderate" },
  "Hook out adults from crown": { method: "manual", effort: "moderate" },
  "Clean crown regularly": { method: "manual", effort: "moderate" },
  "Clean frass from tunnels": { method: "manual", effort: "moderate" },
  "Inject neem oil into trunk": { method: "manual", effort: "advanced" },
  "Inject neem oil into bore holes": { method: "manual", effort: "advanced" },
  "Inject neem oil": { method: "manual", effort: "advanced" },
  "Inject neem solution into pseudostem": { method: "manual", effort: "advanced" },
  "Seal holes with mud": { method: "manual", effort: "moderate" },
  "Auger and treat with fungicide": { method: "manual", effort: "advanced" },
  // Cultural practices
  "Improve drainage": { method: "cultural", effort: "moderate" },
  "Reduce watering": { method: "cultural", effort: "easy" },
  "Avoid overwatering": { method: "cultural", effort: "easy" },
  "Avoid overhead watering": { method: "cultural", effort: "easy" },
  "Avoid excess watering": { method: "cultural", effort: "easy" },
  "Well-drained soil": { method: "cultural", effort: "moderate" },
  "Improve air circulation": { method: "cultural", effort: "easy" },
  "Improve spacing": { method: "cultural", effort: "moderate" },
  "Increase humidity": { method: "cultural", effort: "easy" },
  "Crop rotation": { method: "cultural", effort: "moderate" },
  "Early harvest": { method: "cultural", effort: "easy" },
  "Avoid rain splash": { method: "cultural", effort: "easy" },
  "Avoid trunk injury": { method: "cultural", effort: "easy" },
  "Maintain basin hygiene": { method: "cultural", effort: "easy" },
  "Maintain nutrition": { method: "cultural", effort: "easy" },
  "Balanced nutrition": { method: "cultural", effort: "easy" },
  "Avoid water stagnation": { method: "cultural", effort: "easy" },
  "Avoid infected fields": { method: "cultural", effort: "moderate" },
  "Resistant varieties": { method: "cultural", effort: "moderate" },
  "Use resistant varieties": { method: "cultural", effort: "moderate" },
  "Use tolerant varieties": { method: "cultural", effort: "moderate" },
  "Use disease-free planting material": { method: "cultural", effort: "moderate" },
  "Use disease-free stakes": { method: "cultural", effort: "moderate" },
  "Use virus-free suckers": { method: "cultural", effort: "moderate" },
  "Control sap-sucking insects first": { method: "cultural", effort: "moderate" },
  "Control whiteflies": { method: "cultural", effort: "moderate" },
  "Control citrus psylla": { method: "cultural", effort: "moderate" },
  "Control banana aphid": { method: "cultural", effort: "moderate" },
  "Control aphid vectors": { method: "cultural", effort: "moderate" },
  "Pest control for mites": { method: "cultural", effort: "moderate" },
};

export interface TreatmentGroup {
  method: TreatmentMethod;
  emoji: string;
  label: string;
  items: TreatmentInfo[];
}

const EFFORT_ORDER: Record<string, number> = { easy: 0, moderate: 1, advanced: 2 };

/**
 * Get organic treatments grouped by method with emoji and effort level.
 */
export function getGroupedTreatments(issueName: string): TreatmentGroup[] {
  const treatments = getOrganicTreatments(issueName);
  if (treatments.length === 0) return [];

  const groups: Record<string, TreatmentGroup> = {};
  for (const name of treatments) {
    const detail = TREATMENT_DETAILS[name] || { method: "spray" as TreatmentMethod, effort: "moderate" as const };
    const meta = TREATMENT_METHOD_META[detail.method];
    if (!groups[detail.method]) {
      groups[detail.method] = { method: detail.method, emoji: meta.emoji, label: meta.label, items: [] };
    }
    groups[detail.method].items.push({ name, method: detail.method, effort: detail.effort });
  }

  // Sort items within each group by effort (easy first)
  for (const group of Object.values(groups)) {
    group.items.sort((a, b) => EFFORT_ORDER[a.effort] - EFFORT_ORDER[b.effort]);
  }

  // Return groups in a meaningful order
  const methodOrder: TreatmentMethod[] = ["spray", "trap", "biocontrol", "soil", "manual", "cultural"];
  return methodOrder
    .filter((m) => groups[m])
    .map((m) => groups[m]);
}

/**
 * Get the effort emoji indicator for a treatment effort level.
 */
export function getTreatmentEffortDot(effort: "easy" | "moderate" | "advanced"): string {
  if (effort === "easy") return "🟢";
  if (effort === "moderate") return "🟡";
  return "🔴";
}

const ORGANIC_TREATMENTS: Record<string, string[]> = {
  // Pests
  "Aphids": ["Neem oil spray (2–3 ml/L)", "Soapnut water spray", "Lady beetle release", "Garlic-chili spray"],
  "Whiteflies": ["Yellow sticky traps", "Neem oil spray", "Soapnut solution", "Garlic extract spray"],
  "Mealybugs": ["Neem oil + soap spray", "Isopropyl alcohol swab", "Release lacewings", "Diatomaceous earth"],
  "Thrips": ["Blue sticky traps", "Neem oil spray", "Spinosad (organic)", "Garlic extract"],
  "Mites": ["Neem oil spray", "Sulfur-based spray", "Predatory mite release", "Strong water jet"],
  "Red Spider Mite": ["Wettable sulfur spray", "Neem oil spray", "Predatory mite release", "Increase humidity"],
  "Fruit Fly": ["Pheromone traps", "Neem oil fruit spray", "Bait traps (jaggery+malathion)", "Early harvest"],
  "Scale Insects": ["Neem oil + soap spray", "Manual removal with brush", "Horticultural oil", "Release parasitic wasps"],
  "Caterpillar": ["Bt (Bacillus thuringiensis)", "Neem oil spray", "Handpicking", "Trichogramma egg cards"],
  "Hairy Caterpillar": ["Bt spray", "Light traps", "Neem kernel extract", "Manual collection and destruction"],
  "Fruit and Shoot Borer": ["Pheromone traps", "Neem seed kernel extract", "Bt spray", "Trap crops"],
  "Jassids": ["Neem oil spray", "Yellow sticky traps", "Garlic-chili spray"],
  "Bud Worm": ["Bt spray", "Neem oil", "Pheromone traps", "Hand picking"],
  "Leaf Miner": ["Neem oil spray", "Remove affected leaves", "Yellow sticky traps", "Spinosad spray"],
  "Nematodes": ["Neem cake soil application", "Marigold interplanting", "Trichoderma soil treatment", "Castor cake"],
  "Red Palm Weevil": ["Pheromone traps", "Inject neem oil into trunk", "Entomopathogenic nematodes", "Clean crown regularly"],
  "Rhinoceros Beetle": ["Rhinolure pheromone trap", "Metarhizium anisopliae (fungal biocontrol)", "Hook out adults from crown", "Neem cake in manure pits"],
  "Black-Headed Caterpillar": ["Release parasitoids (Goniozus nephantidis)", "Bt spray on fronds", "Remove and burn affected leaves"],
  "Coconut Mealybug": ["Release Cryptolaemus beetle", "Neem oil spray", "Soapnut solution"],
  "Eriophyid Mite": ["Neem oil + garlic spray", "Wettable sulfur", "Azadirachtin spray", "Root feeding neem cake"],
  "Coconut Mite": ["Wettable sulfur spray", "Neem oil spray", "Azadirachtin 1%"],
  "Citrus Psylla": ["Neem oil spray", "Yellow sticky traps", "Remove affected shoots"],
  "Mango Hopper": ["Neem oil spray at flowering", "Sticky traps", "Garlic-chili spray", "Avoid excess watering"],
  "Stem Borer": ["Inject neem oil into bore holes", "Seal holes with mud", "Prune affected branches"],
  "Bark Eating Caterpillar": ["Clean frass from tunnels", "Inject neem oil", "Apply Bt paste"],
  "Spiralling Whitefly": ["Neem oil spray", "Release Encarsia parasitoid", "Yellow sticky traps"],
  "Rhizome Weevil": ["Trap with pseudostems", "Neem cake in soil", "Beauveria bassiana"],
  "Pseudostem Borer": ["Inject neem solution into pseudostem", "Remove and destroy affected parts"],
  "Papaya Mealybug": ["Release Acerophagus papayae", "Neem oil spray", "Soapnut spray"],
  "Pod Fly": ["Neem oil spray at pod formation", "Early harvest", "Pheromone traps"],
  // Diseases
  "Powdery Mildew": ["Baking soda spray (1 tsp/L)", "Neem oil", "Milk spray (1:9)", "Sulfur-based fungicide"],
  "Anthracnose": ["Copper-based fungicide", "Neem oil spray", "Remove infected parts", "Improve air circulation"],
  "Leaf Spot": ["Copper hydroxide spray", "Neem oil", "Remove and burn infected leaves", "Avoid overhead watering"],
  "Cercospora Leaf Spot": ["Copper oxychloride spray", "Remove infected foliage", "Improve drainage"],
  "Root Rot": ["Trichoderma viride soil drench", "Improve drainage", "Reduce watering", "Neem cake in soil"],
  "Wilt": ["Trichoderma soil treatment", "Pseudomonas fluorescens", "Crop rotation", "Improve drainage"],
  "Damping Off": ["Trichoderma seed treatment", "Well-drained soil", "Avoid overwatering", "Cinnamon powder"],
  "Rust": ["Sulfur-based spray", "Neem oil", "Remove infected leaves", "Improve air circulation"],
  "Bud Rot": ["Bordeaux paste on crown", "Remove infected tissue", "Improve drainage", "Copper oxychloride"],
  "Stem Bleeding": ["Apply Bordeaux paste", "Avoid trunk injury", "Neem cake basal application"],
  "Root Wilt": ["Trichoderma + Pseudomonas soil drench", "Neem cake application", "Maintain basin hygiene"],
  "Leaf Blight": ["Copper fungicide spray", "Remove affected fronds", "Improve air circulation"],
  "Nut Fall": ["Borax spray during flowering", "Maintain nutrition", "Pest control for mites"],
  "Thanjavur Wilt": ["Neem cake + Trichoderma in basin", "Avoid water stagnation", "Auger and treat with fungicide"],
  "Sooty Mold": ["Control sap-sucking insects first", "Wash with soapnut water", "Neem oil spray"],
  "Citrus Canker": ["Copper-based spray", "Remove and burn infected parts", "Avoid rain splash"],
  "Gummosis": ["Bordeaux paste on trunk", "Improve drainage", "Remove infected bark"],
  "Greening Disease": ["Remove infected trees", "Control citrus psylla", "Use disease-free planting material"],
  "Yellow Vein Mosaic Virus": ["Remove infected plants", "Control whiteflies", "Resistant varieties"],
  "Cassava Mosaic Disease": ["Use disease-free stakes", "Remove infected plants early", "Control whiteflies"],
  "Bacterial Blight": ["Copper-based spray", "Resistant varieties", "Crop rotation", "Remove infected parts"],
  "Sigatoka Leaf Spot": ["Remove affected leaves", "Copper spray", "Improve spacing"],
  "Panama Wilt": ["Use resistant varieties", "Trichoderma soil treatment", "Avoid infected fields"],
  "Bunchy Top Virus": ["Remove and destroy infected plants", "Control banana aphid", "Use virus-free suckers"],
  "Rhizome Rot": ["Trichoderma treatment", "Improve drainage", "Neem cake application"],
  "Papaya Ringspot Virus": ["Remove infected plants", "Control aphid vectors", "Use tolerant varieties"],
  "Dieback": ["Prune and burn affected branches", "Copper fungicide paste on cuts", "Balanced nutrition"],
};

/**
 * Get organic treatment suggestions for a pest or disease name.
 * Returns matching treatments using exact match first, then partial name match.
 */
export function getOrganicTreatments(issueName: string): string[] {
  if (!issueName) return [];

  const normalised = issueName.trim().toLowerCase();

  // Exact match (case-insensitive)
  for (const [key, treatments] of Object.entries(ORGANIC_TREATMENTS)) {
    if (key.toLowerCase() === normalised) return treatments;
  }

  // Partial match — find best match
  for (const [key, treatments] of Object.entries(ORGANIC_TREATMENTS)) {
    if (
      key.toLowerCase().includes(normalised) ||
      normalised.includes(key.toLowerCase())
    ) {
      return treatments;
    }
  }

  return [];
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
