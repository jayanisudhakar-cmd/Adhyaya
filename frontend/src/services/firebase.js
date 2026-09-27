import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// These keys should be supplied in a .env file on the client
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key-for-local-testing",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "namma-guru-auth.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "namma-guru-auth",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "namma-guru-auth.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234:web:abcd"
};

// Initialize Firebase only once
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);

// For local testing without a real Firebase project, we can let users proceed with a local mock state.
// We've set up fallback modes in our AuthContext to bypass real Firebase connections if credentials are mock.

export { auth, db };
