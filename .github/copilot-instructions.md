# Organic Gardening Planner - Copilot Instructions

This document provides guidance for AI coding agents to effectively contribute to the Organic Gardening Planner mobile app.

## Architecture Overview

This is a React Native application built with Expo. It uses Firebase for backend services, with a focus on keeping images local and minimizing cloud storage costs.

- **Frontend**: React Native with Expo.
- **Backend**: Firebase (Authentication, Firestore). **Note: Cloud Storage is NOT used** - images are stored locally.
- **Data Models**: Defined in `src/types/database.types.ts`. These are crucial for understanding the shape of data stored in Firestore.
- **Firebase Interaction**: All Firebase-related code is centralized in `src/lib/firebase.ts`. This includes initialization and configuration.
- **Image Storage**: All image handling is in `src/lib/imageStorage.ts`. Images are stored locally in the device's document directory (`garden_images/` folder), **never uploaded to cloud storage**.
- **Data Services**: Business logic for interacting with Firestore collections (plants, tasks, journal) is encapsulated in services found in `src/services/`:
  - `src/services/plants.ts`: Plant CRUD operations
  - `src/services/tasks.ts`: Task templates and logs
  - `src/services/journal.ts`: Journal entries
  - `src/services/backup.ts`: Export/import functionality (3 backup types)
- **UI**: The UI is composed of screens located in `src/screens/` and reusable components in `src/components/`.

## Image Storage Strategy (IMPORTANT)

### Key Principles:
1. **Local-Only Storage**: Images are NEVER uploaded to Firebase Cloud Storage or any cloud service
2. **File URIs in Firestore**: Only the local file path (URI string) is stored in Firestore
3. **Cross-Device Sync**: Images must be manually exported/imported using backup features
4. **Benefits**: 
   - Zero cloud storage costs (stays within Firebase free tier)
   - No dependency on paid services
   - Full user control over their photos
   - Long-term sustainability (10-15+ years)

### Image Properties:
- **Plants**: `photo_url` (string | null) - single image URI
- **Journal Entries**: `photo_urls` (string[]) - array of image URIs
- **Legacy**: `photo_url` (string | null) - backward compatibility field

### Image Functions (`src/lib/imageStorage.ts`):
- `initImageStorage()`: Create images directory
- `saveImageLocally(uri, prefix)`: Save image to local storage
- `deleteImageLocally(uri)`: Delete local image file
- `imageExists(uri)`: Check if image file exists
- `pickImage()`: Launch image picker
- `takePhoto()`: Launch camera
- `getImageStorageSize()`: Get total size of stored images

## Backup System (CRITICAL)

The app has **three distinct backup options** (all in `src/services/backup.ts`):

### 1. Text-Only Backup (JSON)
- **Function**: `exportBackup()`, `importBackup(overwrite)`
- **Format**: JSON file
- **Contains**: Plants, tasks, journals (text data only)
- **Size**: Very small (~100 KB)
- **Images**: NOT included (only image URI strings)
- **Use Case**: Quick backups, regular data sync

### 2. Complete Backup (ZIP)
- **Functions**: `exportBackupWithImages()`, `importBackupWithImages(overwrite)`
- **Format**: ZIP file with `backup.json` + `images/` folder
- **Contains**: All text data + all image files
- **Size**: Large (depends on photos)
- **Images**: Fully included
- **Use Case**: Device-to-device transfers, complete backups
- **Library**: Uses `fflate` (NOT JSZip - security/maintenance reasons)

### 3. Images-Only Backup (ZIP)
- **Functions**: `exportImagesOnly()`, `importImagesOnly()`
- **Format**: ZIP file with minimal manifest + `images/` folder
- **Contains**: Only image files
- **Size**: Depends on photos
- **Data**: NOT included
- **Use Case**: Separate image backups, photo transfers without data

### Backup Utilities (`src/utils/zipHelper.ts`):
- `createZipWithImages(jsonData, imageUris)`: Create ZIP archive
- `extractZipWithImages(zipUri, targetDir)`: Extract ZIP archive
- **Library**: Uses `fflate` with `zipSync`/`unzipSync` (synchronous API for React Native compatibility)
- **Platform Support**: Web, iOS, Android (all tested)

## Developer Workflow

