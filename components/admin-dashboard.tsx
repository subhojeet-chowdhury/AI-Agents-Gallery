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
  TrendingUp,
  Star,
  Clock,
  Activity,
  BarChart3,
  PieChartIcon,
  RefreshCw,
  Download,
  ThumbsUp,
  ThumbsDown,
  LogOut,
} from "lucide-react"
import { getFeedbackData, getUserActivityData } from "@/lib/firebase-client"
import type { ChatFeedback, UserActivity } from "@/lib/firebase-client"
import { AGENT_CONFIG } from "@/lib/agent-config"

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
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [feedbackData, setFeedbackData] = useState<ChatFeedback[]>([])
  const [userActivity, setUserActivity] = useState<UserActivity[]>([])
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
      const [feedback, activity] = await Promise.all([
        getFeedbackData(undefined, 30), // Last 30 days
        getUserActivityData(30),
      ])

      setFeedbackData(feedback)
      setUserActivity(activity)

      // Calculate dashboard stats
      const uniqueUsers = new Set(feedback.map((f) => f.userId)).size
      const totalMessages = feedback.reduce((sum, f) => sum + f.messageCount, 0)
      const totalDuration = feedback.reduce((sum, f) => sum + f.chatDuration, 0)
      const averageRating = feedback.length > 0 ? feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length : 0

      setDashboardStats({
        totalChats: feedback.length,
        totalUsers: uniqueUsers,
        totalFeedbacks: feedback.length,
        averageRating: Math.round(averageRating * 10) / 10,
        totalMessages,
        averageChatDuration: feedback.length > 0 ? Math.round(totalDuration / feedback.length) : 0,
      })
    } catch (error) {
      console.error("Error loading dashboard data:", error)
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

  // Process data for charts
  const agentStats: AgentStats[] = Object.keys(AGENT_CONFIG).map((agentId) => {
    const agentFeedback = feedbackData.filter((f) => f.agentId === agentId)
    const totalFeedbacks = agentFeedback.length
    const averageRating = totalFeedbacks > 0 ? agentFeedback.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks : 0
    const positiveRating = agentFeedback.filter((f) => f.rating >= 4).length
    const negativeRating = agentFeedback.filter((f) => f.rating <= 2).length

    return {
      agentId,
      agentName: AGENT_CONFIG[agentId].name,
      totalChats: totalFeedbacks,
      averageRating: Math.round(averageRating * 10) / 10,
      totalFeedbacks,
      positiveRating,
      negativeRating,
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

  // Dummy future implementation data
  const performanceMetrics = [
    { metric: "Response Time", value: "1.2s", trend: "+5%", color: "text-green-600" },
    { metric: "Resolution Rate", value: "94%", trend: "+2%", color: "text-green-600" },
    { metric: "User Satisfaction", value: "4.6/5", trend: "+0.3", color: "text-green-600" },
    { metric: "Uptime", value: "99.9%", trend: "0%", color: "text-slate-600" },
  ]

  const monthlyTrends = [
    { month: "Jan", revenue: 45000, users: 1200, satisfaction: 4.2 },
    { month: "Feb", revenue: 52000, users: 1350, satisfaction: 4.3 },
    { month: "Mar", revenue: 48000, users: 1280, satisfaction: 4.1 },
    { month: "Apr", revenue: 61000, users: 1520, satisfaction: 4.5 },
    { month: "May", revenue: 55000, users: 1420, satisfaction: 4.4 },
    { month: "Jun", revenue: 67000, users: 1680, satisfaction: 4.6 },
  ]

  const departmentUsage = [
    { department: "HR", usage: 35, color: "#3B82F6" },
    { department: "IT Support", usage: 28, color: "#EF4444" },
    { department: "Finance", usage: 20, color: "#10B981" },
    { department: "Operations", usage: 17, color: "#F59E0B" },
  ]

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
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-semibold text-slate-900">Admin Dashboard</span>
                <div className="text-sm text-slate-500">Enterprise AI Hub Analytics</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={loadData} disabled={refreshing} className="border-slate-300">
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="border-slate-300">
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
              <div className="text-2xl font-bold">{dashboardStats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Unique users</p>
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
              <div className="text-2xl font-bold">{Math.floor(dashboardStats.averageChatDuration / 60)}m</div>
              <p className="text-xs text-muted-foreground">Per chat session</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
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
                <CardDescription>Key performance indicators for AI agents</CardDescription>
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
            <Card>
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
                <CardDescription>Performance metrics for each AI agent</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={agentStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="agentName" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalChats" fill="#3B82F6" name="Total Chats" />
                    <Bar dataKey="averageRating" fill="#10B981" name="Avg Rating" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Agent Details Table */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Details</CardTitle>
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
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Feedback</CardTitle>
                <CardDescription>Latest user feedback and ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {feedbackData.slice(0, 10).map((feedback) => (
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
                          </div>
                          {feedback.comment && <p className="text-sm text-slate-600 mb-2">"{feedback.comment}"</p>}
                          <div className="text-xs text-slate-500">
                            {feedback.messageCount} messages • {Math.floor(feedback.chatDuration / 60)}m{" "}
                            {feedback.chatDuration % 60}s
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">{feedback.timestamp.toDate().toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
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
                  <CardDescription>Revenue and user growth over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Department Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Usage</CardTitle>
                  <CardDescription>AI agent usage by department</CardDescription>
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
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Reports</CardTitle>
                <CardDescription>Create custom reports for different time periods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <BarChart3 className="w-6 h-6 mb-2" />
                    <span>Usage Report</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <PieChartIcon className="w-6 h-6 mb-2" />
                    <span>Satisfaction Report</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                    <TrendingUp className="w-6 h-6 mb-2" />
                    <span>Performance Report</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scheduled Reports</CardTitle>
                <CardDescription>Automated reports sent to stakeholders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Weekly Summary</div>
                      <div className="text-sm text-slate-600">Sent every Monday at 9:00 AM</div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Monthly Analytics</div>
                      <div className="text-sm text-slate-600">Sent on the 1st of each month</div>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
