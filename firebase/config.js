import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // --- ADDED: Import for Storage ---


// --- PASTE YOUR FIREBASE WEB CONFIG HERE ---
// You can get this from your Firebase project settings
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAY7bnfgdDD_oVbA0dkWvYwAn512Pz2Wxs",
  authDomain: "moboflix-beb33.firebaseapp.com",
  projectId: "moboflix-beb33",
  storageBucket: "moboflix-beb33.firebasestorage.app",
  messagingSenderId: "70346121750",
  appId: "1:70346121750:web:8b6b84b9e9e7afbd94cb37"
};

// Initialize Firebase for Server-Side Rendering (SSR), prevent re-initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // --- ADDED: Initialize Storage ---

export { app, db, auth, storage }; // --- ADDED: Export Storage ---
