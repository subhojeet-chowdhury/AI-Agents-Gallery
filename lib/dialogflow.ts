import { SessionsClient } from "@google-cloud/dialogflow-cx"
import { AGENT_CONFIG } from "./agent-config"

// Server-side Dialogflow CX client (for API routes)
export function createDialogflowCXClient() {
  const credentials = {
    type: "service_account",
    project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
    private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.GOOGLE_CLOUD_CLIENT_EMAIL || "")}`,
  }

  // Validate required fields
  const requiredFields = ["project_id", "private_key_id", "private_key", "client_email", "client_id"]
  const missingFields = requiredFields.filter((field) => !credentials[field as keyof typeof credentials])

  if (missingFields.length > 0) {
    throw new Error(`Missing required Google Cloud credentials: ${missingFields.join(", ")}`)
  }

  const location = process.env.DIALOGFLOW_LOCATION || "asia-south1"

  return new SessionsClient({
    credentials,
    projectId: credentials.project_id,
    apiEndpoint: `${location}-dialogflow.googleapis.com`,
  })
}

// Client-side types and interfaces
export interface DialogflowAgent {
  id: string
  name: string
  description: string
  avatar: string
  projectId: string
  languageCode: string
  capabilities: string[]
  icon: string
  color: string
}

export interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  agentResponse?: {
    fulfillmentText: string
    intent?: string
    confidence?: number
  }
}

export { AGENT_CONFIG }
