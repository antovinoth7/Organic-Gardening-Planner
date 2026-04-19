/// <reference types="jest" />
import {
  getAllDiseases,
  getDiseaseById,
  getDiseaseByName,
  getDiseasesByCategory,
  getGroupedDiseaseEntries,
  getCategoryLabel,
} from "../../config/diseases";
import type { DiseaseCategory } from "../../types/database.types";

describe("disease registry", () => {
  describe("getAllDiseases", () => {
    it("returns a non-empty array", () => {
      const diseases = getAllDiseases();
      expect(diseases.length).toBeGreaterThan(0);
    });

    it("each entry has required fields", () => {
      for (const disease of getAllDiseases()) {
        expect(disease.id).toBeTruthy();
        expect(disease.name).toBeTruthy();
        expect(disease.category).toBeTruthy();
        expect(disease.emoji).toBeTruthy();
        expect(disease.identification).toBeTruthy();
        expect(disease.damageDescription).toBeTruthy();
        expect(disease.organicPrevention.length).toBeGreaterThan(0);
        expect(disease.organicTreatments.length).toBeGreaterThan(0);
        expect(disease.plantsAffected.length).toBeGreaterThan(0);
      }
    });

    it("all ids are unique", () => {
      const diseases = getAllDiseases();
      const ids = diseases.map((d) => d.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("getDiseaseById", () => {
    it("returns the correct disease for a known id", () => {
      const disease = getDiseaseById("powdery_mildew");
      expect(disease).toBeDefined();
      expect(disease!.name).toBe("Powdery Mildew");
    });

    it("returns undefined for an unknown id", () => {
      expect(getDiseaseById("nonexistent_disease")).toBeUndefined();
    });
  });

  describe("getDiseaseByName", () => {
    it("finds a disease by exact name (case-insensitive)", () => {
      const disease = getDiseaseByName("ROOT ROT");
      expect(disease).toBeDefined();
      expect(disease!.id).toBe("root_rot");
    });

    it("returns undefined for unknown name", () => {
      expect(getDiseaseByName("Imaginary Disease")).toBeUndefined();
    });
  });

  describe("getDiseasesByCategory", () => {
    it("returns only diseases matching the category", () => {
      const fungal = getDiseasesByCategory("fungal");
      expect(fungal.length).toBeGreaterThan(0);
      for (const disease of fungal) {
        expect(disease.category).toBe("fungal");
      }
    });

    it("returns viral diseases", () => {
      const viral = getDiseasesByCategory("viral");
      expect(viral.length).toBeGreaterThan(0);
      for (const disease of viral) {
        expect(disease.category).toBe("viral");
      }
    });
  });

  describe("getGroupedDiseaseEntries", () => {
    it("returns groups in the expected order", () => {
      const groups = getGroupedDiseaseEntries();
      const categories = groups.map((g) => g.category);
      const expectedOrder: DiseaseCategory[] = [
        "fungal",
        "bacterial",
        "viral",
        "physiological",
      ];
      let lastIdx = -1;
      for (const cat of categories) {
        const idx = expectedOrder.indexOf(cat);
        expect(idx).toBeGreaterThan(lastIdx);
        lastIdx = idx;
      }
    });

    it("each group has a label and non-empty diseases array", () => {
      for (const group of getGroupedDiseaseEntries()) {
        expect(group.label).toBeTruthy();
        expect(group.diseases.length).toBeGreaterThan(0);
      }
    });
  });

  describe("getCategoryLabel", () => {
    it("returns readable labels for all categories", () => {
      const categories: DiseaseCategory[] = [
        "fungal",
        "bacterial",
        "viral",
        "physiological",
      ];
      for (const cat of categories) {
        const label = getCategoryLabel(cat);
        expect(label).toBeTruthy();
        expect(label).not.toBe(cat);
      }
    });
  });

  describe("treatment validation", () => {
    it("all treatments have valid method and effort", () => {
      const validMethods = new Set(["spray", "trap", "biocontrol", "soil", "manual", "cultural"]);
      const validEfforts = new Set(["easy", "moderate", "advanced"]);

      for (const disease of getAllDiseases()) {
        for (const t of disease.organicTreatments) {
          expect(validMethods.has(t.method)).toBe(true);
          expect(validEfforts.has(t.effort)).toBe(true);
        }
      }
    });
  });
});
