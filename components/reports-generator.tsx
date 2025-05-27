"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  BarChart3,
  PieChartIcon,
  TrendingUp,
  CalendarIcon,
  Clock,
  Mail,
  Settings,
  Play,
  FileText,
  Download,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { ChatFeedback, UserActivity } from "@/lib/firebase-client"
import {
  generateUsageReport,
  generateSatisfactionReport,
  generatePerformanceReport,
  generatePDFReport,
} from "@/lib/export-utils"

interface ReportsGeneratorProps {
  feedback: ChatFeedback[]
  activity: UserActivity[]
}

export default function ReportsGenerator({ feedback, activity }: ReportsGeneratorProps) {
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [scheduledReports, setScheduledReports] = useState([
    {
      id: "1",
      name: "Weekly Summary",
      type: "usage",
      schedule: "weekly",
      nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      recipients: ["admin@company.com"],
      active: true,
    },
    {
      id: "2",
      name: "Monthly Analytics",
      type: "comprehensive",
      schedule: "monthly",
      nextRun: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      recipients: ["management@company.com", "analytics@company.com"],
      active: true,
    },
  ])

  const reportTypes = [
    {
      id: "usage",
      title: "Usage Report",
      description: "Detailed agent usage statistics and performance metrics",
      icon: BarChart3,
      color: "bg-blue-500",
      estimatedTime: "2-3 minutes",
      includes: ["Agent performance", "Chat volumes", "User engagement", "Response times"],
    },
    {
      id: "satisfaction",
      title: "Satisfaction Report",
      description: "User satisfaction trends and feedback analysis",
      icon: PieChartIcon,
      color: "bg-green-500",
      estimatedTime: "1-2 minutes",
      includes: ["Rating distributions", "Satisfaction trends", "Feedback analysis", "Improvement areas"],
    },
    {
      id: "performance",
      title: "Performance Report",
      description: "Key performance indicators and system metrics",
      icon: TrendingUp,
      color: "bg-purple-500",
      estimatedTime: "1-2 minutes",
      includes: ["KPI dashboard", "Performance trends", "System metrics", "Efficiency analysis"],
    },
    {
      id: "comprehensive",
      title: "Comprehensive Report",
      description: "Complete analytics report with all available data",
      icon: FileText,
      color: "bg-orange-500",
      estimatedTime: "3-5 minutes",
      includes: ["All usage data", "Complete analytics", "Detailed insights", "Executive summary"],
    },
  ]

  const handleGenerateReport = async (reportType: string) => {
    setIsGenerating(true)

    try {
      // Filter data by date range
      const filteredFeedback = feedback.filter((f) => {
        const date = f.timestamp.toDate()
        return date >= dateRange.start && date <= dateRange.end
      })

      const filteredActivity = activity.filter((a) => {
        const date = a.timestamp.toDate()
        return date >= dateRange.start && date <= dateRange.end
      })

      // Simulate report generation time
      await new Promise((resolve) => setTimeout(resolve, 2000))

      switch (reportType) {
        case "usage":
          generateUsageReport(filteredFeedback, filteredActivity)
          break
        case "satisfaction":
          generateSatisfactionReport(filteredFeedback)
          break
        case "performance":
          generatePerformanceReport(filteredFeedback, filteredActivity)
          break
        case "comprehensive":
          generatePDFReport({
            feedback: filteredFeedback,
            activity: filteredActivity,
            dateRange,
          })
          break
      }
    } catch (error) {
      console.error("Report generation error:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">Generate Reports</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          {/* Date Range Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Configuration</CardTitle>
              <CardDescription>Select date range and report parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(dateRange.start, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.start}
                        onSelect={(date) => date && setDateRange((prev) => ({ ...prev, start: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(dateRange.end, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateRange.end}
                        onSelect={(date) => date && setDateRange((prev) => ({ ...prev, end: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reportTypes.map((report) => {
              const IconComponent = report.icon
              const isSelected = selectedReport === report.id

              return (
                <Card
                  key={report.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-lg",
                    isSelected && "ring-2 ring-blue-500 shadow-lg",
                  )}
                  onClick={() => setSelectedReport(report.id)}
                >
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", report.color)}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{report.estimatedTime}</span>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2">{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Includes:</h4>
                        <div className="flex flex-wrap gap-1">
                          {report.includes.map((item, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGenerateReport(report.id)
                        }}
                        disabled={isGenerating}
                        className="w-full"
                        variant={isSelected ? "default" : "outline"}
                      >
                        {isGenerating ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Generate Report
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          {/* Existing Scheduled Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>Automated reports sent to stakeholders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{report.name}</h3>
                        <Badge variant={report.active ? "default" : "secondary"}>
                          {report.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <div>
                          Type: {report.type} • Schedule: {report.schedule}
                        </div>
                        <div>Next run: {report.nextRun.toLocaleDateString()}</div>
                        <div>Recipients: {report.recipients.join(", ")}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add New Scheduled Report */}
          <Card>
            <CardHeader>
              <CardTitle>Create Scheduled Report</CardTitle>
              <CardDescription>Set up automated report generation and delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input id="report-name" placeholder="e.g., Weekly Performance Summary" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-type">Report Type</Label>
                  <select className="w-full p-2 border rounded-md" id="report-type">
                    <option value="usage">Usage Report</option>
                    <option value="satisfaction">Satisfaction Report</option>
                    <option value="performance">Performance Report</option>
                    <option value="comprehensive">Comprehensive Report</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schedule">Schedule</Label>
                  <select className="w-full p-2 border rounded-md" id="schedule">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" type="time" defaultValue="09:00" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipients">Email Recipients</Label>
                <Textarea id="recipients" placeholder="Enter email addresses separated by commas" rows={2} />
              </div>

              <Button className="w-full">
                <Mail className="w-4 h-4 mr-2" />
                Create Scheduled Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
