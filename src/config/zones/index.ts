import { AgroClimaticZone } from "./types";
import { HIGH_RAINFALL_ZONE } from "./highRainfall";

export { HIGH_RAINFALL_ZONE } from "./highRainfall";
export type { AgroClimaticZone, SeasonDefinition, SeasonalPestAlert } from "./types";

export const DEFAULT_ZONE: AgroClimaticZone = HIGH_RAINFALL_ZONE;

const ZONE_REGISTRY: AgroClimaticZone[] = [HIGH_RAINFALL_ZONE];

export function getZoneByDistrict(district: string): AgroClimaticZone {
  const normalized = district.trim().toLowerCase();
  const found = ZONE_REGISTRY.find((zone) =>
    zone.districts.some((d) => d.toLowerCase() === normalized),
  );
  return found ?? DEFAULT_ZONE;
}

export function getZoneById(zoneId: string): AgroClimaticZone {
  const found = ZONE_REGISTRY.find((zone) => zone.id === zoneId);
  return found ?? DEFAULT_ZONE;
}
