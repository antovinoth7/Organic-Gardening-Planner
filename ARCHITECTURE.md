# Architecture Overview

## Goals and constraints
- Free-forever: store only text/metadata in Firestore; keep all images local.
- Offline-friendly: reads fall back to AsyncStorage when Firestore is unavailable.
- Manual backups: user exports JSON or ZIP to their own storage.
- Portable and low lock-in: backups are plain JSON and standard ZIP files.

## High-level architecture
```text
User
  |
  v
Expo React Native app
  |-- Screens + Components
  |-- Services (plants, tasks, journal, backup)
  |-- Lib/Utils (storage, image, network, errors)
  |
  |-- Local cache: AsyncStorage
  |-- Local images: FileSystem documentDirectory/garden_images/
  |
  +-- Firebase Auth + Firestore (text data only)
  +-- Sentry (optional, if DSN configured)
```

## App layers
- UI: `src/screens/*` and `src/components/*` (tabs + stacks in `App.tsx`).
- Services: CRUD and flows in `src/services/*.ts`.
- Lib: Firebase init, local image storage, local cache in `src/lib/*`.
- Utilities: network state, timeout/retry, logging, ZIP helpers in `src/utils/*`.
- Theme: light/dark/system theme in `src/theme/*`.

## Data model and storage
### Firestore collections (text data only)
- `plants`: plant metadata, including `photo_filename` (stored filename).
- `task_templates`: recurring task schedules and `next_due_at`.
- `task_logs`: completion history.
- `journal_entries`: journal text and `photo_filenames` (stored filenames).

Each document is scoped by `user_id` (auth is required before reading/writing).

### Local device storage
- AsyncStorage cache:
  - `@garden_plants`, `@garden_tasks`, `@garden_task_logs`, `@garden_journal`
  - Accessed via `src/lib/storage.ts` and guarded by `src/utils/safeStorage.ts`.
- Images:
  - Stored in `FileSystem.documentDirectory/garden_images/`.
  - Filenames use prefixes like `plant_` and `journal_`.
  - Firestore stores filenames; AsyncStorage caches filenames and resolved local URIs.
  - On web, image URIs are blob URLs and no local deletion is attempted.

## Core data flows
### 1) Create a plant with a photo
```text
User picks/takes photo
  -> src/lib/imageStorage.ts (saveImageLocallyWithFilename)
  -> Local URI saved under garden_images/
  -> src/services/plants.ts (createPlant)
  -> Firestore stores text fields + photo_filename string
  -> AsyncStorage cache updated
  -> UI renders local image if file exists
```

### 2) Complete a task
```text
User taps "Done"
  -> src/services/tasks.ts (markTaskDone)
  -> task_logs entry created
  -> task_templates.next_due_at updated (or disabled for one-time tasks)
```

### 3) Sync care tasks from plant settings
```text
Plant form save
  -> src/screens/PlantFormScreen.tsx
  -> src/services/tasks.ts (syncCareTasksForPlant)
  -> creates/updates task_templates for watering/fertilising/pruning frequencies
```

### 4) Backup and restore
Data-only JSON:
- `exportBackup()` and `importBackup()` in `src/services/backup.ts`.
- Includes plants, tasks, task logs, journal entries (text only).

Complete ZIP (data + images):
- `exportBackupWithImages()` and `importBackupWithImages()`.
- ZIP contains `backup.json` plus `images/` folder.
- Uses `src/utils/zipHelper.ts` with `fflate`.

Images-only ZIP:
- `exportImagesOnly()` and `importImagesOnly()`.
- Used in Settings UI; restores photos and updates URIs by filename match.

Note: Settings UI exposes data-only, complete (data + images), and images-only
backup flows.

## Offline behavior
- Read path: services fetch from Firestore and cache locally; on failure they
  fall back to AsyncStorage.
- Write path: create/update/delete write to Firestore and then update cache;
  offline writes may fail if the SDK cannot queue them.
- Network state: `src/utils/networkState.ts` uses NetInfo and
  `src/utils/firestoreTimeout.ts` wraps Firestore calls with timeout/retry.

## Observability and reliability
- Sentry is initialized in `App.tsx` when a DSN is configured.
- `ErrorBoundary` catches render errors and forwards to `errorTracker`.
- `errorTracker` stores recent logs in AsyncStorage and forwards to Sentry.
- `errorLogging` provides structured error logs for network/auth/storage flows.

## Security and privacy
- Firebase Auth (email/password) gates all data access.
- Firestore rules should enforce per-user access via `user_id`.
- Images stay on device and are never uploaded to cloud storage.
- Backups are user-initiated and stored wherever the user chooses.

## Configuration
- Firebase config via `EXPO_PUBLIC_FIREBASE_*` env vars (see `src/lib/firebase.ts`).
- Sentry config via `EXPO_PUBLIC_SENTRY_DSN`,
  `EXPO_PUBLIC_SENTRY_TEST`, and `EXPO_PUBLIC_SENTRY_CAPTURE_CONSOLE`.
- `app.config.js` passes env values to Expo config at build time.

## Key files
- `App.tsx`: app entry, navigation, Sentry, ErrorBoundary.
- `src/lib/firebase.ts`: Firebase init (Auth + Firestore).
- `src/lib/imageStorage.ts`: local image store and helpers.
- `src/lib/storage.ts`: AsyncStorage cache wrapper.
- `src/services/*.ts`: data services for plants, tasks, journal, backup.
- `src/utils/zipHelper.ts`: ZIP backup and restore.
- `src/utils/firestoreTimeout.ts`: timeout and retry for Firestore calls.
- `src/utils/errorTracker.ts`: error capture and persistence.
- `src/theme/*`: theme tokens and provider.
