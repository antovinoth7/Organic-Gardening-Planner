# Architecture Overview

## Design Philosophy: Free Forever

This app is architected to run **free for 10-15+ years** with zero subscription costs and minimal vendor dependency.

### Core Principles

1. **Text in Cloud, Images Local**: Only lightweight text/structured data syncs via Firebase. Images stay on device.
2. **Offline-First**: App works fully without internet, syncs when available.
3. **Manual Backups**: User exports data to their own cloud storage (Google Drive, OneDrive, etc.)
4. **No Vendor Lock-in**: Plain JSON backups, local storage, easy to migrate.
5. **Free Tier Only**: Designed to stay within Firebase Spark plan limits forever.

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    User's Device                         │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  React Native App (Expo)                          │  │
│  │                                                    │  │
│  │  ┌──────────────┐  ┌──────────────────────────┐  │  │
│  │  │  UI Screens  │  │  Services Layer          │  │  │
│  │  │              │  │  • plants.ts             │  │  │
│  │  │ • Today      │  │  • tasks.ts              │  │  │
│  │  │ • Plants     │  │  • journal.ts            │  │  │
│  │  │ • Calendar   │  │  • backup.ts             │  │  │
│  │  │ • Journal    │  │                          │  │  │
│  │  │ • Settings   │  │                          │  │  │
│  │  └──────┬───────┘  └───────┬──────────────────┘  │  │
│  │         │                  │                      │  │
│  │         └──────────┬───────┘                      │  │
│  │                    │                              │  │
│  │  ┌─────────────────▼────────────────────────┐    │  │
│  │  │  Storage Layer                           │    │  │
│  │  │                                          │    │  │
│  │  │  ┌──────────────┐  ┌──────────────────┐ │    │  │
│  │  │  │ AsyncStorage │  │ expo-file-system │ │    │  │
│  │  │  │ (Caching)    │  │ (Images)         │ │    │  │
│  │  │  │              │  │                  │ │    │  │
│  │  │  │ • Plants     │  │ garden_images/   │ │    │  │
│  │  │  │ • Tasks      │  │ • plant_*.jpg    │ │    │  │
│  │  │  │ • Journals   │  │ • journal_*.jpg  │ │    │  │
│  │  │  └──────────────┘  └──────────────────┘ │    │  │
│  │  └───────────────────────────────────────┘    │  │
│  └────────────────────────┬──────────────────────┘  │
│                           │                          │
└───────────────────────────┼──────────────────────────┘
                            │
                            │ (Sync text data only)
                            ▼
             ┌──────────────────────────────┐
             │    Firebase (Free Tier)      │
             │                              │
             │  ┌────────────────────────┐  │
             │  │  Authentication        │  │
             │  │  (Email/Password)      │  │
             │  └────────────────────────┘  │
             │                              │
             │  ┌────────────────────────┐  │
             │  │  Firestore Database    │  │
             │  │                        │  │
             │  │  Collections:          │  │
             │  │  • plants              │  │
             │  │  • task_templates      │  │
             │  │  • task_logs           │  │
             │  │  • journal_entries     │  │
             │  │                        │  │
             │  │  Stores:               │  │
             │  │  • Text data           │  │
             │  │  • Metadata            │  │
             │  │  • Image URIs (paths)  │  │
             │  │  NOT: Image files      │  │
             │  └────────────────────────┘  │
             └──────────────────────────────┘
```

## Data Flow

### 1. Creating a Plant with Photo

```
User selects/takes photo
         │
         ▼
[expo-image-picker] Returns temporary URI
         │
         ▼
[imageStorage.ts] Saves to local storage
         │
         ├─> File: garden_images/plant_123456_abc.jpg
         └─> Returns: file:///path/to/image.jpg
         │
         ▼
[plants.ts] Creates plant document
         │
         ├─> Firestore: { name, type, photo_url: "file://..." }
         └─> AsyncStorage: Cached copy
         │
         ▼
[PlantCard] Displays image from local URI
```

### 2. Syncing Between Devices

```
Device A                          Firebase                  Device B
   │                                 │                         │
   │ Add plant                       │                         │
   ├──────> photo_url: "file://A"   │                         │
   │                                 │                         │
   │                                 ├──────> Sync text data   │
   │                                 │         photo_url: "file://A"
   │                                 │                         │
   │                                 │         ⚠️ Image missing│
   │                                 │         Shows 📷 icon   │