- **Running the app**: To start the development server, run `npx expo start`. This will open the Expo Go development environment.
- **Dependencies**: The project uses npm for package management. Install dependencies with `npm install`.
- **Firebase Setup**: The project requires a Firebase project. The setup guide is in `FIREBASE_SETUP.md`. This includes setting up Firestore and Authentication (but NOT Cloud Storage).

## Project Conventions

- **State Management**: Component state is managed using React hooks (`useState`, `useEffect`). For global state, the app uses React Context (`src/theme/index.tsx` for theme).
- **Styling**: The app uses a custom theme defined in `src/theme/`. Colors are in `src/theme/colors.ts`. Supports light/dark modes.
- **Error Handling**: 
  - Custom error boundary at `src/components/ErrorBoundary.tsx`
  - Error logging utilities in `src/utils/errorLogging.ts` and `src/utils/errorTracker.ts`
  - Firestore timeout handling in `src/utils/firestoreTimeout.ts`
- **Data Fetching**: 
  - Services in `src/services/` handle Firestore operations
  - All Firestore calls wrapped with timeout/retry logic (`withTimeoutAndRetry`)
  - Offline support via local caching (`src/lib/storage.ts` using AsyncStorage)
- **Utilities**:
  - `src/utils/dateHelpers.ts`: Date formatting and calculations
  - `src/utils/plantHelpers.ts`: Plant-specific logic
  - `src/utils/networkState.ts`: Network connectivity detection
  - `src/utils/debounce.ts`: Debouncing utility
  - `src/utils/safeStorage.ts`: Safe AsyncStorage operations

## Key Files and Directories

### Core Files:
- `src/lib/firebase.ts`: Firebase configuration and initialization
- `src/lib/imageStorage.ts`: **Local image storage** (all image operations)
- `src/lib/storage.ts`: AsyncStorage wrapper for local data caching
- `src/types/database.types.ts`: TypeScript type definitions for all data structures

### Services:
- `src/services/plants.ts`: Plant CRUD operations
- `src/services/tasks.ts`: Task templates and completion logs
- `src/services/journal.ts`: Journal entries
- `src/services/backup.ts`: **Three backup types** (text-only, complete, images-only)

### Screens:
- `src/screens/AuthScreen.tsx`: Authentication (sign in/sign up)
- `src/screens/PlantsScreen.tsx`: Plant list and search
- `src/screens/PlantDetailScreen.tsx`: Individual plant details
- `src/screens/PlantFormScreen.tsx`: Add/edit plant form
- `src/screens/TodayScreen.tsx`: Today's tasks dashboard
- `src/screens/CalendarScreen.tsx`: Task calendar view
- `src/screens/JournalScreen.tsx`: Journal entries list
- `src/screens/JournalFormScreen.tsx`: Add/edit journal entry
- `src/screens/SettingsScreen.tsx`: **Settings with 3 backup options**

### Components:
- `src/components/ErrorBoundary.tsx`: Error boundary wrapper
- `src/components/PlantCard.tsx`: Plant list item
- `src/components/TaskCard.tsx`: Task list item

### Documentation:
- `FIREBASE_SETUP.md`: Firebase configuration guide
- `ARCHITECTURE.md`: High-level architecture overview
- `BACKUP_GUIDE.md`: **Comprehensive backup/restore guide** (3 backup types)
- `README.md`: Project overview and setup

### Configuration:
- `app.json`: Expo configuration
- `eas.json`: Expo Application Services config
- `package.json`: Dependencies (includes `fflate` for ZIP operations)

## Important Dependencies

### Production:
- `expo`: ~54.0.30 (React Native framework)
- `firebase`: ^12.7.0 (Auth + Firestore only, NOT Storage)
- `fflate`: Latest (Modern ZIP library - used for backups)
- `@react-native-async-storage/async-storage`: ^2.2.0 (Local storage)
- `expo-file-system`: ~19.0.21 (File operations)
- `expo-image-picker`: ^17.0.10 (Camera/gallery)
- `expo-document-picker`: ~14.0.8 (File picker for imports)
- `expo-sharing`: ~14.0.8 (Share functionality)
- `@react-navigation/*`: Navigation libraries
- `@react-native-community/netinfo`: ^11.4.1 (Network state)

