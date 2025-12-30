# Backup & Restore Guide

## Why Manual Backups?

This app uses **manual backups** instead of automatic cloud backup for several reasons:

1. **Cost**: No ongoing cloud storage costs
2. **Control**: You choose where to store your backups (Google Drive, OneDrive, external drive, etc.)
3. **Privacy**: Your data goes where you want it
4. **Longevity**: Plain JSON files readable for decades
5. **Portability**: Easy to move between services

## What Gets Backed Up?

### ✅ Included in Backup

- **Plants**: All plant data (name, type, location, notes, health, dates, etc.)
- **Tasks**: All task templates and schedules
- **Task Logs**: Complete history of completed tasks
- **Journal Entries**: All journal text content
- **Image URIs**: File paths to images (as strings)

### ❌ NOT Included in Backup

- **Actual Image Files**: Photos remain on your device
- **User Credentials**: Firebase handles auth separately

### Why Images Aren't Backed Up

- Images are large (2-5 MB each)
- Would make backup files huge and slow
- You can manually copy images separately if needed
- For most users, retaking photos on new device is easier

## How to Export a Backup

### Step 1: Open Settings

1. Launch the Garden Planner app
2. Tap the **Settings** tab at the bottom

### Step 2: Export

1. Scroll to the **Data Backup** section
2. You'll see statistics:
   - Number of plants
   - Number of tasks
   - Number of journal entries
   - Total image storage used
3. Tap **Export Backup** button
4. Wait a few seconds while the backup is created

### Step 3: Save Backup File

1. Your device's share sheet will appear
2. Choose where to save:
   - **Google Drive**: Best for cross-platform
   - **OneDrive**: Good for Windows/Office users
   - **Dropbox**: Another good option
   - **Files app**: Save to device/iCloud
   - **Email**: Send to yourself (not recommended for large backups)

3. The file will be named: `garden-backup-YYYY-MM-DD.json`

### Backup File Contents

