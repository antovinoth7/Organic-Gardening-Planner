/**
 * Error Logging and Crash Analytics Utility
 * Centralized error tracking for better debugging
 * Can be extended with Firebase Crashlytics, Sentry, etc.
 */

interface ErrorLog {
  timestamp: string;
  type: 'error' | 'warning' | 'crash' | 'network' | 'auth' | 'storage';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
}

const MAX_LOGS = 100;
const errorLogs: ErrorLog[] = [];

/**
 * Log an error for analytics
 */
export const logError = (
  type: ErrorLog['type'],
  message: string,
  error?: Error | any,
  context?: Record<string, any>
) => {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    type,
    message,
    stack: error?.stack || new Error().stack,
    context,
  };

  errorLogs.push(errorLog);

  // Keep only last MAX_LOGS entries to prevent memory issues
  if (errorLogs.length > MAX_LOGS) {
    errorLogs.shift();
  }

  // Console log for development
  if (__DEV__) {
    console.error(`[${type.toUpperCase()}]`, message, error, context);
  }

  // Send to error tracker (can forward to Sentry)
  import('../utils/errorTracker').then(({ errorTracker }) => {
    errorTracker.trackError(message, error, { ...context, type });
  });
};

/**
 * Log warning (non-critical errors)
 */
export const logWarning = (message: string, context?: Record<string, any>) => {
  logError('warning', message, undefined, context);
};

/**
 * Log network-related errors
 */
export const logNetworkError = (message: string, error?: Error, context?: Record<string, any>) => {
  logError('network', message, error, context);
};

/**
 * Log authentication errors
 */
export const logAuthError = (message: string, error?: Error, context?: Record<string, any>) => {
  logError('auth', message, error, context);
};

/**
 * Log storage errors
 */
export const logStorageError = (message: string, error?: Error, context?: Record<string, any>) => {
  logError('storage', message, error, context);
};

/**
 * Log app crash
 */
export const logCrash = (message: string, error: Error, context?: Record<string, any>) => {
  logError('crash', message, error, context);
};

/**
 * Get all error logs (for debugging or reporting)
 */
export const getErrorLogs = (): ErrorLog[] => {
  return [...errorLogs];
};

/**
 * Clear error logs
 */
export const clearErrorLogs = () => {
  errorLogs.length = 0;
};

/**
 * Export error logs as JSON string
 */
export const exportErrorLogs = (): string => {
  return JSON.stringify(errorLogs, null, 2);
};

/**
 * Set user context for error logs
 */
let currentUserId: string | undefined;

export const setErrorLogUserId = (userId: string | undefined) => {
  currentUserId = userId;
};

export const getErrorLogUserId = (): string | undefined => {
  return currentUserId;
};
