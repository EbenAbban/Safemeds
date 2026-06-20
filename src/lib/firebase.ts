import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import {
  getFirestore,
  enableNetwork,
  disableNetwork,
} from "firebase/firestore";
import { getRemoteConfig, type RemoteConfig } from "firebase/remote-config";
import { setLogLevel } from "firebase/app";

// Firebase configuration (values from env so they can differ per environment).
// The keys are prefixed NEXT_PUBLIC_ so Next.js inlines them at build time for
// the browser bundle. API key alone is not a secret — it is restricted by
// Firebase App Check + Firestore Security Rules + Cloud Function enforcement.
//
// Fallback placeholders keep the SDK from throwing (e.g. getAuth throws
// `auth/invalid-api-key` on an empty key) when no Firebase env vars are set,
// such as during a build/preview without real credentials. Network-backed
// Firebase calls still require real values configured via .env.local.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "0000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:0000000000:web:demo",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Set log level for the Firebase app
if (process.env.NODE_ENV === "development") setLogLevel("debug");

// Initialize Remote Config — browser-only. On the server (e.g. during static
// prerendering) getRemoteConfig throws because Firebase Installations requires a
// real projectId and a browser environment, so we guard it behind a window check.
export let remoteConfig: RemoteConfig | null = null;
if (typeof window !== "undefined") {
  try {
    remoteConfig = getRemoteConfig(app);
    remoteConfig.settings = {
      minimumFetchIntervalMillis: 3600000, // 1 hour for testing, 12 hours for production
      fetchTimeoutMillis: 60000, // Optional: timeout for fetch requests
    };
    remoteConfig.defaultConfig = {
      // Add your default remote config values here
      // example: "feature_flag": false
    };
  } catch (error) {
    console.warn("Firebase Remote Config initialization failed:", error);
  }
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Anonymous Firebase Auth. The app authenticates users via NextAuth, but
// Firestore security rules need a Firebase identity (`request.auth != null`).
// We sign each browser in anonymously so chat / video signaling / live GPS
// pass the rules. Idempotent + memoized — safe to await before any Firestore op.
let authReady: Promise<User | null> | null = null;
export function ensureAuth(): Promise<User | null> {
  if (typeof window === "undefined") return Promise.resolve(null); // server: skip
  if (authReady) return authReady;
  authReady = new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsub();
        resolve(user);
      }
    });
    if (!auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        unsub();
        reject(err);
      });
    }
  });
  return authReady;
}

// Enable offline persistence for Firestore
// This allows the app to work offline and sync when connection is restored
if (typeof window !== "undefined") {
  // Only run in browser environment
  import("firebase/firestore").then(({ enableIndexedDbPersistence }) => {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === "failed-precondition") {
        // Multiple tabs open, persistence can only be enabled in one tab at a time
        console.warn("Firestore persistence failed: Multiple tabs open");
      } else if (err.code === "unimplemented") {
        // Browser doesn't support persistence
        console.warn("Firestore persistence not supported in this browser");
      }
    });
  });
}

// Network status management
export const enableFirestoreNetwork = async () => {
  try {
    await enableNetwork(db);
    console.log("Firestore network enabled");
  } catch (error) {
    console.error("Failed to enable Firestore network:", error);
  }
};

export const disableFirestoreNetwork = async () => {
  try {
    await disableNetwork(db);
    console.log("Firestore network disabled");
  } catch (error) {
    console.error("Failed to disable Firestore network:", error);
  }
};

export default app;
