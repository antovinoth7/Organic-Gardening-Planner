# Architecture Overview

## Goals and Constraints
- Keep Firebase usage inside the free tier by storing structured text data and image filenames only.
- Keep all plant and journal images local to the device.
- Support offline-friendly reads through AsyncStorage-backed caches.
- Use user-controlled image ZIP backups instead of cloud media storage.
- Preserve Kanyakumari / South Tamil Nadu-specific gardening logic in scheduling and care guidance.

## High-Level Architecture
```text
User
  |
  v
Expo React Native app
  |-- ErrorBoundary
  |-- SafeAreaProvider
  |-- ThemeProvider
  |
  |-- Auth-gated navigation
  |    |-- Home
  |    |-- Plants stack
  |    |-- Care Plan
  |    |-- Journal stack
  |    |-- More stack
  |
  |-- Screens + Components
  |-- Services
  |-- Lib / Utils
  |
  |-- AsyncStorage cache
  |-- Local images / MediaLibrary
  |
  +-- Firebase Auth
  +-- Firestore
  +-- Sentry (optional)
```

## Runtime Structure
- App entry: `App.tsx`
- Providers:
  - `ErrorBoundary`
  - `SafeAreaProvider`
  - `ThemeProvider`
- Main tabs:
  - `Home`
  - `Plants`
  - `Care Plan`
  - `Journal`
  - `More`
- Nested stacks:
  - Plants: list, archived plants, plant detail, plant form
  - Journal: list, form
  - More: manage locations, manage plant catalog, settings

Authentication gates the app at the root navigator. Unauthenticated users see `AuthScreen`; authenticated users see the tabbed application.

## Application Layers
- UI: `src/screens/*` and `src/components/*`
- Theme: `src/theme/*`
- Services: `src/services/*`
- Firebase and storage adapters: `src/lib/*`
- Cross-cutting utilities: `src/utils/*`
- Data contracts: `src/types/database.types.ts`

## Firestore Model
Primary collections:
- `plants`
- `task_templates`
- `task_logs`
- `journal_entries`

User settings:
- `user_settings/{uid}`

Current `user_settings` payloads:
- `locations`
- `plantCatalog`
- `plantCareProfiles`

Collection responsibilities:
- `plants`: plant metadata, care frequencies, health fields, archive flags, coconut-specific metrics, and `photo_filename`
- `task_templates`: recurring or one-time care tasks with `next_due_at`
- `task_logs`: completion history written when tasks are marked done
- `journal_entries`: plant-linked notes, harvest notes, and `photo_filenames`
- `user_settings`: per-user configurable reference data used by forms and management screens

All Firestore reads and writes are scoped to the authenticated user through `user_id` checks or the user's own settings document.

## Local Storage Model
AsyncStorage cache keys in `src/lib/storage.ts`:
- `@garden_plants`
- `@garden_tasks`
- `@garden_task_logs`
- `@garden_journal`
- `@garden_last_sync`
- `@garden_offline_queue`
- `@garden_locations`
- `@garden_plant_catalog`
- `@garden_plant_care_profiles`

Storage access goes through:
- `src/lib/storage.ts`
- `src/utils/safeStorage.ts`

Theme mode is stored separately by `src/theme/index.tsx`.

## Image Storage Model
Images are never uploaded to Firebase Storage or Firestore.

Stored in Firestore:
- Plant images: `photo_filename`
- Journal images: `photo_filenames`

Derived locally for UI:
- Plant images: `photo_url`
- Journal images: `photo_urls`

Platform behavior:
- Android dev/prod builds: save to `expo-media-library` album `Pictures/GardenPlanner`
- Android Expo Go: fall back to `FileSystem.documentDirectory/garden_images/`
- iOS: save to `FileSystem.documentDirectory/garden_images/`
- Web: keep blob URLs

Important behavior:
- `saveImageLocallyWithFilename()` persists the image and returns the stable filename
- `resolveLocalImageUri()` and `resolveLocalImageUris()` map stored filenames back to usable local URIs
- `migrateImagesToMediaLibrary()` moves older Android file-based images into MediaLibrary when possible
- Android migration runs after successful login in `App.tsx`
- Android migration also runs after image import in `src/services/backup.ts`

## Core Data Flows
### 1. App startup
```text
App.tsx
  -> init Sentry if configured
  -> mount providers
  -> subscribe to Firebase Auth state
  -> if authenticated, show app tabs
  -> on Android, attempt image migration after auth
```

### 2. Load plants
```text
Plants screen / dependent screens
  -> src/services/plants.ts
  -> refresh auth token
  -> query Firestore with pagination
  -> convert Firestore timestamps to ISO strings
  -> resolve local image URIs from stored filenames
  -> cache first-page results in AsyncStorage
  -> fall back to cached plants on read failure
```

### 3. Save or update a plant with a photo
```text
Plant form
  -> src/lib/imageStorage.ts saves image locally
  -> filename is stored in plant.photo_filename
  -> src/services/plants.ts writes plant metadata to Firestore
  -> cached plant list is updated locally
  -> src/services/tasks.ts syncs care tasks from plant frequencies
```

