/**
 * Async Error Wrapper Utilities
 * Prevents uncaught promise rejections that can crash the app
 */

import { logError } from './errorLogging';
import * as Sentry from '@sentry/react-native';

/**
 * Wraps an async function to catch and handle errors gracefully
 * Use this for async functions in useEffect, event handlers, etc.
 * 
 * @example
 * useEffect(() => {
 *   safeAsync(async () => {
 *     const data = await fetchData();
 *     setState(data);
 *   }, 'fetchData');
 * }, []);
 */
export const safeAsync = async <T>(
  fn: () => Promise<T>,
  context: string,
  options?: {
    onError?: (error: Error) => void;
    silent?: boolean;
  }
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    const err = error as Error;
    
    // Log to console in dev
    if (__DEV__ && !options?.silent) {
      console.error(`🔴 Async error in ${context}:`, err);
    }
    
    // Log to error tracking
    logError('error', `Error in ${context}`, err);
    
    // Send to Sentry
    Sentry.captureException(err, {
      tags: { context, type: 'async_error' },
    });
    
    // Call custom error handler if provided
    if (options?.onError) {
      try {
        options.onError(err);
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }
    
    return null;
  }
};

/**
 * Wraps a Promise.all to prevent complete failure if one promise fails
 * Returns results with null for failed promises
 * 
 * @example
 * const results = await safePromiseAll([
 *   fetchUsers(),
 *   fetchPosts(),
 *   fetchComments()
 * ], 'loadDashboardData');
 */
export const safePromiseAll = async <T>(
  promises: Promise<T>[],
  context: string
): Promise<(T | null)[]> => {
  const results = await Promise.allSettled(promises);
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      const error = result.reason as Error;
      console.warn(`Promise ${index} failed in ${context}:`, error);
      
      logError('error', `Promise ${index} failed in ${context}`, error);
      
      Sentry.captureException(error, {
        tags: { context, type: 'promise_all_partial_failure', index: String(index) },
      });
      
      return null;
    }
  });
};

/**
 * Creates a debounced async function that prevents concurrent executions
 * Useful for preventing multiple simultaneous API calls
 * 
 * @example
 * const debouncedSearch = useDebouncedAsync(
 *   async (query: string) => {
 *     const results = await searchAPI(query);
 *     setResults(results);
 *   },
 *   300
 * );
 */
export const createDebouncedAsync = <Args extends any[]>(
  fn: (...args: Args) => Promise<void>,
  delayMs: number
): ((...args: Args) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let isExecuting = false;
  
  return (...args: Args) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Don't queue if already executing
    if (isExecuting) {
      return;
    }
    
    timeoutId = setTimeout(async () => {
      isExecuting = true;
      try {
        await fn(...args);
      } catch (error) {
        console.error('Debounced async error:', error);
        Sentry.captureException(error);
      } finally {
        isExecuting = false;
      }
    }, delayMs);
  };
};

/**
 * Wraps an async operation with a timeout
 * Prevents hanging operations from blocking the app
 * 
 * @example
 * const data = await withTimeout(
 *   fetchData(),
 *   5000,
 *   'fetchData'
 * );
 */
export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number,
  context: string
): Promise<T | null> => {
  const timeout = new Promise<null>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
  );
  
  try {
    return await Promise.race([promise, timeout]);
  } catch (error) {
    const err = error as Error;
    console.warn(`Timeout in ${context}:`, err);
    
    logError('error', `Timeout in ${context}`, err);
    
    Sentry.captureException(err, {
      tags: { context, type: 'timeout', timeoutMs: String(timeoutMs) },
    });
    
    return null;
  }
};
