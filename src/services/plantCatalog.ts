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
        "Brinjal",
        "Long Brinjal",
        "Ladies Finger",
        "Tomato",
        "Chilli",
        "Tapioca",
        "Drumstick",
        "Amaranthus",
        "Methi",
        "Cowpea",
        "Beans",
        "Bitter Gourd",
        "Snake Gourd",
        "Ridge Gourd",
        "Bottle Gourd",
        "Pumpkin",
        "Ash Gourd",
        "Cucumber",
        "Spinach",
        "Radish",
        "Onion",
        "Shallot",
        "Garlic",
        "Cabbage",
        "Cauliflower",
        "Carrot",
        "Potato",
        "Eggplant",
        "Pepper",
      ],
      varieties: {
        Brinjal: ["Long Purple", "Round Green", "Striped"],
        "Long Brinjal": ["Long Green", "Violet Long", "Local"],
        "Ladies Finger": ["CO 4", "CO 5", "Arka Anamika"],
        Tomato: ["Country Tomato", "Hybrid Tomato", "Cherry Tomato"],
        Chilli: ["Bird's Eye", "Gundu", "Long Chilli"],
        Tapioca: ["Mulluvadi", "CO 2", "H-165"],
        Drumstick: ["PKM 1", "PKM 2", "Local"],
        Amaranthus: ["Arai Keerai", "Siru Keerai", "Mulai Keerai"],
        Methi: ["Kasuri", "Pusa Early", "Local"],
        Cowpea: ["Bush", "Pole", "Red Cowpea"],
        Beans: ["Bush Beans", "Pole Beans", "Double Beans"],
        "Bitter Gourd": ["Mithipagal", "Long Green", "CO 1"],
        "Snake Gourd": ["Long White", "Striped", "CO 2"],
        "Ridge Gourd": ["Long Ridge", "Dark Green", "CO 1"],
        "Bottle Gourd": ["Long Bottle", "Round Bottle", "CO 1"],
        Pumpkin: ["Parangikkai", "CO 2", "Red Pumpkin"],
        "Ash Gourd": ["White Ash", "Long Ash", "CO 1"],
        Cucumber: ["Country Cucumber", "Hybrid Green", "Slicing"],
        Onion: ["Bellary", "Nasik Red", "CO Onion"],
        Shallot: ["Sambar Onion", "Small Red", "CO Shallot"],
        Radish: ["Pusa Chetki", "White Long", "Pink"],
        Spinach: ["Palak", "Local Green", "Hybrid Leafy"],
        Cabbage: ["Golden Acre", "CO 1", "Green Ball"],
        Cauliflower: ["Pusa Snowball", "CO 1", "Early White"],
      },
    },
    herb: {
      plants: [
        "Coriander",
        "Mint",
        "Curry Leaf",
        "Lemongrass",
        "Tulsi",
        "Basil",
        "Dill",
        "Parsley",
        "Rosemary",
        "Thyme",
        "Oregano",
      ],
      varieties: {
        Coriander: ["CO 4", "CO 5", "Local"],
        Mint: ["Peppermint", "Spearmint", "Country Mint"],
        "Curry Leaf": ["Dwarf", "Regular", "Local"],
        Lemongrass: ["East Indian", "West Indian", "Local"],
        Tulsi: ["Krishna Tulsi", "Rama Tulsi"],
      },
    },
    flower: {
      plants: [
        "Marigold",
        "Jasmine",
        "Hibiscus",
        "Rose",
        "Chrysanthemum",
        "Crossandra",
        "Ixora",
        "Sunflower",
        "Dahlia",
        "Orchid",
      ],
      varieties: {
        Marigold: ["African", "French", "Local Orange"],
        Jasmine: ["Malli", "Mullai", "Jathi Malli"],
        Hibiscus: ["Red", "Yellow", "Double Petal"],
      },
    },
    fruit_tree: {
      plants: [
        "Banana",
        "Mango",
        "Guava",
        "Papaya",
        "Lemon",
        "Pomegranate",
        "Jackfruit",
        "Chikoo",
        "Water Apple",
        "Custard Apple",
        "Amla",
        "Orange",
        "Fig",
        "Avocado",
        "Soursop",
        "Mangosteen",
        "Rambutan",
      ],
      varieties: {
        Banana: ["Nendran", "Poovan", "Rasthali", "Robusta", "Monthan"],
        Mango: ["Alphonso", "Banganapalli", "Neelum", "Imam Pasand"],
        Guava: ["Allahabad Safeda", "Pink Guava", "Local"],
        Papaya: ["Red Lady", "CO 8", "Local"],
        Lemon: ["Grafted Lemon", "Country Lemon"],
        Pomegranate: ["Bhagwa", "Ganesh", "Arakta"],
        Jackfruit: ["Palur 1", "Palur 2", "Local"],
        "Custard Apple": ["Balanagar", "Arka Sahan", "Local"],
        Amla: ["NA 7", "Krishna", "Kanchan"],
      },
    },
    timber_tree: {
      plants: [
        "Neem",
        "Teak",
        "Mahogany",
        "Rosewood",
        "Sandalwood",
        "Bamboo",
        "Wild Jack",
      ],
      varieties: {},
    },
    coconut_tree: {
      plants: ["Dwarf Coconut", "Tall Coconut", "Hybrid Coconut", "King Coconut"],
      varieties: {
        "Dwarf Coconut": ["COD", "Malayan Dwarf"],
        "Tall Coconut": ["West Coast Tall", "East Coast Tall"],
      },
    },
    shrub: {
      plants: [
        "Hibiscus",
        "Ixora",
        "Nandiyavattai",
        "Bougainvillea",
        "Jasmine",
        "Crossandra",
        "Lantana",
        "Gardenia",
      ],
      varieties: {
        Hibiscus: ["Single", "Double", "Red"],
        Ixora: ["Red", "Yellow", "Orange"],
      },
    },
  },
};

