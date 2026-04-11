/**
 * In-memory data freshness cache layer.
 *
 * Sits between screens and Firestore service calls.  When data is still
 * "fresh" (fetched less than `STALE_MS` ago), the cached result is
 * returned synchronously—avoiding redundant Firestore reads on every
 * tab switch.  Mutations call `invalidate()` so the next read goes to
 * the network.
 *
 * This does NOT replace AsyncStorage caching (offline fallback).  It
 * is a short-lived, in-memory-only layer to eliminate the "full reload
 * on every focus" bottleneck.
 */

const STALE_MS = 30_000; // 30 seconds

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/* ── public helpers ─────────────────────────────────────── */

/**
 * Return cached data if it was fetched less than `STALE_MS` ago.
 * Returns `null` when stale or absent — caller should fetch fresh data.
 */
export function getCached<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > STALE_MS) return null;
  return entry.data;
}

/** Store freshly-fetched data. */
export function setCached<T>(key: string, data: T): void {
  store.set(key, { data, fetchedAt: Date.now() });
}

/** Mark one or more keys as stale so the next read fetches fresh data. */
export function invalidate(...keys: string[]): void {
  for (const key of keys) {
    store.delete(key);
  }
}

/** Mark everything stale (e.g. on sign-out). */
export function invalidateAll(): void {
  store.clear();
  pendingRequests.clear();
}

/* ── request deduplication ──────────────────────────────── */

const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Deduplicate concurrent service calls for the same cache key.
 *
 * If a request for `key` is already in-flight, subsequent callers
 * receive the same promise instead of firing a duplicate Firestore
 * read.  The result is stored via `setCached()` on success.
 */
export function dedup<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = pendingRequests.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = fetcher()
    .then((result) => {
      setCached(key, result);
      return result;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, promise);
  return promise;
}

/* ── well-known cache keys ──────────────────────────────── */

export const CACHE_KEYS = {
  ALL_PLANTS: "allPlants",
  TODAY_TASKS: "todayTasks",
  TASK_TEMPLATES: "taskTemplates",
  TODAY_TASK_LOGS: "todayTaskLogs",
  JOURNAL_ENTRIES: "journalEntries",
  JOURNAL_METADATA: "journalMetadata",
} as const;
