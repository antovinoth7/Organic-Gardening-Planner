import type { Plant, PlantType } from '../types/database.types';

/**
 * Build the base for an auto-generated plant name from its metadata.
 * E.g. "Tomato - Cherry '26 (BG)" for a Cherry Tomato planted in 2026 in Backyard Garden.
 */
export const buildGeneratedPlantNameBase = (
  plantType: PlantType | string,
  plantVariety: string,
  variety: string,
  plantingDate?: string,
  parentLocation?: string,
  locationShortName?: string,
): string => {
  const pv = plantVariety.trim();
  const v = variety.trim();
  if (!pv) return "";

  let base: string;
  if (!v) {
    base = pv;
  } else if (v.toLowerCase().includes(pv.toLowerCase())) {
    base = v;
  } else {
    base = `${pv} - ${v}`;
  }

  const isTree = ["fruit_tree", "timber_tree", "coconut_tree"].includes(
    plantType as string,
  );
  if (isTree && plantingDate) {
    const d = new Date(plantingDate);
    if (!isNaN(d.getTime())) {
      base = `${base} '${String(d.getFullYear()).slice(2)}`;
    }
  }

  const loc = parentLocation?.trim();
  if (loc) {
    const token =
      locationShortName?.trim() || (loc.split(/\s+/)[0] ?? '').slice(0, 10);
    if (token) base = `${base} (${token})`;
  }

  return base;
};

export const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Check whether a plant name matches the auto-generated pattern for a given base.
 */
export const isGeneratedPlantName = (value: string, baseName: string): boolean => {
  const nv = value.trim();
  const nb = baseName.trim();
  if (!nv || !nb) return false;
  const pattern = new RegExp(`^${escapeRegExp(nb)}(?: #(\\d+))?$`, "i");
  return pattern.test(nv);
};

/**
 * Build a unique auto-generated plant name, appending " #N" when the base is
 * already taken by another plant.
 */
export const buildGeneratedPlantName = (
  baseName: string,
  existingPlants: Plant[],
  currentPlantId?: string,
  currentGeneratedName?: string,
): string => {
  const normalizedBase = baseName.trim();
  if (!normalizedBase) return "";

  if (
    currentPlantId &&
    currentGeneratedName &&
    isGeneratedPlantName(currentGeneratedName, normalizedBase)
  ) {
    return currentGeneratedName;
  }

  const pattern = new RegExp(
    `^${escapeRegExp(normalizedBase)}(?: #(\\d+))?$`,
    "i",
  );
  let baseTaken = false;
  const usedSuffixes = new Set<number>();

  existingPlants.forEach((plant) => {
    if (plant.id === currentPlantId) return;
    const match = plant.name?.trim().match(pattern);
    if (!match) return;
    if (!match[1]) {
      baseTaken = true;
    } else {
      const suffix = parseInt(match[1], 10);
      if (!Number.isNaN(suffix)) usedSuffixes.add(suffix);
    }
  });

  if (!baseTaken) return normalizedBase;
  let next = 2;
  while (usedSuffixes.has(next)) next++;
  return `${normalizedBase} #${next}`;
};
