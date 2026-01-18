/**
 * Error Tracking Service
 * 
 * Provides basic error tracking and analytics for production apps.
 * Can be extended to integrate with Firebase Crashlytics, Sentry, etc.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from './logger';

const ERROR_LOG_KEY = '@garden_error_logs';
const MAX_ERROR_LOGS = 50; // Keep last 50 errors

export interface ErrorLog {
  timestamp: string;
  message: string;
  error?: string;
  stack?: string;
  context?: Record<string, any>;
  userAgent?: string;
  appVersion?: string;
}

class ErrorTracker {
  private errorLogs: ErrorLog[] = [];
  private initialized = false;

  /**
   * Initialize the error tracker
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(ERROR_LOG_KEY);
      if (stored) {
        this.errorLogs = JSON.parse(stored);
      }
      this.initialized = true;
      logger.debug('Error tracker initialized');
    } catch (error) {
      console.error('Failed to initialize error tracker:', error);
    }
  }

  /**
   * Track an error
   */
  async trackError(message: string, error?: Error, context?: Record<string, any>) {
    const normalizedContext = context || {};
    const type = typeof normalizedContext.type === 'string' ? normalizedContext.type : 'error';
    const level: 'warning' | 'error' | 'fatal' = type === 'warning' ? 'warning' : type === 'crash' ? 'fatal' : 'error';

    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      message,
      error: error?.message,
      stack: error?.stack,
      context: normalizedContext,
      appVersion: '1.0.0', // You can import from package.json
    };

    // Add to in-memory logs
    this.errorLogs.push(errorLog);

    // Keep only last MAX_ERROR_LOGS
    if (this.errorLogs.length > MAX_ERROR_LOGS) {
      this.errorLogs = this.errorLogs.slice(-MAX_ERROR_LOGS);
    }

    // Persist to storage
    try {
      await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(this.errorLogs));
    } catch (storageError) {
      console.error('Failed to save error log:', storageError);
    }

    // Log to console in development
    logger.error(message, error, { metadata: context });

    // Send to Sentry (dev and production)
    import('@sentry/react-native').then((Sentry) => {
      const captureContext = {
        level: level as 'warning' | 'error' | 'fatal' | 'info' | 'debug',
        contexts: { custom: normalizedContext },
        tags: { source: 'error_tracker', type },
      };

      if (error) {
        Sentry.captureException(error, captureContext);
      } else {
        Sentry.captureMessage(message, captureContext);
      }
    });
  }

  /**
   * Track a non-fatal error (warning)
   */
  async trackWarning(message: string, context?: Record<string, any>) {
    logger.warn(message, undefined, { metadata: context });

    // In production, you might want to track warnings too
    // await this.trackError(`[WARNING] ${message}`, undefined, context);
  }

  /**
   * Get all stored error logs
   */
  async getErrorLogs(): Promise<ErrorLog[]> {
    await this.initialize();
    return [...this.errorLogs];
  }

  /**
   * Clear all error logs
   */
  async clearErrorLogs() {
    this.errorLogs = [];
    try {
      await AsyncStorage.removeItem(ERROR_LOG_KEY);
      logger.info('Error logs cleared');
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStats(): Promise<{
    total: number;
    last24Hours: number;
    mostRecent?: ErrorLog;
  }> {
    await this.initialize();

    const now = new Date();
    const last24Hours = this.errorLogs.filter((log) => {
      const logDate = new Date(log.timestamp);
      const hoursDiff = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    });

    return {
      total: this.errorLogs.length,
      last24Hours: last24Hours.length,
      mostRecent: this.errorLogs[this.errorLogs.length - 1],
    };
  }

  /**
   * Export error logs as JSON string (for support/debugging)
   */
  async exportErrorLogs(): Promise<string> {
    await this.initialize();
    return JSON.stringify(this.errorLogs, null, 2);
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

