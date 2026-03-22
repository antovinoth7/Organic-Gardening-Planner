# Organic Gardening Planner - Copilot Instructions

Use this file as the working source of guidance for AI contributors. If any markdown docs conflict with the TypeScript code, prefer the live code in `App.tsx`, `src/services/*`, `src/lib/*`, and `src/types/database.types.ts`.

## Current Stack
- Expo SDK 54, React 19, React Native 0.81, TypeScript.
- App entry is `App.tsx`.
- Providers wrap the app in this order: `ErrorBoundary` -> `SafeAreaProvider` -> `ThemeProvider`.
- Navigation is auth-gated with Firebase Auth.
- Main tabs are `Home`, `Plants`, `Care Plan`, `Journal`, and `More`.
- Nested stacks exist for Plants, Journal, and More. Keep existing route names unchanged unless you update all callers.

## Architecture Rules
- Firebase is used for Auth and Firestore only.
- Do not add Firebase Storage. Images are intentionally device-local.
- Firestore is initialized with `memoryLocalCache()` in `src/lib/firebase.ts`.
- `refreshAuthToken()` is exported from `src/lib/firebase.ts` and used by services before important reads.
- Never call `terminate()` on the Firestore instance.
- AsyncStorage is the app-managed cache layer and is accessed through `src/lib/storage.ts`.
- `clearAllData()` should clear only local cached data, not Firestore internals.
- `src/lib/dataCache.ts` is an in-memory freshness cache (30-second TTL) that sits between screens and service calls. It avoids redundant Firestore reads on tab switches. Use `getCached()`/`setCached()` for short-lived reads and `invalidate()`/`invalidateAll()` after mutations. This does not replace AsyncStorage (offline fallback).

## Active Firestore Shape
- `plants`: plant metadata and stored image filename.
- `task_templates`: recurring care schedule records.
- `task_logs`: completion history.
- `journal_entries`: journal text and stored image filenames.
- `user_settings/{uid}`: per-user settings payloads for:
  - `locations`
  - `plantCatalog`
  - `plantCareProfiles`

All app data is scoped by `user_id` or the authenticated user's settings document.

## Image Storage Rules
- Images never go to Firestore or cloud storage.
- Store only filenames in Firestore and backups:
  - Plant photos: `photo_filename`
  - Journal photos: `photo_filenames`
- Treat local URIs as derived values:
  - Plant UI field: `photo_url`
  - Journal UI field: `photo_urls`
- Use `saveImageLocallyWithFilename()` from `src/lib/imageStorage.ts` before saving plant or journal records.
- Use `resolveLocalImageUri()` or `resolveLocalImageUris()` before rendering images.

Platform behavior:
- Android dev builds: prefer `expo-media-library` storage in `Pictures/GardenPlanner`.
- Android Expo Go: fall back to `FileSystem.documentDirectory/garden_images/`.
- iOS: use `FileSystem.documentDirectory/garden_images/`.
- Web: use blob URLs.

Migration behavior:
- `App.tsx` runs `migrateImagesToMediaLibrary()` after authentication on Android.
- `src/services/backup.ts` also runs Android migration after image import.
- Preserve this flow when changing image storage.

## Service Layer Conventions
- Keep Firestore and cache logic inside `src/services/*`.
- Typical service flow is:
  1. Check `auth.currentUser`.
  2. Refresh auth with `refreshAuthToken()` before important reads.
  3. Wrap Firestore operations with `withTimeoutAndRetry()` where practical.
  4. Convert Firestore `Timestamp` values to ISO strings for app models.
  5. Update AsyncStorage caches through `getData()` and `setData()`.
  6. Fall back to cached data for read failures.
- Prefer existing service modules over duplicating Firestore access from screens.

Specific current behavior to preserve:
- `src/services/plants.ts`
  - Uses paginated reads.
  - Soft-deletes plants with `is_deleted` and `deleted_at`.
  - Resolves image filenames to local URIs before returning plants.
  - Cascades plant deletion into tasks via `deleteTasksForPlantIds()`.
- `src/services/tasks.ts`
  - Avoids extra Firestore composite index requirements by filtering and sorting in memory in some queries.
  - `markTaskDone()` writes a task log, updates `next_due_at`, and also updates plant last-care fields.
  - Recurring task due times are normalized to 6:00 PM.
  - `syncCareTasksForPlant()` auto-generates water, fertilise, prune, and coconut harvest (age-derived) tasks from plant settings.
  - The full `TaskType` union is `water | fertilise | prune | repot | spray | mulch | harvest`. Repot, spray, and mulch are user-created; sync does not auto-generate them.
