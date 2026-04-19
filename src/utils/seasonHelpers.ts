/**
 * Season helpers parameterized by agro-climatic zone.
 *
 * All functions accept an optional `zone` argument. When omitted they
 * default to the Kanyakumari / High Rainfall zone so every existing
 * call site continues to work without changes.
 */

import { PlantType, SpaceType } from "@/types/database.types";
import {
  AgroClimaticZone,
  DEFAULT_ZONE,
  SeasonalPestAlert,
} from "@/config/zones";

export type KKSeason = string;

export function getCurrentSeason(
  date?: Date,
  zone?: AgroClimaticZone,
): string {
  const z = zone ?? DEFAULT_ZONE;
  const month = (date ?? new Date()).getMonth() + 1;

  for (const season of z.seasons) {
    if (season.startMonth <= season.endMonth) {
      if (month >= season.startMonth && month <= season.endMonth) {
        return season.id;
      }
    } else {
      if (month >= season.startMonth || month <= season.endMonth) {
        return season.id;
      }
    }
  }

  return z.seasons[0]?.id ?? "unknown";
}

export function isMonsoonSeason(
  date?: Date,
  zone?: AgroClimaticZone,
): boolean {
  const s = getCurrentSeason(date, zone);
  return s === "sw_monsoon" || s === "ne_monsoon";
}

export function getSeasonLabel(
  date?: Date,
  zone?: AgroClimaticZone,
): string {
  const z = zone ?? DEFAULT_ZONE;
  const seasonId = getCurrentSeason(date, z);
  const season = z.seasons.find((s) => s.id === seasonId);
  return season?.label ?? seasonId;
}

export function getWateringFrequencyMultiplier(
  spaceType: SpaceType,
  zone?: AgroClimaticZone,
): number {
  const z = zone ?? DEFAULT_ZONE;
  const seasonId = getCurrentSeason(undefined, z);
  const multipliers = z.wateringMultipliers[seasonId];
  if (!multipliers) return 1.0;
  return multipliers[spaceType] ?? 1.0;
}

export function getSeasonalPestAlerts(
  plantType: PlantType | null | undefined,
  zone?: AgroClimaticZone,
): SeasonalPestAlert[] {
  const z = zone ?? DEFAULT_ZONE;
  const seasonId = getCurrentSeason(undefined, z);
  const seasonAlerts = z.seasonalPestAlerts[seasonId];
  if (!seasonAlerts) return [];

  const general = seasonAlerts["_general"] ?? [];
  const specific = plantType ? seasonAlerts[plantType] ?? [] : [];
  return [...specific, ...general];
}
