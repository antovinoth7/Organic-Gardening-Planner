# Data Handling & Privacy

This document describes what user data the Organic Gardening Planner collects, where it is stored, and how to delete it.

## Data Collected

| Data Type | Examples | Storage Location |
| ----------- | ---------- | ----------------- |
| **Account credentials** | Email, password | Firebase Authentication (Google-managed) |
| **Plant records** | Name, species, care frequencies, health status, growth stage | Firestore (cloud) + AsyncStorage (device cache) |
| **Task schedules** | Watering/fertilising/pruning templates, completion logs | Firestore + AsyncStorage |
| **Journal entries** | Text notes, entry type, timestamps | Firestore + AsyncStorage |
| **Plant & journal photos** | JPEG/PNG images | Device only (MediaLibrary or app sandbox) |
| **Photo filenames** | e.g. `plant_1234567890.jpg` | Firestore (filename only, not the image) |
| **User settings** | Locations, plant catalog, care profiles | Firestore `user_settings/{uid}` |
| **Error/crash data** | Stack traces, anonymised user ID | Sentry (if configured) |

## Where Data Lives

### Cloud (Firebase)

- **Authentication**: Managed by Firebase Auth. Email and hashed password stored by Google.
- **Firestore**: All documents are scoped to the authenticated user via `user_id` field. Firestore security rules enforce that users can only read/write their own data.
- **No Firebase Storage**: Images are never uploaded to the cloud.

### Device

- **AsyncStorage**: Cached copies of plants, tasks, journal entries, and settings. Stored as JSON in the app's sandboxed storage. Not encrypted by default.
- **Images**: Stored in the device's MediaLibrary (`Pictures/GardenPlanner` on Android) or the app's `documentDirectory/garden_images/` folder. Images never leave the device unless the user explicitly exports a backup ZIP.

### Error Tracking (Sentry)

- User ID is sent to Sentry for crash correlation. Email is **not** sent.
- Sensitive context keys (password, token, email, credential) are auto-redacted from error payloads.
- Stack traces and device metadata are collected for debugging.

## Data Retention

- **Firestore data**: Retained indefinitely while the account exists.
- **Local cache**: Retained on-device until the user clears app data or uninstalls.
- **Soft-deleted plants**: Marked with `is_deleted` and `deleted_at` but remain in Firestore. They can be permanently deleted from the Archived Plants screen.
- **Sentry events**: Retained per Sentry's configured retention period (default 90 days).

## Data Deletion

### Delete individual records

- Plants, tasks, and journal entries can be deleted from their respective screens.
- Deleting a plant also removes its associated tasks.
- Deleting a journal entry also removes its local image files.

### Clear local cache

- Go to **Settings** and use the clear cache option to remove all locally cached data.
- This does not affect Firestore data.

### Delete account data

- To delete all cloud data: delete all plants, tasks, and journal entries from the app, then delete your Firebase Authentication account.
- Firebase does not automatically delete Firestore documents when an auth account is deleted. Manual cleanup or a Cloud Function is required for full deletion.

## Third-Party Services

| Service | Purpose | Data Shared |
| --------- | --------- | ------------- |
| Firebase Authentication | User sign-in | Email, password (hashed) |
| Cloud Firestore | Data storage | Plant/task/journal records, settings |
| Sentry | Error tracking | Anonymised user ID, stack traces, device info |

No analytics, advertising, or social media SDKs are integrated.

## Backups

- The app supports **images-only ZIP export/import** from the Settings screen.
- Backup ZIPs contain only image files and a manifest — no user credentials or auth tokens.
- Backups are created and shared locally; they are not uploaded to any server.
