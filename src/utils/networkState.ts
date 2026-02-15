import NetInfo from "@react-native-community/netinfo";

/**
 * Network State Monitoring Utility
 * Tracks online/offline status to avoid hanging operations.
 */

let isOnline = true;
let unsubscribe: (() => void) | null = null;

/**
 * Initialize network state monitoring
 * Safe to call multiple times - will only subscribe once
 */
const initNetworkMonitoring = (): void => {
  if (unsubscribe) return; // Already initialized

  // Initialize network state monitoring
  NetInfo.fetch().then((state) => {
    isOnline = state.isConnected ?? true;
  });

  // Subscribe to network state changes
  unsubscribe = NetInfo.addEventListener((state) => {
    const wasOnline = isOnline;
    isOnline = state.isConnected ?? true;

    if (wasOnline !== isOnline) {
      console.log(`Network state changed: ${isOnline ? "online" : "offline"}`);
    }
  });
};

/**
 * Cleanup network monitoring listener
 * Call this when app is unmounting or no longer needs monitoring
 */
export const cleanupNetworkMonitoring = (): void => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
    console.log('Network monitoring cleaned up');
  }
};

// Auto-initialize on module load
initNetworkMonitoring();

export const isNetworkAvailable = (): boolean => isOnline;
