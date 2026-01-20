import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyDTcSIPkEt2dtyAmlcC1xFVuZ68e8y1SKM",
  authDomain: "momentum-fitness-ai.firebaseapp.com",
  projectId: "momentum-fitness-ai",
  storageBucket: "momentum-fitness-ai.firebasestorage.app",
  messagingSenderId: "335276198384",
  appId: "1:335276198384:web:ac58a4771d605892203535",
  measurementId: "G-9DJX8R1NX8"
};

let app, auth, db, functions;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  functions = getFunctions(app);
} catch (e) {
  console.error("Error al inicializar Firebase:", e);
}

export { app, auth, db, functions };
