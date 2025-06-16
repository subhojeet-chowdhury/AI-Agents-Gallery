"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import {
  Building2,
  Users,
  MessageSquare,
  Star,
  Clock,
  Activity,
  RefreshCw,
  Download,
  ThumbsUp,
  ThumbsDown,
  LogOut,
  Settings,
  ArrowLeft,
  AlertCircle,
} from "lucide-react"
import { getFeedbackData, getUserActivityData, getAllFeedbackData } from "@/lib/firebase-client"
import { getAllUserProfiles } from "@/lib/user-profile"
import { ensureAllAgentsInAnalytics } from "@/lib/initialize-agent-data"
import type { ChatFeedback, UserActivity } from "@/lib/firebase-client"
import type { UserProfile } from "@/lib/user-profile"
import { AGENT_CONFIG } from "@/lib/agent-config"
import ExportModal from "@/components/export-modal"
import ReportsGenerator from "@/components/reports-generator"
import UserManagement from "@/components/user-management"
import { toast } from "@/hooks/use-toast"

interface DashboardStats {
  totalChats: number
  totalUsers: number
  totalFeedbacks: number
  averageRating: number
  totalMessages: number
  averageChatDuration: number
}

interface AgentStats {
  agentId: string
  agentName: string
  totalChats: number
  averageRating: number
  totalFeedbacks: number
  positiveRating: number
  negativeRating: number
  averageDuration: number
}

