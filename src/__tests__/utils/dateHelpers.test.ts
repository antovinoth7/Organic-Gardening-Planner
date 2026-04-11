/// <reference types="jest" />
import { toLocalDateString, formatDateDisplay, getYearsOld } from '../../utils/dateHelpers';

describe('dateHelpers', () => {
  describe('toLocalDateString', () => {
    it('formats a date as YYYY-MM-DD', () => {
      const date = new Date(2026, 2, 15); // March 15, 2026
      expect(toLocalDateString(date)).toBe('2026-03-15');
    });

    it('zero-pads single-digit months and days', () => {
      const date = new Date(2026, 0, 5); // January 5
      expect(toLocalDateString(date)).toBe('2026-01-05');
    });
  });

  describe('formatDateDisplay', () => {
    it('formats YYYY-MM-DD to readable string', () => {
      const result = formatDateDisplay('2026-03-21');
      expect(result).toContain('Mar');
      expect(result).toContain('21');
      expect(result).toContain('2026');
    });

    it('returns original string for invalid date', () => {
      expect(formatDateDisplay('not-a-date')).toBe('not-a-date');
    });
  });

  describe('getYearsOld', () => {
    it('returns null for null input', () => {
      expect(getYearsOld(null)).toBeNull();
    });

    it('returns null for invalid date string', () => {
      expect(getYearsOld('invalid')).toBeNull();
    });

    it('returns 0 for a recent date', () => {
      const recent = new Date();
      recent.setMonth(recent.getMonth() - 3);
      const dateStr = `${recent.getFullYear()}-${String(recent.getMonth() + 1).padStart(2, '0')}-${String(recent.getDate()).padStart(2, '0')}`;
      expect(getYearsOld(dateStr)).toBe(0);
    });

    it('returns positive years for an old date', () => {
      const result = getYearsOld('2020-01-01');
      expect(result).toBeGreaterThanOrEqual(6);
    });
  });
});
