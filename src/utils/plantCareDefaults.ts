import {
  PlantType,
  PlantCareProfile,
  PlantCareProfiles,
} from "../types/database.types";

/**
 * Comprehensive plant care defaults database
 * Provides intelligent recommendations based on plant variety
 */

const DEFAULT_PROFILES_BY_TYPE: Record<PlantType, PlantCareProfile> = {
  vegetable: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 14,
    pruningFrequencyDays: 21,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },
  herb: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 21,
    pruningFrequencyDays: 21,
    sunlight: "partial_sun",
    soilType: "potting_mix",
    preferredFertiliser: "compost",
    initialGrowthStage: "vegetative",
  },
  flower: {
    waterRequirement: "medium",
    wateringFrequencyDays: 3,
    fertilisingFrequencyDays: 21,
    pruningFrequencyDays: 30,
    sunlight: "full_sun",
    soilType: "potting_mix",
    preferredFertiliser: "compost",
    initialGrowthStage: "vegetative",
  },
  fruit_tree: {
    waterRequirement: "medium",
    wateringFrequencyDays: 5,
    fertilisingFrequencyDays: 45,
    pruningFrequencyDays: 180,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "vegetative",
  },
  timber_tree: {
    waterRequirement: "low",
    wateringFrequencyDays: 10,
    fertilisingFrequencyDays: 90,
    pruningFrequencyDays: 365,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "vegetative",
  },
  coconut_tree: {
    waterRequirement: "medium",
    wateringFrequencyDays: 5,
    fertilisingFrequencyDays: 75,
    pruningFrequencyDays: 180,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "vermicompost",
    initialGrowthStage: "vegetative",
  },
  shrub: {
    waterRequirement: "medium",
    wateringFrequencyDays: 5,
    fertilisingFrequencyDays: 45,
    pruningFrequencyDays: 60,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "vegetative",
  },
};

const PLANT_VARIETIES_BY_TYPE: Record<PlantType, string[]> = {
  vegetable: [
    "Brinjal",
    "Long Brinjal",
    "Ladies Finger",
    "Tomato",
    "Chilli",
    "Tapioca",
    "Drumstick",
    "Amaranthus",
    "Methi",
    "Cowpea",
    "Beans",
    "Bitter Gourd",
    "Snake Gourd",
    "Ridge Gourd",
    "Bottle Gourd",
    "Pumpkin",
    "Ash Gourd",
    "Cucumber",
    "Spinach",
    "Radish",
    "Onion",
    "Shallot",
    "Garlic",
    "Cabbage",
    "Cauliflower",
    "Carrot",
    "Potato",
    "Eggplant",
    "Pepper",
  ],
  herb: [
    "Coriander",
    "Mint",
    "Curry Leaf",
    "Lemongrass",
    "Tulsi",
    "Basil",
    "Dill",
    "Parsley",
    "Rosemary",
    "Thyme",
    "Oregano",
  ],
  flower: [
    "Marigold",
    "Jasmine",
    "Hibiscus",
    "Rose",
    "Chrysanthemum",
    "Crossandra",
    "Ixora",
    "Sunflower",
    "Dahlia",
    "Orchid",
  ],
  fruit_tree: [
    "Banana",
    "Mango",
    "Guava",
    "Papaya",
    "Lemon",
    "Pomegranate",
    "Jackfruit",
    "Chikoo",
    "Water Apple",
    "Custard Apple",
    "Amla",
    "Orange",
    "Fig",
    "Avocado",
    "Soursop",
    "Mangosteen",
    "Rambutan",
  ],
  timber_tree: [
    "Neem",
    "Teak",
    "Mahogany",
    "Rosewood",
    "Sandalwood",
    "Bamboo",
    "Wild Jack",
  ],
  coconut_tree: [
    "Dwarf Coconut",
    "Tall Coconut",
    "Hybrid Coconut",
    "King Coconut",
  ],
  shrub: [
    "Hibiscus",
    "Ixora",
    "Nandiyavattai",
    "Bougainvillea",
    "Jasmine",
    "Crossandra",
    "Lantana",
    "Gardenia",
  ],
};

const buildProfileKey = (plantType: PlantType, plantVariety: string): string =>
  `${plantType}:${plantVariety}`;

const PLANT_CARE_PROFILES: Record<string, PlantCareProfile> = {};

Object.entries(PLANT_VARIETIES_BY_TYPE).forEach(([type, varieties]) => {
  const plantType = type as PlantType;
  const defaults = DEFAULT_PROFILES_BY_TYPE[plantType];
  varieties.forEach((variety) => {
    PLANT_CARE_PROFILES[buildProfileKey(plantType, variety)] = {
      ...defaults,
    };
  });
});

