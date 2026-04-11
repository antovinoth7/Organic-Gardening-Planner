import { getFilenameFromUri } from '../lib/imageStorage';
import type { Plant, JournalEntry } from '../types/database.types';

/**
 * Resolve the canonical photo filename from either the `photo_filename` field
 * (preferred) or by extracting it from a legacy `photo_url` URI.
 */
export const resolvePhotoFilename = (
  photoFilename?: string | null,
  photoUrl?: string | null,
): string | null => {
  return photoFilename ?? getFilenameFromUri(photoUrl ?? '') ?? null;
};

/**
 * Collect all referenced image filenames across plants and journal entries.
 * Handles both current `photo_filename(s)` fields and legacy `photo_url(s)` fallbacks.
 */
export const collectReferencedFilenames = (
  plants: Plant[],
  journal: JournalEntry[],
): Set<string> => {
  const filenames = new Set<string>();

  for (const plant of plants) {
    const filename = resolvePhotoFilename(plant.photo_filename, plant.photo_url);
    if (filename) filenames.add(filename);
  }

  for (const entry of journal) {
    const legacyUrls =
      entry.photo_urls && entry.photo_urls.length > 0
        ? entry.photo_urls
        : entry.photo_url
          ? [entry.photo_url]
          : [];
    const photoFilenames =
      entry.photo_filenames && entry.photo_filenames.length > 0
        ? entry.photo_filenames
        : legacyUrls
            .map((uri) => getFilenameFromUri(uri))
            .filter((f): f is string => !!f);
    for (const f of photoFilenames) filenames.add(f);
  }

  return filenames;
};
