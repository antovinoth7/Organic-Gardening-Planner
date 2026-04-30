/// <reference types="jest" />
import {
  computeExpectedGrowthStage,
  computeAnnualCycleStage,
  getEffectiveGrowthStage,
  STAGE_ORDER,
} from '../../utils/plantHelpers';
import type { GrowthStageDurations, AnnualCycleDurations, Plant, PlantCareProfile } from '../../types/database.types';

describe('computeExpectedGrowthStage', () => {
  const tomatoDurations: GrowthStageDurations = {
    seedling: 21,
    vegetative: 25,
    flowering: 15,
    fruiting: 40,
    mature: 20,
  };

  it('returns seedling on day 1', () => {
    const today = new Date();
    const plantingDate = new Date(today);
    plantingDate.setDate(plantingDate.getDate() - 1);
    const result = computeExpectedGrowthStage(
      plantingDate.toISOString().slice(0, 10),
      tomatoDurations,
    );
    expect(result).not.toBeNull();
    expect(result!.stage).toBe('seedling');
    expect(result!.daysSinceStageStart).toBe(1);
  });

  it('returns vegetative after seedling days', () => {
    const today = new Date();
    const plantingDate = new Date(today);
    plantingDate.setDate(plantingDate.getDate() - 25); // 25 days ago (past 21-day seedling)
    const result = computeExpectedGrowthStage(
      plantingDate.toISOString().slice(0, 10),
      tomatoDurations,
    );
    expect(result).not.toBeNull();
    expect(result!.stage).toBe('vegetative');
  });

  it('returns flowering at correct time', () => {
    const today = new Date();
    const plantingDate = new Date(today);
    plantingDate.setDate(plantingDate.getDate() - 50); // seedling(21) + vegetative(25) + 4 = flowering
    const result = computeExpectedGrowthStage(
      plantingDate.toISOString().slice(0, 10),
      tomatoDurations,
    );
    expect(result).not.toBeNull();
    expect(result!.stage).toBe('flowering');
  });

  it('returns last stage when past all durations', () => {
    const today = new Date();
    const plantingDate = new Date(today);
    plantingDate.setDate(plantingDate.getDate() - 200); // way past total of 121 days
    const result = computeExpectedGrowthStage(
      plantingDate.toISOString().slice(0, 10),
      tomatoDurations,
    );
    expect(result).not.toBeNull();
    expect(result!.stage).toBe('mature');
  });

  it('returns null for empty durations', () => {
    const result = computeExpectedGrowthStage('2025-01-01', {});
    expect(result).toBeNull();
  });

  it('computes percentComplete correctly', () => {
    const today = new Date();
    const plantingDate = new Date(today);
    plantingDate.setDate(plantingDate.getDate() - 10); // 10 days into 21-day seedling
    const result = computeExpectedGrowthStage(
      plantingDate.toISOString().slice(0, 10),
      tomatoDurations,
    );
    expect(result).not.toBeNull();
    expect(result!.stage).toBe('seedling');
    expect(result!.percentComplete).toBeCloseTo((10 / 21) * 100, 0);
    expect(result!.daysUntilNextStage).toBe(11);
  });
});

describe('computeAnnualCycleStage', () => {
  const mangoCycle: AnnualCycleDurations = {
    flowering: 45,
    fruiting: 90,
    vegetative: 120,
    dormant: 110,
  };

  it('returns null if tree is too young', () => {
    const today = new Date();
    const plantingDate = new Date(today);
    plantingDate.setDate(plantingDate.getDate() - 365); // 1 year old
    const result = computeAnnualCycleStage(
      plantingDate.toISOString().slice(0, 10),
      5, // 5 years to first harvest
      mangoCycle,
      11, // flowering starts November
    );
    expect(result).toBeNull();
  });

  it('returns a stage for a mature tree', () => {
    const today = new Date();
    const plantingDate = new Date(today);
    plantingDate.setFullYear(plantingDate.getFullYear() - 10); // 10 years old
    const result = computeAnnualCycleStage(
      plantingDate.toISOString().slice(0, 10),
      5,
      mangoCycle,
      11,
    );
    expect(result).not.toBeNull();
    expect(STAGE_ORDER).toContain(result!.stage);
  });
});

describe('getEffectiveGrowthStage', () => {
  const basePlant = {
    id: 'test-1',
    user_id: 'u1',
    name: 'Tomato',
    plant_type: 'vegetable' as const,
    plant_variety: 'Tomato',
    planting_date: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    location: 'Garden',
    space_type: 'ground' as const,
    photo_url: null,
    growth_stage: 'seedling' as const,
    health_status: 'healthy' as const,
  } satisfies Partial<Plant> as Plant;

  const baseProfile: PlantCareProfile = {
    wateringFrequencyDays: 3,
    fertilisingFrequencyDays: 14,
    pruningFrequencyDays: undefined,
    sunlight: 'full_sun',
    soilType: 'garden_soil',
    waterRequirement: 'medium',
    preferredFertiliser: 'compost',
    initialGrowthStage: 'seedling',

    growthStageDurations: {
      seedling: 21,
      vegetative: 25,
      flowering: 15,
      fruiting: 40,
      mature: 20,
    },
  };

  it('returns pinned stage when plant has growth_stage_pinned', () => {
    const plant = { ...basePlant, growth_stage_pinned: 'flowering' as const };
    const result = getEffectiveGrowthStage(plant, baseProfile);
    expect(result.stage).toBe('flowering');
    expect(result.source).toBe('pinned');
  });

  it('returns computed stage from durations', () => {
    const result = getEffectiveGrowthStage(basePlant, baseProfile);
    expect(result.source).toBe('computed');
    expect(STAGE_ORDER).toContain(result.stage);
  });

  it('returns manual fallback when no durations', () => {
    const profileNoDurations = { ...baseProfile, growthStageDurations: undefined };
    const result = getEffectiveGrowthStage(basePlant, profileNoDurations);
    expect(result.stage).toBe('seedling');
    expect(result.source).toBe('manual');
  });

  it('returns coconut source for coconut_tree', () => {
    const coconutPlant: Plant = {
      ...basePlant,
      plant_type: 'coconut_tree',
      plant_variety: 'East Coast Tall',
      planting_date: new Date(Date.now() - 365 * 5 * 86400000).toISOString().slice(0, 10),
    };
    const coconutProfile = { ...baseProfile, growthStageDurations: undefined };
    const result = getEffectiveGrowthStage(coconutPlant, coconutProfile);
    expect(result.source).toBe('coconut');
  });
});
