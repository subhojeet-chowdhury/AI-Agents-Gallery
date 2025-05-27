import { SessionsClient } from "@google-cloud/dialogflow-cx"

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

// Agent configuration with your actual agent IDs and default icons
export const AGENT_CONFIG: Record<
  string,
  { agentId: string; name: string; description: string; capabilities: string[]; icon: string; color: string }
> = {
  "digital-workmate": {
    agentId: "6ac26a0a-9c99-4e5f-82cd-3d977475411c",
    name: "Digital Workmate",
    description: "I'm your digital assistant for general workplace queries and productivity support.",
    capabilities: ["General Assistance", "Productivity Tips", "Workplace Guidance", "Quick Help"],
    icon: "Zap",
    color: "bg-blue-500",
  },
  "hr-policy": {
    agentId: "a3ebfe22-d0ad-497c-9404-41286060e00e",
    name: "HR Policy Agent",
    description: "I can help you understand HR policies, procedures, and company guidelines.",
    capabilities: ["HR Policies", "Procedures", "Guidelines", "Compliance"],
    icon: "Users",
    color: "bg-blue-500",
  },
  "learning-development": {
    agentId: "75f1d40c-2032-4098-a2be-25fda3834aad",
    name: "Learning and Development Agent",
    description: "I can help you with training programs, skill development, and career growth opportunities.",
    capabilities: ["Training Programs", "Skill Development", "Career Growth", "Learning Resources"],
    icon: "GraduationCap",
    color: "bg-blue-500",
  },
  "leave-management": {
    agentId: "760f8806-6d55-482e-9865-7501b9fce718",
    name: "Leave Management Agent",
    description: "I can assist you with leave applications, vacation planning, and time-off policies.",
    capabilities: ["Leave Applications", "Vacation Planning", "Time-off Policies", "Absence Management"],
    icon: "Calendar",
    color: "bg-blue-500",
  },
  "benefits-query": {
    agentId: "375770db-4e7a-4a54-914e-8ba4ac94408e",
    name: "Benefits Query Agent",
    description: "I can help you with questions about employee benefits, insurance, and compensation packages.",
    capabilities: ["Benefits Information", "Insurance Queries", "Compensation", "Retirement Plans"],
    icon: "Heart",
    color: "bg-blue-500",
  },
  "case-management": {
    agentId: "2e7a420a-d68b-4d6b-a4ad-be647930c5d0",
    name: "Case Management Agent",
    description: "I can assist you with case tracking, issue resolution, and workflow management.",
    capabilities: ["Case Tracking", "Issue Resolution", "Workflow Management", "Status Updates"],
    icon: "FileText",
    color: "bg-blue-500",
  },
  "it-support": {
    agentId: "ef1b0521-684f-4256-8234-3f1de146fe1c",
    name: "IT Support Agent",
    description: "I can assist you with technical issues, software problems, and IT-related queries.",
    capabilities: ["Technical Support", "Software Issues", "Hardware Help", "System Access"],
    icon: "Monitor",
    color: "bg-blue-500",
  },
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
