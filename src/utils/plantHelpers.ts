import { PlantType } from '../types/database.types';

// Companion planting data
export const COMPANION_PLANTS: Record<string, string[]> = {
  // Vegetables
  'Tomato': ['Basil', 'Marigold', 'Carrot', 'Onion', 'Parsley', 'Lettuce'],
  'Carrot': ['Onion', 'Tomato', 'Lettuce', 'Rosemary', 'Sage'],
  'Lettuce': ['Carrot', 'Radish', 'Cucumber', 'Strawberry', 'Beans'],
  'Cabbage': ['Dill', 'Mint', 'Rosemary', 'Sage', 'Thyme', 'Beans'],
  'Broccoli': ['Onion', 'Garlic', 'Rosemary', 'Sage', 'Thyme'],
  'Cucumber': ['Beans', 'Peas', 'Radish', 'Sunflower', 'Lettuce'],
  'Pepper': ['Basil', 'Onion', 'Spinach', 'Tomato'],
  'Eggplant': ['Beans', 'Peas', 'Spinach', 'Thyme'],
  'Spinach': ['Strawberry', 'Peas', 'Beans', 'Eggplant'],
  'Radish': ['Lettuce', 'Cucumber', 'Carrot', 'Spinach'],
  'Potato': ['Beans', 'Cabbage', 'Corn', 'Peas'],
  'Onion': ['Carrot', 'Tomato', 'Lettuce', 'Cabbage', 'Pepper'],
  'Garlic': ['Tomato', 'Roses', 'Cabbage', 'Fruit trees'],
  'Beans': ['Corn', 'Cucumber', 'Cabbage', 'Carrot', 'Radish'],
  'Peas': ['Carrot', 'Radish', 'Cucumber', 'Corn', 'Beans'],
  
  // Herbs
  'Basil': ['Tomato', 'Pepper', 'Oregano', 'Parsley'],
  'Mint': ['Cabbage', 'Tomato', 'Radish'],
  'Coriander': ['Tomato', 'Beans', 'Peas'],
  'Parsley': ['Tomato', 'Carrot', 'Roses'],
  'Rosemary': ['Cabbage', 'Beans', 'Carrot', 'Sage'],
  'Thyme': ['Cabbage', 'Eggplant', 'Potato', 'Strawberry'],
  'Oregano': ['Basil', 'Pepper', 'Cucumber'],
  'Sage': ['Rosemary', 'Cabbage', 'Carrot', 'Tomato'],
  'Dill': ['Lettuce', 'Cucumber', 'Cabbage', 'Onion'],
  'Lemongrass': ['Tomato', 'Basil', 'Cilantro'],
  'Curry Leaf': ['Citrus trees', 'Turmeric', 'Ginger'],
  
  // Flowers
  'Rose': ['Garlic', 'Parsley', 'Chives', 'Marigold'],
  'Sunflower': ['Cucumber', 'Squash', 'Corn'],
  'Marigold': ['Tomato', 'Cabbage', 'Beans', 'Cucumber', 'Most vegetables'],
  'Lily': ['Roses', 'Peonies', 'Ferns'],
  'Tulip': ['Daffodils', 'Hyacinths'],
  'Jasmine': ['Roses', 'Gardenias'],
  'Hibiscus': ['Aloe', 'Succulents', 'Citrus'],
  'Dahlia': ['Marigold', 'Zinnia', 'Nasturtium'],
  'Chrysanthemum': ['Roses', 'Asters', 'Daisies'],
  'Orchid': ['Ferns', 'Bromeliads', 'Anthuriums'],
};

// Plants to avoid together (incompatible companions)
export const INCOMPATIBLE_PLANTS: Record<string, string[]> = {
  'Tomato': ['Cabbage', 'Potato', 'Fennel', 'Corn'],
  'Carrot': ['Dill', 'Parsnip', 'Celery'],
  'Onion': ['Beans', 'Peas', 'Sage'],
  'Garlic': ['Beans', 'Peas'],
  'Beans': ['Onion', 'Garlic', 'Fennel'],
  'Peas': ['Onion', 'Garlic'],
  'Potato': ['Tomato', 'Cucumber', 'Squash'],
  'Cucumber': ['Sage', 'Potato'],
  'Cabbage': ['Tomato', 'Strawberry'],
  'Sunflower': ['Potato'],
};

// Days to maturity/harvest for different plants (from planting date)
export const DAYS_TO_HARVEST: Record<string, number> = {
  // Vegetables (days)
  'Tomato': 75,
  'Carrot': 70,
  'Lettuce': 45,
  'Cabbage': 90,
  'Broccoli': 85,
  'Cucumber': 55,
  'Pepper': 75,
  'Eggplant': 80,
  'Spinach': 40,
  'Radish': 30,
  'Potato': 90,
  'Onion': 100,
  'Garlic': 180,
  'Beans': 60,
  'Peas': 65,
  
  // Herbs (days to first harvest)
  'Basil': 60,
  'Mint': 90,
  'Coriander': 45,
  'Parsley': 70,
  'Rosemary': 365,
  'Thyme': 365,
  'Oregano': 90,
  'Sage': 365,
  'Dill': 70,
  'Lemongrass': 120,
  'Curry Leaf': 730,
};

