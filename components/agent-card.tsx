"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Zap, Heart, FileText, Users, Monitor, GraduationCap, Calendar, Bot } from "lucide-react"
import type { DialogflowAgent } from "@/lib/dialogflow"

interface AgentCardProps {
  agent: DialogflowAgent
  onChatClick: (agent: DialogflowAgent) => void
}

export default function AgentCard({ agent, onChatClick }: AgentCardProps) {
  // Get the icon component based on the agent's icon property
  const getIconComponent = () => {
    switch (agent.icon) {
      case "Heart":
        return <Heart className="h-8 w-8 text-white" />
      case "FileText":
        return <FileText className="h-8 w-8 text-white" />
      case "Zap":
        return <Zap className="h-8 w-8 text-white" />
      case "Users":
        return <Users className="h-8 w-8 text-white" />
      case "Monitor":
        return <Monitor className="h-8 w-8 text-white" />
      case "GraduationCap":
        return <GraduationCap className="h-8 w-8 text-white" />
      case "Calendar":
        return <Calendar className="h-8 w-8 text-white" />
      default:
        return <Bot className="h-8 w-8 text-white" />
    }
  }

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-200 border-slate-200 hover:border-blue-300 bg-white group">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div
              className={`h-16 w-16 ${agent.color} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg`}
            >
              {getIconComponent()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
        <CardTitle className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
          {agent.name}
        </CardTitle>
        <CardDescription className="text-sm text-slate-600 line-clamp-2">{agent.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
            <Zap className="w-4 h-4 mr-1 text-blue-500" />
            Capabilities
          </h4>
          <div className="flex flex-wrap gap-1">
            {agent.capabilities.slice(0, 3).map((capability) => (
              <Badge key={capability} variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                {capability}
              </Badge>
            ))}
            {agent.capabilities.length > 3 && (
              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                +{agent.capabilities.length - 3} more
              </Badge>
            )}
          </div>
        </div>
        <Button
          onClick={() => onChatClick(agent)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
          size="sm"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Start Chat
        </Button>
      </CardContent>
    </Card>
  )
}
