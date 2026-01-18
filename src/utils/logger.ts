/**
 * Production-safe Logger Utility
 * 
 * Provides logging that respects environment settings:
 * - Development: Logs to console
 * - Production: Can be disabled or sent to analytics
 */

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || typeof __DEV__ !== 'undefined' && __DEV__;

enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogOptions {
  level?: LogLevel;
  tags?: string[];
  metadata?: Record<string, any>;
}

class Logger {
  private enabled: boolean = isDevelopment;
  private minLevel: LogLevel = LogLevel.DEBUG;

  /**
   * Enable or disable logging
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Set minimum log level to display
   */
  setMinLevel(level: LogLevel) {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;

    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.minLevel);

    return currentLevelIndex >= minLevelIndex;
  }

  private formatMessage(message: string, options?: LogOptions): string {
    const parts: string[] = [];
    
    if (options?.tags && options.tags.length > 0) {
      parts.push(`[${options.tags.join('][')}]`);
    }
    
    parts.push(message);
    
    return parts.join(' ');
  }

  /**
   * Debug logging - verbose information
   */
  debug(message: string, options?: LogOptions) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formatted = this.formatMessage(message, options);
      console.log(`🔍 ${formatted}`, options?.metadata || '');
    }
  }

  /**
   * Info logging - general information
   */
  info(message: string, options?: LogOptions) {
    if (this.shouldLog(LogLevel.INFO)) {
      const formatted = this.formatMessage(message, options);
      console.log(`ℹ️  ${formatted}`, options?.metadata || '');
    }
  }

  /**
   * Warning logging - potential issues
   */
  warn(message: string, error?: Error, options?: LogOptions) {
    if (this.shouldLog(LogLevel.WARN)) {
      const formatted = this.formatMessage(message, options);
      console.warn(`⚠️  ${formatted}`, error || options?.metadata || '');
    }
  }

  /**
   * Error logging - serious problems
   */
  error(message: string, error?: Error, options?: LogOptions) {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formatted = this.formatMessage(message, options);
      console.error(`❌ ${formatted}`, error || options?.metadata || '');
      
      // In production, you could send to analytics here
      // Example: sendToAnalytics({ message, error, ...options });
    }
  }

  /**
   * Performance logging
   */
  time(label: string) {
    if (this.enabled && isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.enabled && isDevelopment) {
      console.timeEnd(label);
    }
  }

  /**
   * Network request logging
   */
  network(method: string, url: string, status?: number, duration?: number) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const statusEmoji = status && status >= 200 && status < 300 ? '✅' : '❌';
      const durationStr = duration ? ` (${duration}ms)` : '';
      console.log(`🌐 ${statusEmoji} ${method} ${url}${durationStr}`);
    }
  }

  /**
   * Firebase operation logging
   */
  firebase(operation: string, collection: string, details?: string) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`🔥 ${operation} ${collection}${details ? ` - ${details}` : ''}`);
    }
  }

  /**
   * Storage operation logging
   */
  storage(operation: string, key: string, details?: string) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`💾 ${operation} ${key}${details ? ` - ${details}` : ''}`);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// In production, disable debug logs
if (!isDevelopment) {
  logger.setMinLevel(LogLevel.INFO);
}

