# Backup & Restore Guide

## Why Manual Backups?

This app uses manual backups instead of automatic cloud backup for several reasons:

1. Cost: No ongoing cloud storage costs
2. Control: You choose where to store your backups (Google Drive, OneDrive, external drive, etc.)
3. Privacy: Your data goes where you want it
4. Longevity: Plain JSON and ZIP files are readable for decades
5. Portability: Easy to move between services and devices

## Backup Types (Current Code)

### 1) Data-only backup (JSON)
- Includes plants, tasks, task logs, and journal entries
- Includes image URI strings only (no actual photos)
- File name: `garden-backup-YYYY-MM-DD.json`

### 2) Complete backup with images (ZIP)
- Includes all data plus images
- ZIP contains `backup.json` and an `images/` folder
- File name: `garden-backup-YYYY-MM-DD.zip`
- Available in the backup service; UI may not expose this in every build

### 3) Images-only backup (ZIP)
- Includes photos only plus a small manifest in `backup.json`
- Does not change data; only restores images and updates their URIs
- File name: `garden-backup-YYYY-MM-DD.zip`
- Available in Settings > Images-Only Backup
- Images are matched by original filename during import

## What Gets Backed Up?

### Included in data-only JSON
- Plants (all fields, including `photo_url` string)
- Tasks (templates and schedules)
- Task logs (completion history)
- Journal entries (including `photo_urls` strings)

### Not included in data-only JSON
- Image files
- User credentials (Firebase Auth handles sign-in)

### Included in complete ZIP
- Everything in data-only JSON
- All plant and journal photos stored on the device

### Included in images-only ZIP
- All plant and journal photos stored on the device
- A small manifest (`exportDate`, `imageCount`, `note`)

## How to Export

### Images-only ZIP (current Settings UI)
1. Open the app and go to Settings.
2. Open the "Images-Only Backup" section.
3. Tap "Export Images Only (ZIP)".
4. Save the file using the share sheet.

### Data-only JSON (if your build exposes Data Backup)
1. Open Settings and go to Data Backup.
2. Tap "Export Backup".
3. Save `garden-backup-YYYY-MM-DD.json`.

### Complete ZIP with images (if exposed)
1. Open Settings and go to Data Backup.
2. Tap "Export Complete Backup (ZIP)".
3. Save `garden-backup-YYYY-MM-DD.zip`.

### Where to save backups
- Google Drive
- OneDrive
- Dropbox
- Files app (local or iCloud)
- External drive
- Email (not recommended for large ZIPs)

## How to Import

### Data-only JSON
- Import & Merge: keeps existing items, adds new ones; backup wins on ID conflicts
- Import & Replace All: replaces all local data with the backup

### Complete ZIP with images
- Same merge/replace behavior for data
- Images are extracted to local storage and image URIs are updated to new paths

### Images-only ZIP
- Does not change plants, tasks, or journal content
- Updates image URIs by matching original filenames
- Best results if photos have not been renamed

## Backup File Contents

### Data-only JSON example
```json
{
  "version": "1.0.0",
  "exportDate": "2024-12-29T10:30:00.000Z",
  "plants": [
    {
      "id": "plant_123",
      "name": "Tomato - Cherry",
      "plant_type": "vegetable",
      "photo_url": "file:///path/to/image.jpg",
      "location": "Balcony",
      "created_at": "2024-03-01T10:00:00Z"
    }
  ],
  "tasks": [],
  "taskLogs": [],
  "journal": [
    {
      "id": "journal_123",
      "entry_type": "observation",
      "content": "First flowers today",
      "photo_urls": ["file:///path/to/image.jpg"],
      "created_at": "2024-03-10T08:00:00Z"
    }
  ]
}
```

### ZIP structure
```
garden-backup-YYYY-MM-DD.zip
- backup.json
- images/
  - plant_1700000000000_ab12cd.jpg
  - journal_1700000000000_ef34gh.jpg
```

Images-only ZIPs also contain `backup.json`, but it is only a small manifest.

## Restoring on a New Device

1. Install the app and sign in with the same account.
2. Text data syncs from Firestore.
3. Restore photos using one of these options:
   - Images-only ZIP import (Settings > Images-Only Backup)
   - Complete ZIP import (if available in your build)
4. Import a JSON backup if you need to restore or merge data.

## Backup Strategies

### Strategy 1: Personal Use (Single Device)
- Frequency: monthly
- Export a data-only JSON or complete ZIP
- Keep the last 3 backups

### Strategy 2: Multi-Device User
- Frequency: weekly
- Export data-only JSON
- Export images-only ZIP when moving to a new device

### Strategy 3: Paranoid User
- Weekly: export data-only JSON or complete ZIP to cloud storage
- Monthly: save a copy to an external drive

### Strategy 4: Casual User
- Export before deleting many plants, app updates, or device changes

## Troubleshooting

### "Export failed"
Possible causes:
- Not signed in
- No internet connection (Firestore fetch timeout)
- Not enough storage space

### "Import failed" (JSON)
- Wrong file type
- Invalid JSON
- Missing required fields

### "Import failed" (ZIP)
- ZIP does not contain `backup.json`
- Corrupted ZIP file

### "No images found to export"
- You have not saved any photos yet

### "Images missing after import"
- JSON backups do not include image files
- Images-only ZIP import requires matching filenames

## Advanced: Manual Image Copy

If you cannot use ZIP export/import:

### Android
1. Connect phone to computer via USB
2. Navigate to:
   `Android/data/com.antovinoth7.organicgardeningapp/files/garden_images/`
3. Copy the entire `garden_images` folder

### iOS
1. Use Finder or iTunes file sharing (if enabled)
2. Copy the `garden_images` folder

### Restore
1. Copy `garden_images` back into the app documents directory
2. Restart the app

## Backup File Format (For Developers)

```typescript
interface BackupData {
  version: string;
  exportDate: string;
  plants: Plant[];
  tasks: TaskTemplate[];
  taskLogs: TaskLog[];
  journal: JournalEntry[];
}

interface ImagesOnlyManifest {
  exportDate: string;
  imageCount: number;
  note: string;
}
```

Types are defined in `src/types/database.types.ts`.

## Best Practices

### Do
- Export backups regularly
- Store backups in multiple places
- Test importing a backup occasionally
- Keep at least 2-3 recent backups
- Export before major app updates

### Don't
- Rely only on sync as a backup
- Store backups only on the same device
- Rename images inside a ZIP (breaks matching)
- Share backup files (they contain your data)

## Long-Term Safety (10-15 Years)

This backup system is designed for longevity:

1. Plain JSON and standard ZIP formats
2. Human-readable and easy to parse
3. No proprietary formats
4. Easy migration to other apps

## Emergency Recovery

1. App will not open: reinstall, sign in, import backup
2. Data looks wrong: import backup (Replace All)
3. Images missing: import images-only ZIP or complete ZIP
4. Sync issues: export backup, sign out, sign in, import

---

Remember: the best backup is the one you do regularly.
