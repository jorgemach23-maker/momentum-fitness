import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// 1. Prioritize Environment Variables (Vite standard)
// This is critical for local development where .env might differ from production defaults
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
// The check for apiKey ensures we don't use an empty object if env vars are missing
let firebaseConfig = (envConfig.apiKey) ? envConfig : (
  typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "AIzaSyDTcSIPkEt2dtyAmlcC1xFVuZ68e8y1SKM",
    authDomain: "momentum-fitness-ai.firebaseapp.com",
    projectId: "momentum-fitness-ai",
    storageBucket: "momentum-fitness-ai.firebasestorage.app",
    messagingSenderId: "335276198384",
    appId: "1:335276198384:web:ac58a4771d605892203535",
    measurementId: "G-9DJX8R1NX8"
  }
);

let app, auth, db, functions; 

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  // Important: Explicitly set region if your function is not in us-central1 (default)
  // We verified previously the function is deployed to us-central1, so default is fine.
  functions = getFunctions(app, 'us-central1'); 
} catch (e) {
  console.error("Critical Error initializing Firebase:", e);
  // Fallback to avoid crashing the whole app immediately on import
  // Consumers of these exports should check for nulls
}

export { app, auth, db, functions };
