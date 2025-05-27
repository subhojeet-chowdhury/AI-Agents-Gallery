"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import AuthGuard from "@/components/auth-guard"
import AdminDashboard from "@/components/admin-dashboard"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield } from "lucide-react"

const ADMIN_EMAILS = [
  "subhojeet.chowdhury.work@gmail.com",
]

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      const userIsAdmin = ADMIN_EMAILS.includes(user.email || "")
      setIsAdmin(userIsAdmin)
      setLoading(false)

      if (!userIsAdmin) {
        // Redirect non-admin users after a delay
        setTimeout(() => {
          router.push("/dashboard")
        }, 3000)
      }
    }
  }, [user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-lg text-slate-600">Checking admin access...</div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
              <p className="text-slate-600 mb-4">You don't have permission to access the admin dashboard.</p>
              <p className="text-sm text-slate-500">Redirecting to dashboard in a few seconds...</p>
            </div>
            <Button onClick={() => router.push("/dashboard")} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <AdminDashboard />
    </AuthGuard>
  )
}
