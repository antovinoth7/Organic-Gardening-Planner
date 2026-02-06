import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, refreshAuthToken } from "../lib/firebase";
import { getData, setData, KEYS } from "../lib/storage";
import { LocationConfig } from "../types/database.types";
import { logError } from "../utils/errorLogging";
import { withTimeoutAndRetry } from "../utils/firestoreTimeout";

export const DEFAULT_PARENT_LOCATIONS = [
  "Mangarai",
  "Velliavilai Home",
  "Velliavilai Near Pond",
  "Palappallam",
];

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

const normalizeConfig = (config?: LocationConfig | null): LocationConfig => {
  const normalizedParents = normalizeList(config?.parentLocations);
  const normalizedChildren = normalizeList(config?.childLocations);

  return {
    parentLocations:
      normalizedParents.length > 0
        ? normalizedParents
        : DEFAULT_PARENT_LOCATIONS,
    childLocations:
      normalizedChildren.length > 0
        ? normalizedChildren
        : DEFAULT_CHILD_LOCATIONS,
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
      timeoutMs: 10000,
      maxRetries: 2,
    });

    if (!snapshot.exists()) {
      await withTimeoutAndRetry(
        () =>
          setDoc(
            docRef,
            { [LOCATIONS_FIELD]: cached, updated_at: serverTimestamp() },
            { merge: true }
          ),
        { timeoutMs: 10000, maxRetries: 1, throwOnTimeout: false }
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
      { timeoutMs: 10000, maxRetries: 2, throwOnTimeout: false }
    );
  } catch (error) {
    logError("network", "Failed to save location config", error as Error, {
      userId: user.uid,
    });
  }

  return normalized;
};
