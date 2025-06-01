"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft,
  Send,
  User,
  MoreVertical,
  Minimize2,
  Heart,
  FileText,
  Zap,
  Users,
  Monitor,
  GraduationCap,
  Calendar,
  Bot,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  DollarSign,
} from "lucide-react"
import type { DialogflowAgent, ChatMessage } from "@/lib/dialogflow"
import { useAuth } from "@/contexts/auth-context"
import FeedbackModal from "@/components/feedback-modal"
import MarkdownRenderer from "@/components/markdown-renderer"
import { logUserActivity, submitFeedback } from "@/lib/firebase-client"
import { toast } from "@/hooks/use-toast"

interface ChatInterfaceProps {
  agent: DialogflowAgent
  onBack: () => void
}

interface ExtendedChatMessage extends ChatMessage {
  feedback?: "positive" | "negative" | null
  feedbackSubmitted?: boolean
}

export default function ChatInterface({ agent, onBack }: ChatInterfaceProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    {
      id: "1",
      text: `Hello! I'm ${agent.name}. ${agent.description} How can I help you today?`,
      isUser: false,
      timestamp: new Date(),
      feedback: null,
      feedbackSubmitted: false,
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [chatStartTime] = useState(Date.now())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef(`${user?.uid}-${agent.id}-${Date.now()}`)

  // Get the icon component based on the agent's icon property
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Heart":
        return Heart
      case "FileText":
        return FileText
      case "Zap":
        return Zap
      case "Users":
        return Users
      case "Monitor":
        return Monitor
      case "GraduationCap":
        return GraduationCap
      case "Calendar":
        return Calendar
      case "DollarSign":
        return DollarSign
      default:
        return Bot
    }
  }

  const IconComponent = getIconComponent(agent.icon)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Log chat start activity
  useEffect(() => {
    if (user) {
      logUserActivity({
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userEmail: user.email || "",
        action: "chat_start",
        agentId: agent.id,
        sessionId: sessionId.current,
      })
    }
  }, [user, agent.id])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ExtendedChatMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          sessionId: sessionId.current,
          agentId: agent.id,
          // Add user context for personalization and security
          userName: user?.displayName || "User",
          userEmail: user?.email || "",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const data = await response.json()

      const botMessage: ExtendedChatMessage = {
        id: (Date.now() + 1).toString(),
        text: data.fulfillmentText,
        isUser: false,
        timestamp: new Date(),
        feedback: null,
        feedbackSubmitted: false,
        agentResponse: {
          fulfillmentText: data.fulfillmentText,
          intent: data.intent,
          confidence: data.confidence,
        },
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Error sending message:", error)
      const errorMessage: ExtendedChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date(),
        feedback: null,
        feedbackSubmitted: false,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickFeedback = async (messageId: string, feedbackType: "positive" | "negative") => {
    if (!user) return

    // Update message with feedback
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, feedback: feedbackType, feedbackSubmitted: true } : msg)),
    )

    try {
      // Submit quick feedback to Firebase
      await submitFeedback({
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userEmail: user.email || "",
        agentId: agent.id,
        agentName: agent.name,
        sessionId: sessionId.current,
        rating: feedbackType === "positive" ? 5 : 2, // Quick mapping
        comment: `Quick feedback: ${feedbackType}`,
        messageCount: messages.filter((m) => m.isUser).length,
        chatDuration: Math.floor((Date.now() - chatStartTime) / 1000),
      })

      // Log feedback activity
      await logUserActivity({
        userId: user.uid,
        userName: user.displayName || "Anonymous",
        userEmail: user.email || "",
        action: "feedback_submit",
        agentId: agent.id,
        sessionId: sessionId.current,
        metadata: { type: "quick", feedback: feedbackType, messageId },
      })

      toast({
        title: "Feedback Received",
        description: `Thank you for the ${feedbackType} feedback!`,
      })

      // If negative feedback, optionally show detailed feedback modal
      if (feedbackType === "negative") {
        setTimeout(() => {
          toast({
            title: "Help us improve",
            description: "Would you like to provide more details?",
            action: (
              <Button size="sm" onClick={() => setShowFeedbackModal(true)}>
                Give Details
              </Button>
            ),
          })
        }, 1000)
      }
    } catch (error) {
      console.error("Error submitting quick feedback:", error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getChatDuration = () => Math.floor((Date.now() - chatStartTime) / 1000)
  const getMessageCount = () => messages.filter((m) => m.isUser).length

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className={`h-10 w-10 ${agent.color} rounded-lg flex items-center justify-center`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">{agent.name}</h2>
                <div className="text-sm text-green-600 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFeedbackModal(true)}
              className="text-slate-600 hover:text-blue-600 border-slate-300"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Feedback
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-600">
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-600">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}>
            <div
              className={`flex items-start space-x-3 max-w-[85%] ${message.isUser ? "flex-row-reverse space-x-reverse" : ""}`}
            >
              <div className="flex-shrink-0">
                {message.isUser ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className={`h-8 w-8 ${agent.color} rounded-lg flex items-center justify-center`}>
                    <IconComponent className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
              <div className="flex flex-col space-y-2">
                <div
                  className={`rounded-2xl px-4 py-3 shadow-sm ${
                    message.isUser ? "bg-blue-600 text-white" : "bg-white text-slate-900 border border-slate-200"
                  }`}
                >
                  {message.isUser ? (
                    <div className="text-sm leading-relaxed">{message.text}</div>
                  ) : (
                    <MarkdownRenderer content={message.text} className="text-sm leading-relaxed" />
                  )}
                  <div className={`text-xs mt-2 ${message.isUser ? "text-blue-100" : "text-slate-500"}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                {/* Quick Feedback Buttons for AI responses */}
                {!message.isUser && message.id !== "1" && (
                  <div className="flex items-center space-x-2 ml-2">
                    {!message.feedbackSubmitted ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickFeedback(message.id, "positive")}
                          className="h-8 px-2 text-slate-500 hover:text-green-600 hover:bg-green-50"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleQuickFeedback(message.id, "negative")}
                          className="h-8 px-2 text-slate-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center space-x-1 text-xs text-slate-500">
                        {message.feedback === "positive" ? (
                          <ThumbsUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <ThumbsDown className="h-3 w-3 text-red-600" />
                        )}
                        <span>Feedback received</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3">
              <div className={`h-8 w-8 ${agent.color} rounded-lg flex items-center justify-center`}>
                <IconComponent className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white rounded-2xl px-4 py-3 border border-slate-200 shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="flex space-x-3">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${agent.name}...`}
            disabled={isLoading}
            className="flex-1 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-slate-500 mt-2 text-center">
          Press Enter to send • Shift + Enter for new line • Use 👍👎 for quick feedback
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        agentId={agent.id}
        agentName={agent.name}
        sessionId={sessionId.current}
        messageCount={getMessageCount()}
        chatDuration={getChatDuration()}
      />
    </div>
  )
}
