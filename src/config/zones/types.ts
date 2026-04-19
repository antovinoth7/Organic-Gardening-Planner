import { SpaceType } from "@/types/database.types";

export interface SeasonDefinition {
  id: string;
  name: string;
  label: string;
  startMonth: number;
  endMonth: number;
}

export type WateringMultipliers = Record<SpaceType, number>;

export interface SeasonalPestAlert {
  issue: string;
  type: "pest" | "disease";
  tip: string;
}

export interface AgroClimaticZone {
  id: string;
  name: string;
  districts: string[];
  seasons: SeasonDefinition[];
  wateringMultipliers: Record<string, WateringMultipliers>;
  seasonalPestAlerts: Record<string, Record<string, SeasonalPestAlert[]>>;
  annualRainfallMm: number;
  soilTypes: string[];
  irrigationDominant: string;
}
