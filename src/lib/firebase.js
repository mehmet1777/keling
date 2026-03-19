import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCEA2ecFDr82utZtrzTBDoPeFFSRCLyYLc", // google-services.json ile eşleştirdik
  authDomain: "keling-baed0.firebaseapp.com",
  projectId: "keling-baed0",
  storageBucket: "keling-baed0.firebasestorage.app",
  messagingSenderId: "914621538684",
  appId: "1:914621538684:web:56edb651484ceec539c4f9",
  measurementId: "G-YH54N8Z3DM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore Database
export const db = getFirestore(app);

// Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Network timeout ayarları
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Mobile için custom domain ayarı
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  auth.useDeviceLanguage();
}

export default app;
