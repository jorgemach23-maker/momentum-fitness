import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// 1. Prioritize Environment Variables (Vite standard)
const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 2. Fallback to global config (IDX/Google environments) or Hardcoded Defaults
let firebaseConfig;

if (envConfig.apiKey) {
  // If any env variable is set, assume all are intended to be from .env
  firebaseConfig = envConfig;
} else if (typeof __firebase_config !== 'undefined') {
  // Fallback to global config provided by the environment (e.g., Firebase Hosting)
  firebaseConfig = JSON.parse(__firebase_config);
} else {
  // Hardcoded defaults for local development or when no other config is available
  firebaseConfig = {
    apiKey: "AIzaSyDTcSIPkEt2dtyAmlcC1xFVuZ68e8y1SKM",
    authDomain: "momentum-fitness-ai.firebaseapp.com",
    projectId: "momentum-fitness-ai",
    storageBucket: "momentum-fitness-ai.firebasestorage.app",
    messagingSenderId: "335276198384",
    appId: "1:335276198384:web:ac58a4771d605892203535",
    measurementId: "G-9DJX8R1NX8"
  };
}

// --- Singleton Initialization ---
// This ensures we don't initialize the app more than once, which can cause auth state issues in production builds.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');

export { app, auth, db, functions };