### DO NOT USE:
- ❌ `jszip` - Replaced with `fflate` (security/maintenance)
- ❌ Firebase Cloud Storage - Images are local-only
- ❌ Redux/MobX - Using React Context for global state

## Data Flow

1. **User Creates Plant/Journal**:
   - User picks/takes photo → `pickImage()` or `takePhoto()`
   - Image saved locally → `saveImageLocally(uri, 'plant')`
   - Returns local file URI (e.g., `file:///...garden_images/plant_123.jpg`)
   - URI stored in Firestore alongside text data

2. **Data Sync**:
   - Text data syncs automatically via Firebase
   - Images remain device-local
   - To sync images: Use backup export/import

3. **Backup Flow**:
   - **Text-Only**: Fetch from Firestore → Export JSON
   - **Complete**: Fetch data + Read image files → Create ZIP
   - **Images-Only**: Collect image URIs → Create ZIP with just images

4. **Import Flow**:
   - **Text-Only**: Parse JSON → Write to Firestore/AsyncStorage
   - **Complete**: Extract ZIP → Restore data + Save images locally → Update URIs
   - **Images-Only**: Extract ZIP → Save images → Existing data unchanged

## Best Practices for Contributors

### When Working with Images:
1. **Always use** `src/lib/imageStorage.ts` functions
2. **Never** attempt to upload images to cloud storage
3. **Store only URIs** in Firestore, never base64 or blob data
4. **Handle missing images** gracefully (file may not exist)
5. **Check image existence** before displaying: `imageExists(uri)`

### When Working with Backups:
1. Use appropriate backup type based on user need
2. Always provide clear UI messaging about what's included
3. Handle errors gracefully (network, storage space, corrupted files)
4. Test on all platforms (web, iOS, Android)
5. Use `fflate` synchronous API (`zipSync`/`unzipSync`) for React Native

### When Working with Data:
1. All Firestore operations should use `withTimeoutAndRetry`
2. Cache data locally in AsyncStorage for offline support
3. Validate data structure before saving
4. Handle both online and offline states
5. Use TypeScript types from `database.types.ts`

### Code Quality:
1. Follow existing patterns in the codebase
2. Add error logging for debugging
3. Use theme colors from `src/theme/colors.ts`
4. Test on both light and dark modes
5. Handle platform differences (web vs mobile)

## Common Tasks

### Adding a New Feature with Images:
1. Define data type in `src/types/database.types.ts`
2. Create service functions in `src/services/`
3. Use `pickImage()` or `takePhoto()` for image selection
4. Save image with `saveImageLocally(uri, 'prefix')`
5. Store returned URI in Firestore
6. Update backup functions to include new images
7. Add UI in appropriate screen

### Modifying Backup System:
1. Update `src/services/backup.ts` with new logic
2. Update `src/utils/zipHelper.ts` if ZIP structure changes
3. Update UI in `src/screens/SettingsScreen.tsx`
4. Update documentation in `BACKUP_GUIDE.md`
5. Test all three backup types
6. Verify cross-platform compatibility

### Testing Checklist:
- [ ] Test on Expo Go (mobile)
- [ ] Test on web browser
- [ ] Test with/without internet
- [ ] Test light/dark modes
- [ ] Test backup export/import
- [ ] Verify no TypeScript errors
- [ ] Check console for warnings
- [ ] Test image upload/display

## Security & Privacy

- **No cloud image storage**: Ensures user privacy and zero ongoing costs
- **Firebase Auth**: Email/password authentication only
- **Firestore Rules**: Should be configured to restrict user data access
- **Local images**: Protected by device OS security
- **Backups**: User controls where backups are stored (cloud agnostic)

## Long-Term Sustainability

This app is designed to work for **10-15+ years** without changes:

1. **No cloud dependencies**: Firebase free tier for text, local images
2. **Standard formats**: JSON (data) and ZIP (backups)
3. **No vendor lock-in**: Backups can be used with other apps
4. **Minimal dependencies**: Only essential, well-maintained packages
5. **Cross-platform**: Works on web, iOS, Android without changes

## Questions?

Refer to:
- `ARCHITECTURE.md`: High-level design decisions
- `BACKUP_GUIDE.md`: Complete backup/restore documentation
- `FIREBASE_SETUP.md`: Firebase configuration
- Code comments in service files for specific implementation details
