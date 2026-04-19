/// <reference types="jest" />
import {
  getAllPests,
  getPestById,
  getPestByName,
  getPestsByCategory,
  getGroupedPestEntries,
  getCategoryLabel,
} from "../../config/pests";
import type { PestEntry, PestCategory } from "../../types/database.types";

describe("pest registry", () => {
  describe("getAllPests", () => {
    it("returns a non-empty array", () => {
      const pests = getAllPests();
      expect(pests.length).toBeGreaterThan(0);
    });

    it("each entry has required fields", () => {
      for (const pest of getAllPests()) {
        expect(pest.id).toBeTruthy();
        expect(pest.name).toBeTruthy();
        expect(pest.category).toBeTruthy();
        expect(pest.emoji).toBeTruthy();
        expect(pest.identification).toBeTruthy();
        expect(pest.damageDescription).toBeTruthy();
        expect(pest.organicPrevention.length).toBeGreaterThan(0);
        expect(pest.organicTreatments.length).toBeGreaterThan(0);
        expect(pest.plantsAffected.length).toBeGreaterThan(0);
      }
    });

    it("all ids are unique", () => {
      const pests = getAllPests();
      const ids = pests.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("getPestById", () => {
    it("returns the correct pest for a known id", () => {
      const pest = getPestById("aphids");
      expect(pest).toBeDefined();
      expect(pest!.name).toBe("Aphids");
    });

    it("returns undefined for an unknown id", () => {
      expect(getPestById("nonexistent_pest")).toBeUndefined();
    });
  });

  describe("getPestByName", () => {
    it("finds a pest by exact name (case-insensitive)", () => {
      const pest = getPestByName("MEALYBUGS");
      expect(pest).toBeDefined();
      expect(pest!.id).toBe("mealybugs");
    });

    it("returns undefined for unknown name", () => {
      expect(getPestByName("Invisible Bug")).toBeUndefined();
    });
  });

  describe("getPestsByCategory", () => {
    it("returns only pests matching the category", () => {
      const mites = getPestsByCategory("mites");
      expect(mites.length).toBeGreaterThan(0);
      for (const pest of mites) {
        expect(pest.category).toBe("mites");
      }
    });
  });

  describe("getGroupedPestEntries", () => {
    it("returns groups in the expected order", () => {
      const groups = getGroupedPestEntries();
      const categories = groups.map((g) => g.category);
      const expectedOrder: PestCategory[] = [
        "sap_sucking",
        "mites",
        "borers_larvae",
        "beetles_weevils",
        "other",
      ];
      // All returned categories should be in the expected order
      let lastIdx = -1;
      for (const cat of categories) {
        const idx = expectedOrder.indexOf(cat);
        expect(idx).toBeGreaterThan(lastIdx);
        lastIdx = idx;
      }
    });

    it("each group has a label and non-empty pests array", () => {
      for (const group of getGroupedPestEntries()) {
        expect(group.label).toBeTruthy();
        expect(group.pests.length).toBeGreaterThan(0);
      }
    });
  });

  describe("getCategoryLabel", () => {
    it("returns readable labels for all categories", () => {
      const categories: PestCategory[] = [
        "sap_sucking",
        "mites",
        "borers_larvae",
        "beetles_weevils",
        "other",
      ];
      for (const cat of categories) {
        const label = getCategoryLabel(cat);
        expect(label).toBeTruthy();
        expect(label).not.toBe(cat); // Should be human-readable, not the raw key
      }
    });
  });

  describe("treatment validation", () => {
    it("all treatments have valid method and effort", () => {
      const validMethods = new Set(["spray", "trap", "biocontrol", "soil", "manual", "cultural"]);
      const validEfforts = new Set(["easy", "moderate", "advanced"]);

      for (const pest of getAllPests()) {
        for (const t of pest.organicTreatments) {
          expect(validMethods.has(t.method)).toBe(true);
          expect(validEfforts.has(t.effort)).toBe(true);
        }
      }
    });
  });
});
