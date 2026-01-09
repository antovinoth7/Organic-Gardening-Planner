/**
 * Firestore Timeout Utility
 * Prevents hanging operations and ANR errors
 * Adds configurable timeouts to all Firestore operations
 */

import { isNetworkAvailable } from './networkState';

export interface TimeoutOptions {
  timeoutMs?: number;
  throwOnTimeout?: boolean;
  fallbackValue?: any;
}

const DEFAULT_TIMEOUT = 15000; // 15 seconds

/**
 * Wraps a Firestore operation with timeout and network check
 */
export async function withTimeout<T>(
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
    return fallbackValue;
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
          console.warn(error.message);
          resolve(fallbackValue);
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
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Don't retry on auth errors
      if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
        throw error;
      }

      // Don't retry if no network
      if (!isNetworkAvailable()) {
        throw new Error('No network connection available');
      }

      // Last attempt failed
      if (attempt === maxRetries) {
        break;
      }

      // Calculate exponential backoff delay
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.warn(`Operation failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
      
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

/**
 * Batch operations with timeout
 * Useful for executing multiple Firestore operations in parallel
 */
export async function withTimeoutBatch<T>(
  operations: Array<() => Promise<T>>,
  timeoutMs: number = DEFAULT_TIMEOUT
): Promise<Array<T | null>> {
  const promises = operations.map(op =>
    withTimeout(op, { timeoutMs, throwOnTimeout: false, fallbackValue: null })
  );

  return Promise.all(promises);
}