The backup is a plain JSON file you can open in any text editor:

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
  "tasks": [...],
  "taskLogs": [...],
  "journal": [...]
}
```

## How to Import a Backup

### Option 1: Import & Merge

**Use this when**: You want to combine backup data with existing data

1. Open Settings → Data Backup
2. Tap **Import & Merge**
3. Confirm the action
4. Choose your backup file from cloud storage
5. Wait for import to complete

**What happens**:
- Existing items are kept
- New items from backup are added
- If same item exists in both, backup version wins
- Nothing is deleted

### Option 2: Import & Replace All

**Use this when**: You want to completely replace current data with backup

⚠️ **Warning**: This will DELETE all your current data and replace it with the backup.

1. Open Settings → Data Backup
2. Tap **Import & Replace All**
3. Read the warning carefully
4. Confirm if you're sure
5. Choose your backup file
6. Wait for import to complete

**What happens**:
- ALL existing data is deleted
- Backup data becomes your new data
- Local image files are not affected

## Backup Strategies

### Strategy 1: Personal Use (Single Device)

**Frequency**: Monthly

1. Export backup once a month
2. Save to Google Drive
3. Keep last 3 backups (delete older ones)

**Why**: Simple, low maintenance, protects against accidental deletion

### Strategy 2: Multi-Device User

**Frequency**: Weekly

1. Export backup weekly from your main device
2. Save to cloud storage (Google Drive/OneDrive)
3. When switching devices:
   - Install app on new device
   - Sign in (text data syncs automatically)
   - Import backup if needed

**Why**: Text syncs via Firebase, but images are device-local

### Strategy 3: Paranoid User

**Frequency**: Weekly + Monthly

**Weekly**:
1. Export backup
2. Save to Google Drive

**Monthly**:
1. Export backup
2. Save to Google Drive
3. Download to external USB drive
4. Store drive safely

**Why**: Maximum protection, survives cloud service changes

### Strategy 4: Casual User

**Frequency**: Before major changes

1. Before deleting many plants: Export backup
2. Before app updates: Export backup
3. Before device changes: Export backup

**Why**: Minimal effort, still protected when it matters

## Restoring on a New Device

### Scenario 1: Got a New Phone

**Text data (plants, tasks, journals)** syncs automatically:

1. Install Garden Planner on new phone
2. Sign in with same email/password
3. Wait a few seconds
4. All text data appears (via Firebase sync)

**Images** don't sync automatically:

- Option A: Retake photos (easiest)
- Option B: Manually copy `garden_images/` folder from old phone
- Option C: Use Syncthing or similar to sync the folder

### Scenario 2: Reinstalling the App

If you deleted the app and reinstalled:

1. Sign in
2. Text data syncs from Firebase
3. Images are gone (were deleted with app)
4. Import backup to restore data (if needed)
5. Retake photos

### Scenario 3: Switching to Different Cloud

If you want to move from one cloud storage to another:

1. Export backup from current setup
2. Save to your computer
3. Upload to new cloud service
4. Done - backup is just a file, works anywhere

## Troubleshooting

### "Export Failed"

**Possible causes**:
- Not signed in
- No internet connection (needs to fetch from Firebase)
- Not enough storage space

**Solutions**:
- Check you're signed in
- Connect to internet
- Free up device storage

### "Import Failed"

**Possible causes**:
- Invalid backup file
- Corrupted file
- Wrong file selected

**Solutions**:
- Make sure it's a `garden-backup-*.json` file
- Try exporting a fresh backup to test
- Check file isn't corrupted (open in text editor)

### "Images Missing After Import"

**This is normal** - images are not included in backups.

**Solutions**:
- Retake photos (recommended)
- Manually copy `garden_images/` folder from old device
- Use file sync tool (Syncthing, etc.)

### "Can't Find Backup File"

**Solutions**:
- Check your cloud storage app (Drive, OneDrive)
- Use device's "Files" app to browse
- Search for "garden-backup"
- Check Downloads folder

## Advanced: Manual Backup of Images

If you want to manually backup images too:

### Android

1. Connect phone to computer via USB
2. Navigate to: `Android/data/com.yourapp/files/garden_images/`
3. Copy entire `garden_images` folder to computer
4. Store in Google Drive/external drive

### iOS

1. Use iTunes/Finder file sharing
2. Or use iCloud Drive (enable for app)
3. Copy `garden_images` folder

### Restore Images

1. Copy `garden_images` folder back to device
2. Place in app's documents directory
3. App will recognize images automatically

## Backup File Format

For developers or advanced users:

```typescript
interface BackupData {
  version: string;           // Backup format version (e.g., "1.0.0")
  exportDate: string;        // ISO timestamp
  plants: Plant[];           // Array of plant objects
  tasks: TaskTemplate[];     // Array of task templates
  taskLogs: TaskLog[];       // Array of task completion logs
  journal: JournalEntry[];   // Array of journal entries
}
```

Each object includes all fields from the TypeScript types in `src/types/database.types.ts`.

## Best Practices

### ✅ Do

- Export backups regularly (weekly or monthly)
- Store backups in multiple places (cloud + external drive)
- Test importing a backup occasionally
- Keep at least 2-3 recent backups
- Export before major app updates
- Name your backups descriptively if you customize them

### ❌ Don't

- Rely only on Firebase (it's not a backup system)
- Store backups only on the same device
- Forget to verify backups occasionally
- Share backup files (they contain your data)
- Edit backup JSON manually (unless you know what you're doing)

## Long-Term Safety (10-15 Years)

This backup system is designed for longevity:

1. **Plain JSON**: Still readable in 2040
2. **Simple format**: Easy to parse in any language
3. **No proprietary formats**: Not locked to any vendor
4. **Human-readable**: You can open it in any text editor
5. **Future-proof**: Can be imported into other apps if needed

Even if this app stops working in 10 years, your data is safe in JSON format and can be imported into whatever app exists then.

## Emergency Recovery

If something goes wrong:

1. **App won't open**: Uninstall, reinstall, sign in, import backup
2. **Data looks wrong**: Import backup (use "Replace All")
3. **Syncing issues**: Export backup, sign out, sign in, import backup
4. **Everything lost**: Sign in, import backup from cloud storage

As long as you have a backup file, your data is safe.

---

**Remember**: The best backup is the one you actually do regularly!

Set a calendar reminder to export a backup monthly. It takes 30 seconds.
