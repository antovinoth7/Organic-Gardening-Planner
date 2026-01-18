import NetInfo from "@react-native-community/netinfo";

/**
 * Network State Monitoring Utility
 * Tracks online/offline status to avoid hanging operations.
 */

let isOnline = true;

// Initialize network state monitoring
NetInfo.fetch().then((state) => {
  isOnline = state.isConnected ?? true;
});

// Subscribe to network state changes
NetInfo.addEventListener((state) => {
  const wasOnline = isOnline;
  isOnline = state.isConnected ?? true;

  if (wasOnline !== isOnline) {
    console.log(`Network state changed: ${isOnline ? "online" : "offline"}`);
  }
});

export const isNetworkAvailable = (): boolean => isOnline;
