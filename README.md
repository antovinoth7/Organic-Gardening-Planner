# Organic Gardening Planner

Personal gardening planner built with Expo React Native and Firebase. It tracks plants, recurring care tasks, harvests, and journal entries while keeping image storage off the cloud.

## Design Philosophy
- Firestore stores text data and image filenames only.
- Plant and journal photos stay on the device.
- Reads are offline-friendly through AsyncStorage caching.
- Image backups are user-controlled ZIP exports.
- The care model is tailored to Kanyakumari / South Tamil Nadu growing conditions.

## Current Feature Set
- Email/password authentication with persistent login.
- Plant tracking with local photos, care metadata, health status, and archive/restore support.
- Recurring care plan with watering, fertilising, pruning, repotting, spraying, mulching, and harvest tasks.
- Today dashboard with task completion, snooze/skip flows, and garden health alerts.
- Calendar screen with week/month views, search, grouping, and manual task creation.
- Journal with plant-linked entries and multi-photo support.
- Manage garden locations from the More tab.
- Manage plant catalog, varieties, and plant care profiles from the More tab.
- Images-only ZIP backup/import in Settings.
- Theme mode support for system, light, and dark.
- Local cache clearing from Settings without deleting Firebase data.

## Architecture
- Client: Expo React Native app with auth-gated tab + stack navigation.
- Cloud: Firebase Auth + Firestore.
- Cache: AsyncStorage via `src/lib/storage.ts`.
- Error reporting: optional Sentry integration.

Image storage by platform:
- Android dev/prod builds: `expo-media-library` album `Pictures/GardenPlanner`.
- Android in Expo Go: fallback to `FileSystem.documentDirectory/garden_images/`.
- iOS: `FileSystem.documentDirectory/garden_images/`.
- Web: blob URLs.

Notes:
- Firestore is initialized with `memoryLocalCache()`.
- Firebase Storage is intentionally not used.
- Android image migration to MediaLibrary runs automatically after login when applicable.

See `ARCHITECTURE.md` for a deeper breakdown.

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
- Android emulator / device, iOS simulator / device, or web browser

For Android photo persistence across app reinstalls, use a development build or production build. Expo Go falls back to app-local file storage.

## Setup
1. Install dependencies
   ```bash
   npm install
   ```

2. Configure Firebase
   - Create a Firebase project.
   - Enable Email/Password authentication.
   - Enable Firestore.
   - Do not add Firebase Storage.
   - See `FIREBASE_SETUP.md` for the full setup guide.

3. Create `.env` in the repo root
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

4. Run the app
   ```bash
   npm start
   npm run android
   npm run ios
   npm run web
   ```

## Backups
- The app currently supports images-only ZIP backup export/import in Settings.
- Importing images updates local image mappings without changing Firestore text data.
- Data-only and full data-plus-images backup flows are not currently part of the app.

See `BACKUP_GUIDE.md` for operational details.

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
- AsyncStorage caches for plants, tasks, logs, journal, locations, plant catalog, and care profiles.
- Device-local image files or MediaLibrary assets, depending on platform.

## Offline Behavior
- Reads fetch from Firestore and fall back to AsyncStorage on failure.
- Writes target Firestore first and update local cache on success.
- Clearing cache from Settings only removes local cached data.
- If the device is offline, create/update operations may need to be retried later.

## Domain Notes
- Seasonal logic follows a Kanyakumari four-season model:
  - `summer`
  - `sw_monsoon`
  - `ne_monsoon`
  - `cool_dry`
- Water scheduling, reminders, harvest estimates, and coconut care include Tamil Nadu-specific logic.

## Current App Navigation
- `Home`: today summary and urgent care view.
- `Plants`: active plants, archived plants, plant detail, and plant form.
- `Care Plan`: task calendar and task creation.
- `Journal`: journal list and journal form.
- `More`: locations, plant catalog, settings, and sign-out.

## Troubleshooting
- Images missing on Android: confirm the app has photo/media permissions and, if testing with Expo Go, remember it uses the fallback file storage path.
- Auth errors: verify the Email/Password provider is enabled and the `EXPO_PUBLIC_FIREBASE_*` values are correct.
- Backup import errors: use an images-only ZIP created by this app.
- Cache issues: clear local cache from Settings and reload the app.

## Build for Production
```bash
eas build --platform android
eas build --platform ios
```

## License
0BSD

## Contributing
Personal project, but feel free to fork and adapt.
