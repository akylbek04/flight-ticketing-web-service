"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, Plus, Edit, Trash2 } from "lucide-react"
import type { AirlineCompany, User } from "@/types"

export default function AdminCompaniesPage() {
  const { user, role, loading: authLoading } = useAuth()
  const router = useRouter()
  const [companies, setCompanies] = useState<AirlineCompany[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCompany, setEditingCompany] = useState<AirlineCompany | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (!authLoading && role !== "admin") {
      router.push("/dashboard")
    }
  }, [user, role, authLoading, router])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Get companies
        const companiesSnapshot = await getDocs(collection(db, "companies"))
        const companiesData = companiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        })) as AirlineCompany[]

        setCompanies(companiesData)

        // Get users for manager assignment
        const usersSnapshot = await getDocs(collection(db, "users"))
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        })) as User[]

        setUsers(usersData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user && role === "admin") {
      fetchData()
    }
  }, [user, role])

  const handleDelete = async (companyId: string) => {
    if (!confirm("Are you sure you want to delete this company?")) return

    try {
      // Find the company to get the manager ID before deletion
      const companyToDelete = companies.find((c) => c.id === companyId)
      
      // Delete the company
      await deleteDoc(doc(db, "companies", companyId))
      setCompanies((prev) => prev.filter((c) => c.id !== companyId))
      
      // If the company had a manager, downgrade their role to user
      if (companyToDelete?.managerId) {
        await fetch("/api/auth/set-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: companyToDelete.managerId, role: "user" }),
        })
      }
    } catch (error) {
      console.error("Error deleting company:", error)
      alert("Failed to delete company")
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
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Company Management</h1>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingCompany(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCompany ? "Edit Company" : "Add New Company"}</DialogTitle>
                  <DialogDescription>
                    {editingCompany ? "Update company details" : "Create a new airline company"}
                  </DialogDescription>
                </DialogHeader>
                <CompanyForm
                  company={editingCompany}
                  users={users}
                  onSuccess={(newCompany) => {
                    if (editingCompany) {
                      setCompanies((prev) => prev.map((c) => (c.id === newCompany.id ? newCompany : c)))
                    } else {
                      setCompanies((prev) => [...prev, newCompany])
                    }
                    setDialogOpen(false)
                    setEditingCompany(null)
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {companies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground mb-4">No companies yet</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Company
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>All Companies ({companies.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {companies.map((company) => {
                    const manager = users.find((u) => u.id === company.managerId)
                    console.log('manager', manager)
                    return (
                      <div key={company.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{company.name}</p>
                            <Badge variant="outline">{company.code}</Badge>
                            <Badge variant={company.active ? "default" : "secondary"}>
                              {company.active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Manager: {manager?.name || "Unassigned"} ({manager?.email || "N/A"})
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Created {company.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCompany(company)
                              setDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(company.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )
                  })}
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

function CompanyForm({
  company,
  users,
  onSuccess,
}: {
  company: AirlineCompany | null
  users: User[]
  onSuccess: (company: AirlineCompany) => void
}) {
  console.log('company form users', users)
  const [formData, setFormData] = useState({
    name: company?.name || "",
    code: company?.code || "",
    managerId: company?.managerId || "",
    active: company?.active ?? true,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const companyData = {
        name: formData.name,
        code: formData.code,
        managerId: formData.managerId,
        active: formData.active,
        createdAt: company?.createdAt || new Date(),
      }

      if (company) {
        await updateDoc(doc(db, "companies", company.id), companyData)
        onSuccess({ ...companyData, id: company.id } as AirlineCompany)
      } else {
        const docRef = await addDoc(collection(db, "companies"), companyData)
        onSuccess({ ...companyData, id: docRef.id } as AirlineCompany)
      }

      // Handle role changes for managers
      if (company) {
        // If updating an existing company and manager changed
        const oldManagerId = company.managerId
        const newManagerId = formData.managerId
        
        // If there was an old manager and it's different from the new one (or being removed)
        if (oldManagerId && oldManagerId !== newManagerId) {
          // Downgrade old manager to user role
          await fetch("/api/auth/set-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: oldManagerId, role: "user" }),
          })
        }
        
        // Set new manager to company role if assigned
        if (newManagerId) {
          await fetch("/api/auth/set-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: newManagerId, role: "company" }),
          })
        }
      } else {
        // Creating a new company - set manager role to company if assigned
        if (formData.managerId) {
          await fetch("/api/auth/set-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: formData.managerId, role: "company" }),
          })
        }
      }
    } catch (error) {
      console.error("Error saving company:", error)
      alert("Failed to save company")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Company Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">Company Code</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          placeholder="e.g., AA, DL, UA"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="manager">Assign Manager</Label>
        <Select value={formData.managerId} onValueChange={(value) => setFormData({ ...formData, managerId: value })}>
          <SelectTrigger id="manager">
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {users.filter((user) => user.role === "user").map((user) => {
              console.log('company form user', user)
              return <SelectItem key={user.id} value={user.id}>
                {user.name} ({user.email})
              </SelectItem>
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="active"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="active" className="cursor-pointer">
          Active
        </Label>
      </div>

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "Saving..." : company ? "Update Company" : "Create Company"}
      </Button>
    </form>
  )
}
