import type { ChatFeedback, UserActivity } from "@/lib/firebase-client"
import { AGENT_CONFIG } from "@/lib/agent-config"

// Export utilities for different formats
export interface ExportData {
  feedback: ChatFeedback[]
  activity: UserActivity[]
  dateRange: { start: Date; end: Date }
}

export function exportToCSV(data: any[], filename: string, headers: string[]) {
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header.toLowerCase().replace(/\s+/g, "")]
          return typeof value === "string" && value.includes(",") ? `"${value}"` : value
        })
        .join(","),
    ),
  ].join("\n")

  downloadFile(csvContent, `${filename}.csv`, "text/csv")
}

export function exportFeedbackToCSV(feedback: ChatFeedback[]) {
  const headers = [
    "Date",
    "User Name",
    "User Email",
    "Agent Name",
    "Rating",
    "Comment",
    "Message Count",
    "Chat Duration",
    "Session ID",
  ]

  const data = feedback.map((f) => ({
    date: f.timestamp.toDate().toLocaleDateString(),
    username: f.userName,
    useremail: f.userEmail,
    agentname: f.agentName,
    rating: f.rating,
    comment: f.comment || "",
    messagecount: f.messageCount,
    chatduration: `${Math.floor(f.chatDuration / 60)}m ${f.chatDuration % 60}s`,
    sessionid: f.sessionId,
  }))

  exportToCSV(data, "feedback-report", headers)
}

export function exportActivityToCSV(activity: UserActivity[]) {
  const headers = ["Date", "Time", "User Name", "User Email", "Action", "Agent ID", "Session ID", "Metadata"]

  const data = activity.map((a) => ({
    date: a.timestamp.toDate().toLocaleDateString(),
    time: a.timestamp.toDate().toLocaleTimeString(),
    username: a.userName,
    useremail: a.userEmail,
    action: a.action,
    agentid: a.agentId || "",
    sessionid: a.sessionId || "",
    metadata: JSON.stringify(a.metadata || {}),
  }))

  exportToCSV(data, "activity-report", headers)
}

export function generateUsageReport(feedback: ChatFeedback[], activity: UserActivity[]) {
  // Dynamically generate stats for all agents in the config
  const agentStats = Object.keys(AGENT_CONFIG).map((agentId) => {
    const agentFeedback = feedback.filter((f) => f.agentId === agentId)
    const agentActivity = activity.filter((a) => a.agentId === agentId)
    const totalDuration = agentFeedback.reduce((sum, f) => sum + f.chatDuration, 0)

    return {
      agentname: AGENT_CONFIG[agentId].name,
      totalchats: agentFeedback.length,
      averagerating:
        agentFeedback.length > 0
          ? (agentFeedback.reduce((sum, f) => sum + f.rating, 0) / agentFeedback.length).toFixed(1)
          : "0",
      totalmessages: agentFeedback.reduce((sum, f) => sum + f.messageCount, 0),
      averageduration:
        agentFeedback.length > 0
          ? `${Math.floor(totalDuration / agentFeedback.length / 60)}m ${Math.round((totalDuration / agentFeedback.length) % 60)}s`
          : "0s",
      positiverating: agentFeedback.filter((f) => f.rating >= 4).length,
      negativerating: agentFeedback.filter((f) => f.rating <= 2).length,
    }
  })

  const headers = [
    "Agent Name",
    "Total Chats",
    "Average Rating",
    "Total Messages",
    "Average Duration",
    "Positive Rating",
    "Negative Rating",
  ]

  exportToCSV(agentStats, "usage-report", headers)
}

