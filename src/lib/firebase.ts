/**
 * Firebase Configuration
 * 
 * This app uses Firebase for:
 * - Authentication (Firebase Auth)
 * - Text/structured data sync (Firestore) - FREE TIER ONLY
 * 
 * What Firebase is NOT used for:
 * - Image storage (images are stored locally on device)
 * - Any paid features
 * 
 * Firebase Firestore stores only text data and image filenames.
 * This keeps the app within free tier limits for 10-15+ years.
 */

import { initializeApp } from 'firebase/app';
import * as FirebaseAuth from '@firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

if (
  !apiKey ||
  !authDomain ||
  !projectId ||
  !storageBucket ||
  !messagingSenderId ||
  !appId
) {
  throw new Error(
    'Missing Firebase environment values. Check EXPO_PUBLIC_FIREBASE_* variables.'
  );
}

// Your Firebase configuration
// Get these from Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with React Native AsyncStorage persistence
// CRITICAL: This ensures user sessions persist across app restarts in APK builds
// Without this, users would be logged out every time the app is closed
const getReactNativePersistence = (FirebaseAuth as Record<string, unknown>).getReactNativePersistence as
  | ((storage: typeof ReactNativeAsyncStorage) => FirebaseAuth.Persistence)
  | undefined;

let auth: FirebaseAuth.Auth;
if (typeof getReactNativePersistence === 'function') {
  try {
    auth = FirebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch (error: unknown) {
    if (error != null && typeof error === 'object' && 'code' in error && (error as { code: unknown }).code === 'auth/already-initialized') {
      auth = FirebaseAuth.getAuth(app);
    } else {
      throw error;
    }
  }
} else {
  logger.warn(
    'Firebase RN persistence helper is unavailable; falling back to default auth initialization.'
  );
  auth = FirebaseAuth.getAuth(app);
}

// Initialize Firestore (text data only - no images!)
// Use in-memory cache to avoid persistent cache corruption warnings.
const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
});

// NOTE: Firebase Storage is NOT initialized because we don't use it
// Images are stored locally on the device to avoid any cloud storage costs

/**
 * REMOVED: clearFirestoreCache - terminating Firestore causes "client already terminated" errors
 * Memory cache is managed automatically by Firebase SDK
 * If memory issues arise, consider using persistentLocalCache instead of memoryLocalCache
 */

// Track last token refresh to avoid excessive refreshes
let lastTokenRefresh = 0;
const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes (tokens expire in 60min)
let pendingRefresh: Promise<boolean> | null = null;

/**
 * Refresh auth token to prevent expiration issues
 * Firebase tokens expire after 1 hour - refresh proactively but cached.
 * Concurrent calls share the same in-flight promise to avoid duplicate
 * network round-trips (e.g. when TodayScreen fires 3 service calls in parallel).
 * @param forceRefresh - Force refresh even if recently refreshed
 * @returns true if token was refreshed successfully
 */
export const refreshAuthToken = async (forceRefresh = false): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    const now = Date.now();
    // Only refresh if token is close to expiring (or force refresh)
    if (!forceRefresh && (now - lastTokenRefresh) < TOKEN_REFRESH_INTERVAL) {
      return true; // Token is still fresh
    }

    // Deduplicate concurrent refresh calls
    if (pendingRefresh) return pendingRefresh;

    pendingRefresh = (async () => {
      try {
        await user.getIdToken(/* forceRefresh */ true);
        lastTokenRefresh = Date.now();
        return true;
      } catch (error: unknown) {
        logger.error('Token refresh failed', error instanceof Error ? error : new Error(String(error)));
        return false;
      } finally {
        pendingRefresh = null;
      }
    })();

    return pendingRefresh;
  } catch (error: unknown) {
    logger.error('Token refresh failed', error instanceof Error ? error : new Error(String(error)));
    return false;
  }
};

export { auth, db };


