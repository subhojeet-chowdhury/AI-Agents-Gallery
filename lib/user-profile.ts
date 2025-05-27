// User profile management
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase-client"

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  department: string
  role: string
  location: string
  timezone: string
  isAdmin: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface UserProfileInput {
  department: string
  role: string
  location: string
  timezone: string
}

// Department options
export const DEPARTMENTS = [
  "Human Resources",
  "Information Technology",
  "Finance",
  "Operations",
  "Marketing",
  "Sales",
  "Legal",
  "Customer Support",
  "Research & Development",
  "Other",
]

// Role options
export const ROLES = [
  "Employee",
  "Team Lead",
  "Manager",
  "Senior Manager",
  "Director",
  "VP",
  "C-Level Executive",
  "Contractor",
  "Intern",
]

// Location options (you can expand this)
export const LOCATIONS = [
  "New York, NY",
  "San Francisco, CA",
  "London, UK",
  "Mumbai, India",
  "Singapore",
  "Toronto, Canada",
  "Sydney, Australia",
  "Remote",
  "Other",
]

// Default admin email
const DEFAULT_ADMIN_EMAIL = "subhojeet.chowdhury.work@gmail.com"

// Get user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, "user_profiles", uid))
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile
    }
    return null
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
}

// Create new user profile
export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string,
  photoURL: string | undefined,
  profileData: UserProfileInput,
): Promise<void> {
  try {
    const isAdmin = email === DEFAULT_ADMIN_EMAIL

    const userProfile: Omit<UserProfile, "createdAt" | "updatedAt"> = {
      uid,
      email,
      displayName,
      photoURL,
      department: profileData.department,
      role: profileData.role,
      location: profileData.location,
      timezone: profileData.timezone,
      isAdmin,
    }

    await setDoc(doc(db, "user_profiles", uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error creating user profile:", error)
    throw error
  }
}

// Update user profile
export async function updateUserProfile(uid: string, updates: Partial<UserProfileInput>): Promise<void> {
  try {
    await updateDoc(doc(db, "user_profiles", uid), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

// Get all user profiles (for admin analytics)
export async function getAllUserProfiles(): Promise<UserProfile[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "user_profiles"))
    return querySnapshot.docs.map((doc) => doc.data() as UserProfile)
  } catch (error) {
    console.error("Error getting all user profiles:", error)
    return []
  }
}

// Get users by department
export async function getUsersByDepartment(department: string): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, "user_profiles"), where("department", "==", department))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => doc.data() as UserProfile)
  } catch (error) {
    console.error("Error getting users by department:", error)
    return []
  }
}

// Check if user is admin
export async function checkUserAdmin(uid: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(uid)
    return profile?.isAdmin || false
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}
