import { type NextRequest, NextResponse } from "next/server"
import { createDialogflowCXClient, AGENT_CONFIG } from "@/lib/dialogflow"

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, agentId } = await request.json()

    if (!message || !sessionId || !agentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // agent configuration
    const agentConfig = AGENT_CONFIG[agentId]
    if (!agentConfig) {
      return NextResponse.json({ error: "Invalid agent ID" }, { status: 400 })
    }

    const client = createDialogflowCXClient()
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
    const location = process.env.DIALOGFLOW_LOCATION || "asia-south1"

    if (!projectId) {
      return NextResponse.json({ error: "Project ID not configured" }, { status: 500 })
    }

    // session path for Dialogflow CX using the correct method
    const sessionPath = `projects/${projectId}/locations/${location}/agents/${agentConfig.agentId}/sessions/${sessionId}`

    // request for Dialogflow CX
    const request_dialogflow = {
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
        },
        languageCode: "en",
      },
    }

    console.log(`Processing message for agent: ${agentId} (${agentConfig.agentId}), session: ${sessionId}`)
    console.log(`Session path: ${sessionPath}`)

    const [response] = await client.detectIntent(request_dialogflow)

    // Extracting response text from Dialogflow CX response
    let fulfillmentText = "Sorry, I didn't understand that."
    if (response.queryResult?.responseMessages && response.queryResult.responseMessages.length > 0) {
      const firstMessage = response.queryResult.responseMessages[0]
      if (firstMessage.text && firstMessage.text.text && firstMessage.text.text.length > 0) {
        fulfillmentText = firstMessage.text.text[0]
      }
    }

    return NextResponse.json({
      fulfillmentText,
      intent: response.queryResult?.intent?.displayName,
      confidence: response.queryResult?.intentDetectionConfidence,
      parameters: response.queryResult?.parameters,
      agentId: agentId,
      sessionId: sessionId,
    })
  } catch (error) {
    console.error("Dialogflow CX API error:", error)

    if (error instanceof Error) {
      if (error.message.includes("NOT_FOUND")) {
        return NextResponse.json(
          {
            error: "Dialogflow CX agent not found. Please check your agent configuration.",
            details: error.message,
          },
          { status: 404 },
        )
      }
      if (error.message.includes("PERMISSION_DENIED")) {
        return NextResponse.json(
          {
            error: "Permission denied. Please check your service account permissions.",
            details: error.message,
          },
          { status: 403 },
        )
      }
      if (error.message.includes("UNAUTHENTICATED")) {
        return NextResponse.json(
          {
            error: "Authentication failed. Please check your service account credentials.",
            details: error.message,
          },
          { status: 401 },
        )
      }
    }

    return NextResponse.json(
      {
        error: "Failed to process message",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
