// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdJGEroTfWDcaXFwwKHhE72GpzQVIZYS0",
  authDomain: "taskos-a2080.firebaseapp.com",
  projectId: "taskos-a2080",
  storageBucket: "taskos-a2080.firebasestorage.app",
  messagingSenderId: "221891458549",
  appId: "1:221891458549:web:6c01994bf47a9943321cbc",
  measurementId: "G-QJGX6F9Z5D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);