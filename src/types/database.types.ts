export type SpaceType = 'pot' | 'bed' | 'ground';
export type TaskType = 'water' | 'fertilise' | 'prune' | 'repot' | 'spray' | 'mulch';
export type PlantType = 'vegetable' | 'herb' | 'flower' | 'fruit_tree' | 'timber_tree' | 'coconut_tree' | 'shrub';
export type SunlightLevel = 'full_sun' | 'partial_sun' | 'shade';
export type SoilType = 'garden_soil' | 'potting_mix' | 'coco_peat' | 'custom';
export type WaterRequirement = 'low' | 'medium' | 'high';
export type HealthStatus = 'healthy' | 'stressed' | 'recovering' | 'sick';
export type FertiliserType = 'compost' | 'vermicompost' | 'fish_emulsion' | 'seaweed' | 'neem_cake' | 'other';

export interface Plant {
  id: string;
  user_id: string;
  name: string;
  plant_type: PlantType;
  plant_variety?: string | null;
  // Local file URI - images stored on device, not in cloud
  photo_url: string | null;
  space_type: SpaceType;
  location: string;
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
  content: string;
  // Local file URI - images stored on device, not in cloud
  photo_url: string | null;
  created_at: string;
}
