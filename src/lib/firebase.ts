import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const rawAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const authDomain =
  rawAuthDomain && !rawAuthDomain.includes("yuanware-730466024438")
    ? rawAuthDomain
    : "site-yuanware-roupas.firebaseapp.com";

const rawProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const projectId =
  rawProjectId && rawProjectId !== "yuanware-730466024438"
    ? rawProjectId
    : "site-yuanware-roupas";

const rawStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const storageBucket =
  rawStorageBucket && !rawStorageBucket.includes("yuanware-730466024438")
    ? rawStorageBucket
    : "site-yuanware-roupas.firebasestorage.app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyD1Ei65PCRwcJzSzN-UnyArtUUOB_PlnOA",
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "730466024438",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:730466024438:web:placeholder",
};

export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "AIzaSyPlaceholderChangeInConsole" &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "AIzaSyDummyPlaceholderForBuild"
);

// Initialize Firebase safely
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db: Firestore = getFirestore(app);

export default app;