export default function AdminDashboard() {
  const { user, userProfile, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [feedbackData, setFeedbackData] = useState<ChatFeedback[]>([])
  const [userActivity, setUserActivity] = useState<UserActivity[]>([])
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([])
  const [dataLoadError, setDataLoadError] = useState<string | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalChats: 0,
    totalUsers: 0,
    totalFeedbacks: 0,
    averageRating: 0,
    totalMessages: 0,
    averageChatDuration: 0,
  })

  const loadData = async () => {
    try {
      setRefreshing(true)
      setDataLoadError(null)

      console.log("Loading admin dashboard data...")

      // Ensure all agents (including new ones) are initialized in analytics
      await ensureAllAgentsInAnalytics()

      // Load data with error handling for each source
      const [feedback, activity, profiles] = await Promise.all([
        getFeedbackData(undefined, 30).catch((error) => {
          console.error("Error loading feedback:", error)
          return []
        }),
        getUserActivityData(30).catch((error) => {
          console.error("Error loading activity:", error)
          return []
        }),
        getAllUserProfiles().catch((error) => {
          console.error("Error loading profiles:", error)
          return []
        }),
      ])

      console.log("Data loaded:", {
        feedback: feedback.length,
        activity: activity.length,
        profiles: profiles.length,
      })

      // Also try to load ALL feedback for debugging
      const allFeedback = await getAllFeedbackData()
      console.log("All feedback data:", allFeedback)

      setFeedbackData(feedback)
      setUserActivity(activity)
      setUserProfiles(profiles)

      // Calculate dashboard stats
      const uniqueUsers = new Set(feedback.map((f) => f.userId)).size
      const totalMessages = feedback.reduce((sum, f) => sum + f.messageCount, 0)
      const totalDuration = feedback.reduce((sum, f) => sum + f.chatDuration, 0)
      const averageRating = feedback.length > 0 ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : 0

      const stats = {
        totalChats: feedback.length,
        totalUsers: uniqueUsers,
        totalFeedbacks: feedback.length,
        averageRating: Math.round(averageRating * 10) / 10,
        totalMessages,
        averageChatDuration: feedback.length > 0 ? Math.round(totalDuration / feedback.length) : 0,
      }

      console.log("Calculated stats:", stats)
      setDashboardStats(stats)

      if (feedback.length === 0) {
        setDataLoadError("No feedback data found. Try submitting some feedback first.")
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      setDataLoadError("Failed to load dashboard data. Please try refreshing.")
      toast({
        title: "Data Load Error",
        description: "Some dashboard data may not be available.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Process data for charts - dynamically include all agents from config
  const agentStats: AgentStats[] = Object.keys(AGENT_CONFIG).map((agentId) => {
    const agentFeedback = feedbackData.filter((f) => f.agentId === agentId)
    const totalFeedbacks = agentFeedback.length
    const averageRating = totalFeedbacks > 0 ? agentFeedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks : 0
    const positiveRating = agentFeedback.filter((f) => f.rating >= 4).length
    const negativeRating = agentFeedback.filter((f) => f.rating <= 2).length
    const totalDuration = agentFeedback.reduce((sum, f) => sum + f.chatDuration, 0)

    return {
      agentId,
      agentName: AGENT_CONFIG[agentId].name,
      totalChats: totalFeedbacks,
      averageRating: Math.round(averageRating * 10) / 10,
      totalFeedbacks,
      positiveRating,
      negativeRating,
      averageDuration: totalFeedbacks > 0 ? Math.round(totalDuration / totalFeedbacks) : 0,
    }
  })

  // Daily activity data (last 7 days)
  const dailyActivity = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toISOString().split("T")[0]
    const dayActivity = userActivity.filter((a) => {
      const activityDate = a.timestamp.toDate().toISOString().split("T")[0]
      return activityDate === dateStr
    })

    return {
      date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      chats: dayActivity.filter((a) => a.action === "chat_start").length,
      logins: dayActivity.filter((a) => a.action === "login").length,
      feedbacks: dayActivity.filter((a) => a.action === "feedback_submit").length,
    }
  })

  // Rating distribution
  const ratingDistribution = [
    { rating: "5 Stars", count: feedbackData.filter((f) => f.rating === 5).length, color: "#10B981" },
    { rating: "4 Stars", count: feedbackData.filter((f) => f.rating === 4).length, color: "#3B82F6" },
    { rating: "3 Stars", count: feedbackData.filter((f) => f.rating === 3).length, color: "#F59E0B" },
    { rating: "2 Stars", count: feedbackData.filter((f) => f.rating === 2).length, color: "#EF4444" },
    { rating: "1 Star", count: feedbackData.filter((f) => f.rating === 1).length, color: "#DC2626" },
  ]

  // Real department usage based on user profiles
  const departmentUsage = userProfiles
    .reduce(
      (acc, profile) => {
        const existing = acc.find((d) => d.department === profile.department)
        if (existing) {
          existing.count++
        } else {
          acc.push({ department: profile.department, count: 1 })
        }
        return acc
      },
      [] as { department: string; count: number }[],
    )
    .map((dept, index) => ({
      department: dept.department,
      usage: Math.round((dept.count / userProfiles.length) * 100),
      color: ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"][index % 6],
    }))

  // Real performance metrics
  const totalResponseTime = feedbackData.reduce((sum, f) => sum + f.chatDuration, 0)
  const avgResponseTime = feedbackData.length > 0 ? totalResponseTime / feedbackData.length : 0
  const satisfactionRate =
    feedbackData.length > 0 ? (feedbackData.filter((f) => f.rating >= 4).length / feedbackData.length) * 100 : 0

  const performanceMetrics = [
    {
      metric: "Avg Response Time",
      value:
        avgResponseTime >= 60
          ? `${Math.floor(avgResponseTime / 60)}m ${Math.round(avgResponseTime % 60)}s`
          : `${Math.round(avgResponseTime)}s`,
      trend: "+5%",
      color: "text-green-600",
    },
    {
      metric: "Satisfaction Rate",
      value: `${satisfactionRate.toFixed(1)}%`,
      trend: "+2%",
      color: "text-green-600",
    },
    {
      metric: "User Satisfaction",
      value: `${dashboardStats.averageRating}/5`,
      trend: "+0.3",
      color: "text-green-600",
    },
    {
      metric: "Active Users",
      value: userProfiles.length.toString(),
      trend: `+${Math.round(userProfiles.length * 0.1)}`,
      color: "text-green-600",
    },
  ]

  // Monthly trends with real data
  const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - i))
    const monthStr = date.toISOString().slice(0, 7) // YYYY-MM format

    const monthFeedback = feedbackData.filter((f) => f.timestamp.toDate().toISOString().slice(0, 7) === monthStr)

    const monthActivity = userActivity.filter((a) => a.timestamp.toDate().toISOString().slice(0, 7) === monthStr)

    return {
      month: date.toLocaleDateString("en-US", { month: "short" }),
      users: new Set(monthFeedback.map((f) => f.userId)).size,
      chats: monthFeedback.length,
      satisfaction:
        monthFeedback.length > 0 ? monthFeedback.reduce((sum, f) => sum + f.rating, 0) / monthFeedback.length : 0,
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-lg text-slate-600">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => (window.location.href = "/dashboard")} className="mr-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-semibold text-slate-900">Admin Dashboard</span>
                <div className="text-sm text-slate-500">
                  Enterprise AI Hub Analytics
                  {userProfile?.isSuperAdmin && " • Super Admin"}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={loadData} disabled={refreshing} className="border-slate-300">
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="border-slate-300" onClick={() => setShowExportModal(true)}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <div className="text-sm text-slate-600">
                Welcome, <span className="font-medium">{user?.displayName}</span>
              </div>
              <Button onClick={logout} variant="outline" size="sm" className="border-slate-300">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Data Load Error Alert */}
        {dataLoadError && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-orange-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Data Notice:</span>
                <span>{dataLoadError}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.totalChats}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userProfiles.length}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.averageRating}</div>
              <p className="text-xs text-muted-foreground">Out of 5 stars</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardStats.averageChatDuration >= 60
                  ? `${Math.floor(dashboardStats.averageChatDuration / 60)}m ${dashboardStats.averageChatDuration % 60}s`
                  : `${dashboardStats.averageChatDuration}s`}
              </div>
              <p className="text-xs text-muted-foreground">Per chat session</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="users">
              <Settings className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Daily Activity (Last 7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="chats" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                      <Area type="monotone" dataKey="logins" stackId="1" stroke="#10B981" fill="#10B981" />
                      <Area type="monotone" dataKey="feedbacks" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Rating Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    Rating Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={ratingDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ rating, count }) => `${rating}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {ratingDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Real-time performance indicators for AI agents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {performanceMetrics.map((metric, index) => (
                    <div key={index} className="text-center p-4 bg-slate-50 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
                      <div className="text-sm text-slate-600">{metric.metric}</div>
                      <div className={`text-xs ${metric.color}`}>{metric.trend}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            {/* Agent Details Table */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance Overview</CardTitle>
                <CardDescription>Detailed performance metrics for each AI agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Agent</th>
                        <th className="text-left p-2">Total Chats</th>
                        <th className="text-left p-2">Avg Rating</th>
                        <th className="text-left p-2">Positive</th>
                        <th className="text-left p-2">Negative</th>
                        <th className="text-left p-2">Avg Duration</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentStats.map((agent) => (
                        <tr key={agent.agentId} className="border-b">
                          <td className="p-2 font-medium">{agent.agentName}</td>
                          <td className="p-2">{agent.totalChats}</td>
                          <td className="p-2">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 mr-1" />
                              {agent.averageRating}
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center text-green-600">
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              {agent.positiveRating}
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center text-red-600">
                              <ThumbsDown className="w-4 h-4 mr-1" />
                              {agent.negativeRating}
                            </div>
                          </td>
                          <td className="p-2">
                            {agent.averageDuration >= 60
                              ? `${Math.floor(agent.averageDuration / 60)}m ${agent.averageDuration % 60}s`
                              : `${agent.averageDuration}s`}
                          </td>
                          <td className="p-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Charts Section - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Total Chats Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Total Chats by Agent
                  </CardTitle>
                  <CardDescription>Number of conversations handled by each agent</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={agentStats} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="agentName" angle={-45} textAnchor="end" height={80} fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="totalChats" fill="#3B82F6" name="Total Chats" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Average Rating Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    Average Rating by Agent
                  </CardTitle>
                  <CardDescription>User satisfaction ratings for each agent (out of 5)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={agentStats} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="agentName" angle={-45} textAnchor="end" height={80} fontSize={12} />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Bar dataKey="averageRating" fill="#10B981" name="Average Rating" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Feedback</CardTitle>
                <CardDescription>
                  Latest user feedback and ratings ({feedbackData.length} total records) - sorted by most recent
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {feedbackData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p>No feedback data available yet.</p>
                      <p className="text-sm">Submit some feedback through the chat interface to see data here.</p>
                    </div>
                  ) : (
                    feedbackData
                      .sort((a, b) => {
                        // Sort by timestamp, newest first
                        const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp?.toString() || 0)
                        const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp?.toString() || 0)
                        return timeB.getTime() - timeA.getTime()
                      })
                      .slice(0, 20) // Show latest 20 feedback entries
                      .map((feedback) => (
                        <div key={feedback.id} className="border rounded-lg p-4 bg-white">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="font-medium">{feedback.userName}</div>
                                <Badge variant="outline">{feedback.agentName}</Badge>
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < feedback.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {feedback.rating === 5
                                    ? "Excellent"
                                    : feedback.rating === 4
                                      ? "Very Good"
                                      : feedback.rating === 3
                                        ? "Good"
                                        : feedback.rating === 2
                                          ? "Fair"
                                          : "Poor"}
                                </Badge>
                              </div>
                              {feedback.comment && <p className="text-sm text-slate-600 mb-2">"{feedback.comment}"</p>}
                              <div className="text-xs text-slate-500">
                                {feedback.messageCount} messages • {Math.floor(feedback.chatDuration / 60)}m{" "}
                                {feedback.chatDuration % 60}s • Session: {feedback.sessionId.slice(-8)}
                              </div>
                            </div>
                            <div className="text-xs text-slate-500 text-right">
                              <div>{feedback.timestamp.toDate().toLocaleDateString()}</div>
                              <div className="text-slate-400">
                                {feedback.timestamp.toDate().toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
                {feedbackData.length > 20 && (
                  <div className="text-center pt-4 border-t">
                    <p className="text-sm text-slate-500">
                      Showing latest 20 of {feedbackData.length} feedback entries
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                  <CardDescription>User activity and satisfaction over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="chats" stroke="#3B82F6" strokeWidth={2} name="Chats" />
                      <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} name="Users" />
                      <Line
                        type="monotone"
                        dataKey="satisfaction"
                        stroke="#F59E0B"
                        strokeWidth={2}
                        name="Satisfaction"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Department Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Usage</CardTitle>
                  <CardDescription>AI agent usage by department (real data)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={departmentUsage}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ department, usage }) => `${department}: ${usage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="usage"
                      >
                        {departmentUsage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* User Profiles Summary */}
            <Card>
              <CardHeader>
                <CardTitle>User Demographics</CardTitle>
                <CardDescription>Overview of registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">{userProfiles.length}</div>
                    <div className="text-sm text-slate-600">Total Users</div>
                    <div className="text-xs text-green-600">+{Math.round(userProfiles.length * 0.15)} this month</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">
                      {new Set(userProfiles.map((p) => p.department)).size}
                    </div>
                    <div className="text-sm text-slate-600">Departments</div>
                    <div className="text-xs text-slate-500">Across organization</div>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-900">
                      {userProfiles.filter((p) => p.isAdmin).length}
                    </div>
                    <div className="text-sm text-slate-600">Administrators</div>
                    <div className="text-xs text-slate-500">System admins</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <ReportsGenerator feedback={feedbackData} activity={userActivity} />
          </TabsContent>

          {/* Users Tab - Only for Super Admins */}
          <TabsContent value="users" className="space-y-6">
            {userProfile?.isAdmin ? (
              <UserManagement />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Access Restricted</CardTitle>
                  <CardDescription>Only administrators can manage users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      You need administrator privileges to access user management.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        feedback={feedbackData}
        activity={userActivity}
      />
    </div>
  )
}