const SETTINGS_COLLECTION = "user_settings";
const PLANT_CATALOG_FIELD = "plantCatalog";
const REQUIRED_LOCAL_PLANTS: Partial<Record<PlantType, string[]>> = {
  vegetable: [
    "Brinjal",
    "Ladies Finger",
    "Chilli",
    "Drumstick",
    "Tapioca",
  ],
};
const KNOWN_VARIETY_ALIASES: Record<string, string> = {
  "lady's finger": "ladies finger",
  "ladies finger": "ladies finger",
  eggplant: "brinjal",
  aubergine: "brinjal",
  okra: "ladies finger",
  bhindi: "ladies finger",
  vendakkai: "ladies finger",
  kathirikai: "brinjal",
  "chilli pepper": "chilli",
  chili: "chilli",
  chilli: "chilli",
  maravalli: "tapioca",
  cassava: "tapioca",
  murungai: "drumstick",
  drumstick: "drumstick",
  keerai: "amaranthus",
  pudina: "mint",
  kothamalli: "coriander",
  karuveppilai: "curry leaf",
};

const toLookupKey = (value: string): string =>
  value.toLowerCase().replace(/\s+/g, " ").trim();

const getCanonicalPlantKey = (value: string): string => {
  const key = toLookupKey(value);
  return KNOWN_VARIETY_ALIASES[key] ?? key;
};

const hasEquivalentPlant = (plants: string[], target: string): boolean => {
  const targetKey = getCanonicalPlantKey(target);
  return plants.some((plant) => getCanonicalPlantKey(plant) === targetKey);
};

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
  const validPlantMap = new Map(
    validPlants.map((plant) => [toLookupKey(plant), plant])
  );
  const result: Record<string, string[]> = {};

  if (!varieties || typeof varieties !== "object") return result;

  Object.entries(varieties).forEach(([plantName, list]) => {
    const normalizedPlantName = plantName?.toString().trim();
    if (!normalizedPlantName) return;
    const plantKey = toLookupKey(normalizedPlantName);
    const aliasKey = KNOWN_VARIETY_ALIASES[plantKey];
    const canonicalPlantName =
      validPlantMap.get(plantKey) ??
      (aliasKey ? validPlantMap.get(aliasKey) : undefined);
    if (!canonicalPlantName) return;
    const normalizedList = normalizeList(list);
    if (normalizedList.length === 0) return;
    result[canonicalPlantName] = normalizedList;
  });

  return result;
};

const createVarietyLookup = (
  varieties: Record<string, string[]> | undefined | null
): Record<string, string[]> => {
  const lookup: Record<string, string[]> = {};
  if (!varieties || typeof varieties !== "object") return lookup;

  Object.entries(varieties).forEach(([plantName, list]) => {
    const key = toLookupKey(plantName);
    const normalized = normalizeList(list);
    if (!key || normalized.length === 0) return;
    lookup[key] = normalized;
  });

  return lookup;
};

const getKnownVarietiesForPlant = (
  plantName: string,
  defaultVarietyLookup: Record<string, string[]>
): string[] => {
  const plantKey = toLookupKey(plantName);
  const aliasKey = KNOWN_VARIETY_ALIASES[plantKey];
  const defaults = defaultVarietyLookup[plantKey] ??
    (aliasKey ? defaultVarietyLookup[aliasKey] : undefined);
  return defaults ? [...defaults] : [];
};

const normalizeCategory = (
  category: PlantCatalogCategory | undefined | null,
  defaultPlants: string[],
  defaultVarieties: Record<string, string[]>,
  requiredPlants: string[],
  hasCategory: boolean
): PlantCatalogCategory => {
  const plants = normalizeList(category?.plants);
  const resolvedPlants = hasCategory ? [...plants] : [...defaultPlants];
  requiredPlants.forEach((plantName) => {
    if (!hasEquivalentPlant(resolvedPlants, plantName)) {
      resolvedPlants.push(plantName);
    }
  });
  const normalizedIncomingVarieties = normalizeVarieties(
    category?.varieties,
    resolvedPlants
  );
  const incomingVarietySet = new Set(
    Object.keys(normalizedIncomingVarieties).map((plant) => toLookupKey(plant))
  );
  const defaultVarietyLookup = createVarietyLookup(defaultVarieties);
  const mergedVarieties: Record<string, string[]> = {
    ...normalizedIncomingVarieties,
  };

  resolvedPlants.forEach((plantName) => {
    if (incomingVarietySet.has(toLookupKey(plantName))) return;
    const defaults = getKnownVarietiesForPlant(plantName, defaultVarietyLookup);
    if (defaults.length > 0) {
      mergedVarieties[plantName] = defaults;
    }
  });

  return {
    plants: resolvedPlants,
    varieties: mergedVarieties,
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
      defaultCategory.varieties,
      REQUIRED_LOCAL_PLANTS[type] ?? [],
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
