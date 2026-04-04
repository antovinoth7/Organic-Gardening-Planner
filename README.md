# Organic Gardening Planner

Personal gardening planner built with Expo React Native and Firebase.
It tracks plants, recurring care tasks, harvests, and journal entries
while keeping image storage off the cloud.

## Design Philosophy

- Firestore stores text data and image filenames only.
- Plant and journal photos stay on the device.
- Reads are offline-friendly through AsyncStorage caching.
- Image backups are user-controlled ZIP exports.
- The care model is tailored to Kanyakumari / South Tamil Nadu
  growing conditions.

## Current Feature Set

- Email/password authentication with persistent login.
- Plant tracking with local photos, care metadata, health status,
  and archive/restore support.
- Recurring care plan with watering, fertilising, pruning,
  repotting, spraying, mulching, and harvest tasks.
- Today dashboard with task completion, snooze/skip flows,
  and garden health alerts.
- Calendar screen with week/month views, search, grouping,
  and manual task creation.
- Journal with plant-linked entries and multi-photo support.
- Manage garden locations from the More tab.
- Manage plant catalog, varieties, and plant care profiles
  from the More tab.
- Images-only ZIP backup/import in Settings.
- Theme mode support for system, light, and dark.
- Local cache clearing from Settings without deleting Firebase data.

## Architecture

- Client: Expo React Native app with auth-gated tab + stack
  navigation.
- Cloud: Firebase Auth + Firestore.
- Cache: AsyncStorage via `src/lib/storage.ts`.
- Error reporting: optional Sentry integration.
- Firestore stores structured text data and image filenames only.

Image storage by platform:

- Android dev/prod builds: `expo-media-library` album
  `Pictures/GardenPlanner`.
- Android in Expo Go: fallback to
  `FileSystem.documentDirectory/garden_images/`.
- iOS: `FileSystem.documentDirectory/garden_images/`.
- Web: blob URLs.

Notes:

- Firestore is initialized with `memoryLocalCache()`.
- Firebase Storage is intentionally not used.
- Android image migration to MediaLibrary runs automatically
  after login when applicable.

## Tech Stack

- Expo SDK 54
- React 19
- React Native 0.81
- TypeScript
- Firebase Auth + Firestore
- AsyncStorage
- expo-image-picker
- expo-file-system
- expo-media-library
- React Navigation
- fflate
- Sentry

## Prerequisites

- Node.js 18+
- npm
- Firebase project on the Spark plan
- Android emulator / device, iOS simulator / device,
  or web browser

For Android photo persistence across app reinstalls, use a
development build or production build. Expo Go falls back to
app-local file storage.

## Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Create and configure Firebase
   - Create a Firebase project in the Firebase Console.
   - Keep the project on the Spark free plan.
   - Register a Web app for this project.
   - Do not enable Firebase Hosting.
   - Enable Email/Password authentication.
   - Create a Firestore database in Production mode.
   - Do not configure Firebase Storage for this app.

3. Create `.env` in the repo root using the Firebase Web app
   config

   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
   EXPO_PUBLIC_SENTRY_CAPTURE_CONSOLE=0
   ```

4. Apply Firestore security rules

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       function signedIn() {
         return request.auth != null;
       }

       function ownsDoc() {
         return signedIn()
           && resource.data.user_id == request.auth.uid;
       }

       function ownsNewDoc() {
         return signedIn()
           && request.resource.data.user_id == request.auth.uid;
       }

       match /plants/{plantId} {
         allow create: if ownsNewDoc();
         allow read, update, delete: if ownsDoc();
       }

       match /task_templates/{taskId} {
         allow create: if ownsNewDoc();
         allow read, update, delete: if ownsDoc();
       }

       match /task_logs/{logId} {
         allow create: if ownsNewDoc();
         allow read, update, delete: if ownsDoc();
       }

       match /journal_entries/{entryId} {
         allow create: if ownsNewDoc();
         allow read, update, delete: if ownsDoc();
       }

       match /user_settings/{userId} {
         allow read, write: if signedIn()
           && request.auth.uid == userId;
       }
     }
   }
   ```

5. Restart the dev server after changing environment values

   ```bash
   npx expo start --clear
   ```

6. Run the app

   ```bash
   npm start
   npm run android
   npm run ios
   npm run web
   ```

## Backups

- The app currently supports images-only ZIP backup
  export/import in Settings.
- Importing images updates local image mappings without
  changing Firestore text data.
- Data-only and full data-plus-images backup flows are not
  currently part of the app.

### What the images-only backup contains

- Plant and journal image files currently referenced by the app.
- A small manifest with export metadata.

### What it does not contain

- Firestore text data such as plants, tasks, task logs,
  journal content, locations, or catalog settings.
- Authentication state or credentials.

### Export images

1. Open the app and go to `More -> Settings`.
2. In the `Images-Only Backup` section, tap
   `Export Images Only (ZIP)`.
3. Save the ZIP using the platform share sheet.

### Import images

1. Open the app and go to `More -> Settings`.
2. In the `Images-Only Backup` section, tap
   `Import Images Only`.
3. Select a ZIP previously exported by the app.
4. The app restores local image files and remaps cached image
   URIs by filename.

### Restoring on a new device

1. Install the app and sign in with the same Firebase account.
2. Let Firestore sync the text data.
3. Import the images-only ZIP from Settings to restore local
   photos.

### Backup notes

- On Android, best long-term image persistence comes from a
  dev/prod build using MediaLibrary.
- In Expo Go on Android, images use the fallback app-local
  file path instead.
- Do not rename files inside the ZIP if you expect filename
  matching to work during import.

## Project Structure

