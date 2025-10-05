"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Users, Building2, Plane, DollarSign } from "lucide-react"

type TimeFilter = "today" | "week" | "month" | "all"

export default function AdminStatisticsPage() {
  const { user, role, loading: authLoading } = useAuth()
  const router = useRouter()
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    activeCompanies: 0,
    totalFlights: 0,
    activeFlights: 0,
    completedFlights: 0,
    totalBookings: 0,
    totalPassengers: 0,
    totalRevenue: 0,
    averageBookingValue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (!authLoading && role !== "admin") {
      router.push("/dashboard")
    }
  }, [user, role, authLoading, router])

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        // Calculate date range based on filter
        const now = new Date()
        let startDate = new Date(0) // Beginning of time

        switch (timeFilter) {
          case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
        }

        // Get users count
        const usersSnapshot = await getDocs(collection(db, "users"))
        const users = usersSnapshot.docs.map((doc) => ({
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        }))
        const totalUsers = users.filter((u: any) => u.createdAt >= startDate).length

        // Get companies count
        const companiesSnapshot = await getDocs(collection(db, "companies"))
        const companies = companiesSnapshot.docs.map((doc) => ({
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        }))
        const filteredCompanies = companies.filter((c: any) => c.createdAt >= startDate)
        const totalCompanies = filteredCompanies.length
        const activeCompanies = filteredCompanies.filter((c: any) => c.active).length

        // Get flights count
        const flightsSnapshot = await getDocs(collection(db, "flights"))
        const flights = flightsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        }))
        const filteredFlights = flights.filter((f: any) => f.createdAt >= startDate)
        const totalFlights = filteredFlights.length
        const activeFlights = filteredFlights.filter((f: any) => f.status === "scheduled").length
        const completedFlights = filteredFlights.filter((f: any) => f.status === "completed").length

        // Get bookings
        const bookingsSnapshot = await getDocs(query(collection(db, "bookings"), where("status", "==", "confirmed")))
        const bookings = bookingsSnapshot.docs.map((doc) => ({
          ...doc.data(),
          bookedAt: doc.data().bookedAt.toDate(),
        }))
        const filteredBookings = bookings.filter((b: any) => b.bookedAt >= startDate)

        const totalBookings = filteredBookings.length
        const totalPassengers = filteredBookings.reduce((sum: number, b: any) => sum + (b.passengers || 0), 0)
        const totalRevenue = filteredBookings.reduce((sum: number, b: any) => sum + (b.totalPrice || 0), 0)
        const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0

        setStats({
          totalUsers,
          totalCompanies,
          activeCompanies,
          totalFlights,
          activeFlights,
          completedFlights,
          totalBookings,
          totalPassengers,
          totalRevenue,
          averageBookingValue,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user && role === "admin") {
      fetchStats()
    }
  }, [user, role, timeFilter])

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
            <h1 className="text-3xl font-bold">Platform Statistics</h1>
            <div className="w-48">
              <Label htmlFor="timeFilter" className="sr-only">
                Time Filter
              </Label>
              <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)}>
                <SelectTrigger id="timeFilter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Companies</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCompanies}</div>
                <p className="text-xs text-muted-foreground">{stats.activeCompanies} active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Flights</CardTitle>
                <Plane className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFlights}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeFlights} active, {stats.completedFlights} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Platform revenue</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Bookings</span>
                  <span className="font-semibold">{stats.totalBookings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Passengers</span>
                  <span className="font-semibold">{stats.totalPassengers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Booking Value</span>
                  <span className="font-semibold">${stats.averageBookingValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Revenue</span>
                  <span className="font-semibold">${stats.totalRevenue.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Registered Users</span>
                  <span className="font-semibold">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Companies</span>
                  <span className="font-semibold">
                    {stats.activeCompanies} / {stats.totalCompanies}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Flights</span>
                  <span className="font-semibold">{stats.activeFlights}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completed Flights</span>
                  <span className="font-semibold">{stats.completedFlights}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Flight Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active (Scheduled)</span>
                  <span className="font-semibold">{stats.activeFlights}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${stats.totalFlights > 0 ? (stats.activeFlights / stats.totalFlights) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Completed</span>
                  <span className="font-semibold">{stats.completedFlights}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-secondary h-2 rounded-full"
                    style={{
                      width: `${stats.totalFlights > 0 ? (stats.completedFlights / stats.totalFlights) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  )
}
