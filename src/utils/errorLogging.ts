/**
 * Error Logging and Crash Analytics Utility
 * Centralized error tracking for better debugging
 * Can be extended with Firebase Crashlytics, Sentry, etc.
 */
import { logger } from './logger';

interface ErrorLog {
  timestamp: string;
  type: 'error' | 'warning' | 'crash' | 'network' | 'auth' | 'storage';
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  userId?: string;
}

const MAX_LOGS = 100;
const errorLogs: ErrorLog[] = [];

/**
 * Log an error for analytics
 */
const SENSITIVE_KEYS = ['password', 'token', 'secret', 'email', 'phone', 'credential'];

const sanitizeContext = (context?: Record<string, unknown>): Record<string, unknown> | undefined => {
  if (!context) return undefined;
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (SENSITIVE_KEYS.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const logError = (
  type: ErrorLog['type'],
  message: string,
  error?: Error | unknown,
  context?: Record<string, unknown>
): void => {
  const userId = currentUserId;
  const safeContext = sanitizeContext(context);
  const enrichedContext = { ...safeContext, type, userId };
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    type,
    message,
    stack: (error instanceof Error ? error.stack : undefined) || new Error().stack,
    context: enrichedContext,
    userId,
  };

  errorLogs.push(errorLog);

  // Keep only last MAX_LOGS entries to prevent memory issues
  if (errorLogs.length > MAX_LOGS) {
    errorLogs.shift();
  }

  logger.error(`[${type.toUpperCase()}] ${message}`, error instanceof Error ? error : undefined);


  // Send to error tracker (can forward to Sentry)
  import('../utils/errorTracker').then(({ errorTracker }) => {
    errorTracker.trackError(message, error instanceof Error ? error : undefined, enrichedContext);
  });
};

/**
 * Log authentication errors
 */
export const logAuthError = (message: string, error?: Error, context?: Record<string, unknown>): void => {
  logError('auth', message, error, context);
};

/**
 * Log storage errors
 */
export const logStorageError = (message: string, error?: Error, context?: Record<string, unknown>): void => {
  logError('storage', message, error, context);
};

/**
 * Set user context for error logs
 */
let currentUserId: string | undefined;

export const setErrorLogUserId = (userId: string | undefined): void => {
  currentUserId = userId;
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function getErrorCode(error: unknown): string | undefined {
  if (error != null && typeof error === 'object' && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
}
