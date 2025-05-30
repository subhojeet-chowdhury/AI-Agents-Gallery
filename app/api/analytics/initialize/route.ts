import { NextResponse } from "next/server"
import { initializeAgentAnalytics } from "@/lib/initialize-agent-data"

// API route to initialize agent analytics data
export async function POST() {
  try {
    const result = await initializeAgentAnalytics()

    if (result.success) {
      return NextResponse.json({ message: result.message }, { status: 200 })
    } else {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }
  } catch (error) {
    console.error("Error initializing analytics:", error)
    return NextResponse.json({ error: "Failed to initialize analytics data" }, { status: 500 })
  }
}
