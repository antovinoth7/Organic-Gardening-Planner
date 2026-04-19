# Service Layer & Data Architecture

## Firebase Rules

- **Auth**: Email/password only. Token refresh every 50 minutes (tokens expire at 60 min).
- **Firestore**: Text data only (no binary blobs). Images stored in device MediaLibrary.
- **No Firebase Storage**: Keeps the app within the free tier.
- Prefer batch writes for multi-document mutations.

---

## Active Firestore Shape

- `plants`: plant metadata and stored image filename.
- `task_templates`: recurring care schedule records.
- `task_logs`: completion history.
- `journal_entries`: journal text, stored image filenames, optional `tags: string[]`.
- `user_settings/{uid}`: per-user settings payloads for:
  - `locations`
  - `plantCatalog`
  - `plantCareProfiles`
  - `schema_version` (integer, tracks applied migrations)
  - `district`, `zone_id` (agro-climatic zone linkage)

All app data is scoped by `user_id` or the authenticated user's settings document.

---

## Service Layer Conventions

Keep Firestore and cache logic inside `src/services/*`. Typical service flow:

1. Check `auth.currentUser`.
2. Refresh auth with `refreshAuthToken()` before important reads.
3. Wrap Firestore operations with `withTimeoutAndRetry()` where practical.
4. Convert Firestore `Timestamp` values to ISO strings for app models.
5. Update AsyncStorage caches through `getData()` and `setData()`.
6. Fall back to cached data for read failures.

Every public service function must:
1. Check in-memory cache (return if fresh, <30s).
2. Refresh auth token before Firestore calls.
3. Apply 15s timeout + 2 retries for network requests.
4. Update AsyncStorage and in-memory cache on success.
5. Fall back to AsyncStorage on network failure.

Return typed data; never return `any`. Log errors to Sentry with context. Mask PII.

Prefer existing service modules over duplicating Firestore access from screens.

---

## Specific Service Behaviors

### `src/services/plants.ts`
- Uses paginated reads.
- Soft-deletes plants with `is_deleted` and `deleted_at`.
- Resolves image filenames to local URIs before returning plants.
- Cascades plant deletion into tasks via `deleteTasksForPlantIds()`.

### `src/services/tasks.ts`
- Avoids extra Firestore composite index requirements by filtering and sorting in memory in some queries.
- `markTaskDone()` writes a task log, updates `next_due_at`, and also updates plant last-care fields.
- Recurring task due times are normalized to 6:00 PM.
- `syncCareTasksForPlant()` auto-generates water, fertilise, prune, and coconut harvest (age-derived) tasks from plant settings.
- The full `TaskType` union is `water | fertilise | prune | repot | spray | mulch | harvest`. Repot, spray, and mulch are user-created; sync does not auto-generate them.

### `src/services/journal.ts`
- Supports multiple images through `photo_filenames` and `photo_urls`.
- Still carries the legacy single `photo_url` field for backward compatibility.
- `getJournalMetadata()` fetches entries without resolving images, used by `CalendarScreen` for lightweight reads.

### `src/services/backup.ts`
- Supports images-only ZIP export/import.
- Does not currently support data-only or full data-plus-images backups.
- Do not reintroduce `exportBackup`, `importBackup`, or full ZIP flows unless the feature is intentionally rebuilt.
- When importing images, matching is filename-based.

---

## Caching Architecture

- `src/lib/dataCache.ts` is an in-memory freshness cache (30-second TTL) between screens and service calls.
  - Use `getCached()`/`setCached()` for short-lived reads.
  - Use `invalidate()`/`invalidateAll()` after mutations.
  - Does not replace AsyncStorage (offline fallback).
- `src/lib/storage.ts` wraps AsyncStorage access via `getData()` and `setData()`.
- `clearAllData()` should clear only local cached data, not Firestore internals.

---

## Plant and Settings Data

- Core types live in `src/types/database.types.ts`. Update types first when changing schema.
- `Plant` includes: care frequencies, health status, growth stage, pest and disease history, soft-delete fields, coconut-specific metrics, `care_schedule` metadata.
- Plant catalog defaults and aliases live in `src/services/plantCatalog.ts`.
- Care profile overrides live in `src/services/plantCareProfiles.ts`.
- Location defaults and normalization live in `src/services/locations.ts`.
- These settings are cached locally and synced through `user_settings`.

---

## Reliability and Logging

- Sentry is initialized in `App.tsx` when a DSN is configured.
- Global error and unhandled promise rejection handlers are wired up in `App.tsx`.
- Use `logError()`, `logAuthError()`, `logStorageError()`, and `setErrorLogUserId()` from `src/utils/errorLogging.ts`.
- `safeStorage` in `src/utils/safeStorage.ts` is the defensive wrapper for AsyncStorage access.
- `src/utils/logger.ts` provides production-safe console logging.

---

## Additional Utilities

- `src/utils/appLifecycle.ts` — app lifecycle management, used in `App.tsx`.
- `src/utils/dateHelpers.ts` — date parsing, formatting, Firestore timestamp conversion.
- `src/utils/errorTracker.ts` — error tracking service.
- `src/utils/networkState.ts` — network connectivity state, used by `firestoreTimeout.ts`.
- `src/utils/textSanitizer.ts` — text sanitization for user input.
- `src/utils/zipHelper.ts` — ZIP utilities used by backup.
- `src/utils/firestoreTimeout.ts` — `withTimeoutAndRetry()` wrapper for Firestore operations.