- `src/services/journal.ts`
  - Supports multiple images through `photo_filenames` and `photo_urls`.
  - Still carries the legacy single `photo_url` field for backward compatibility.
  - `getJournalMetadata()` fetches entries without resolving images, used by `CalendarScreen` for lightweight reads.
- `src/services/backup.ts`
  - Supports images-only ZIP export/import.
  - Does not currently support data-only or full data-plus-images backups.

## Domain Logic
- The app is intentionally tailored to Kanyakumari / South Tamil Nadu gardening conditions.
- `src/utils/seasonHelpers.ts` defines a four-season model:
  - `summer`
  - `sw_monsoon`
  - `ne_monsoon`
  - `cool_dry`
- Watering frequencies and reminders are season-aware.
- `src/utils/plantHelpers.ts` contains important domain behavior for:
  - expected harvest dates
  - companion planting
  - pest and disease suggestions
  - coconut age-based care guidance
  - coconut nutrient deficiency guidance
- `src/utils/plantCareDefaults.ts` provides plant care profiles, pruning techniques, and static pruning defaults.
- Preserve this regional logic unless a change is explicitly requested.

## Plant and Settings Data
- Core types live in `src/types/database.types.ts`. Update types first when changing schema.
- `Plant` includes:
  - care frequencies
  - health status
  - growth stage
  - pest and disease history
  - soft-delete fields
  - coconut-specific metrics
  - `care_schedule` metadata
- Plant catalog defaults and aliases live in `src/services/plantCatalog.ts`.
- Care profile overrides live in `src/services/plantCareProfiles.ts`.
- Location defaults and normalization live in `src/services/locations.ts`.
- These settings are cached locally and synced through `user_settings`.

## UI Conventions
- Use `useTheme()` for colors and shared tokens.
- Use `useThemeMode()` for theme mode changes.
- Prefer existing themed styles over new hardcoded colors, unless matching an already hardcoded local accent in that screen.
- Most screens use safe area insets and refresh on focus; preserve those patterns when modifying screens.
- Reuse existing shared components where possible:
  - `PlantCard`
  - `TaskCard`
  - `PhotoSourceModal`
  - `CollapsibleSection`
  - `ErrorBoundary`
  - `FloatingLabelInput`
  - `FloatingTabBar`
  - `ThemedDropdown`

## Reliability and Logging
- Sentry is initialized in `App.tsx` when a DSN is configured.
- Global error and unhandled promise rejection handlers are already wired up in `App.tsx`.
- Use `logError()`, `logAuthError()`, `logStorageError()`, and `setErrorLogUserId()` from `src/utils/errorLogging.ts` instead of ad hoc error handling when touching existing flows.
- `safeStorage` in `src/utils/safeStorage.ts` is the defensive wrapper for AsyncStorage access.
- `src/utils/logger.ts` provides production-safe console logging.

## Backup Guidance
- Current user-facing backup in Settings is images only.
- Do not reintroduce `exportBackup`, `importBackup`, or full ZIP flows unless the feature is intentionally rebuilt across services, UI, and docs.
- When importing images, matching is filename-based and should continue to work for both plants and journal entries.

## Additional Utilities
- `src/utils/appLifecycle.ts` — app lifecycle management, used in `App.tsx`.
- `src/utils/asyncWrapper.ts` — async utility helpers.
- `src/utils/dateHelpers.ts` — date parsing and formatting helpers used across services.
- `src/utils/errorTracker.ts` — error tracking service.
- `src/utils/networkState.ts` — network connectivity state, used by `firestoreTimeout.ts`.
- `src/utils/textSanitizer.ts` — text sanitization for user input.
- `src/utils/zipHelper.ts` — ZIP utilities used by backup.
- `src/utils/firestoreTimeout.ts` — `withTimeoutAndRetry()` wrapper for Firestore operations.

## Development Commands
```bash
npm start
npm run android
npm run ios
npm run web
npm run lint
```

## When You Change Behavior
- Update this file if contributor guidance changes.
- Keep `README.md` as the primary architecture and usage document, and update any remaining docs only if you also bring them in line with the code.
