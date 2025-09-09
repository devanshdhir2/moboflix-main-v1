import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // --- ADDED: Import for Storage ---


// --- PASTE YOUR FIREBASE WEB CONFIG HERE ---
// You can get this from your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyCKWY1fRc8dQ30Gdr2Dd5W7pwlSKeDtwM4",
  authDomain: "mobofix-app.firebaseapp.com",
  projectId: "mobofix-app",
  storageBucket: "mobofix-app.firebasestorage.app",
  messagingSenderId: "369946427303",
  appId: "1:369946427303:web:5c711390016aeb6a9cc082",
  measurementId: "G-KF2QFT1B8B"
};

// Initialize Firebase for Server-Side Rendering (SSR), prevent re-initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // --- ADDED: Initialize Storage ---

export { app, db, auth, storage }; // --- ADDED: Export Storage ---
