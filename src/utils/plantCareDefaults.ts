import {
  GrowthStage,
  WaterRequirement,
  SunlightLevel,
  SoilType,
  FertiliserType,
} from "../types/database.types";

/**
 * Comprehensive plant care defaults database
 * Provides intelligent recommendations based on plant variety
 */

interface PlantCareProfile {
  // Basic Care
  waterRequirement: WaterRequirement;
  wateringFrequencyDays: number;
  fertilisingFrequencyDays: number;
  pruningFrequencyDays?: number;
  sunlight: SunlightLevel;
  soilType: SoilType;
  preferredFertiliser: FertiliserType;

  // Phase 1: Growth
  initialGrowthStage: GrowthStage;
}

/**
 * Plant care database organized by variety
 */
const PLANT_CARE_PROFILES: Record<string, PlantCareProfile> = {
  // VEGETABLES
  Tomato: {
    waterRequirement: "high",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 14,
    pruningFrequencyDays: 21,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },

  Lettuce: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 14,
    sunlight: "partial_sun",
    soilType: "potting_mix",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },

  Radish: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 14,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },

  Spinach: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 14,
    sunlight: "partial_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },

  // HERBS
  Basil: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 21,
    pruningFrequencyDays: 14,
    sunlight: "full_sun",
    soilType: "potting_mix",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },

  Mint: {
    waterRequirement: "high",
    wateringFrequencyDays: 1,
    fertilisingFrequencyDays: 30,
    pruningFrequencyDays: 21,
    sunlight: "partial_sun",
    soilType: "potting_mix",
    preferredFertiliser: "compost",
    initialGrowthStage: "vegetative",
  },

  Coriander: {
    waterRequirement: "medium",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 21,
    sunlight: "partial_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "seedling",
  },

  "Curry Leaf": {
    waterRequirement: "medium",
    wateringFrequencyDays: 3,
    fertilisingFrequencyDays: 30,
    pruningFrequencyDays: 60,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "vermicompost",
    initialGrowthStage: "vegetative",
  },

  // FRUIT TREES
  Mango: {
    waterRequirement: "medium",
    wateringFrequencyDays: 7,
    fertilisingFrequencyDays: 60,
    pruningFrequencyDays: 365,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "vegetative",
  },

  Banana: {
    waterRequirement: "high",
    wateringFrequencyDays: 2,
    fertilisingFrequencyDays: 30,
    pruningFrequencyDays: 90,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "vermicompost",
    initialGrowthStage: "vegetative",
  },

  Papaya: {
    waterRequirement: "medium",
    wateringFrequencyDays: 3,
    fertilisingFrequencyDays: 30,
    pruningFrequencyDays: 180,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "vegetative",
  },

  Guava: {
    waterRequirement: "medium",
    wateringFrequencyDays: 5,
    fertilisingFrequencyDays: 45,
    pruningFrequencyDays: 180,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "compost",
    initialGrowthStage: "vegetative",
  },

  // COCONUT TREES
  "Dwarf Coconut": {
    waterRequirement: "high",
    wateringFrequencyDays: 3,
    fertilisingFrequencyDays: 60,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "vermicompost",
    initialGrowthStage: "vegetative",
  },

  "Tall Coconut": {
    waterRequirement: "medium",
    wateringFrequencyDays: 7,
    fertilisingFrequencyDays: 90,
    sunlight: "full_sun",
    soilType: "garden_soil",
    preferredFertiliser: "vermicompost",
    initialGrowthStage: "vegetative",
  },
};

/**
 * Get care profile for a specific plant variety
 */
export function getPlantCareProfile(
  plantVariety: string
): PlantCareProfile | null {
  return PLANT_CARE_PROFILES[plantVariety] || null;
}

/**
 * Get a list of all plants that have care profiles
 */
/**
 * Check if a plant variety has a care profile
 */
export function hasPlantCareProfile(plantVariety: string): boolean {
  return plantVariety in PLANT_CARE_PROFILES;
}
