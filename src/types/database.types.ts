export type SpaceType = 'pot' | 'bed' | 'ground';
export type TaskType = 'water' | 'fertilise' | 'prune' | 'repot' | 'spray' | 'mulch';
export type PlantType = 'vegetable' | 'herb' | 'flower' | 'fruit_tree' | 'timber_tree' | 'coconut_tree' | 'shrub';
export type JournalEntryType = 'observation' | 'harvest' | 'issue' | 'milestone' | 'other';
export type SunlightLevel = 'full_sun' | 'partial_sun' | 'shade';
export type SoilType = 'garden_soil' | 'potting_mix' | 'coco_peat' | 'custom';
export type WaterRequirement = 'low' | 'medium' | 'high';
export type HealthStatus = 'healthy' | 'stressed' | 'recovering' | 'sick';
export type FertiliserType = 'compost' | 'vermicompost' | 'fish_emulsion' | 'seaweed' | 'neem_cake' | 'other';
export type GrowthStage = 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'dormant' | 'mature';

export interface LocationConfig {
  parentLocations: string[];
  childLocations: string[];
}

export type SeasonRegionProfile = "tamil_nadu" | "legacy_south_asia";

export interface UserPreferences {
  seasonRegionProfile: SeasonRegionProfile;
}

export interface PlantCatalogCategory {
  plants: string[];
  varieties: Record<string, string[]>;
}

export interface PlantCatalog {
  categories: Record<PlantType, PlantCatalogCategory>;
}

export interface PlantCareProfile {
  waterRequirement: WaterRequirement;
  wateringFrequencyDays: number;
  fertilisingFrequencyDays: number;
  pruningFrequencyDays?: number;
  sunlight: SunlightLevel;
  soilType: SoilType;
  preferredFertiliser: FertiliserType;
  initialGrowthStage: GrowthStage;
}

export type PlantCareProfileOverride = Partial<PlantCareProfile>;

export type PlantCareProfiles = Record<
  PlantType,
  Record<string, PlantCareProfileOverride>
>;

export interface PestDiseaseRecord {
  id?: string;
  type: 'pest' | 'disease';
  name: string;
  occurredAt: string;
  treatment?: string;
  resolved: boolean;
  resolvedAt?: string;
  notes?: string;
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
  // Companion Plants
  companion_plants?: string[] | null;
  // Expected Harvest Date
  expected_harvest_date?: string | null;
  // PHASE 1: Growth Stage & Pruning
  growth_stage?: GrowthStage | null;
  pruning_frequency_days?: number | null;
  last_pruned_date?: string | null;
  pruning_notes?: string | null;
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
  // PHASE 1: Smart Scheduling
  skip_if_raining?: boolean | null;
  adjust_for_season?: boolean | null;
  priority_level?: 'critical' | 'high' | 'medium' | 'low' | null;
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
  // Enhanced Harvest tracking fields
  harvest_quantity?: number | null;
  harvest_unit?: string | null; // 'kg', 'g', 'lbs', 'pieces', 'bunches'
  harvest_quality?: 'excellent' | 'good' | 'fair' | 'poor' | null;
  harvest_notes?: string | null; // Storage method, taste notes, etc.
  created_at: string;
}
