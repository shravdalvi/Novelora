import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  User as FirebaseUser,
  IdTokenResult,
  NextOrObserver,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'

const googleProvider = new GoogleAuthProvider()

/**
 * Sign in existing user with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

/**
 * Sign up a new user with email, password, and display name
 */
export async function signUpWithEmail(email: string, password: string, name: string): Promise<FirebaseUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user

  await updateProfile(user, { displayName: name })

  // Initialize reader profile document in Firestore
  const userRef = doc(db, 'users', user.uid)
  await setDoc(userRef, {
    uid: user.uid,
    name: name || 'Reader',
    email: user.email,
    avatarUrl: user.photoURL || '',
    role: 'reader',
    createdAt: serverTimestamp(),
  }, { merge: true })

  return user
}

/**
 * Sign in or sign up with Google popup
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider)
  const user = result.user

  // Ensure user doc exists
  const userRef = doc(db, 'users', user.uid)
  const snapshot = await getDoc(userRef)
  if (!snapshot.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName || 'Reader',
      email: user.email,
      avatarUrl: user.photoURL || '',
      role: 'reader',
      createdAt: serverTimestamp(),
    })
  }

  return user
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  await fbSignOut(auth)
}

/**
 * Get currently authenticated Firebase user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: NextOrObserver<FirebaseUser | null>) {
  return onAuthStateChanged(auth, callback)
}

/**
 * Get current ID token result to check custom claims (e.g. admin claim)
 */
export async function getIdTokenResult(forceRefresh = false): Promise<IdTokenResult | null> {
  const currentUser = auth.currentUser
  if (!currentUser) return null
  return await currentUser.getIdTokenResult(forceRefresh)
}

/**
 * Check if the current user has admin privileges
 */
export async function checkIsAdmin(): Promise<boolean> {
  const token = await getIdTokenResult()
  return Boolean(token?.claims?.admin)
}