```text
src/
  components/    shared UI components
  lib/           firebase init, image storage, AsyncStorage wrapper
  screens/       app screens
  services/      plants, tasks, journal, backup, locations, plant catalog
  theme/         light/dark theme tokens and provider
  types/         TypeScript data models
  utils/         network, zip, logging, lifecycle, domain helpers
```

## Data Model

Firestore collections:

- `plants`
- `task_templates`
- `task_logs`
- `journal_entries`
- `user_settings/{uid}` for:
  - `locations`
  - `plantCatalog`
  - `plantCareProfiles`

Local storage:

- AsyncStorage caches for plants, tasks, logs, journal,
  locations, plant catalog, and care profiles.
- Device-local image files or MediaLibrary assets,
  depending on platform.

Stored image fields:

- Plants store `photo_filename` in Firestore and derive
  `photo_url` locally for UI.
- Journal entries store `photo_filenames` in Firestore and
  derive `photo_urls` locally for UI.

## Offline Behavior

- Reads fetch from Firestore and fall back to AsyncStorage
  on failure.
- Writes target Firestore first and update local cache on
  success.
- Clearing cache from Settings only removes local cached data.
- If the device is offline, create/update operations may need
  to be retried later.

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
  - Journal: list and form
  - More: manage locations, manage plant catalog, settings

Unauthenticated users see `AuthScreen`. Authenticated users
see the tabbed application.

## Domain Notes

- Seasonal logic follows a Kanyakumari four-season model:
  - `summer`
  - `sw_monsoon`
  - `ne_monsoon`
  - `cool_dry`
- Water scheduling, reminders, harvest estimates, and coconut
  care include Tamil Nadu-specific logic.

Key domain modules:

- `src/utils/seasonHelpers.ts`
- `src/utils/plantHelpers.ts`
- `src/utils/plantCareDefaults.ts`

## Current App Navigation

- `Home`: today summary and urgent care view.
- `Plants`: active plants, archived plants, plant detail,
  and plant form.
- `Care Plan`: task calendar and task creation.
- `Journal`: journal list and journal form.
- `More`: locations, plant catalog, settings, and sign-out.

## Core Data Flows

### App startup

- `App.tsx` initializes Sentry when configured.
- Auth state controls whether the user sees `AuthScreen`
  or the app tabs.
- Android image migration runs after successful
  authentication when supported.

### Plant reads and writes

- `src/services/plants.ts` handles paginated Firestore reads.
- Firestore timestamps are normalized to ISO strings.
- Local image URIs are resolved from stored filenames before
  UI render.
- Active plants are cached in AsyncStorage and reads fall back
  to cache on failure.

### Task scheduling and completion

- `src/services/tasks.ts` creates and updates recurring
  care tasks.
- `markTaskDone()` writes to `task_logs`, updates
  `task_templates.next_due_at`, and updates plant
  last-care fields.
- `syncCareTasksForPlant()` keeps plant care frequencies in
  sync with task templates, including coconut harvest
  scheduling.

### Settings-backed reference data

- `src/services/locations.ts`,
  `src/services/plantCatalog.ts`, and
  `src/services/plantCareProfiles.ts` read and write
  `user_settings/{uid}`.
- These settings are normalized, cached locally, and used
  by plant forms and management screens.

### Images-only backup flow

- `src/services/backup.ts` exports image ZIPs by collecting
  referenced filenames from plants and journal entries.
- Import restores local files and remaps cached URIs by
  filename without changing Firestore text data.

## Service Responsibilities

- `src/services/plants.ts`: plant CRUD, archive/restore,
  image resolution, and task cascade cleanup.
- `src/services/tasks.ts`: task templates, task logs,
  completion flow, and season-aware care scheduling.
- `src/services/journal.ts`: journal CRUD with multi-photo
  and legacy single-photo compatibility.
- `src/services/backup.ts`: images-only ZIP export/import
  and storage size calculation.
- `src/services/locations.ts`: per-user location settings.
- `src/services/plantCatalog.ts`: editable plant catalog
  and varieties.
- `src/services/plantCareProfiles.ts`: editable care profile
  overrides.

## Reliability and Lifecycle Notes

- Firestore uses `memoryLocalCache()` from
  `src/lib/firebase.ts`.
- Do not call `terminate()` on the Firestore client.
- Auth persistence uses React Native AsyncStorage.
- Sentry, global error handling, and unhandled promise
  rejection tracking are configured in `App.tsx`.
- `clearAllData()` only clears app-managed local cache.

## Key Files

- `App.tsx`
- `src/lib/firebase.ts`
- `src/lib/imageStorage.ts`
- `src/lib/storage.ts`
- `src/services/plants.ts`
- `src/services/tasks.ts`
- `src/services/journal.ts`
- `src/services/backup.ts`
- `src/services/locations.ts`
- `src/services/plantCatalog.ts`
- `src/services/plantCareProfiles.ts`
- `src/types/database.types.ts`

## Troubleshooting

- `auth/invalid-api-key`: verify your
  `EXPO_PUBLIC_FIREBASE_*` values and restart Metro with
  `npx expo start --clear`.
- Missing or insufficient permissions: confirm the Firestore
  rules above are published and that you are signed in.
- Images missing on Android: confirm the app has photo/media
  permissions and, if testing with Expo Go, remember it uses
  the fallback file storage path.
- Auth errors: verify the Email/Password provider is enabled
  and the `EXPO_PUBLIC_FIREBASE_*` values are correct.
- Backup import errors: use an images-only ZIP created by
  this app.
- Images still missing after import: make sure the ZIP contains
  the original filenames used by the app.
- Cache issues: clear local cache from Settings and reload
  the app.

## Build for Production

```bash
eas build --platform android
eas build --platform ios
```
