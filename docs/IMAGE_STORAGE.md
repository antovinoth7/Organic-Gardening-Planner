# Image Storage

Images never go to Firestore or cloud storage. They are stored on-device only.

## Filename Convention

Store only filenames in Firestore and backups:
- Plant photos: `photo_filename`
- Journal photos: `photo_filenames`

Treat local URIs as derived values:
- Plant UI field: `photo_url`
- Journal UI field: `photo_urls`

## API

- Use `saveImageLocallyWithFilename()` from `src/lib/imageStorage.ts` before saving plant or journal records.
- Use `resolveLocalImageUri()` or `resolveLocalImageUris()` before rendering images.

## Platform Behavior

- **Android dev builds**: prefer `expo-media-library` storage in `Pictures/GardenPlanner`.
- **Android Expo Go**: fall back to `FileSystem.documentDirectory/garden_images/`.
- **iOS**: use `FileSystem.documentDirectory/garden_images/`.
- **Web**: use blob URLs.

## Migration Behavior

- `App.tsx` runs `migrateImagesToMediaLibrary()` after authentication on Android.
- `src/services/backup.ts` also runs Android migration after image import.
- Preserve this flow when changing image storage.