```

Device B sees plant metadata but not the image (it's local to Device A).

### 3. Manual Backup/Restore

```
User exports backup
         │
         ▼
[backup.ts] Reads all data from Firestore/cache
         │
         ├─> Plants (text + URIs)
         ├─> Tasks
         ├─> Journals (text + URIs)
         └─> Creates JSON file
         │
         ▼
[expo-sharing] Shows system share sheet
         │
         ▼
User saves to Google Drive/OneDrive
```

```
User imports backup on new device
         │
         ▼
[expo-document-picker] User selects JSON file
         │
         ▼
[backup.ts] Parses and restores data
         │
         ├─> AsyncStorage: Local cache
         └─> Firestore: Syncs to cloud
         │
         ▼
App reloads with restored data
(Images still missing - need manual copy or retake)
```

## File Structure

```
src/
├── lib/
│   ├── firebase.ts           # Firebase config (Auth + Firestore only)
│   ├── imageStorage.ts       # Local image file operations
│   ├── storage.ts            # AsyncStorage helpers for caching
│   └── supabase.ts           # DEPRECATED - not used
│
├── services/
│   ├── plants.ts             # CRUD for plants + local image handling
│   ├── tasks.ts              # CRUD for tasks + offline caching
│   ├── journal.ts            # CRUD for journals + local image handling
│   └── backup.ts             # Export/import backup files
│
├── screens/
│   ├── AuthScreen.tsx        # Login/signup
│   ├── TodayScreen.tsx       # Today's tasks
│   ├── PlantsScreen.tsx      # Plants list
│   ├── PlantFormScreen.tsx   # Add/edit plant
│   ├── PlantDetailScreen.tsx # Plant details
│   ├── CalendarScreen.tsx    # Calendar view
│   ├── JournalScreen.tsx     # Journal list
│   ├── JournalFormScreen.tsx # Add journal entry
│   └── SettingsScreen.tsx    # Settings + backup UI
│
├── components/
│   ├── PlantCard.tsx         # Plant card (handles missing images)
│   └── TaskCard.tsx          # Task card
│
└── types/
    └── database.types.ts     # TypeScript interfaces
```

## Key Components

### imageStorage.ts

Handles all local image file operations:
- `saveImageLocally()`: Saves image from picker to app directory
- `deleteImageLocally()`: Removes image file
- `imageExists()`: Checks if file exists
- `pickImage()`: Opens gallery picker
- `takePhoto()`: Opens camera
- `getImageStorageSize()`: Calculates total image storage used

### storage.ts

Handles local caching via AsyncStorage:
- `getData()`: Read cached array
- `setData()`: Write cached array
- `addItem()`: Add item to cached array
- `updateItem()`: Update cached item
- `deleteItem()`: Remove cached item
- `getItemById()`: Get specific item by ID

### Services

Each service (`plants.ts`, `tasks.ts`, `journal.ts`) follows this pattern:

1. **Read**: Try Firestore first, fall back to cache if offline
2. **Write**: Save to Firestore, update cache immediately
3. **Delete**: Remove from Firestore, remove from cache, delete local image if exists
4. **Images**: Only save/load local file URIs, never upload image data

### backup.ts

Provides manual backup/restore:
- `exportBackup()`: Creates JSON file with all text data
- `importBackup()`: Restores from JSON file (merge or replace)
- `getBackupStats()`: Shows data counts for UI

## Data Storage Breakdown

### Firestore (Cloud - Text Only)

```typescript
// Example plant document (text only, ~500 bytes)
{
  id: "plant_123",
  user_id: "user_abc",
  name: "Tomato - Cherry",
  plant_type: "vegetable",
  photo_url: "file:///data/.../plant_123_main.jpg",  // Just a string path
  space_type: "pot",
  location: "Balcony",
  notes: "Planted March 2024",
  created_at: "2024-03-01T10:00:00Z"
}
```

### Local Storage (Device - Images)

```
garden_images/
├── plant_1735480000_a1b2c3.jpg       (2.5 MB)
├── plant_1735490000_d4e5f6.jpg       (1.8 MB)
├── journal_1735500000_g7h8i9.jpg     (3.2 MB)
└── journal_1735510000_j0k1l2.jpg     (2.1 MB)
                                Total: ~9.6 MB
