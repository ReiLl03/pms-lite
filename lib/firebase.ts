import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBunoy4twDEy5vEMu3lIGO7lfCDCMN01RY",
  authDomain: "pms-lite.firebaseapp.com",
  projectId: "pms-lite",
  storageBucket: "pms-lite.firebasestorage.app",
  messagingSenderId: "314049999192",
  appId: "1:314049999192:web:74e0795d9b94892c18752d",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

