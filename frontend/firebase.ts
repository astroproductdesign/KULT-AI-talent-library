// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1IA7hRrSTP8XzFYdy5sjqaNlCjCGj60g",
  authDomain: "kult-ai-talent-library.firebaseapp.com",
  projectId: "kult-ai-talent-library",
  storageBucket: "kult-ai-talent-library.firebasestorage.app",
  messagingSenderId: "10592899318",
  appId: "1:10592899318:web:3a173d08489b8f56c7dcd7",
  measurementId: "G-YK4LDY1V2W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only if supported (browser environments)
export const analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);

export default app;
