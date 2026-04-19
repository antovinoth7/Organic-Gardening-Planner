/// <reference types="jest" />
import {
  getCurrentSeason,
  isMonsoonSeason,
  getSeasonLabel,
  getWateringFrequencyMultiplier,
  getSeasonalPestAlerts,
} from "../../utils/seasonHelpers";
import { HIGH_RAINFALL_ZONE } from "../../config/zones/highRainfall";
import { AgroClimaticZone } from "../../config/zones/types";

describe("seasonHelpers", () => {
  describe("getCurrentSeason", () => {
    it("returns summer for March", () => {
      expect(getCurrentSeason(new Date(2026, 2, 15))).toBe("summer");
    });

    it("returns summer for May", () => {
      expect(getCurrentSeason(new Date(2026, 4, 1))).toBe("summer");
    });

    it("returns sw_monsoon for June", () => {
      expect(getCurrentSeason(new Date(2026, 5, 1))).toBe("sw_monsoon");
    });

    it("returns sw_monsoon for September", () => {
      expect(getCurrentSeason(new Date(2026, 8, 30))).toBe("sw_monsoon");
    });

    it("returns ne_monsoon for October", () => {
      expect(getCurrentSeason(new Date(2026, 9, 1))).toBe("ne_monsoon");
    });

    it("returns ne_monsoon for December", () => {
      expect(getCurrentSeason(new Date(2026, 11, 25))).toBe("ne_monsoon");
    });

    it("returns cool_dry for January", () => {
      expect(getCurrentSeason(new Date(2026, 0, 15))).toBe("cool_dry");
    });

    it("returns cool_dry for February", () => {
      expect(getCurrentSeason(new Date(2026, 1, 28))).toBe("cool_dry");
    });

    it("accepts an explicit zone parameter", () => {
      const result = getCurrentSeason(new Date(2026, 0, 15), HIGH_RAINFALL_ZONE);
      expect(result).toBe("cool_dry");
    });

    it("defaults to high rainfall zone when no zone given", () => {
      const withZone = getCurrentSeason(new Date(2026, 6, 1), HIGH_RAINFALL_ZONE);
      const withoutZone = getCurrentSeason(new Date(2026, 6, 1));
      expect(withZone).toBe(withoutZone);
    });
  });

  describe("isMonsoonSeason", () => {
    it("returns true during SW monsoon", () => {
      expect(isMonsoonSeason(new Date(2026, 6, 15))).toBe(true);
    });

    it("returns true during NE monsoon", () => {
      expect(isMonsoonSeason(new Date(2026, 10, 15))).toBe(true);
    });

    it("returns false during summer", () => {
      expect(isMonsoonSeason(new Date(2026, 3, 15))).toBe(false);
    });

    it("returns false during cool dry", () => {
      expect(isMonsoonSeason(new Date(2026, 0, 15))).toBe(false);
    });
  });

  describe("getSeasonLabel", () => {
    it("returns human-readable label for summer", () => {
      const label = getSeasonLabel(new Date(2026, 3, 1));
      expect(label).toContain("Summer");
      expect(label).toContain("Mar");
    });

    it("returns label for NE monsoon", () => {
      const label = getSeasonLabel(new Date(2026, 10, 1));
      expect(label).toContain("NE Monsoon");
    });
  });

  describe("getWateringFrequencyMultiplier", () => {
    it("returns < 1 for pot plants in summer (more frequent watering)", () => {
      jest.useFakeTimers({ now: new Date(2026, 3, 15) });
      const multiplier = getWateringFrequencyMultiplier("pot");
      expect(multiplier).toBeLessThan(1);
      jest.useRealTimers();
    });

    it("returns > 1 for ground plants in NE monsoon (less frequent)", () => {
      jest.useFakeTimers({ now: new Date(2026, 10, 15) });
      const multiplier = getWateringFrequencyMultiplier("ground");
      expect(multiplier).toBeGreaterThan(1);
      jest.useRealTimers();
    });

    it("returns 1.0 for cool dry season", () => {
      jest.useFakeTimers({ now: new Date(2026, 0, 15) });
      const multiplier = getWateringFrequencyMultiplier("bed");
      expect(multiplier).toBe(1.0);
      jest.useRealTimers();
    });
  });

  describe("getSeasonalPestAlerts", () => {
    it("returns general alerts for null plant type", () => {
      jest.useFakeTimers({ now: new Date(2026, 3, 15) });
      const alerts = getSeasonalPestAlerts(null);
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some((a) => a.issue === "Mites")).toBe(true);
      jest.useRealTimers();
    });

    it("returns coconut-specific alerts for coconut_tree", () => {
      jest.useFakeTimers({ now: new Date(2026, 3, 15) });
      const alerts = getSeasonalPestAlerts("coconut_tree");
      expect(alerts.some((a) => a.issue === "Eriophyid Mite")).toBe(true);
      expect(alerts.some((a) => a.issue === "Mites")).toBe(true);
      jest.useRealTimers();
    });

    it("accepts a zone parameter", () => {
      jest.useFakeTimers({ now: new Date(2026, 3, 15) });
      const alerts = getSeasonalPestAlerts("vegetable", HIGH_RAINFALL_ZONE);
      expect(alerts.some((a) => a.issue === "Whiteflies")).toBe(true);
      jest.useRealTimers();
    });
  });

  describe("custom zone support", () => {
    const twoSeasonZone: AgroClimaticZone = {
      id: "test_zone",
      name: "Test Zone",
      districts: ["TestDistrict"],
      annualRainfallMm: 800,
      soilTypes: ["clay"],
      irrigationDominant: "canal",
      seasons: [
        { id: "wet", name: "Wet", label: "Wet (Jun\u2013Nov)", startMonth: 6, endMonth: 11 },
        { id: "dry", name: "Dry", label: "Dry (Dec\u2013May)", startMonth: 12, endMonth: 5 },
      ],
      wateringMultipliers: {
        wet: { pot: 1.5, bed: 3.0, ground: 3.0 },
        dry: { pot: 0.5, bed: 0.7, ground: 0.7 },
      },
      seasonalPestAlerts: {},
    };

    it("resolves season for a zone with wrap-around months", () => {
      expect(getCurrentSeason(new Date(2026, 0, 15), twoSeasonZone)).toBe("dry");
      expect(getCurrentSeason(new Date(2026, 7, 15), twoSeasonZone)).toBe("wet");
    });

    it("returns correct watering multiplier for custom zone", () => {
      jest.useFakeTimers({ now: new Date(2026, 7, 15) });
      const multiplier = getWateringFrequencyMultiplier("pot", twoSeasonZone);
      expect(multiplier).toBe(1.5);
      jest.useRealTimers();
    });

    it("returns empty alerts for zone with no pest data", () => {
      jest.useFakeTimers({ now: new Date(2026, 7, 15) });
      const alerts = getSeasonalPestAlerts("vegetable", twoSeasonZone);
      expect(alerts).toEqual([]);
      jest.useRealTimers();
    });
  });
});
