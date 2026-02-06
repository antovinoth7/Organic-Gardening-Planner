/**
 * App Lifecycle Management Utility
 * Handles cleanup tasks (network monitoring, etc.)
 */

import { AppState, AppStateStatus } from 'react-native';
import { cleanupNetworkMonitoring } from './networkState';

/**
 * Handle app state changes
 * NOTE: Removed Firestore cache clearing - it was terminating the client and causing errors
 * Firebase SDK manages memory cache automatically
 */
export const handleAppStateChange = async (nextAppState: AppStateStatus): Promise<void> => {
  if (nextAppState === 'background') {
    console.log('App backgrounded');
    // Firestore cache is managed automatically by Firebase SDK
  }
  
  if (nextAppState === 'active') {
    console.log('App foregrounded');
    // Firestore will automatically reconnect if needed
  }
};

/**
 * Initialize app lifecycle listeners
 * Returns cleanup function
 */
export const initAppLifecycle = (): (() => void) => {
  const subscription = AppState.addEventListener('change', handleAppStateChange);
  
  return () => {
    subscription.remove();
    cleanupNetworkMonitoring();
  };
};

/**
 * Manual cache clear removed - was causing Firebase termination errors
 * Firebase SDK manages cache automatically
 */
