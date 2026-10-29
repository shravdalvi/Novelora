import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore'
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD4JqGhlIXYxU82d9o4IVnysYRkQ2S52nA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'novelora-60cfc.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'novelora-60cfc',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'novelora-60cfc.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '559347037278',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:559347037278:web:57d420518e626f7f3af0cf',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-V5WSWTHGQ6',
}

const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
const auth: Auth = getAuth(app)
const db: Firestore = getFirestore(app)
const storage: FirebaseStorage = getStorage(app)
const functions: Functions = getFunctions(app)

// Connect to emulators if specified and not already connected
const useEmulator = import.meta.env.VITE_USE_EMULATOR === 'true'

if (useEmulator && typeof window !== 'undefined') {
  const globalWithEmulators = window as typeof window & { _emulatorsConnected?: boolean }
  if (!globalWithEmulators._emulatorsConnected) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
      connectFirestoreEmulator(db, 'localhost', 8080)
      connectFunctionsEmulator(functions, 'localhost', 5001)
      connectStorageEmulator(storage, 'localhost', 9199)
      globalWithEmulators._emulatorsConnected = true
      console.info('[Firebase] Connected to local emulators')
    } catch (err) {
      console.warn('[Firebase] Emulator connection failed or already initialized:', err)
    }
  }
}

export { app, auth, db, storage, functions }
