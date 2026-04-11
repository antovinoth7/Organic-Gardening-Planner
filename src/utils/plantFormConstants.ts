/**
 * Constants and pure helpers shared between PlantAddWizard, PlantEditForm,
 * and usePlantFormState.
 */

export const NOTES_MAX_LENGTH = 500;

export const sanitizeNumberText = (value: string): string =>
  value.replace(/[^0-9]/g, "");

export type FormSectionKey =
  | "basic"
  | "location"
  | "care"
  | "health"
  | "harvest"
  | "coconut"
  | "notesHistory"
  | "pestDisease";

export const CATEGORY_OPTIONS = [
  { label: "🥬 Vegetable", value: "vegetable" },
  { label: "🍇 Fruit", value: "fruit_tree" },
  { label: "🥥 Coconut", value: "coconut_tree" },
  { label: "🌿 Herb", value: "herb" },
  { label: "🌲 Timber", value: "timber_tree" },
  { label: "🌸 Flower", value: "flower" },
  { label: "🌱 Shrub", value: "shrub" },
] as const;

export const HEALTH_OPTIONS = [
  { label: "✅ Healthy", value: "healthy" },
  { label: "⚠️ Stressed", value: "stressed" },
  { label: "🔄 Recovering", value: "recovering" },
  { label: "❌ Sick", value: "sick" },
] as const;

export const GROWTH_STAGE_OPTIONS = [
  { label: "🌱 Seedling", value: "seedling" },
  { label: "🌿 Vegetative", value: "vegetative" },
  { label: "🌸 Flowering", value: "flowering" },
  { label: "🍎 Fruiting", value: "fruiting" },
  { label: "🌳 Mature", value: "mature" },
  { label: "💤 Dormant", value: "dormant" },
] as const;

export const getFrequencyLabel = (days: string): string => {
  const n = parseInt(days, 10);
  if (isNaN(n) || n < 1) return "";
  if (n === 1) return "Daily";
  if (n === 7) return "Weekly";
  if (n === 14) return "Fortnightly";
  if (n === 30) return "Monthly";
  return `Every ${n} days`;
};

export const adjustFrequency = (
  current: string,
  delta: number,
  setter: (value: string) => void,
): void => {
  const n = parseInt(current, 10);
  const next = Math.max(1, (isNaN(n) ? 0 : n) + delta);
  setter(next.toString());
};
