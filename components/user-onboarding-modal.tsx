"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Building2, MapPin, Clock, Briefcase, Shield } from "lucide-react"
import { createUserProfile, DEPARTMENTS, ROLES, LOCATIONS, type UserProfileInput } from "@/lib/user-profile"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface UserOnboardingModalProps {
  isOpen: boolean
  onComplete: () => void
}

export default function UserOnboardingModal({ isOpen, onComplete }: UserOnboardingModalProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<UserProfileInput>({
    department: "",
    role: "",
    location: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validate required fields
    if (!formData.department || !formData.role || !formData.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await createUserProfile(user.uid, user.email || "", user.displayName || "", user.photoURL || undefined, formData)

      toast({
        title: "Profile Created!",
        description: "Welcome to Enterprise AI Hub. Your profile has been set up successfully.",
      })

      onComplete()
    } catch (error) {
      console.error("Error creating profile:", error)
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSuperAdmin = user?.email === "subhojeet.chowdhury.work@gmail.com"

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <User className="w-6 h-6 mr-2 text-blue-600" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription>
            Help us personalize your experience by providing some additional information about yourself.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Info Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  {user?.photoURL ? (
                    <img src={user.photoURL || "/placeholder.svg"} alt="Profile" className="w-12 h-12 rounded-full" />
                  ) : (
                    <User className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <div>
                  <div className="font-medium">{user?.displayName || "User"}</div>
                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                  {isSuperAdmin && (
                    <Badge variant="secondary" className="mt-1 bg-purple-100 text-purple-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Super Administrator
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center">
                <Building2 className="w-4 h-4 mr-2" />
                Department *
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center">
                <Briefcase className="w-4 h-4 mr-2" />
                Role *
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Location *
              </Label>
              <Select
                value={formData.location}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your location" />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone" className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Timezone
              </Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))}
                placeholder="Your timezone"
                className="bg-muted"
                readOnly
              />
              <p className="text-xs text-muted-foreground">Automatically detected from your browser</p>
            </div>
          </div>

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Privacy & Security</p>
                  <p className="text-blue-700">
                    This information helps us provide personalized AI assistance and analytics. Your data is secure and
                    only used to improve your experience.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || !formData.department || !formData.role || !formData.location}
              className="bg-blue-600 hover:bg-blue-700 px-8"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Setting up...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