export function generateSatisfactionReport(feedback: ChatFeedback[]) {
  // Daily satisfaction trends
  const dailyStats = feedback.reduce(
    (acc, f) => {
      const date = f.timestamp.toDate().toDateString()
      if (!acc[date]) {
        acc[date] = { ratings: [], count: 0 }
      }
      acc[date].ratings.push(f.rating)
      acc[date].count++
      return acc
    },
    {} as Record<string, { ratings: number[]; count: number }>,
  )

  const data = Object.entries(dailyStats).map(([date, stats]) => ({
    date,
    totalfeedbacks: stats.count,
    averagerating: (stats.ratings.reduce((sum, r) => sum + r, 0) / stats.count).toFixed(1),
    fivestar: stats.ratings.filter((r) => r === 5).length,
    fourstar: stats.ratings.filter((r) => r === 4).length,
    threestar: stats.ratings.filter((r) => r === 3).length,
    twostar: stats.ratings.filter((r) => r === 2).length,
    onestar: stats.ratings.filter((r) => r === 1).length,
  }))

  const headers = ["Date", "Total Feedbacks", "Average Rating", "5 Star", "4 Star", "3 Star", "2 Star", "1 Star"]

  exportToCSV(data, "satisfaction-report", headers)
}

export function generatePerformanceReport(feedback: ChatFeedback[], activity: UserActivity[]) {
  const uniqueUsers = new Set(feedback.map((f) => f.userId)).size
  const totalSessions = new Set(feedback.map((f) => f.sessionId)).size
  const totalMessages = feedback.reduce((sum, f) => sum + f.messageCount, 0)
  const averageRating = feedback.length > 0 ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : 0

  const performanceData = [
    {
      metric: "Total Users",
      value: uniqueUsers,
      period: "Last 30 Days",
    },
    {
      metric: "Total Sessions",
      value: totalSessions,
      period: "Last 30 Days",
    },
    {
      metric: "Total Messages",
      value: totalMessages,
      period: "Last 30 Days",
    },
    {
      metric: "Average Rating",
      value: averageRating.toFixed(1),
      period: "Last 30 Days",
    },
    {
      metric: "User Satisfaction Rate",
      value: `${((feedback.filter((f) => f.rating >= 4).length / feedback.length) * 100).toFixed(1)}%`,
      period: "Last 30 Days",
    },
  ]

  const headers = ["Metric", "Value", "Period"]
  exportToCSV(performanceData, "performance-report", headers)
}

function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// Generate comprehensive PDF report (would need a PDF library like jsPDF)
export function generatePDFReport(data: ExportData) {
  // For now, we'll create a detailed text report
  const { feedback, activity, dateRange } = data

  const report = `
ENTERPRISE AI HUB - ANALYTICS REPORT
Generated: ${new Date().toLocaleString()}
Period: ${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}

=== SUMMARY ===
Total Conversations: ${feedback.length}
Unique Users: ${new Set(feedback.map((f) => f.userId)).size}
Average Rating: ${feedback.length > 0 ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1) : 0}/5
Total Messages: ${feedback.reduce((sum, f) => sum + f.messageCount, 0)}

=== AGENT PERFORMANCE ===
${Object.keys(AGENT_CONFIG)
  .map((agentId) => {
    const agentFeedback = feedback.filter((f) => f.agentId === agentId)
    const avgRating =
      agentFeedback.length > 0
        ? (agentFeedback.reduce((sum, f) => sum + f.rating, 0) / agentFeedback.length).toFixed(1)
        : "0"
    return `${AGENT_CONFIG[agentId].name}: ${agentFeedback.length} chats, ${avgRating}/5 rating`
  })
  .join("\n")}

=== RATING DISTRIBUTION ===
5 Stars: ${feedback.filter((f) => f.rating === 5).length}
4 Stars: ${feedback.filter((f) => f.rating === 4).length}
3 Stars: ${feedback.filter((f) => f.rating === 3).length}
2 Stars: ${feedback.filter((f) => f.rating === 2).length}
1 Star: ${feedback.filter((f) => f.rating === 1).length}

=== USER ACTIVITY ===
Total Login Events: ${activity.filter((a) => a.action === "login").length}
Total Chat Sessions: ${activity.filter((a) => a.action === "chat_start").length}
Total Feedback Submissions: ${activity.filter((a) => a.action === "feedback_submit").length}
  `.trim()

  downloadFile(report, "ai-hub-report.txt", "text/plain")
}
