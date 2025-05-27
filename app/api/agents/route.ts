import { NextResponse } from "next/server"
import type { DialogflowAgent } from "@/lib/dialogflow"
import { AGENT_CONFIG } from "@/lib/agent-config"

const agents: DialogflowAgent[] = Object.entries(AGENT_CONFIG).map(([id, config]) => ({
  id,
  name: config.name,
  description: config.description,
  avatar: "",
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || "",
  languageCode: "en",
  capabilities: config.capabilities,
  icon: config.icon,
  color: config.color,
}))

export async function GET() {
  return NextResponse.json(agents)
}
