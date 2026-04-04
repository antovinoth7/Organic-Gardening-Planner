/**
 * Firestore Timeout Utility
 * Prevents hanging operations and ANR errors
 * Adds configurable timeouts to all Firestore operations
 */

import { isNetworkAvailable } from './networkState';
import { logger } from './logger';
import { getErrorCode, getErrorMessage } from './errorLogging';

interface TimeoutOptions {
  timeoutMs?: number;
  throwOnTimeout?: boolean;
  fallbackValue?: unknown;
}

const DEFAULT_TIMEOUT = 15000; // 15 seconds

export const FIRESTORE_WRITE_TIMEOUT_MS = 15000;
export const FIRESTORE_READ_TIMEOUT_MS = 10000;
export const FIRESTORE_MAX_RETRIES = 2;
export const FIRESTORE_BASE_DELAY_MS = 1000;

/**
 * Wraps a Firestore operation with timeout and network check
 */
async function withTimeout<T>(
  operation: () => Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT,
    throwOnTimeout = true,
    fallbackValue = null,
  } = options;

  // Check network connectivity first
  if (!isNetworkAvailable()) {
    if (throwOnTimeout) {
      throw new Error('No network connection available');
    }
    return fallbackValue as T;
  }

  return new Promise<T>((resolve, reject) => {
    let isResolved = false;

    // Set timeout
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        const error = new Error(`Operation timed out after ${timeoutMs}ms`);

        if (throwOnTimeout) {
          reject(error);
        } else {
          logger.warn(error.message);
          resolve(fallbackValue as T);
        }
      }
    }, timeoutMs);

    // Execute operation
    operation()
      .then((result) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          resolve(result);
        }
      })
      .catch((error) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          reject(error);
        }
      });
  });
}

/**
 * Retry wrapper for Firestore operations
 * Automatically retries failed operations with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      const code = getErrorCode(error);
      const message = getErrorMessage(error);

      // Don't retry on auth errors
      if (code === 'permission-denied' || code === 'unauthenticated') {
        logger.error('Authentication error, not retrying: ' + code);
        throw error;
      }

      // Don't retry on invalid argument errors
      if (code === 'invalid-argument') {
        logger.error('Invalid argument error, not retrying: ' + message);
        throw error;
      }

      // Don't retry if no network
      if (!isNetworkAvailable()) {
        logger.warn('No network connection, stopping retries');
        throw new Error('No network connection available');
      }

      // Log network errors with more details
      if (code === 'unavailable' || message.includes('Failed to fetch')) {
        logger.warn(`Network unavailable (attempt ${attempt + 1}/${maxRetries + 1}): ${message}`);
      }

      // Last attempt failed
      if (attempt === maxRetries) {
        break;
      }

      // Calculate exponential backoff delay
      const delay = baseDelayMs * Math.pow(2, attempt);
      logger.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Combines timeout and retry logic for maximum reliability
 */
export async function withTimeoutAndRetry<T>(
  operation: () => Promise<T>,
  options: TimeoutOptions & { maxRetries?: number; baseDelayMs?: number } = {}
): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT,
    throwOnTimeout = true,
    fallbackValue = null,
    maxRetries = 2,
    baseDelayMs = 1000,
  } = options;

  return withRetry(
    () => withTimeout(operation, { timeoutMs, throwOnTimeout, fallbackValue }),
    maxRetries,
    baseDelayMs
  );
}