// Days to maturity for fruit trees (years converted to days)
export const YEARS_TO_FIRST_HARVEST: Record<string, number> = {
  'Mango': 3,
  'Apple': 3,
  'Orange': 3,
  'Banana': 1,
  'Guava': 2,
  'Papaya': 1,
  'Lemon': 3,
  'Pomegranate': 2,
  'Fig': 2,
  'Avocado': 3,
  'Jackfruit': 4,
  'Dwarf Coconut': 3,
  'Tall Coconut': 6,
  'Hybrid Coconut': 4,
  'King Coconut': 4,
};

/**
 * Calculate expected harvest date based on plant variety and planting date
 */
export function calculateExpectedHarvestDate(
  plantVariety: string | null | undefined,
  plantingDate: string | null | undefined,
  plantType: PlantType | null | undefined
): string | null {
  // Comprehensive null checks
  if (!plantVariety || !plantingDate || !plantType) return null;
  
  const plantDate = new Date(plantingDate);
  if (Number.isNaN(plantDate.getTime())) return null;
  
  let daysToAdd = 0;
  
  // Check if it's a fruit tree or coconut tree
  if (plantType === 'fruit_tree' || plantType === 'coconut_tree') {
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
    
    return harvestDate.toISOString().split('T')[0];
  } catch (error) {
    console.warn('Error calculating harvest date:', error);
    return null;
  }
}

/**
 * Get companion plant suggestions for a given plant variety
 */
export function getCompanionSuggestions(plantVariety: string | null | undefined): string[] {
  if (!plantVariety) return [];
  return COMPANION_PLANTS[plantVariety] || [];
}

/**
 * Get incompatible plants for a given plant variety
 */
export function getIncompatiblePlants(plantVariety: string | null | undefined): string[] {
  if (!plantVariety) return [];
  return INCOMPATIBLE_PLANTS[plantVariety] || [];
}

/**
 * Common pests and diseases for different plant types
 */
export const COMMON_PESTS_DISEASES: Record<PlantType, { pests: string[], diseases: string[] }> = {
  vegetable: {
    pests: ['Aphids', 'Whiteflies', 'Caterpillars', 'Slugs', 'Spider Mites', 'Leaf Miners'],
    diseases: ['Powdery Mildew', 'Blight', 'Root Rot', 'Leaf Spot', 'Wilt', 'Mosaic Virus'],
  },
  herb: {
    pests: ['Aphids', 'Spider Mites', 'Whiteflies', 'Thrips'],
    diseases: ['Powdery Mildew', 'Root Rot', 'Leaf Spot', 'Rust'],
  },
  flower: {
    pests: ['Aphids', 'Thrips', 'Japanese Beetles', 'Spider Mites', 'Slugs'],
    diseases: ['Powdery Mildew', 'Botrytis Blight', 'Root Rot', 'Rust', 'Leaf Spot'],
  },
  fruit_tree: {
    pests: ['Fruit Flies', 'Scale Insects', 'Mealybugs', 'Aphids', 'Borers'],
    diseases: ['Anthracnose', 'Sooty Mold', 'Leaf Spot', 'Crown Rot', 'Canker'],
  },
  timber_tree: {
    pests: ['Borers', 'Termites', 'Scale Insects', 'Bark Beetles'],
    diseases: ['Root Rot', 'Canker', 'Heart Rot', 'Leaf Blight'],
  },
  coconut_tree: {
    pests: ['Rhinoceros Beetle', 'Red Palm Weevil', 'Coconut Mite', 'Scale Insects'],
    diseases: ['Bud Rot', 'Stem Bleeding', 'Root Wilt', 'Leaf Blight'],
  },
  shrub: {
    pests: ['Aphids', 'Scale Insects', 'Whiteflies', 'Spider Mites'],
    diseases: ['Powdery Mildew', 'Leaf Spot', 'Root Rot', 'Rust'],
  },
};

/**
 * Get common pests for a plant type
 */
export function getCommonPests(plantType: PlantType | null | undefined): string[] {
  if (!plantType) return [];
  return COMMON_PESTS_DISEASES[plantType]?.pests || [];
}

/**
 * Get common diseases for a plant type
 */
export function getCommonDiseases(plantType: PlantType | null | undefined): string[] {
  if (!plantType) return [];
  return COMMON_PESTS_DISEASES[plantType]?.diseases || [];
}
