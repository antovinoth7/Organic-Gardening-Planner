/**
 * Disease reference registry.
 * Exposes zone-specific disease data via lookup functions.
 */

import type { DiseaseEntry, DiseaseCategory } from "@/types/database.types";
import { KANYAKUMARI_DISEASES } from "./kanyakumari";

// ─── Registry ────────────────────────────────────────────────────────────────

const ALL_DISEASES: DiseaseEntry[] = KANYAKUMARI_DISEASES;

const DISEASE_BY_ID = new Map<string, DiseaseEntry>(
  ALL_DISEASES.map((d) => [d.id, d]),
);

// ─── Lookups ─────────────────────────────────────────────────────────────────

export function getAllDiseases(): DiseaseEntry[] {
  return ALL_DISEASES;
}

export function getDiseaseById(id: string): DiseaseEntry | undefined {
  return DISEASE_BY_ID.get(id);
}

export function getDiseaseByName(name: string): DiseaseEntry | undefined {
  const normalised = name.trim().toLowerCase();
  return ALL_DISEASES.find((d) => d.name.toLowerCase() === normalised);
}

export function getDiseasesByCategory(
  category: DiseaseCategory,
): DiseaseEntry[] {
  return ALL_DISEASES.filter((d) => d.category === category);
}

export interface DiseaseCategoryGroup {
  category: DiseaseCategory;
  label: string;
  diseases: DiseaseEntry[];
}

const CATEGORY_LABELS: Record<DiseaseCategory, string> = {
  fungal: "Fungal Diseases",
  bacterial: "Bacterial Diseases",
  viral: "Viral Diseases",
  physiological: "Physiological Disorders",
};

export const CATEGORY_DESCRIPTIONS: Record<DiseaseCategory, string> = {
  fungal:
    "Caused by fungal spores spread by moisture and wind; shows as spots, blight, mildew, or rot.",
  bacterial:
    "Caused by bacteria entering through wounds or stomata; leads to wilting, cankers, or oozing lesions.",
  viral:
    "Caused by plant viruses spread by insect vectors; symptoms include mosaic patterns, stunting, and deformity.",
  physiological:
    "Non-infectious disorders caused by nutrient deficiency, watering extremes, or environmental stress.",
};

const CATEGORY_ORDER: DiseaseCategory[] = [
  "fungal",
  "bacterial",
  "viral",
  "physiological",
];

export function getGroupedDiseaseEntries(): DiseaseCategoryGroup[] {
  const groups: Partial<Record<DiseaseCategory, DiseaseEntry[]>> = {};

  for (const disease of ALL_DISEASES) {
    const list = groups[disease.category] ?? [];
    list.push(disease);
    groups[disease.category] = list;
  }

  return CATEGORY_ORDER
    .filter((cat) => groups[cat] && groups[cat]!.length > 0)
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      diseases: groups[cat]!,
    }));
}

export function getCategoryLabel(category: DiseaseCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}
