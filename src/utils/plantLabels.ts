import {
  FertiliserType,
  GrowthStage,
  PlantType,
  SoilType,
  SunlightLevel,
  WaterRequirement,
} from "../types/database.types";

export const CATEGORY_LABELS: Record<PlantType, string> = {
  vegetable: "🥬 Vegetable",
  fruit_tree: "🍇 Fruit",
  coconut_tree: "🥥 Coconut Tree",
  herb: "🌿 Herb",
  timber_tree: "🌲 Timber Tree",
  flower: "🌸 Flower",
  shrub: "🌱 Shrub",
};

export const WATER_REQUIREMENT_LABELS: Record<WaterRequirement, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const SUNLIGHT_LABELS: Record<SunlightLevel, string> = {
  full_sun: "Full Sun",
  partial_sun: "Partial Sun",
  shade: "Shade",
};

export const SOIL_LABELS: Record<SoilType, string> = {
  garden_soil: "Garden Soil",
  potting_mix: "Potting Mix",
  coco_peat: "Coco Peat",
  red_laterite: "Red Laterite (Seivaal)",
  coastal_sandy: "Coastal Sandy",
  black_cotton: "Black Cotton",
  alluvial: "Alluvial",
  custom: "Custom",
};

export const FERTILISER_LABELS: Record<FertiliserType, string> = {
  compost: "Compost",
  vermicompost: "Vermicompost",
  cow_dung_slurry: "Cow Dung Slurry",
  neem_cake: "Neem Cake",
  panchagavya: "Panchagavya",
  jeevamrutham: "Jeevamrutham",
  groundnut_cake: "Groundnut Cake",
  fish_emulsion: "Fish Emulsion",
  seaweed: "Seaweed",
  other: "Other",
};

export const GROWTH_STAGE_LABELS: Record<GrowthStage, string> = {
  seedling: "Seedling",
  vegetative: "Vegetative",
  flowering: "Flowering",
  fruiting: "Fruiting",
  dormant: "Dormant",
  mature: "Mature",
};

export const LOCATION_SOIL_TYPES: SoilType[] = [
  "red_laterite",
  "black_cotton",
  "coastal_sandy",
  "alluvial",
  "garden_soil",
];
