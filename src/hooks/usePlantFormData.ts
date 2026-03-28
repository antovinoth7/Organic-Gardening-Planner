import React, { useEffect, useState } from "react";
import { getAllPlants } from "../services/plants";
import {
  Plant,
  PlantType,
  PlantCatalog,
  PlantCareProfiles,
} from "../types/database.types";
import {
  DEFAULT_CHILD_LOCATIONS,
  DEFAULT_PARENT_LOCATIONS,
  getLocationConfig,
} from "../services/locations";
import {
  DEFAULT_PLANT_CATALOG,
  getPlantCatalog,
} from "../services/plantCatalog";
import { getPlantCareProfiles } from "../services/plantCareProfiles";
import { useFocusEffect } from "@react-navigation/native";

interface UsePlantFormDataOptions {
  plantType: PlantType | string;
  plantVariety: string;
  parentLocation: string;
  childLocation: string;
  harvestSeason: string;
  formMode: "quick" | "advanced";
  customVarietyMode: boolean;
}

export function usePlantFormData({
  plantType,
  plantVariety,
  parentLocation,
  childLocation,
  harvestSeason,
  formMode,
  customVarietyMode,
}: UsePlantFormDataOptions) {
  const [existingPlants, setExistingPlants] = useState<Plant[]>([]);
  const [plantCatalog, setPlantCatalog] = useState<PlantCatalog>(
    DEFAULT_PLANT_CATALOG,
  );
  const [plantCareProfiles, setPlantCareProfiles] = useState<PlantCareProfiles>(
    {} as PlantCareProfiles,
  );
  const [careProfilesLoaded, setCareProfilesLoaded] = useState(false);
  const [parentLocations, setParentLocations] = useState<string[]>(
    DEFAULT_PARENT_LOCATIONS,
  );
  const [childLocations, setChildLocations] = useState<string[]>(
    DEFAULT_CHILD_LOCATIONS,
  );
  const [locationShortNames, setLocationShortNames] = useState<Record<string, string>>({});

  const loadLocations = async () => {
    try {
      const config = await getLocationConfig();
      setParentLocations(config.parentLocations);
      setChildLocations(config.childLocations);
      setLocationShortNames(config.parentLocationShortNames ?? {});
    } catch (error) {
      console.error("Error loading locations:", error);
    }
  };

  const loadPlantCatalog = async () => {
    try {
      const catalog = await getPlantCatalog();
      setPlantCatalog(catalog);
    } catch (error) {
      console.error("Error loading plant catalog:", error);
    }
  };

  const loadExistingPlants = async () => {
    try {
      const plants = await getAllPlants();
      setExistingPlants(plants);
    } catch (error) {
      console.error("Error loading plants for naming:", error);
    }
  };

  const loadPlantCareProfiles = async () => {
    try {
      const profiles = await getPlantCareProfiles();
      setPlantCareProfiles(profiles);
    } catch (error) {
      console.error("Error loading plant care profiles:", error);
    } finally {
      setCareProfilesLoaded(true);
    }
  };

  const loadAllReferenceData = () => {
    loadLocations();
    loadPlantCatalog();
    loadPlantCareProfiles();
    loadExistingPlants();
  };

  useEffect(() => {
    loadAllReferenceData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadAllReferenceData();
    }, []),
  );

  // Derived option lists
  const parentLocationOptions = React.useMemo(() => {
    if (parentLocation && !parentLocations.includes(parentLocation)) {
      return [parentLocation, ...parentLocations];
    }
    return parentLocations;
  }, [parentLocations, parentLocation]);

  const childLocationOptions = React.useMemo(() => {
    if (childLocation && !childLocations.includes(childLocation)) {
      return [childLocation, ...childLocations];
    }
    return childLocations;
  }, [childLocations, childLocation]);

  const specificPlantOptions = React.useMemo(() => {
    const plants = plantCatalog.categories[plantType as PlantType]?.plants ?? [];
    if (plantVariety && !plants.includes(plantVariety)) {
      return [plantVariety, ...plants];
    }
    return plants;
  }, [plantCatalog, plantType, plantVariety]);

  const varietySuggestions = React.useMemo(() => {
    if (!plantVariety) return [];
    return plantCatalog.categories[plantType as PlantType]?.varieties?.[plantVariety] ?? [];
  }, [plantCatalog, plantType, plantVariety]);

  const TAMIL_NADU_HARVEST_SEASONS = [
    "Year Round",
    "Summer (Mar-May)",
    "Southwest Monsoon (Jun-Sep)",
    "Northeast Monsoon (Oct-Dec)",
    "Cool Dry (Jan-Feb)",
  ];

  const harvestSeasonOptions = React.useMemo(() => {
    if (!harvestSeason) return TAMIL_NADU_HARVEST_SEASONS;
    if (TAMIL_NADU_HARVEST_SEASONS.includes(harvestSeason)) {
      return TAMIL_NADU_HARVEST_SEASONS;
    }
    return [harvestSeason, ...TAMIL_NADU_HARVEST_SEASONS];
  }, [harvestSeason]);

  // Section field counts
  const basicFieldCount = React.useMemo(() => {
    let count = 4;
    if (formMode === "advanced") {
      count += 2;
      if (varietySuggestions.length > 0 && customVarietyMode) {
        count += 1;
      }
    }
    return count;
  }, [formMode, varietySuggestions.length, customVarietyMode]);

  const locationFieldCount = React.useMemo(() => {
    let count = 1;
    if (parentLocation !== "") {
      count += 1;
    }
    if (formMode === "advanced") {
      count += 1;
    }
    return count;
  }, [formMode, parentLocation]);

  const harvestSectionFieldCount = React.useMemo(() => {
    return (plantType as PlantType) === "fruit_tree" ? 4 : 2;
  }, [plantType]);

  const notesHistoryFieldCount = React.useMemo(() => {
    return 1;
  }, []);

  return {
    // Reference data
    existingPlants,
    setExistingPlants,
    plantCatalog,
    plantCareProfiles,
    careProfilesLoaded,
    locationShortNames,
    // Option lists
    parentLocationOptions,
    childLocationOptions,
    specificPlantOptions,
    varietySuggestions,
    harvestSeasonOptions,
    // Field counts
    basicFieldCount,
    locationFieldCount,
    harvestSectionFieldCount,
    notesHistoryFieldCount,
  };
}
