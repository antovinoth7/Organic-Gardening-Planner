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
  const userId = currentUserId;
  const enrichedContext = { ...context, type, userId };
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    type,
    message,
    stack: error?.stack || new Error().stack,
    context: enrichedContext,
    userId,
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
    errorTracker.trackError(message, error, enrichedContext);
  });
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
 * Set user context for error logs
 */
let currentUserId: string | undefined;

export const setErrorLogUserId = (userId: string | undefined) => {
  currentUserId = userId;
};
