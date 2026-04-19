/// <reference types="jest" />
import {
  getPlantCareProfile,
  hasPlantCareProfile,
} from "../../utils/plantCareDefaults";

describe("plantCareDefaults A2 enrichment", () => {
  describe("enriched profiles", () => {
    it("Tomato has all A2 fields", () => {
      const profile = getPlantCareProfile("Tomato", "vegetable");
      expect(profile).toBeTruthy();
      expect(profile!.scientificName).toBe("Solanum lycopersicum");
      expect(profile!.taxonomicFamily).toBeTruthy();
      expect(profile!.lifecycle).toBe("annual");
      expect(profile!.tamilName).toBeTruthy();
      expect(profile!.description).toBeTruthy();
      expect(profile!.daysToHarvest).toEqual(
        expect.objectContaining({ min: expect.any(Number), max: expect.any(Number) }),
      );
      expect(profile!.heightCm).toBeTruthy();
      expect(profile!.spacingCm).toBeGreaterThan(0);
      expect(profile!.growingSeason).toBeTruthy();
      expect(profile!.heatTolerance).toBeTruthy();
      expect(profile!.droughtTolerance).toBeTruthy();
      expect(profile!.waterloggingTolerance).toBeTruthy();
      expect(profile!.feedingIntensity).toBeTruthy();
    });

    it("Mango has yearsToFirstHarvest", () => {
      const profile = getPlantCareProfile("Mango", "fruit_tree");
      expect(profile).toBeTruthy();
      expect(profile!.yearsToFirstHarvest).toBeGreaterThan(0);
      expect(profile!.scientificName).toBe("Mangifera indica");
    });

    it("Dwarf Coconut has A2 fields", () => {
      const profile = getPlantCareProfile("Dwarf Coconut", "coconut_tree");
      expect(profile).toBeTruthy();
      expect(profile!.yearsToFirstHarvest).toBeGreaterThan(0);
      expect(profile!.tamilName).toBeTruthy();
    });

    it("all 100 plants have profiles", () => {
      const plants: [string, string][] = [
        ["Brinjal", "vegetable"],
        ["Coriander", "herb"],
        ["Marigold", "flower"],
        ["Banana", "fruit_tree"],
        ["Neem", "timber_tree"],
        ["Tall Coconut", "coconut_tree"],
        ["Hibiscus", "shrub"],
      ];

      for (const [variety, type] of plants) {
        expect(
          hasPlantCareProfile(variety, type as Parameters<typeof hasPlantCareProfile>[1]),
        ).toBe(true);
      }
    });
  });

  describe("NumericRange fields", () => {
    it("daysToHarvest has min <= max", () => {
      const profile = getPlantCareProfile("Ladies Finger", "vegetable");
      expect(profile!.daysToHarvest!.min).toBeLessThanOrEqual(
        profile!.daysToHarvest!.max,
      );
    });

    it("soilPhRange has valid values", () => {
      const profile = getPlantCareProfile("Tomato", "vegetable");
      expect(profile!.soilPhRange!.min).toBeGreaterThan(0);
      expect(profile!.soilPhRange!.max).toBeLessThan(14);
    });
  });
});
