"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Download, FileText, BarChart3, Star, TrendingUp, CalendarIcon, FileSpreadsheet, FileImage } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { ChatFeedback, UserActivity } from "@/lib/firebase-client"
import {
  exportFeedbackToCSV,
  exportActivityToCSV,
  generateUsageReport,
  generateSatisfactionReport,
  generatePerformanceReport,
  generatePDFReport,
} from "@/lib/export-utils"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  feedback: ChatFeedback[]
  activity: UserActivity[]
}

export default function ExportModal({ isOpen, onClose, feedback, activity }: ExportModalProps) {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  })
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (type: string, format: string) => {
    setIsExporting(true)

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

      switch (type) {
        case "feedback":
          exportFeedbackToCSV(filteredFeedback)
          break
        case "activity":
          exportActivityToCSV(filteredActivity)
          break
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
      console.error("Export error:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportOptions = [
    {
      id: "feedback",
      title: "Feedback Data",
      description: "Raw feedback and ratings data",
      icon: Star,
      count: feedback.length,
      formats: ["CSV"],
    },
    {
      id: "activity",
      title: "User Activity",
      description: "Login, chat, and interaction logs",
      icon: TrendingUp,
      count: activity.length,
      formats: ["CSV"],
    },
    {
      id: "usage",
      title: "Usage Report",
      description: "Agent performance and usage statistics",
      icon: BarChart3,
      count: Object.keys(feedback.reduce((acc, f) => ({ ...acc, [f.agentId]: true }), {})).length,
      formats: ["CSV"],
    },
    {
      id: "satisfaction",
      title: "Satisfaction Report",
      description: "Daily satisfaction trends and ratings",
      icon: Star,
      count: feedback.length,
      formats: ["CSV"],
    },
    {
      id: "performance",
      title: "Performance Report",
      description: "Key performance indicators and metrics",
      icon: TrendingUp,
      count: 5,
      formats: ["CSV"],
    },
    {
      id: "comprehensive",
      title: "Comprehensive Report",
      description: "Complete analytics report with all data",
      icon: FileText,
      count: feedback.length + activity.length,
      formats: ["TXT"],
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            Export Analytics Data
          </DialogTitle>
          <DialogDescription>Choose the data you want to export and customize the date range</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
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

                <span className="text-sm text-muted-foreground">to</span>

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
            </CardContent>
          </Card>

          {/* Export Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exportOptions.map((option) => {
              const IconComponent = option.icon
              return (
                <Card key={option.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-sm">{option.title}</CardTitle>
                      </div>
                      <Badge variant="secondary">{option.count} records</Badge>
                    </div>
                    <CardDescription className="text-xs">{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {option.formats.map((format) => (
                        <Button
                          key={format}
                          size="sm"
                          variant="outline"
                          onClick={() => handleExport(option.id, format)}
                          disabled={isExporting}
                          className="text-xs"
                        >
                          {format === "CSV" && <FileSpreadsheet className="w-3 h-3 mr-1" />}
                          {format === "TXT" && <FileText className="w-3 h-3 mr-1" />}
                          {format === "PDF" && <FileImage className="w-3 h-3 mr-1" />}
                          {isExporting ? "Exporting..." : `Export ${format}`}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