### 4. Complete a task
```text
Today or Care Plan screen
  -> src/services/tasks.ts markTaskDone()
  -> write task log to task_logs
  -> update task_templates.next_due_at or disable one-time task
  -> update plant last-care date field when applicable
  -> update local task and plant caches
```

### 5. Manage reference data
```text
Manage Locations / Manage Plant Catalog screens
  -> src/services/locations.ts
  -> src/services/plantCatalog.ts
  -> src/services/plantCareProfiles.ts
  -> read/write user_settings/{uid}
  -> cache normalized values locally
```

### 6. Images-only backup and restore
```text
Settings screen
  -> src/services/backup.ts
  -> collect image filenames from plants and journal entries
  -> zip only images + manifest
  -> import ZIP and restore local files
  -> remap cached image URIs by filename
  -> text data in Firestore is not modified
```

## Service Layer Responsibilities
- `src/services/plants.ts`
  - plant CRUD
  - pagination
  - archive / restore
  - local image resolution
  - cascade deletion into plant-linked tasks and logs

- `src/services/tasks.ts`
  - task template reads and writes
  - today task filtering
  - task log reads
  - task completion flow
  - auto-sync of watering, fertilising, pruning, and coconut harvest tasks
  - season-aware watering adjustments

- `src/services/journal.ts`
  - journal CRUD
  - multi-photo support
  - backward compatibility for legacy single-photo entries

- `src/services/backup.ts`
  - images-only ZIP export/import
  - image storage size calculation
  - import-time URI remapping

- `src/services/locations.ts`
  - normalized parent/child location configuration in `user_settings`

- `src/services/plantCatalog.ts`
  - editable plant catalog and variety lists
  - alias handling and normalization

- `src/services/plantCareProfiles.ts`
  - editable care profile overrides stored by plant type and plant name

## Domain Logic
The app intentionally includes regional gardening behavior for Kanyakumari / Tamil Nadu.

Key domain modules:
- `src/utils/seasonHelpers.ts`
  - four-season local climate model
  - watering interval multipliers by season and space type

- `src/utils/plantHelpers.ts`
  - harvest date estimation
  - companion planting suggestions
  - pest and disease guidance
  - coconut age-based care scheduling
  - coconut nutrient deficiency guidance

- `src/utils/plantCareDefaults.ts`
  - baseline care defaults used by the plant catalog and form flows

This domain logic is part of the app design, not incidental helper code.

## Offline and Resilience Behavior
- Services generally read from Firestore first and cache normalized results locally.
- On read failure, services fall back to AsyncStorage where possible.
- Writes update Firestore first and then refresh or mutate local cache.
- `withTimeoutAndRetry()` in `src/utils/firestoreTimeout.ts` is used for many Firestore operations to avoid hanging requests.
- `refreshAuthToken()` in `src/lib/firebase.ts` is used before important reads to reduce token-expiry issues.
- `clearAllData()` clears app-managed local caches only.

## Observability and Error Handling
- Sentry is initialized in `App.tsx` if a DSN is configured.
- `App.tsx` also installs:
  - a global JS error handler
  - unhandled promise rejection tracking
- `ErrorBoundary` catches render-time failures.
- `src/utils/errorLogging.ts` provides structured logging helpers.
- `src/utils/errorTracker.ts` persists recent errors locally and forwards them to Sentry when available.

## Firebase Lifecycle Notes
- Firestore uses `memoryLocalCache()` from `src/lib/firebase.ts`.
- Do not call `terminate()` on the Firestore client.
- Auth persistence is configured with React Native AsyncStorage.
- App lifecycle hooks in `src/utils/appLifecycle.ts` support cleanup behavior, but Firestore reconnection is managed by the SDK.

## Security and Privacy
- Firebase Auth uses email/password sign-in.
- Firestore security rules should enforce per-user access.
- Images remain local to the device and are never uploaded.
- Backups are explicitly user-triggered and shared or stored by the user.

## Configuration
Environment variables:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`
- `EXPO_PUBLIC_SENTRY_DSN`
- `EXPO_PUBLIC_SENTRY_CAPTURE_CONSOLE`

Expo config:
- `app.config.js` passes selected environment values into the Expo app config.

## Key Files
- `App.tsx`: app bootstrap, navigation, auth gate, Sentry, Android migration trigger
- `src/lib/firebase.ts`: Firebase Auth + Firestore initialization and token refresh
- `src/lib/imageStorage.ts`: platform-specific image persistence and resolution
- `src/lib/storage.ts`: app cache key definitions and storage helpers
- `src/services/plants.ts`: plant data access and image-aware mapping
- `src/services/tasks.ts`: care plan logic and task completion behavior
- `src/services/journal.ts`: journal entry data access
- `src/services/backup.ts`: images-only backup/import flows
- `src/services/locations.ts`: location settings
- `src/services/plantCatalog.ts`: plant catalog settings
- `src/services/plantCareProfiles.ts`: care profile settings
- `src/utils/firestoreTimeout.ts`: timeout and retry wrapper
- `src/utils/errorLogging.ts`: structured error logging
- `src/utils/errorTracker.ts`: persisted local error tracking
- `src/theme/*`: theme provider and tokens
