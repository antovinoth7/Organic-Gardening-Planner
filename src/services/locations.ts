import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, refreshAuthToken } from "../lib/firebase";
import { getData, setData, KEYS } from "../lib/storage";
import { LocationConfig } from "../types/database.types";
import { logError } from "../utils/errorLogging";
import { withTimeoutAndRetry, FIRESTORE_READ_TIMEOUT_MS } from "../utils/firestoreTimeout";

export const DEFAULT_PARENT_LOCATIONS = [
  "Mangarai",
  "Velliavilai Home",
  "Velliavilai Near Pond",
  "Palappallam",
];

export const DEFAULT_PARENT_LOCATION_SHORT_NAMES: Record<string, string> = {
  Mangarai: "MNG",
  "Velliavilai Home": "VVH",
  "Velliavilai Near Pond": "VVP",
  Palappallam: "PPM",
};

/**
 * Auto-generate a short name from a location name.
 * Takes consonants first (up to 3), then fills with remaining chars. Always uppercase, 3 chars.
 */
export const generateShortName = (name: string): string => {
  const cleaned = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
  if (!cleaned) return "LOC";
  const consonants = cleaned.replace(/[AEIOU]/g, "");
  if (consonants.length >= 3) return consonants.slice(0, 3);
  // Fill remainder from the full string
  const chars: string[] = [...consonants];
  for (const ch of cleaned) {
    if (chars.length >= 3) break;
    if (!chars.includes(ch)) chars.push(ch);
  }
  // If still short, just take first 3 chars of the cleaned name
  while (chars.length < 3) {
    chars.push(cleaned[chars.length] ?? "X");
  }
  return chars.join("").slice(0, 3);
};

export const DEFAULT_CHILD_LOCATIONS = [
  "North",
  "South",
  "East",
  "West",
  "North-East",
  "North-West",
  "South-East",
  "South-West",
  "Center",
  "Front",
  "Back",
];

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

const SETTINGS_COLLECTION = "user_settings";
const LOCATIONS_FIELD = "locations";

const normalizeShortNames = (
  shortNames: Record<string, string> | undefined | null,
  parentLocations: string[],
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const loc of parentLocations) {
    const existing = shortNames?.[loc]?.trim().toUpperCase().slice(0, 5);
    if (existing && existing.length >= 2) {
      result[loc] = existing;
    } else {
      result[loc] = DEFAULT_PARENT_LOCATION_SHORT_NAMES[loc] ?? generateShortName(loc);
    }
  }
  return result;
};

const normalizeConfig = (config?: LocationConfig | null): LocationConfig => {
  const normalizedParents = normalizeList(config?.parentLocations);
  const normalizedChildren = normalizeList(config?.childLocations);

  const parents =
    normalizedParents.length > 0
      ? normalizedParents
      : DEFAULT_PARENT_LOCATIONS;
  const children =
    normalizedChildren.length > 0
      ? normalizedChildren
      : DEFAULT_CHILD_LOCATIONS;

  return {
    parentLocations: parents,
    childLocations: children,
    parentLocationShortNames: normalizeShortNames(
      config?.parentLocationShortNames,
      parents,
    ),
  };
};

const getCachedConfig = async (): Promise<LocationConfig> => {
  const stored = await getData<LocationConfig>(KEYS.LOCATIONS);
  if (stored.length > 0 && stored[0]) {
    return normalizeConfig(stored[0]);
  }

  return {
    parentLocations: DEFAULT_PARENT_LOCATIONS,
    childLocations: DEFAULT_CHILD_LOCATIONS,
  };
};

export const getLocationConfig = async (): Promise<LocationConfig> => {
  const cached = await getCachedConfig();
  const user = auth.currentUser;
  if (!user) return cached;

  // Refresh token to prevent expiration issues
  await refreshAuthToken();

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
      timeoutMs: FIRESTORE_READ_TIMEOUT_MS,
    });

    if (!snapshot.exists()) {
      await withTimeoutAndRetry(
        () =>
          setDoc(
            docRef,
            { [LOCATIONS_FIELD]: cached, updated_at: serverTimestamp() },
            { merge: true }
          ),
        { timeoutMs: FIRESTORE_READ_TIMEOUT_MS, maxRetries: 1, throwOnTimeout: false }
      );
      return cached;
    }

    const data = snapshot.data();
    const remoteConfig = normalizeConfig(
      (data as Record<string, any>)[LOCATIONS_FIELD] ?? data
    );
    await setData(KEYS.LOCATIONS, [remoteConfig]);
    return remoteConfig;
  } catch (error) {
    logError("network", "Failed to fetch location config", error as Error, {
      userId: user.uid,
    });
    return cached;
  }
};

export const saveLocationConfig = async (
  config: LocationConfig
): Promise<LocationConfig> => {
  const normalized = normalizeConfig(config);
  await setData(KEYS.LOCATIONS, [normalized]);

  const user = auth.currentUser;
  if (!user) return normalized;

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    await withTimeoutAndRetry(
      () =>
        setDoc(
          docRef,
          { [LOCATIONS_FIELD]: normalized, updated_at: serverTimestamp() },
          { merge: true }
        ),
      { timeoutMs: FIRESTORE_READ_TIMEOUT_MS, throwOnTimeout: false }
    );
  } catch (error) {
    logError("network", "Failed to save location config", error as Error, {
      userId: user.uid,
    });
  }

  return normalized;
};