```

### AsyncStorage (Device - Cache)

```
@garden_plants: [...]           (~50 KB for 100 plants)
@garden_tasks: [...]            (~15 KB for 50 tasks)
@garden_task_logs: [...]        (~73 KB for 365 logs)
@garden_journal: [...]          (~40 KB for 100 entries)
                          Total: ~180 KB
```

## Cost Analysis (10 Years)

### Firebase Firestore (Free Tier)

**Limits**: 50K reads, 20K writes, 1GB storage per day

**Typical Usage (Single User)**:
- Daily reads: ~100 (opening app, viewing plants/tasks)
- Daily writes: ~10 (adding tasks, marking done)
- Total storage: ~180KB text data
- **Cost**: $0.00 (well within free tier)

### Local Storage

- Images: ~10MB per year (100 photos)
- After 10 years: ~100MB
- Device storage: Free
- **Cost**: $0.00

### Manual Backup Storage

- JSON backup: ~200KB per export
- Store in Google Drive free tier (15GB)
- Or OneDrive free tier (5GB)
- **Cost**: $0.00

### Total 10-Year Cost: $0.00

## Performance Characteristics

### App Launch

1. Check Firebase auth (cached, instant)
2. Load from AsyncStorage cache (instant, ~5ms)
3. Fetch from Firestore in background (100-500ms)
4. Update UI with fresh data

**User sees data instantly, then gets updates.**

### Offline Mode

- All reads: Instant from cache
- All writes: Save to cache, queue for sync
- When online: Auto-sync queued changes
- **App works 100% offline**

### Image Loading

- Local file access: 5-20ms per image
- No network requests
- No loading spinners needed
- **Images load instantly**

## Security Model

### Firebase Authentication

- Email/password only
- No social auth (keeps it simple)
- Tokens stored securely by Firebase SDK

### Firestore Security Rules

```javascript
// Users can only access their own data
allow read, write: if request.auth.uid == resource.data.user_id;
```

### Local Images

- Stored in app-private directory
- Not accessible to other apps
- Deleted when app is uninstalled
- **No security concerns** (local only)

## Migration Strategy

If Firebase ever changes free tier or is shut down:

### Option 1: Local-Only Mode

1. Remove Firebase dependency
2. Keep AsyncStorage as main storage
3. Use SQLite for better querying
4. Keep manual backup/restore
5. **Effort**: 1-2 days of coding

### Option 2: Migrate to Another Backend

1. Export all data via backup feature
2. Set up new backend (Supabase, PocketBase, etc.)
3. Import data
4. Update API calls
5. **Effort**: 3-5 days of coding

### Option 3: Self-Hosted

1. Run own Firestore emulator or PocketBase
2. Change Firebase config to point to localhost/VPN
3. Keep all existing code
4. **Effort**: 1 day of setup

**All options preserve data** because:
- Text data: Plain JSON exports
- Images: Standard JPEG files
- No proprietary formats

## Testing Strategy

### Unit Tests (Recommended)

```typescript
// Test local image storage
describe('imageStorage', () => {
  it('should save image locally', async () => {
    const uri = await saveImageLocally('temp_uri', 'plant');
    expect(uri).toContain('garden_images/plant_');
  });
});

// Test offline caching
describe('plants service', () => {
  it('should return cached plants when offline', async () => {
    mockFirebaseOffline();
    const plants = await getPlants();
    expect(plants).toEqual(cachedPlants);
  });
});
```

### Manual Tests

- ✅ Create plant with photo offline
- ✅ Sync when online
- ✅ View plant on second device (text syncs, image missing)
- ✅ Export backup
- ✅ Import backup on new device
- ✅ Delete plant (removes local image)
- ✅ App works with airplane mode on

## Future Enhancements (Optional)

### Local Database Upgrade

Replace AsyncStorage with SQLite for better querying:
- Faster search/filter
- Better complex queries
- Still local-first
- **Migration**: Straightforward, data stays compatible

### Peer-to-Peer Sync

Use Syncthing or similar to sync images between devices:
- User installs Syncthing
- Points to `garden_images/` folder
- Images sync automatically
- **No code changes needed**

### Progressive Web App

Make it work in browser:
- IndexedDB instead of AsyncStorage
- Web APIs for file system
- Same codebase
- **Effort**: Add web build config

---

**Last Updated**: 2024 (current architecture)  
**Designed for**: 10-15+ year longevity  
**Cost**: $0 forever
