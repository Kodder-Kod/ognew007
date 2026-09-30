import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth"; 
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBc3r3uMmoW7drvCRWmdKIATrVsYzwo5O0",
  authDomain: "chisendposproduction0011.firebaseapp.com",
  databaseURL: "https://chisendposproduction0011-default-rtdb.firebaseio.com",
  projectId: "chisendposproduction0011",
  storageBucket: "chisendposproduction0011.firebasestorage.app",
  messagingSenderId: "908193917197",
  appId: "1:908193917197:web:d3adf088e7eec9e8e2e844",
  measurementId: "G-YSQ1529H9T"
};

const app = initializeApp(firebaseConfig);

// Initialize Firebase services using the modular SDK
const db = getDatabase(app);

// Initialize Firebase Auth with React Native persistence
const auth = getAuth(app);

export { db, auth };


