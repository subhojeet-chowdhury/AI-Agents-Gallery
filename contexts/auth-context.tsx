"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User, onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase"
import { getUserProfile, type UserProfile } from "@/lib/user-profile"

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  needsOnboarding: boolean
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  refreshUserProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  const loadUserProfile = async (currentUser: User) => {
    try {
      const profile = await getUserProfile(currentUser.uid)
      setUserProfile(profile)
      setNeedsOnboarding(!profile) // Show onboarding if no profile exists
    } catch (error) {
      console.error("Error loading user profile:", error)
      setNeedsOnboarding(true)
    }
  }

  const refreshUserProfile = async () => {
    if (user) {
      await loadUserProfile(user)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        await loadUserProfile(user)
      } else {
        setUserProfile(null)
        setNeedsOnboarding(false)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error("Error signing in with Google:", error)
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUserProfile(null)
      setNeedsOnboarding(false)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    needsOnboarding,
    signInWithGoogle,
    logout,
    refreshUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
