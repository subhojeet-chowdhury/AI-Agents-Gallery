"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Shield, ShieldCheck, Users, Search, UserPlus, UserMinus, Crown } from "lucide-react"
import { getAllUserProfiles, promoteUserToAdmin, demoteUserFromAdmin, type UserProfile } from "@/lib/user-profile"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

export default function UserManagement() {
  const { user, userProfile } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const allUsers = await getAllUserProfiles()
      setUsers(allUsers)
    } catch (error) {
      console.error("Error loading users:", error)
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePromoteUser = async (targetUser: UserProfile) => {
    if (!user || !userProfile?.isSuperAdmin) {
      toast({
        title: "Access Denied",
        description: "Only super administrators can promote users.",
        variant: "destructive",
      })
      return
    }

    setActionLoading(true)
    try {
      await promoteUserToAdmin(targetUser.uid, user.uid)
      await loadUsers() // Refresh the list
      toast({
        title: "User Promoted",
        description: `${targetUser.displayName} has been promoted to administrator.`,
      })
      setSelectedUser(null)
    } catch (error) {
      console.error("Error promoting user:", error)
      toast({
        title: "Error",
        description: "Failed to promote user.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDemoteUser = async (targetUser: UserProfile) => {
    if (!user || !userProfile?.isSuperAdmin) {
      toast({
        title: "Access Denied",
        description: "Only super administrators can demote users.",
        variant: "destructive",
      })
      return
    }

    setActionLoading(true)
    try {
      await demoteUserFromAdmin(targetUser.uid, user.uid)
      await loadUsers() // Refresh the list
      toast({
        title: "User Demoted",
        description: `${targetUser.displayName} has been demoted from administrator.`,
      })
      setSelectedUser(null)
    } catch (error) {
      console.error("Error demoting user:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to demote user.",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const adminUsers = users.filter((u) => u.isAdmin)
  const superAdminUsers = users.filter((u) => u.isSuperAdmin)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-slate-600">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Super Admins</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{superAdminUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length - adminUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user roles and permissions
            {userProfile?.isSuperAdmin && " (Super Admin privileges active)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search users by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            {filteredUsers.map((targetUser) => (
              <div key={targetUser.uid} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={targetUser.photoURL || ""} alt={targetUser.displayName} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {targetUser.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{targetUser.displayName}</div>
                    <div className="text-sm text-muted-foreground">{targetUser.email}</div>
                    <div className="text-xs text-muted-foreground">
                      {targetUser.department} • {targetUser.role}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {targetUser.isSuperAdmin && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      <Crown className="w-3 h-3 mr-1" />
                      Super Admin
                    </Badge>
                  )}
                  {targetUser.isAdmin && !targetUser.isSuperAdmin && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}

                  {/* Action Buttons - Only for Super Admins */}
                  {userProfile?.isSuperAdmin && targetUser.uid !== user?.uid && (
                    <div className="flex space-x-2">
                      {!targetUser.isAdmin ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => setSelectedUser(targetUser)}>
                              <UserPlus className="w-4 h-4 mr-1" />
                              Promote
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Promote to Administrator</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to promote {targetUser.displayName} to administrator? They will
                                have access to the admin dashboard and analytics.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={() => handlePromoteUser(targetUser)}
                                disabled={actionLoading}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {actionLoading ? "Promoting..." : "Promote"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        !targetUser.isSuperAdmin && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedUser(targetUser)}>
                                <UserMinus className="w-4 h-4 mr-1" />
                                Demote
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Demote from Administrator</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to demote {targetUser.displayName} from administrator? They will
                                  lose access to the admin dashboard.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedUser(null)}>
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleDemoteUser(targetUser)}
                                  disabled={actionLoading}
                                  variant="destructive"
                                >
                                  {actionLoading ? "Demoting..." : "Demote"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? `No users found matching "${searchTerm}"` : "No users found"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Instructions */}
      {userProfile?.isSuperAdmin && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <ShieldCheck className="w-5 h-5 mr-2" />
              Super Administrator Privileges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• You can promote regular users to administrators</p>
              <p>• You can demote administrators (except other super admins)</p>
              <p>• Super admin status is permanent and cannot be changed through the UI</p>
              <p>• New users with super admin emails get automatic super admin access</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
