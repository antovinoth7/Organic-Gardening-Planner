export type SpaceType = "pot" | "bed" | "ground";
export type TaskType =
  | "water"
  | "fertilise"
  | "prune"
  | "repot"
  | "spray"
  | "mulch"
  | "harvest";
export type PlantType =
  | "vegetable"
  | "herb"
  | "flower"
  | "fruit_tree"
  | "timber_tree"
  | "coconut_tree"
  | "shrub";
export enum JournalEntryType {
  Observation = "observation",
  Harvest = "harvest",
  Issue = "issue",
  Milestone = "milestone",
  Other = "other",
}
export type SunlightLevel = "full_sun" | "partial_sun" | "shade";
export type SoilType =
  | "garden_soil"
  | "potting_mix"
  | "coco_peat"
  | "red_laterite"
  | "coastal_sandy"
  | "black_cotton"
  | "alluvial"
  | "custom";
export type WaterRequirement = "low" | "medium" | "high";
export type HealthStatus = "healthy" | "stressed" | "recovering" | "sick";
export type IssueSeverity = "low" | "medium" | "high" | "severe";
export type FertiliserType =
  | "compost"
  | "vermicompost"
  | "cow_dung_slurry"
  | "fish_emulsion"
  | "groundnut_cake"
  | "seaweed"
  | "neem_cake"
  | "panchagavya"
  | "jeevamrutham"
  | "other";
export type GrowthStage =
  | "seedling"
  | "vegetative"
  | "flowering"
  | "fruiting"
  | "dormant"
  | "mature";

export type Lifecycle = "annual" | "perennial" | "biennial";
export type ToleranceLevel = "low" | "medium" | "high";
export type FeedingIntensity = "light" | "medium" | "heavy";

export interface NumericRange {
  min: number;
  max: number;
}

export type DrainageQuality = "poor" | "fair" | "good" | "excellent";
export type MoistureRetention = "low" | "medium" | "high";
export type NutrientLevel = "low" | "medium" | "high";
export type WindExposure = "sheltered" | "moderate" | "exposed";
export type WaterSource =
  | "rain_fed"
  | "borewell"
  | "tap"
  | "pond_canal"
  | "drip"
  | "mixed";

export interface LocationProfile {
  soilPH?: number | null;
  soilType?: SoilType | null;
  drainageQuality?: DrainageQuality | null;
  moistureRetention?: MoistureRetention | null;
  nitrogenLevel?: NutrientLevel | null;
  phosphorusLevel?: NutrientLevel | null;
  potassiumLevel?: NutrientLevel | null;
  windExposure?: WindExposure | null;
  waterSource?: WaterSource | null;
  lastSoilTestDate?: string | null;
  notes?: string | null;
}

export interface LocationConfig {
  parentLocations: string[];
  childLocations: string[];
  /** Short names (3–5 chars) keyed by parent location name, used in auto-generated plant names. */
  parentLocationShortNames?: Record<string, string>;
  /** Soil & environment profile keyed by parent location name. */
  parentLocationProfiles?: Record<string, LocationProfile>;
}

export interface PlantCatalogCategory {
  plants: string[];
  varieties: Record<string, string[]>;
  /** Tamil names keyed by English plant name. Data-only until Phase G language toggle. */
  tamilNames?: Record<string, string>;
  /** One-line English descriptions keyed by plant name. */
  descriptions?: Record<string, string>;
}

export interface PlantCatalog {
  categories: Record<PlantType, PlantCatalogCategory>;
}

export interface PlantCareProfile {
  waterRequirement: WaterRequirement;
  wateringFrequencyDays?: number;
  wateringEnabled?: boolean;
  fertilisingFrequencyDays?: number;
  fertilisingEnabled?: boolean;
  pruningFrequencyDays?: number;
  pruningEnabled?: boolean;
  sunlight: SunlightLevel;
  soilType: SoilType;
  preferredFertiliser: FertiliserType;
  initialGrowthStage: GrowthStage;
  pruningTips?: string[];
  shapePruningTip?: string;
  shapePruningMonths?: string;
  flowerPruningTip?: string;
  flowerPruningMonths?: string;
  // Botanical identity (Phase A2)
  scientificName?: string;
  taxonomicFamily?: string;
  lifecycle?: Lifecycle;
  tamilName?: string;
  description?: string;
  // Growing parameters (Phase A2)
  daysToHarvest?: NumericRange;
  yearsToFirstHarvest?: number;
  heightCm?: NumericRange;
  spacingCm?: number;
  plantingDepthCm?: number;
  growingSeason?: string;
  germinationDays?: NumericRange;
  germinationTempC?: NumericRange;
  soilPhRange?: NumericRange;
  // Tolerances (Phase A2)
  heatTolerance?: ToleranceLevel;
  droughtTolerance?: ToleranceLevel;
  waterloggingTolerance?: ToleranceLevel;
  // Nutrition & safety (Phase A2)
  vitamins?: string[];
  minerals?: string[];
  petToxicity?: boolean;
  feedingIntensity?: FeedingIntensity;
  // User-extendable lists (Phase A3 UI)
  customPests?: string[];
  customDiseases?: string[];
  customBeneficials?: string[];
}

export type PlantCareProfileOverride = Partial<PlantCareProfile>;

export type PlantCareProfiles = Record<
  PlantType,
  Record<string, PlantCareProfileOverride>
>;

