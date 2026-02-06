# Organic Gardening Planner - Copilot Instructions

Concise guidance for AI contributors working on this Expo React Native gardening planner.

## Core Architecture Principles
- **Free-forever design**: Firestore stores text/metadata ONLY (Auth + Firestore, NO Storage).
- **Images are device-local & persistent**:
  - Android: Photos stored in MediaLibrary (Pictures/GardenPlanner) - survives reinstalls
  - iOS: Photos in `FileSystem.documentDirectory/garden_images/` - backed up to iCloud
  - Web: Blob URLs (session-based)
  - Images NEVER uploaded to cloud
- **Offline-first**: All services fetch from Firestore → cache to AsyncStorage → fall back to cache on error.
- **Manual backups**: User-controlled JSON or ZIP exports (data-only, data+images, or images-only).

## Critical Data Flow Pattern
**ALWAYS** follow this pattern in `src/services/*.ts`:

```typescript
// 1. Check auth
const user = auth.currentUser;
if (!user) throw new Error('Not authenticated');

// 2. Query Firestore with timeout/retry
const snapshot = await withTimeoutAndRetry(
  () => getDocs(query(...)),
  { timeoutMs: 15000, maxRetries: 2 }
);

// 3. Transform Firestore docs (handle Timestamp → ISO string)
const data = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data(),
  created_at: doc.data().created_at?.toDate?.()?.toISOString() || doc.data().created_at,
}));

// 4. Cache results locally (AsyncStorage)
await setData(KEYS.ITEMS, data);
return data;

// 5. Fallback on error
catch (error) {
  console.warn('Firestore failed, using cache:', error);
  return getData<T>(KEYS.ITEMS);
}
```

See `src/services/plants.ts` (lines 30-100) and `src/services/tasks.ts` (lines 25-65) for examples.

## Image Handling Rules
- **Save**: Use `saveImageLocallyWithFilename(uri, prefix)` from `src/lib/imageStorage.ts`.
- **Store in Firestore**: Save only `photo_filename` string (e.g., `"plant_1738091234_abc123.jpg"`), NOT URIs.
- **Resolve for UI**: Use `resolveLocalImageUri(filename)` to get the current device path.
- **Web platform**: Returns blob URLs; no file deletion attempted.
- **Example** (`src/services/plants.ts` lines 200-220):
  ```typescript
  const { filename } = await saveImageLocallyWithFilename(photoUri, 'plant');
  await addDoc(collection(db, 'plants'), {
    ...plantData,
    photo_filename: filename,  // Store filename, not URI
  });
  ```

## Type System & Firestore Timestamps
- All types in `src/types/database.types.ts`.
- Firestore stores `Timestamp` objects; transform to ISO strings (`.toDate().toISOString()`) for app use.
- Preserve both `photo_filename` (stable, stored) and `photo_url` (local URI, derived) in `Plant` and `JournalEntry`.

## Service Layer Patterns
- **Plants**: `src/services/plants.ts` — CRUD + image resolution + pagination (line 30 `getPlants`).
- **Tasks**: `src/services/tasks.ts` — Templates + completion logs + auto-scheduling (line 25 `getTaskTemplates`).
- **Journal**: `src/services/journal.ts` — Multi-photo support via `photo_filenames` array.
- **Backup**: `src/services/backup.ts` — JSON/ZIP export/import with image bundling.

## Backup Types (in Settings UI)
1. **Data-only JSON**: `exportBackup()` / `importBackup()` — no images, just filenames.
2. **Complete ZIP**: `exportBackupWithImages()` / `importBackupWithImages()` — data + `images/` folder.
3. **Images-only ZIP**: `exportImagesOnly()` / `importImagesOnly()` — photos only, matched by filename.

## Network & Resilience
- Wrap ALL Firestore calls with `withTimeoutAndRetry()` from `src/utils/firestoreTimeout.ts` (15s timeout, 2 retries).
- Check `isNetworkAvailable()` before operations; utility is in `src/utils/networkState.ts`.
- Do NOT retry on auth errors (`permission-denied`, `unauthenticated`).

## Error Handling & Observability
- Sentry initialized in `App.tsx` when `EXPO_PUBLIC_SENTRY_DSN` is set.
- Use `logError(category, message, error)` from `src/utils/errorLogging.ts` for structured logs.
- `ErrorBoundary` wraps the app; `errorTracker` persists logs to AsyncStorage.

## Development Commands
```bash
npm install                # Install dependencies
npx expo start             # Start dev server (or `npm start`)
npx expo start --android   # Run on Android
npx expo start --ios       # Run on iOS (macOS only)
npx expo start --web       # Run in web browser
```

## Firebase Configuration
- Create `.env` in repo root (see `FIREBASE_SETUP.md` for full guide):
  ```env
  EXPO_PUBLIC_FIREBASE_API_KEY=...
  EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
  # Never enable Firebase Storage — images are local only
  ```
- Security rules enforce `user_id` ownership per collection.

## When Adding Features
- Update `ARCHITECTURE.md` if changing data flows or storage patterns.
- Update `BACKUP_GUIDE.md` if modifying export/import logic.
- **Never** add Firebase Storage — images must stay local to maintain free-tier sustainability.
