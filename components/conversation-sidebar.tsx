"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import type { DialogflowAgent } from "@/lib/dialogflow"
import type { Conversation } from "@/lib/firebase-client"
import { getUserConversations } from "@/lib/firebase-client"
import { useAuth } from "@/contexts/auth-context"

interface ConversationSidebarProps {
  agent: DialogflowAgent
  currentSessionId: string | null
  onSelectConversation: (conversation: Conversation) => void
  onNewConversation: () => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export default function ConversationSidebar({
  agent,
  currentSessionId,
  onSelectConversation,
  onNewConversation,
  isCollapsed,
  onToggleCollapse,
}: ConversationSidebarProps) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user, agent.id])

  const loadConversations = async () => {
    if (!user) return

    try {
      setLoading(true)
      // Get all user conversations and filter by agent on client side
      const allConversations = await getUserConversations(user.uid)
      const agentConversations = allConversations.filter((conv) => conv.agentId === agent.id)

      // Remove duplicates by sessionId and sort by last message time (newest first)
      const uniqueConversations = agentConversations.reduce((acc, current) => {
        const existing = acc.find((item) => item.sessionId === current.sessionId)
        if (!existing) {
          acc.push(current)
        } else {
          // Keep the one with the latest timestamp
          const currentTime =
            current.lastMessageTime?.toDate?.() || new Date(current.lastMessageTime?.toString() || Date.now())
          const existingTime =
            existing.lastMessageTime?.toDate?.() || new Date(existing.lastMessageTime?.toString() || Date.now())
          if (currentTime > existingTime) {
            const index = acc.indexOf(existing)
            acc[index] = current
          }
        }
        return acc
      }, [] as Conversation[])

      const sortedConversations = uniqueConversations.sort((a, b) => {
        const timeA = a.lastMessageTime?.toDate?.() || new Date(a.lastMessageTime?.toString() || Date.now())
        const timeB = b.lastMessageTime?.toDate?.() || new Date(b.lastMessageTime?.toString() || Date.now())
        return timeB.getTime() - timeA.getTime()
      })

      setConversations(sortedConversations)
    } catch (error) {
      console.error("Error loading conversations:", error)
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return ""
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.toString())
      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

      const timeString = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

      if (diffInHours < 24) {
        // Show "Today" + time for today's conversations
        return `Today ${timeString}`
      } else if (diffInHours < 48) {
        // Show "Yesterday" + time
        return `Yesterday ${timeString}`
      } else if (diffInHours < 168) {
        // Show day name + time for this week
        const dayName = date.toLocaleDateString([], { weekday: "short" })
        return `${dayName} ${timeString}`
      } else {
        // Show date + time for older conversations
        const dateString = date.toLocaleDateString([], { month: "short", day: "numeric" })
        return `${dateString} ${timeString}`
      }
    } catch (error) {
      return ""
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const generateConversationTitle = (lastMessage: string, index: number) => {
    if (!lastMessage) return `Chat ${index + 1}`

    // Extract first few words from the last message for a meaningful title
    const words = lastMessage.split(" ").slice(0, 4).join(" ")
    return words.length > 0 ? words : `Chat ${index + 1}`
  }

  if (isCollapsed) {
    return (
      <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 space-y-4">
        <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="w-10 h-10 p-0">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onNewConversation} className="w-10 h-10 p-0">
          <Plus className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex flex-col space-y-2 w-full px-2">
          {conversations.slice(0, 5).map((conversation) => (
            <Button
              key={conversation.sessionId}
              variant="ghost"
              size="sm"
              onClick={() => onSelectConversation(conversation)}
              className={`w-10 h-10 p-0 ${
                currentSessionId === conversation.sessionId ? "bg-blue-100 text-blue-600" : "text-slate-600"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-medium text-slate-900">Chat History</h3>
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="sm" onClick={onNewConversation} className="h-8">
            <Plus className="h-4 w-4 mr-1" />
            Start Chat
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-slate-500">Loading...</div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-8 w-8 text-slate-300 mb-2" />
              <div className="text-sm text-slate-500">No conversations yet</div>
              <div className="text-xs text-slate-400 mt-1">Start your first chat</div>
            </div>
          ) : (
            <ul className="space-y-1">
              {conversations.map((conversation, index) => (
                <li key={conversation.sessionId}>
                  <button
                    onClick={() => onSelectConversation(conversation)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      currentSessionId === conversation.sessionId
                        ? "bg-blue-100 text-blue-800"
                        : "hover:bg-slate-100 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0 text-slate-500" />
                      <div className="truncate font-medium text-sm">
                        {truncateText(generateConversationTitle(conversation.lastMessage, index), 22)}
                      </div>
                    </div>
                    <div className="mt-1 flex justify-between items-center">
                      <div className="text-xs text-slate-500 truncate max-w-[55%]">
                        {truncateText(conversation.lastMessage, 20)}
                      </div>
                      <div className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDateTime(conversation.lastMessageTime)}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
