import { JournalEntry, JournalEntryType } from '../../types/database.types';

export function makeJournalEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: 'test-entry-id',
    user_id: 'test-user-id',
    plant_id: null,
    entry_type: JournalEntryType.Observation,
    content: 'Test observation',
    photo_filenames: [],
    photo_urls: [],
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}
