# Organic Gardening Planner

A personal, free-forever gardening planner built with React Native (Expo) and Firebase. Track plants, manage recurring care tasks, keep a garden journal, and back up your data without paying for cloud storage.

## Design philosophy (free forever)
- Firestore stores text data and image filenames only (free tier friendly).
- Photos stay on the device (no cloud image storage costs).
- Offline-friendly reads via AsyncStorage cache.
- Manual image backups to your own storage (ZIP).

## Architecture (short)
- Client: Expo React Native app with tab + stack navigation.
- Local: AsyncStorage cache and FileSystem `garden_images/`.
- Cloud: Firebase Auth + Firestore (text data only).
- Optional: Sentry error reporting when DSN is configured.

See `ARCHITECTURE.md` for the full breakdown.

## Features
- Plant tracking with local photos and rich metadata.
- Recurring care tasks with completion logs and notes.
- Calendar view (week/month) and "Today" tasks.
- Search and filter across plants, journal, and care plan.
- Garden journal with photos and plant links.
- Images-only ZIP backup and restore in Settings.
- Theme toggle (system/light/dark).
- Offline-friendly read path with cached data.

## Tech stack
- React Native + Expo (TypeScript)
- Firebase Auth + Firestore (text data only)
- AsyncStorage for caching
- expo-file-system for local images
- expo-image-picker for photos
- React Navigation
- fflate for ZIP backups
- Sentry for optional error reporting

## Prerequisites
- Node.js 18+
- npm or yarn
- Firebase account (Spark/free plan is enough)
- iOS Simulator (Mac) or Android Emulator or a physical device

## Setup
1. Install dependencies
   ```bash
   npm install
   ```

2. Configure Firebase
   - Create a Firebase project (Spark plan).
   - Enable Authentication (Email/Password).
   - Enable Firestore.
   - Do not enable Firebase Storage (images are local only).
   - See `FIREBASE_SETUP.md` for the full guide.

3. Create `.env` in the repo root
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   # Optional
   EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
   EXPO_PUBLIC_SENTRY_CAPTURE_CONSOLE=0
   ```

4. Run the app
   ```bash
   npm start
   # or
   npm run android
   npm run ios
   npm run web
   ```

## Backups
- Settings includes images-only ZIP backup export/import.
- Images import updates local image mappings without changing text data.

See `BACKUP_GUIDE.md` for detailed workflows.

## Project structure (key paths)

```text
src/
  components/    UI building blocks
  lib/           firebase, image storage, AsyncStorage wrapper
  screens/       app screens
  services/      plants, tasks, journal, backup
  theme/         light/dark theme tokens
  types/         TypeScript data types
  utils/         zip, network, logging, helpers
```

## Data model (short)

Firestore collections:
- plants
- task_templates
- task_logs
- journal_entries

Local storage:
- AsyncStorage cache for plants, tasks, logs, journal
- Images in FileSystem documentDirectory/garden_images/

## Offline behavior

- Reads fall back to AsyncStorage if Firestore is unavailable.
- Writes attempt Firestore first and update the local cache on success.
- If you are offline, create/update actions may fail and should be retried.

## Web limitations
- Local file system access is limited on web.
- Image URIs are treated as blob URLs and cannot be deleted the same way as on device.

## Configuration

Task types:
- water
- fertilise
- prune
- repot
- spray
- mulch

Space types:
- pot
- bed
- ground

Plant types:
- vegetable
- herb
- flower
- fruit_tree
- timber_tree
- coconut_tree
- shrub

## Troubleshooting

- Images missing: photos are stored locally. Use images-only ZIP backups when moving devices.
- Auth errors: confirm Email/Password provider is enabled and env vars are correct.
- Backup import errors: ensure JSON is valid and ZIP contains `backup.json`.

## Build for production
```bash
eas build --platform ios
eas build --platform android
```

## License
0BSD

## Contributing
Personal project, but feel free to fork and adapt.
