import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, refreshAuthToken } from "../lib/firebase";
import { getData, setData, KEYS } from "../lib/storage";
import { PlantCatalog, PlantCatalogCategory, PlantType } from "../types/database.types";
import { logError } from "../utils/errorLogging";
import { withTimeoutAndRetry } from "../utils/firestoreTimeout";

export const PLANT_CATEGORIES: PlantType[] = [
  "vegetable",
  "herb",
  "flower",
  "fruit_tree",
  "timber_tree",
  "coconut_tree",
  "shrub",
];

export const DEFAULT_PLANT_CATALOG: PlantCatalog = {
  categories: {
    vegetable: {
      plants: [
        "Tomato",
        "Carrot",
        "Lettuce",
        "Cabbage",
        "Broccoli",
        "Cucumber",
        "Pepper",
        "Eggplant",
        "Spinach",
        "Radish",
        "Potato",
        "Onion",
        "Garlic",
        "Beans",
        "Peas",
      ],
      varieties: {},
    },
    herb: {
      plants: [
        "Basil",
        "Mint",
        "Coriander",
        "Parsley",
        "Rosemary",
        "Thyme",
        "Oregano",
        "Sage",
        "Dill",
        "Lemongrass",
        "Curry Leaf",
      ],
      varieties: {},
    },
    flower: {
      plants: [
        "Rose",
        "Sunflower",
        "Marigold",
        "Lily",
        "Tulip",
        "Jasmine",
        "Hibiscus",
        "Dahlia",
        "Chrysanthemum",
        "Orchid",
      ],
      varieties: {},
    },
    fruit_tree: {
      plants: [
        "Mango",
        "Orange",
        "Banana",
        "Guava",
        "Papaya",
        "Lemon",
        "Pomegranate",
        "Fig",
        "Avocado",
        "Jackfruit",
        "Chikoo",
        "Water Apple",
        "Soursop",
        "Mangosteen",
        "Rambutan",
      ],
      varieties: {},
    },
    timber_tree: {
      plants: ["Teak", "Mahogany", "Rosewood", "Sandalwood", "Bamboo", "Wild Jack", "Neem"],
      varieties: {},
    },
    coconut_tree: {
      plants: ["Dwarf Coconut", "Tall Coconut", "Hybrid Coconut", "King Coconut"],
      varieties: {},
    },
    shrub: {
      plants: [
        "Hibiscus",
        "Bougainvillea",
        "Jasmine",
        "Azalea",
        "Gardenia",
        "Lavender",
        "Boxwood",
        "Holly",
      ],
      varieties: {},
    },
  },
};

const SETTINGS_COLLECTION = "user_settings";
const PLANT_CATALOG_FIELD = "plantCatalog";

const normalizeList = (values: string[] | undefined | null): string[] => {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const trimmed = (value ?? "").toString().trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  });
  return result;
};

const normalizeVarieties = (
  varieties: Record<string, string[]> | undefined | null,
  validPlants: string[]
): Record<string, string[]> => {
  const validSet = new Set(validPlants.map((plant) => plant.toLowerCase()));
  const result: Record<string, string[]> = {};

  if (!varieties || typeof varieties !== "object") return result;

  Object.entries(varieties).forEach(([plantName, list]) => {
    const normalizedPlantName = plantName?.toString().trim();
    if (!normalizedPlantName) return;
    if (!validSet.has(normalizedPlantName.toLowerCase())) return;
    const normalizedList = normalizeList(list);
    if (normalizedList.length === 0) return;
    result[normalizedPlantName] = normalizedList;
  });

  return result;
};

const normalizeCategory = (
  category: PlantCatalogCategory | undefined | null,
  defaultPlants: string[],
  hasCategory: boolean
): PlantCatalogCategory => {
  const plants = normalizeList(category?.plants);
  const resolvedPlants = hasCategory ? plants : defaultPlants;
  return {
    plants: resolvedPlants,
    varieties: normalizeVarieties(category?.varieties, resolvedPlants),
  };
};

const normalizeCatalog = (catalog?: PlantCatalog | null): PlantCatalog => {
  const categories = {} as Record<PlantType, PlantCatalogCategory>;
  const incomingCategories = catalog?.categories ?? ({} as Record<
    PlantType,
    PlantCatalogCategory
  >);

  PLANT_CATEGORIES.forEach((type) => {
    const defaultCategory = DEFAULT_PLANT_CATALOG.categories[type];
    const incomingCategory = incomingCategories?.[type];
    const hasCategory = Boolean(incomingCategory);
    categories[type] = normalizeCategory(
      incomingCategory,
      defaultCategory.plants,
      hasCategory
    );
  });

  return { categories };
};

const getCachedCatalog = async (): Promise<PlantCatalog> => {
  const stored = await getData<PlantCatalog>(KEYS.PLANT_CATALOG);
  if (stored.length > 0 && stored[0]) {
    return normalizeCatalog(stored[0]);
  }

  return DEFAULT_PLANT_CATALOG;
};

export const getPlantCatalog = async (): Promise<PlantCatalog> => {
  const cached = await getCachedCatalog();
  const user = auth.currentUser;
  if (!user) return cached;

  // Refresh token to prevent expiration issues
  await refreshAuthToken();

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
      timeoutMs: 10000,
      maxRetries: 2,
    });

    if (!snapshot.exists()) {
      await withTimeoutAndRetry(
        () =>
          setDoc(
            docRef,
            { [PLANT_CATALOG_FIELD]: cached, updated_at: serverTimestamp() },
            { merge: true }
          ),
        { timeoutMs: 10000, maxRetries: 1, throwOnTimeout: false }
      );
      return cached;
    }

    const data = snapshot.data();
    const remoteCatalog = normalizeCatalog(
      (data as Record<string, any>)[PLANT_CATALOG_FIELD] ?? data
    );
    await setData(KEYS.PLANT_CATALOG, [remoteCatalog]);
    return remoteCatalog;
  } catch (error) {
    logError("network", "Failed to fetch plant catalog", error as Error, {
      userId: user.uid,
    });
    return cached;
  }
};

export const savePlantCatalog = async (
  catalog: PlantCatalog
): Promise<PlantCatalog> => {
  const normalized = normalizeCatalog(catalog);
  await setData(KEYS.PLANT_CATALOG, [normalized]);

  const user = auth.currentUser;
  if (!user) return normalized;

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    await withTimeoutAndRetry(
      () =>
        setDoc(
          docRef,
          { [PLANT_CATALOG_FIELD]: normalized, updated_at: serverTimestamp() },
          { merge: true }
        ),
      { timeoutMs: 10000, maxRetries: 2, throwOnTimeout: false }
    );
  } catch (error) {
    logError("network", "Failed to save plant catalog", error as Error, {
      userId: user.uid,
    });
  }

  return normalized;
};
