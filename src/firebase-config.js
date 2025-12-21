import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Detect if running on local network
const hostname = window.location.hostname;
const isLocalNetwork = hostname.startsWith('192.168.') || 
                       hostname.startsWith('10.') || 
                       hostname.startsWith('172.') ||
                       hostname === 'localhost';

// Connect to emulators
if (isLocalNetwork) {
  console.log('🔧 Connecting to Firebase Emulators...');
  console.log('🌐 Host:', hostname);
  
  // Use the actual hostname for emulator connections
  const emulatorHost = hostname === 'localhost' ? 'localhost' : hostname;
  
  try {
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
    console.log('✅ Auth Emulator connected');
  } catch (error) {
    console.log('Auth emulator already connected');
  }
  
  try {
    connectFirestoreEmulator(db, emulatorHost, 8080);
    console.log('✅ Firestore Emulator connected');
  } catch (error) {
    console.log('Firestore emulator already connected');
  }
  
  try {
    connectFunctionsEmulator(functions, emulatorHost, 5001);
    console.log('✅ Functions Emulator connected');
  } catch (error) {
    console.log('Functions emulator already connected');
  }
}

export default app;