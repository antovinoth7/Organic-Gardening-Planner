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
        "Tomato (Thakkali)",
        "Brinjal (Kathirikai)",
        "Bhendi / Okra (Vendakkai)",
        "Chilli (Milagai)",
        "Cluster Beans (Kothavarangai)",
        "Broad Beans (Avarakkai)",
        "Drumstick (Murungakkai)",
        "Ridge Gourd (Peerkangai)",
        "Bitter Gourd (Pavakkai)",
        "Snake Gourd (Pudalangai)",
        "Bottle Gourd (Suraikkai)",
        "Pumpkin (Parangikkai)",
        "Ash Gourd (Poosanikai)",
        "Amaranth Greens (Arai Keerai)",
        "Spinach (Pasalai Keerai)",
        "Coriander Greens (Kothamalli)",
        "Fenugreek Greens (Vendhaya Keerai)",
        "Curry Leaf Seedling",
        "Banana Stem",
        "Banana Flower",
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
      varieties: {
        "Tomato (Thakkali)": ["PKM 1", "CO 3", "Arka Rakshak", "Arka Vikas"],
        "Brinjal (Kathirikai)": ["CO 2", "Matti Gulla", "Long Green", "Round Purple"],
        "Bhendi / Okra (Vendakkai)": ["COBhH 1", "Arka Anamika", "Parbhani Kranti"],
        "Chilli (Milagai)": ["K1", "K2", "Byadgi", "Gundu Milagai"],
        "Drumstick (Murungakkai)": ["PKM 1", "PKM 2"],
      },
    },
    herb: {
      plants: [
        "Holy Basil (Thulasi)",
        "Indian Borage (Karpooravalli)",
        "Ajwain Leaf",
        "Betel Leaf (Vetrilai)",
        "Turmeric",
        "Ginger",
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
      varieties: {
        "Holy Basil (Thulasi)": ["Rama Tulsi", "Krishna Tulsi"],
        Turmeric: ["Erode Local", "Salem", "Pragati"],
        Ginger: ["Rio-de-Janeiro", "Maran", "Nadia"],
      },
    },
    flower: {
      plants: [
        "Jasmine (Malli)",
        "Crossandra (Kanakambaram)",
        "Tuberose (Sampangi)",
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
      varieties: {
        "Jasmine (Malli)": ["Madurai Malli", "Gundu Malli", "Ramanathapuram Gundumalli"],
        "Crossandra (Kanakambaram)": ["Delhi Orange", "Lutea Yellow"],
      },
    },
    fruit_tree: {
      plants: [
        "Mango (Ma)",
        "Banana (Vazhai)",
        "Guava (Koyya)",
        "Lemon (Elumichai)",
        "Amla (Nellikai)",
        "Custard Apple (Seethapazham)",
        "Indian Gooseberry",
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
      varieties: {
        "Mango (Ma)": ["Alphonso", "Banganapalli", "Imam Pasand", "Neelum"],
        "Banana (Vazhai)": ["Poovan", "Nendran", "Rasthali", "Robusta"],
        "Guava (Koyya)": ["Lucknow 49", "Arka Kiran", "Allahabad Safeda"],
        "Lemon (Elumichai)": ["PKM 1", "Assam Lemon"],
        "Amla (Nellikai)": ["NA-7", "Krishna", "Kanchan"],
      },
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
        "Ixora",
        "Henna (Maruthani)",
        "Hibiscus",
        "Bougainvillea",
        "Jasmine",
        "Azalea",
        "Gardenia",
        "Lavender",
        "Boxwood",
        "Holly",
      ],
      varieties: {
        Hibiscus: ["Red Single", "Yellow Double"],
        Ixora: ["Red Dwarf", "Orange"],
      },
    },
  },
};

const mergeUnique = (base: string[], additions: string[]): string[] => {
  const seen = new Set(base.map((item) => item.toLowerCase()));
  const merged = [...base];

  additions.forEach((item) => {
    if (!seen.has(item.toLowerCase())) {
      seen.add(item.toLowerCase());
      merged.push(item);
    }
  });

  return merged;
};

export const mergeCatalogWithStarterDefaults = (
  catalog: PlantCatalog
): PlantCatalog => {
  const mergedCategories = { ...catalog.categories } as Record<
    PlantType,
    PlantCatalogCategory
  >;

  PLANT_CATEGORIES.forEach((type) => {
    const currentCategory = mergedCategories[type] ?? { plants: [], varieties: {} };
    const starterCategory = DEFAULT_PLANT_CATALOG.categories[type];
    const mergedPlants = mergeUnique(currentCategory.plants ?? [], starterCategory.plants);

    const mergedVarieties: Record<string, string[]> = {
      ...(currentCategory.varieties ?? {}),
    };

    Object.entries(starterCategory.varieties ?? {}).forEach(
      ([plantName, starterVarieties]) => {
        const currentVarieties = mergedVarieties[plantName] ?? [];
        mergedVarieties[plantName] = mergeUnique(currentVarieties, starterVarieties);
      }
    );

    mergedCategories[type] = {
      plants: mergedPlants,
      varieties: mergedVarieties,
    };
  });

  return normalizeCatalog({ categories: mergedCategories });
};

export const catalogNeedsStarterImport = (catalog: PlantCatalog): boolean => {
  return PLANT_CATEGORIES.some((type) => {
    const starterPlants = DEFAULT_PLANT_CATALOG.categories[type].plants;
    const catalogPlants = new Set(
      (catalog.categories[type]?.plants ?? []).map((plant) => plant.toLowerCase())
    );
    return starterPlants.some((plant) => !catalogPlants.has(plant.toLowerCase()));
  });
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