export interface PestDiseaseRecord {
  id?: string;
  type: "pest" | "disease";
  name: string;
  occurredAt: string;
  severity?: IssueSeverity;
  affectedPart?: string;
  treatment?: string;
  treatmentEffectiveness?: "effective" | "partially_effective" | "ineffective";
  resolved: boolean;
  resolvedAt?: string;
  notes?: string;
  photo_filename?: string;
}

export interface Plant {
  id: string;
  user_id: string;
  name: string;
  plant_type: PlantType;
  plant_variety?: string | null;
  // Stable filename stored in Firestore/backups
  photo_filename?: string | null;
  // Local file URI derived from filename (not stored in Firestore)
  photo_url: string | null;
  space_type: SpaceType;
  location: string;
  landmarks?: string | null;
  bed_name?: string | null;
  pot_size?: string | null;
  notes?: string | null;
  // Environment & Care
  sunlight?: SunlightLevel | null;
  soil_type?: SoilType | null;
  water_requirement?: WaterRequirement | null;
  watering_frequency_days?: number | null;
  fertilising_frequency_days?: number | null;
  preferred_fertiliser?: FertiliserType | null;
  mulching_used?: boolean | null;
  // Plant-specific fields
  planting_date?: string | null;
  harvest_season?: string | null;
  mature_height?: string | null;
  variety?: string | null;
  // Harvest tracking
  harvest_start_date?: string | null;
  harvest_end_date?: string | null;
  last_harvest_date?: string | null;
  // Health & Tracking
  last_watered_date?: string | null;
  last_fertilised_date?: string | null;
  health_status?: HealthStatus | null;
  // Pest & Disease History
  pest_disease_history?: PestDiseaseRecord[] | null;
  // Expected Harvest Date
  expected_harvest_date?: string | null;
  // PHASE 1: Growth Stage & Pruning
  growth_stage?: GrowthStage | null;
  pruning_frequency_days?: number | null;
  last_pruned_date?: string | null;
  pruning_notes?: string | null;
  // Coconut-specific tracking (Kanyakumari)
  coconut_fronds_count?: number | null; // healthy range: 30-35
  nuts_per_month?: number | null; // nuts collected at last harvest
  last_climbing_date?: string | null; // last harvest via climbing
  spathe_count_per_month?: number | null; // inflorescence count (yield predictor for bearing trees)
  nut_fall_count?: number | null; // premature nut drop count at last incident
  last_nut_fall_date?: string | null; // date of last premature nut fall incident
  // Soft delete
  is_deleted?: boolean | null;
  deleted_at?: string | null;
  // Recurring Care Schedule (for auto-generating tasks)
  care_schedule?: {
    water_frequency_days?: number;
    fertilise_frequency_days?: number;
    prune_frequency_days?: number;
    auto_generate_tasks?: boolean;
  } | null;
  created_at: string;
}

export interface TaskTemplate {
  id: string;
  user_id: string;
  plant_id: string | null;
  task_type: TaskType;
  frequency_days: number;
  preferred_time: string | null;
  enabled: boolean;
  next_due_at: string;
  priority_level?: "critical" | "high" | "medium" | "low" | null;
  created_at: string;
}

export interface TaskLog {
  id: string;
  user_id: string;
  template_id: string;
  plant_id: string | null;
  task_type: TaskType;
  done_at: string;
  product_used?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  plant_id: string | null;
  entry_type: JournalEntryType;
  content: string;
  // Stable filenames stored in Firestore/backups
  photo_filenames?: string[];
  // Local file URIs derived from filenames
  photo_urls: string[];
  // Legacy field for backward compatibility
  photo_url?: string | null;
  // Structured tags for filtering journal entries
  tags?: string[];
  // Enhanced Harvest tracking fields
  harvest_quantity?: number | null;
  harvest_unit?: string | null; // 'kg', 'g', 'lbs', 'pieces', 'bunches'
  harvest_quality?: "excellent" | "good" | "fair" | "poor" | null;
  harvest_notes?: string | null; // Storage method, taste notes, etc.
  created_at: string;
}

// ─── Reference Screen Types (Phase A) ────────────────────────────────────────

export type PestCategory =
  | "sap_sucking"
  | "mites"
  | "borers_larvae"
  | "beetles_weevils"
  | "other";

export type DiseaseCategory =
  | "fungal"
  | "bacterial"
  | "viral"
  | "physiological";

export type RiskLevel = "low" | "moderate" | "high";
export type TreatmentEffort = "easy" | "moderate" | "advanced";
export type ControlMethod =
  | "spray"
  | "trap"
  | "biocontrol"
  | "soil"
  | "manual"
  | "cultural";

export interface OrganicControlItem {
  name: string;
  method: ControlMethod;
  effort: TreatmentEffort;
  howToApply?: string;
  frequency?: string;
  timing?: string;
  safetyNotes?: string;
}

export interface PestEntry {
  id: string;
  name: string;
  tamilName?: string;
  scientificName?: string;
  category: PestCategory;
  emoji: string;
  identification: string;
  damageDescription: string;
  organicPrevention: string[];
  organicTreatments: OrganicControlItem[];
  seasonalRisk?: Partial<Record<string, RiskLevel>>;
  plantsAffected: string[];
  imageAsset?: string;
}

export interface DiseaseEntry {
  id: string;
  name: string;
  tamilName?: string;
  scientificName?: string;
  category: DiseaseCategory;
  emoji: string;
  identification: string;
  damageDescription: string;
  organicPrevention: string[];
  organicTreatments: OrganicControlItem[];
  seasonalRisk?: Partial<Record<string, RiskLevel>>;
  plantsAffected: string[];
  imageAsset?: string;
}

