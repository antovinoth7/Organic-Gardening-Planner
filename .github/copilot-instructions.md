# Organic Gardening Planner - Copilot Instructions

Purpose: concise guidance for AI contributors working on this repo.

## Core principles
- Free-forever: Firestore stores text data only (Auth + Firestore).
- Images are local-only under `garden_images/` and never uploaded.
- Offline-friendly: read paths fall back to AsyncStorage cache.
- Backups are manual and user-controlled (JSON or ZIP).

## Key files
- `src/lib/firebase.ts`: Firebase init (Auth + Firestore only).
- `src/lib/imageStorage.ts`: all image storage and file ops.
- `src/lib/storage.ts`: AsyncStorage cache wrapper.
- `src/services/backup.ts`: backup/export/import logic.
- `src/utils/zipHelper.ts`: ZIP create/extract with `fflate`.
- `ARCHITECTURE.md`, `BACKUP_GUIDE.md`, `FIREBASE_SETUP.md`: docs.

## Image rules
- Always use `src/lib/imageStorage.ts` helpers for image save/delete/check.
- Store only local file URIs (or web blob URLs) in Firestore.
- Handle missing files gracefully in UI.

## Backups
- Text-only JSON: `exportBackup()` / `importBackup()` (no images).
- Complete ZIP: `exportBackupWithImages()` / `importBackupWithImages()` (data + images).
- Images-only ZIP: `exportImagesOnly()` / `importImagesOnly()` (photos only).
- UI currently exposes images-only backup in Settings; other flows are in code.

## Offline behavior
- Services fetch from Firestore and cache locally; on failure, use AsyncStorage.
- Avoid blocking UI on network calls; use timeouts/retries in `firestoreTimeout.ts`.

## Observability
- Sentry is optional and initialized in `App.tsx` when DSN is configured.
- `ErrorBoundary` and `errorTracker` capture runtime errors.

## Dev commands
- Install: `npm install`
- Run: `npx expo start` (or `npm start`)

## Contribution hygiene
- Keep data storage text-only in Firestore (no Firebase Storage).
- Update docs when changing data flows or backups.
