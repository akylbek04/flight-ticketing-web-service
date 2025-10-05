"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Ban, CheckCircle } from "lucide-react"
import type { User } from "@/types"

export default function AdminUsersPage() {
  const { user, role, loading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (!authLoading && role !== "admin") {
      router.push("/dashboard")
    }
  }, [user, role, authLoading, router])

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const usersSnapshot = await getDocs(collection(db, "users"))
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        })) as User[]

        setUsers(usersData)
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user && role === "admin") {
      fetchUsers()
    }
  }, [user, role])

  const handleToggleBlock = async (userId: string, currentBlocked: boolean) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        blocked: !currentBlocked,
      })

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, blocked: !currentBlocked } : u)))
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Failed to update user")
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <Skeleton className="h-96" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user || role !== "admin") return null

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl font-bold mb-8">User Management</h1>

          {users.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No users found</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Users ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{u.name}</p>
                          <Badge
                            variant={u.role === "admin" ? "default" : u.role === "company" ? "secondary" : "outline"}
                          >
                            {u.role}
                          </Badge>
                          {u.blocked && <Badge variant="destructive">Blocked</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <p className="text-xs text-muted-foreground">Joined {u.createdAt.toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        {u.blocked ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleBlock(u.id, u.blocked || false)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Unblock
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleToggleBlock(u.id, u.blocked || false)}
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Block
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
