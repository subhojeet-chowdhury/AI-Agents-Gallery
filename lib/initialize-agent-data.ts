// Script to initialize analytics data for agents in Firestore
import { db } from "./firebase-client"
import { collection, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { AGENT_CONFIG } from "./agent-config"

/**
 * Initializes analytics data for all configured agents
 * This ensures that new agents appear in the dashboard even before they receive interactions
 */
export async function initializeAgentAnalytics() {
  try {
    const today = new Date()
    const dateString = today.toISOString().split("T")[0] // YYYY-MM-DD format

    // Initialize data for each agent in the config
    for (const [agentId, config] of Object.entries(AGENT_CONFIG)) {
      // Check if agent already has an analytics entry for today
      const analyticsRef = collection(db, "agent_analytics")
      const agentDocRef = doc(analyticsRef, `${agentId}-${dateString}`)
      const docSnap = await getDoc(agentDocRef)

      if (!docSnap.exists()) {
        // Create initial analytics entry for the agent
        await setDoc(agentDocRef, {
          agentId,
          agentName: config.name,
          date: dateString,
          totalChats: 0,
          totalMessages: 0,
          averageRating: 0,
          totalFeedbacks: 0,
          averageChatDuration: 0,
          timestamp: serverTimestamp(),
        })
        console.log(`Initialized analytics for ${config.name}`)
      }
    }

    return { success: true, message: "Agent analytics initialized successfully" }
  } catch (error) {
    console.error("Error initializing agent analytics:", error)
    return { success: false, message: "Failed to initialize agent analytics" }
  }
}

/**
 * Ensures all agents have at least one entry in the analytics collection
 * Call this function when the admin dashboard loads
 */
export async function ensureAllAgentsInAnalytics() {
  return initializeAgentAnalytics()
}
