/**
 * Date Helper Utilities
 * 
 * Provides timezone-safe date calculation functions to avoid common pitfalls
 * with date comparisons and calculations across different timezones.
 */

/**
 * Get the start of day in local timezone (midnight)
 * @param date - Optional date, defaults to today
 * @returns Date object set to 00:00:00.000 in local timezone
 */
export const getStartOfDay = (date: Date = new Date()): Date => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

/**
 * Get the end of day in local timezone (23:59:59.999)
 * @param date - Optional date, defaults to today
 * @returns Date object set to 23:59:59.999 in local timezone
 */
export const getEndOfDay = (date: Date = new Date()): Date => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

/**
 * Calculate days between two dates (timezone-safe)
 * @param from - Start date (string or Date)
 * @param to - End date (string or Date), defaults to today
 * @returns Number of days difference, or null if invalid dates
 */
export const getDaysBetween = (
  from: string | Date,
  to: string | Date = new Date()
): number | null => {
  try {
    const fromDate = typeof from === 'string' ? new Date(from) : from;
    const toDate = typeof to === 'string' ? new Date(to) : to;
    
    // Validate dates
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return null;
    }
    
    // Set both to start of day to avoid time-of-day issues
    const fromStart = getStartOfDay(fromDate);
    const toStart = getStartOfDay(toDate);
    
    const diffMs = toStart.getTime() - fromStart.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.warn('Error calculating days between dates:', error);
    return null;
  }
};

/**
 * Check if two dates are on the same day (timezone-safe)
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are on the same calendar day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return getStartOfDay(date1).getTime() === getStartOfDay(date2).getTime();
};

/**
 * Check if a date is today (timezone-safe)
 * @param date - Date to check
 * @returns True if date is today
 */
export const isToday = (date: Date | string): boolean => {
  const checkDate = typeof date === 'string' ? new Date(date) : date;
  return isSameDay(checkDate, new Date());
};

/**
 * Calculate age in years from a date (for trees)
 * @param dateValue - Planting date
 * @returns Age in years, or null if invalid
 */
export const getYearsOld = (dateValue: string | Date | null): number | null => {
  if (!dateValue) return null;
  
  try {
    const plantDate = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (Number.isNaN(plantDate.getTime())) return null;
    
    const today = new Date();
    const diffMs = today.getTime() - plantDate.getTime();
    const years = Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
    
    return years >= 0 ? years : null;
  } catch (error) {
    console.warn('Error calculating age:', error);
    return null;
  }
};

/**
 * Format a date as YYYY-MM-DD (ISO date string without time)
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatDateISO = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Add days to a date (timezone-safe)
 * @param date - Starting date
 * @param days - Number of days to add (can be negative)
 * @returns New date with days added
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Check if a date is overdue (before today)
 * @param date - Date to check
 * @returns True if date is before today
 */
export const isOverdue = (date: Date | string): boolean => {
  try {
    const checkDate = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(checkDate.getTime())) return false;
    
    return getStartOfDay(checkDate) < getStartOfDay(new Date());
  } catch (error) {
    return false;
  }
};

/**
 * Validate if a date string is valid
 * @param dateStr - Date string to validate
 * @returns True if valid date
 */
export const isValidDate = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
