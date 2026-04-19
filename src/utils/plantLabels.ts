import {
  FeedingIntensity,
  FertiliserType,
  GrowthStage,
  Lifecycle,
  PlantType,
  SoilType,
  SunlightLevel,
  ToleranceLevel,
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

export const CATEGORY_SHORT_LABELS: Record<PlantType, string> = {
  vegetable: "Veg",
  herb: "Herb",
  flower: "Flwr",
  fruit_tree: "Fruit",
  timber_tree: "Tmbr",
  coconut_tree: "Coco",
  shrub: "Shrb",
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

export const LIFECYCLE_LABELS: Record<Lifecycle, string> = {
  annual: "Annual",
  perennial: "Perennial",
  biennial: "Biennial",
};

export const LIFECYCLE_DESCRIPTIONS: Record<Lifecycle, string> = {
  annual: "Completes its full life cycle in one growing season — sow, grow, harvest, then dies",
  perennial: "Lives for many years and regrows each season without replanting",
  biennial: "Takes two growing seasons to flower and complete its life cycle",
};

export const GROWING_SEASON_OPTIONS: { label: string; value: string }[] = [
  { label: "Year Round", value: "Year Round" },
  { label: "Kharif — Southwest Monsoon (Jun–Sep)", value: "Kharif (Jun–Sep)" },
  { label: "Rabi — Winter (Oct–Jan)", value: "Rabi (Oct–Jan)" },
  { label: "Summer (Feb–May)", value: "Summer (Feb–May)" },
  { label: "Northeast Monsoon (Oct–Dec)", value: "Northeast Monsoon (Oct–Dec)" },
  { label: "Kharif + Rabi", value: "Kharif + Rabi" },
  { label: "Rabi + Summer", value: "Rabi + Summer" },
];

export const TOLERANCE_LABELS: Record<ToleranceLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const FEEDING_INTENSITY_LABELS: Record<FeedingIntensity, string> = {
  light: "Light",
  medium: "Medium",
  heavy: "Heavy",
};

export const FEEDING_INTENSITY_SUGGESTED_DAYS: Record<FeedingIntensity, number> = {
  light: 60,
  medium: 30,
  heavy: 14,
};

export const LOCATION_SOIL_TYPES: SoilType[] = [
  "red_laterite",
  "black_cotton",
  "coastal_sandy",
  "alluvial",
  "garden_soil",
];
