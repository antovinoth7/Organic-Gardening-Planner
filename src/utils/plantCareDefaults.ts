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
    wateringFrequencyDays: 3,
    fertilisingFrequencyDays: 14,
    pruningFrequencyDays: 30,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },
  herb: {
    waterRequirement: "medium",
    wateringFrequencyDays: 3,
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
    wateringFrequencyDays: 7,
    fertilisingFrequencyDays: 60,
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
    wateringFrequencyDays: 7,
    fertilisingFrequencyDays: 90,
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
    "Tomato",
    "Carrot",
    "Lettuce",
    "Cabbage",
    "Broccoli",
    "Cucumber",
    "Pepper",
    "Eggplant",
    "Spinach",
    "Radish",
    "Potato",
    "Onion",
    "Garlic",
    "Beans",
    "Peas",
  ],
  herb: [
    "Basil",
    "Mint",
    "Coriander",
    "Parsley",
    "Rosemary",
    "Thyme",
    "Oregano",
    "Sage",
    "Dill",
    "Lemongrass",
    "Curry Leaf",
  ],
  flower: [
    "Rose",
    "Sunflower",
    "Marigold",
    "Lily",
    "Tulip",
    "Jasmine",
    "Hibiscus",
    "Dahlia",
    "Chrysanthemum",
    "Orchid",
  ],
  fruit_tree: [
    "Mango",
    "Orange",
    "Banana",
    "Guava",
    "Papaya",
    "Lemon",
    "Pomegranate",
    "Fig",
    "Avocado",
    "Jackfruit",
    "Chikoo",
    "Water Apple",
    "Soursop",
    "Mangosteen",
    "Rambutan",
  ],
  timber_tree: [
    "Teak",
    "Mahogany",
    "Rosewood",
    "Sandalwood",
    "Bamboo",
    "Wild Jack",
    "Neem",
  ],
  coconut_tree: [
    "Dwarf Coconut",
    "Tall Coconut",
    "Hybrid Coconut",
    "King Coconut",
  ],
  shrub: [
    "Hibiscus",
    "Bougainvillea",
    "Jasmine",
    "Azalea",
    "Gardenia",
    "Lavender",
    "Boxwood",
    "Holly",
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
