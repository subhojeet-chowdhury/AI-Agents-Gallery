// Client-side Firebase for storing feedback and analytics
import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, Timestamp } from "firebase/firestore"

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
  action: "login" | "chat_start" | "chat_end" | "chat_resume" | "feedback_submit"
  agentId?: string
  sessionId?: string
  timestamp: Timestamp
  metadata?: Record<string, any>
}

export interface ConversationMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Timestamp
  agentResponse?: {
    fulfillmentText: string
    intent?: string
    confidence?: number
  }
}

export interface Conversation {
  id?: string
  userId: string
  userName: string
  agentId: string
  agentName: string
  sessionId: string
  title: string
  lastMessage: string
  lastMessageTime: Timestamp
  messageCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Conversation Functions
export async function saveConversation(conversation: Omit<Conversation, "id" | "createdAt" | "updatedAt">) {
  try {
    const docRef = await addDoc(collection(db, "conversations"), {
      ...conversation,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error saving conversation:", error)
    throw error
  }
}

export async function updateConversation(conversationId: string, updates: Partial<Conversation>) {
  try {
    const { doc, updateDoc } = await import("firebase/firestore")
    await updateDoc(doc(db, "conversations", conversationId), {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating conversation:", error)
    throw error
  }
}

export async function saveMessage(sessionId: string, message: Omit<ConversationMessage, "timestamp">) {
  try {
    // Clean the message data to remove undefined values
    const cleanMessage = {
      id: message.id,
      text: message.text,
      isUser: message.isUser,
      sessionId,
      timestamp: serverTimestamp(),
      // Only include agentResponse if it exists and has valid data
      ...(message.agentResponse &&
        message.agentResponse.fulfillmentText && {
          agentResponse: {
            fulfillmentText: message.agentResponse.fulfillmentText,
            ...(message.agentResponse.intent && { intent: message.agentResponse.intent }),
            ...(message.agentResponse.confidence !== undefined && { confidence: message.agentResponse.confidence }),
          },
        }),
    }

    await addDoc(collection(db, "conversation_messages"), cleanMessage)
  } catch (error) {
    console.error("Error saving message:", error)
    throw error
  }
}

export async function getUserConversations(userId: string, agentId?: string) {
  try {
    const conversationsRef = collection(db, "conversations")
    // Simple query - only filter by userId, no complex ordering
    const q = query(conversationsRef, where("userId", "==", userId))

    const querySnapshot = await getDocs(q)
    const conversations = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Conversation[]

    // Filter by agentId if provided
    const filteredConversations = agentId ? conversations.filter((conv) => conv.agentId === agentId) : conversations

    // Sort on client side to avoid index requirements
    return filteredConversations.sort((a, b) => {
      const aTime = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt.toString())
      const bTime = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt.toString())
      return bTime.getTime() - aTime.getTime()
    })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return []
  }
}

export async function getConversationMessages(sessionId: string) {
  try {
    const messagesRef = collection(db, "conversation_messages")
    // Simple query without ordering to avoid index issues
    const q = query(messagesRef, where("sessionId", "==", sessionId))

    const querySnapshot = await getDocs(q)
    const messages = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ConversationMessage[]

    // Sort on client side
    return messages.sort((a, b) => {
      const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp.toString())
      const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp.toString())
      return aTime.getTime() - bTime.getTime()
    })
  } catch (error) {
    console.error("Error fetching conversation messages:", error)
    return []
  }
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

    let q = query(feedbackRef, where("timestamp", ">=", Timestamp.fromDate(cutoffDate)))

    if (agentId) {
      q = query(feedbackRef, where("agentId", "==", agentId), where("timestamp", ">=", Timestamp.fromDate(cutoffDate)))
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

export async function getUserActivityData(days = 30) {
  try {
    const activityRef = collection(db, "user_activity")
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const q = query(activityRef, where("timestamp", ">=", Timestamp.fromDate(cutoffDate)))

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
