import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * Network State Monitoring Utility
 * Tracks online/offline status and connection quality
 * Prevents hanging operations when connectivity is lost
 */

let isOnline = true;
let connectionType: string | null = null;
const listeners: Set<(state: boolean) => void> = new Set();

// Initialize network state monitoring
NetInfo.fetch().then((state) => {
  isOnline = state.isConnected ?? true;
  connectionType = state.type;
});

// Subscribe to network state changes
const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
  const wasOnline = isOnline;
  isOnline = state.isConnected ?? true;
  connectionType = state.type;

  // Notify all listeners if state changed
  if (wasOnline !== isOnline) {
    console.log(`Network state changed: ${isOnline ? 'online' : 'offline'}`);
    listeners.forEach((listener) => listener(isOnline));
  }
});

export const isNetworkAvailable = (): boolean => isOnline;

export const addNetworkListener = (callback: (isOnline: boolean) => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback);
};

/**
 * React hook to monitor network state
 */
export const useNetworkState = () => {
  const [online, setOnline] = useState(isOnline);

  useEffect(() => {
    const removeListener = addNetworkListener(setOnline);
    return () => {
      removeListener();
    };
  }, []);

  return { isOnline: online, connectionType };
};
