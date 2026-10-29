import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { updateProfile, type User as FirebaseUser } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut as authSignOut,
  onAuthStateChange,
  getIdTokenResult,
} from '../services/authService'
import type { User } from '../types'

export interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  isAdmin: boolean
  isLoading: boolean
  signIn: (email: string, pass: string) => Promise<FirebaseUser>
  signUp: (email: string, pass: string, name: string) => Promise<FirebaseUser>
  signInGoogle: () => Promise<FirebaseUser>
  signOut: () => Promise<void>
  updateUserProfile: (updates: { name?: string; bio?: string; avatarUrl?: string }) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AUTHOR_ADMIN_EMAILS = [
  'shravanidalvi70@gmail.com',
  'shravanidalvi2606@gmail.com',
]

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (fbUser) => {
      setIsLoading(true)
      setFirebaseUser(fbUser)

      if (fbUser) {
        try {
          const userEmail = fbUser.email?.toLowerCase() || ''
          const isAuthorEmail = AUTHOR_ADMIN_EMAILS.some((e) => e.toLowerCase() === userEmail)
          const tokenResult = await getIdTokenResult(true)
          const hasAdminClaim = Boolean(tokenResult?.claims?.admin) || isAuthorEmail
          setIsAdmin(hasAdminClaim)

          // Fetch full user doc from Firestore
          const userDocRef = doc(db, 'users', fbUser.uid)
          const userSnapshot = await getDoc(userDocRef)

          if (userSnapshot.exists()) {
            const data = userSnapshot.data()
            const isRoleAdmin = hasAdminClaim || data.role === 'admin' || isAuthorEmail
            setUser({
              uid: fbUser.uid,
              name: data.name || fbUser.displayName || (isAuthorEmail ? 'Shravani Dalvi' : 'Reader'),
              email: fbUser.email || '',
              avatarUrl: data.avatarUrl || fbUser.photoURL || undefined,
              bio: data.bio || '',
              role: isRoleAdmin ? 'admin' : 'reader',
              createdAt: data.createdAt || null,
            })
            if (isRoleAdmin) {
              setIsAdmin(true)
            }
          } else {
            setUser({
              uid: fbUser.uid,
              name: fbUser.displayName || (isAuthorEmail ? 'Shravani Dalvi' : 'Reader'),
              email: fbUser.email || '',
              avatarUrl: fbUser.photoURL || undefined,
              bio: '',
              role: hasAdminClaim ? 'admin' : 'reader',
              createdAt: null,
            })
          }
        } catch (err) {
          console.error('Error fetching user claims/doc:', err)
          setUser(null)
          setIsAdmin(false)
        }
      } else {
        setUser(null)
        setIsAdmin(false)
      }

      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleSignIn = async (email: string, pass: string) => {
    return await signInWithEmail(email, pass)
  }

  const handleSignUp = async (email: string, pass: string, name: string) => {
    return await signUpWithEmail(email, pass, name)
  }

  const handleSignInGoogle = async () => {
    return await signInWithGoogle()
  }

  const handleSignOut = async () => {
    await authSignOut()
    setUser(null)
    setFirebaseUser(null)
    setIsAdmin(false)
  }

  const handleUpdateUserProfile = async (updates: { name?: string; bio?: string; avatarUrl?: string }) => {
    if (!firebaseUser) return
    const userDocRef = doc(db, 'users', firebaseUser.uid)
    await setDoc(userDocRef, updates, { merge: true })
    if (updates.name || updates.avatarUrl) {
      await updateProfile(firebaseUser, {
        displayName: updates.name !== undefined ? updates.name : firebaseUser.displayName,
        photoURL: updates.avatarUrl !== undefined ? updates.avatarUrl : firebaseUser.photoURL,
      })
    }
    setUser((prev) => (prev ? { ...prev, ...updates } : null))
  }

  const value: AuthContextType = {
    user,
    firebaseUser,
    isAdmin,
    isLoading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInGoogle: handleSignInGoogle,
    signOut: handleSignOut,
    updateUserProfile: handleUpdateUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
