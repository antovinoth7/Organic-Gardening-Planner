import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, refreshAuthToken } from "../lib/firebase";
import { getData, setData, KEYS } from "../lib/storage";
import { SeasonRegionProfile, UserPreferences } from "../types/database.types";
import { logError } from "../utils/errorLogging";
import { withTimeoutAndRetry } from "../utils/firestoreTimeout";

const SETTINGS_COLLECTION = "user_settings";
const PREFERENCES_FIELD = "preferences";

const DEFAULT_USER_PREFERENCES: UserPreferences = {
  seasonRegionProfile: "tamil_nadu",
};

const LEGACY_FALLBACK_PREFERENCES: UserPreferences = {
  seasonRegionProfile: "legacy_south_asia",
};

const isValidRegionProfile = (
  value: unknown
): value is SeasonRegionProfile =>
  value === "tamil_nadu" || value === "legacy_south_asia";

const normalizePreferences = (
  preferences?: Partial<UserPreferences> | null,
  fallback: UserPreferences = DEFAULT_USER_PREFERENCES
): UserPreferences => {
  if (!preferences || typeof preferences !== "object") {
    return fallback;
  }

  if (isValidRegionProfile(preferences.seasonRegionProfile)) {
    return { seasonRegionProfile: preferences.seasonRegionProfile };
  }

  return fallback;
};

const getCachedPreferences = async (): Promise<UserPreferences | null> => {
  const stored = await getData<UserPreferences>(KEYS.USER_PREFERENCES);
  if (stored.length > 0 && stored[0]) {
    return normalizePreferences(stored[0], DEFAULT_USER_PREFERENCES);
  }
  return null;
};

export const getUserPreferences = async (): Promise<UserPreferences> => {
  const cached = await getCachedPreferences();

  const user = auth.currentUser;
  if (!user) {
    return cached ?? DEFAULT_USER_PREFERENCES;
  }

  await refreshAuthToken();

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    const snapshot = await withTimeoutAndRetry(() => getDoc(docRef), {
      timeoutMs: 10000,
      maxRetries: 2,
    });

    if (!snapshot.exists()) {
      const resolved = cached ?? DEFAULT_USER_PREFERENCES;
      await withTimeoutAndRetry(
        () =>
          setDoc(
            docRef,
            { [PREFERENCES_FIELD]: resolved, updated_at: serverTimestamp() },
            { merge: true }
          ),
        { timeoutMs: 10000, maxRetries: 1, throwOnTimeout: false }
      );
      await setData(KEYS.USER_PREFERENCES, [resolved]);
      return resolved;
    }

    const data = snapshot.data() as Record<string, unknown>;
    const rawPreferences =
      (data[PREFERENCES_FIELD] as Partial<UserPreferences> | undefined) ??
      (data as Partial<UserPreferences>);

    const fallback = cached ?? LEGACY_FALLBACK_PREFERENCES;
    const resolved = normalizePreferences(rawPreferences, fallback);

    await setData(KEYS.USER_PREFERENCES, [resolved]);
    return resolved;
  } catch (error) {
    logError("network", "Failed to fetch user preferences", error as Error, {
      userId: user.uid,
    });
    return cached ?? LEGACY_FALLBACK_PREFERENCES;
  }
};

export const saveUserPreferences = async (
  preferences: UserPreferences
): Promise<UserPreferences> => {
  const normalized = normalizePreferences(preferences, DEFAULT_USER_PREFERENCES);
  await setData(KEYS.USER_PREFERENCES, [normalized]);

  const user = auth.currentUser;
  if (!user) return normalized;

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, user.uid);
    await withTimeoutAndRetry(
      () =>
        setDoc(
          docRef,
          { [PREFERENCES_FIELD]: normalized, updated_at: serverTimestamp() },
          { merge: true }
        ),
      { timeoutMs: 10000, maxRetries: 2, throwOnTimeout: false }
    );
  } catch (error) {
    logError("network", "Failed to save user preferences", error as Error, {
      userId: user.uid,
    });
  }

  return normalized;
};
