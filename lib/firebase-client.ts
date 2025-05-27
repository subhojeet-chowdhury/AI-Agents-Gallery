// Client-side Firebase for storing feedback and analytics
import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)

// Feedback and Analytics Types
export interface ChatFeedback {
  id?: string
  userId: string
  userName: string
  userEmail: string
  agentId: string
  agentName: string
  sessionId: string
  rating: number // 1-5 stars
  comment?: string
  timestamp: Timestamp
  messageCount: number
  chatDuration: number // in seconds
}

export interface AgentAnalytics {
  id?: string
  agentId: string
  agentName: string
  date: string // YYYY-MM-DD format
  totalChats: number
  totalMessages: number
  averageRating: number
  totalFeedbacks: number
  averageChatDuration: number
  timestamp: Timestamp
}

export interface UserActivity {
  id?: string
  userId: string
  userName: string
  userEmail: string
  action: "login" | "chat_start" | "chat_end" | "feedback_submit"
  agentId?: string
  sessionId?: string
  timestamp: Timestamp
  metadata?: Record<string, any>
}

// Feedback Functions
export async function submitFeedback(feedback: Omit<ChatFeedback, "id" | "timestamp">) {
  try {
    const docRef = await addDoc(collection(db, "chat_feedback"), {
      ...feedback,
      timestamp: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error submitting feedback:", error)
    throw error
  }
}

// Analytics Functions
export async function logUserActivity(activity: Omit<UserActivity, "id" | "timestamp">) {
  try {
    await addDoc(collection(db, "user_activity"), {
      ...activity,
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error logging user activity:", error)
  }
}

export async function updateAgentAnalytics(analytics: Omit<AgentAnalytics, "id" | "timestamp">) {
  try {
    await addDoc(collection(db, "agent_analytics"), {
      ...analytics,
      timestamp: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating agent analytics:", error)
  }
}

// Data Fetching Functions
export async function getFeedbackData(agentId?: string, days = 30) {
  try {
    const feedbackRef = collection(db, "chat_feedback")
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    let q = query(feedbackRef, where("timestamp", ">=", Timestamp.fromDate(cutoffDate)), orderBy("timestamp", "desc"))

    if (agentId) {
      q = query(
        feedbackRef,
        where("agentId", "==", agentId),
        where("timestamp", ">=", Timestamp.fromDate(cutoffDate)),
        orderBy("timestamp", "desc"),
      )
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatFeedback[]
  } catch (error) {
    console.error("Error fetching feedback data:", error)
    return []
  }
}

export async function getAnalyticsData(days = 30) {
  try {
    const analyticsRef = collection(db, "agent_analytics")
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const q = query(
      analyticsRef,
      where("timestamp", ">=", Timestamp.fromDate(cutoffDate)),
      orderBy("timestamp", "desc"),
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as AgentAnalytics[]
  } catch (error) {
    console.error("Error fetching analytics data:", error)
    return []
  }
}

export async function getUserActivityData(days = 30) {
  try {
    const activityRef = collection(db, "user_activity")
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const q = query(activityRef, where("timestamp", ">=", Timestamp.fromDate(cutoffDate)), orderBy("timestamp", "desc"))

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserActivity[]
  } catch (error) {
    console.error("Error fetching user activity data:", error)
    return []
  }
}

export default app
