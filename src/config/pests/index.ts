/**
 * Pest reference registry.
 * Exposes zone-specific pest data via lookup functions.
 */

import type { PestEntry, PestCategory } from "@/types/database.types";
import { KANYAKUMARI_PESTS } from "./kanyakumari";

// ─── Registry ────────────────────────────────────────────────────────────────

const ALL_PESTS: PestEntry[] = KANYAKUMARI_PESTS;

const PEST_BY_ID = new Map<string, PestEntry>(
  ALL_PESTS.map((p) => [p.id, p]),
);

// ─── Lookups ─────────────────────────────────────────────────────────────────

export function getAllPests(): PestEntry[] {
  return ALL_PESTS;
}

export function getPestById(id: string): PestEntry | undefined {
  return PEST_BY_ID.get(id);
}

export function getPestByName(name: string): PestEntry | undefined {
  const normalised = name.trim().toLowerCase();
  return ALL_PESTS.find((p) => p.name.toLowerCase() === normalised);
}

export function getPestsByCategory(category: PestCategory): PestEntry[] {
  return ALL_PESTS.filter((p) => p.category === category);
}

export interface PestCategoryGroup {
  category: PestCategory;
  label: string;
  pests: PestEntry[];
}

const CATEGORY_LABELS: Record<PestCategory, string> = {
  sap_sucking: "Sap-Sucking",
  mites: "Mites & Spiders",
  borers_larvae: "Borers & Larvae",
  beetles_weevils: "Beetles & Weevils",
  other: "Other Pests",
};

export const CATEGORY_DESCRIPTIONS: Record<PestCategory, string> = {
  sap_sucking:
    "Insects that pierce plant tissue and suck out sap, weakening plants, causing leaf curl, and spreading viruses.",
  mites:
    "Tiny arachnids (not insects) that feed on plant cells, causing stippling, discoloration, and fine webbing.",
  borers_larvae:
    "Insect larvae that tunnel into stems, roots, or fruit, causing wilting, dieback, and structural damage.",
  beetles_weevils:
    "Hard-bodied beetles or weevils that chew leaves, bore into seeds, or damage storage organs.",
  other:
    "Pests that don't fit the main categories — includes soil pests, thrips, and region-specific threats.",
};

const CATEGORY_ORDER: PestCategory[] = [
  "sap_sucking",
  "mites",
  "borers_larvae",
  "beetles_weevils",
  "other",
];

export function getGroupedPestEntries(): PestCategoryGroup[] {
  const groups: Partial<Record<PestCategory, PestEntry[]>> = {};

  for (const pest of ALL_PESTS) {
    const list = groups[pest.category] ?? [];
    list.push(pest);
    groups[pest.category] = list;
  }

  return CATEGORY_ORDER
    .filter((cat) => groups[cat] && groups[cat]!.length > 0)
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      pests: groups[cat]!,
    }));
}

export function getCategoryLabel(category: PestCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}