const PLANT_CARE_OVERRIDES: Record<string, PlantCareProfile> = {
  [buildProfileKey("vegetable", "Tomato")]: {
    waterRequirement: "high",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 14,
    pruningFrequencyDays: 21,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },
  [buildProfileKey("vegetable", "Lettuce")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 14,
    sunlight: "partial_sun",
    soilType: "potting_mix",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },
  [buildProfileKey("vegetable", "Radish")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 14,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },
  [buildProfileKey("vegetable", "Spinach")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 14,
    sunlight: "partial_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },
  [buildProfileKey("vegetable", "Brinjal")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 14,
    pruningFrequencyDays: 21,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },
  [buildProfileKey("vegetable", "Long Brinjal")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 14,
    pruningFrequencyDays: 21,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },
  [buildProfileKey("vegetable", "Ladies Finger")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 14,
    pruningFrequencyDays: 30,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },
  [buildProfileKey("vegetable", "Chilli")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 21,
    pruningFrequencyDays: 30,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },
  [buildProfileKey("vegetable", "Tapioca")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 3,
    fertilisingFrequencyDays: 45,
    pruningFrequencyDays: 90,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "vegetative",
  },
  [buildProfileKey("vegetable", "Drumstick")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 4,
    fertilisingFrequencyDays: 45,
    pruningFrequencyDays: 120,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "vermicompost",
    initialGrowthStage: "vegetative",
  },
  [buildProfileKey("vegetable", "Amaranthus")]: {
    waterRequirement: "high",
    wateringFrequencyDays: 1,
    fertilisingFrequencyDays: 10,
    sunlight: "partial_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },
  [buildProfileKey("vegetable", "Methi")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 1,
    fertilisingFrequencyDays: 14,
    sunlight: "partial_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },
  [buildProfileKey("vegetable", "Cowpea")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 21,
    pruningFrequencyDays: 21,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },
  [buildProfileKey("herb", "Basil")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 21,
    pruningFrequencyDays: 14,
    sunlight: "full_sun",
    soilType: "potting_mix",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },
  [buildProfileKey("herb", "Mint")]: {
    waterRequirement: "high",
    wateringFrequencyDays: 1,
    fertilisingFrequencyDays: 30,
    pruningFrequencyDays: 21,
    sunlight: "partial_sun",
    soilType: "potting_mix",
    preferredFertiliser: "compost",
    initialGrowthStage: "vegetative",
  },
  [buildProfileKey("herb", "Coriander")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 21,
    sunlight: "partial_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },
  [buildProfileKey("herb", "Curry Leaf")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 3,
    fertilisingFrequencyDays: 30,
    pruningFrequencyDays: 60,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "vermicompost",
    initialGrowthStage: "vegetative",
  },
  [buildProfileKey("herb", "Tulsi")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 21,
    pruningFrequencyDays: 21,
    sunlight: "partial_sun",
    soilType: "potting_mix",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },
  [buildProfileKey("fruit_tree", "Mango")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 7,
    fertilisingFrequencyDays: 60,
    pruningFrequencyDays: 365,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "vegetative",
  },
  [buildProfileKey("fruit_tree", "Banana")]: {
    waterRequirement: "high",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 30,
    pruningFrequencyDays: 90,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "vermicompost",
    initialGrowthStage: "vegetative",
  },
  [buildProfileKey("fruit_tree", "Papaya")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 3,
    fertilisingFrequencyDays: 30,
    pruningFrequencyDays: 180,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "vegetative",
  },
  [buildProfileKey("fruit_tree", "Guava")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 5,
    fertilisingFrequencyDays: 45,
    pruningFrequencyDays: 180,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "vegetative",
  },
  [buildProfileKey("coconut_tree", "Dwarf Coconut")]: {
    waterRequirement: "high",
    wateringFrequencyDays: 3,
    fertilisingFrequencyDays: 60,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "vermicompost",
    initialGrowthStage: "vegetative",
  },
  [buildProfileKey("coconut_tree", "Tall Coconut")]: {
    waterRequirement: "medium",
    wateringFrequencyDays: 7,
    fertilisingFrequencyDays: 90,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "vermicompost",
    initialGrowthStage: "vegetative",
  },
};

Object.assign(PLANT_CARE_PROFILES, PLANT_CARE_OVERRIDES);

const findProfileByVariety = (
  plantVariety: string
): PlantCareProfile | null => {
  const key = Object.keys(PLANT_CARE_PROFILES).find((profileKey) =>
    profileKey.endsWith(`:${plantVariety}`)
  );
  return key ? PLANT_CARE_PROFILES[key] : null;
};

const applyOverrides = (
  base: PlantCareProfile,
  overrides?: PlantCareProfiles,
  plantType?: PlantType,
  plantVariety?: string
): PlantCareProfile => {
  if (!plantType || !plantVariety || !overrides) {
    return base;
  }

  const override = overrides[plantType]?.[plantVariety];
  if (!override) return base;

  return {
    ...base,
    ...override,
  };
};

/**
 * Get care profile for a specific plant variety
 */
export function getPlantCareProfile(
  plantVariety: string,
  plantType?: PlantType,
  overrides?: PlantCareProfiles
): PlantCareProfile | null {
  if (plantType) {
    const key = buildProfileKey(plantType, plantVariety);
    const base =
      PLANT_CARE_PROFILES[key] || DEFAULT_PROFILES_BY_TYPE[plantType] || null;
    return base ? applyOverrides(base, overrides, plantType, plantVariety) : null;
  }

  if (!plantVariety) return null;

  const base = findProfileByVariety(plantVariety);
  return base ? applyOverrides(base, overrides) : null;
}

export function hasPlantCareProfile(
  plantVariety: string,
  plantType?: PlantType,
  overrides?: PlantCareProfiles
): boolean {
  if (plantType) {
    const key = buildProfileKey(plantType, plantVariety);
    if (overrides?.[plantType]?.[plantVariety]) {
      return true;
    }
    return (
      Boolean(PLANT_CARE_PROFILES[key]) ||
      Boolean(DEFAULT_PROFILES_BY_TYPE[plantType])
    );
  }

  if (!plantVariety) return false;

  return Boolean(findProfileByVariety(plantVariety));
}
