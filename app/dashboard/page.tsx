"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import AuthGuard from "@/components/auth-guard"
import AgentCard from "@/components/agent-card"
import ChatInterface from "@/components/chat-interface"
import UserOnboardingModal from "@/components/user-onboarding-modal"
import type { DialogflowAgent } from "@/lib/dialogflow"
import { Building2, LogOut, Search, Filter, BarChart3 } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function DashboardPage() {
  const { user, userProfile, needsOnboarding, refreshUserProfile, logout } = useAuth()
  const [agents, setAgents] = useState<DialogflowAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<DialogflowAgent | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents")
      if (response.ok) {
        const agentsData = await response.json()
        setAgents(agentsData)
      }
    } catch (error) {
      console.error("Error fetching agents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChatClick = (agent: DialogflowAgent) => {
    setSelectedAgent(agent)
  }

  const handleBackToGallery = () => {
    setSelectedAgent(null)
  }

  const handleOnboardingComplete = async () => {
    await refreshUserProfile()
  }

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.capabilities.some((cap) => cap.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (selectedAgent) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-slate-50">
          <div className="max-w-6xl mx-auto h-screen">
            <ChatInterface agent={selectedAgent} onBack={handleBackToGallery} />
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
        {/* User Onboarding Modal */}
        {needsOnboarding && <UserOnboardingModal isOpen={needsOnboarding} onComplete={handleOnboardingComplete} />}

        {/* Header */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-slate-900">Enterprise AI Hub</span>
              </div>
              <div className="flex items-center space-x-4">
                {userProfile?.isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Admin Dashboard
                    </Button>
                  </Link>
                )}
                <div className="flex items-center space-x-3 px-3 py-2 bg-slate-50 rounded-lg">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.photoURL || ""} alt={user?.displayName || ""} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                      {user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-slate-900">{user?.displayName}</p>
                    <p className="text-xs text-slate-500">
                      {userProfile?.department} • {userProfile?.role}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={logout}
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Assistant Gallery</h1>
            <p className="text-lg text-slate-600">Choose a specialized AI agent to help with your workplace needs</p>
            {userProfile && (
              <p className="text-sm text-slate-500 mt-2">
                Welcome back, {userProfile.displayName} from {userProfile.department}
              </p>
            )}
          </div>

          {/* Search and Filter */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search agents by name, description, or capabilities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Agents Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-slate-600">Loading agents...</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} onChatClick={handleChatClick} />
                ))}
              </div>

              {filteredAgents.length === 0 && searchTerm && (
                <div className="text-center py-12">
                  <p className="text-slate-500">No agents found matching "{searchTerm}"</p>
                </div>
              )}

              {!loading && agents.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-slate-500">No agents available at the moment.</p>
                </div>
              )}
            </>
          )}

          {/* Stats */}
          <div className="mt-12 bg-white rounded-lg border border-slate-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{agents.length}</div>
                <div className="text-sm text-slate-600">Available Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">24/7</div>
                <div className="text-sm text-slate-600">Availability</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">Instant</div>
                <div className="text-sm text-slate-600">Response Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
