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
 * Firebase Firestore stores only text data and local image URI strings.
 * This keeps the app within free tier limits for 10-15+ years.
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// Get these from Firebase Console -> Project Settings -> General -> Your apps
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth (React Native automatically uses AsyncStorage for persistence)
const auth = getAuth(app);

// Initialize Firestore (text data only - no images!)
const db = getFirestore(app);

// NOTE: Firebase Storage is NOT initialized because we don't use it
// Images are stored locally on the device to avoid any cloud storage costs

export { app, auth, db };
