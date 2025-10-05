"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plane, Users, DollarSign, TrendingUp } from "lucide-react"

type TimeFilter = "today" | "week" | "month" | "all"

export default function CompanyStatisticsPage() {
  const { user, role, loading: authLoading } = useAuth()
  const router = useRouter()
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all")
  const [stats, setStats] = useState({
    totalFlights: 0,
    activeFlights: 0,
    completedFlights: 0,
    totalPassengers: 0,
    totalRevenue: 0,
    averageBookingValue: 0,
    totalBookings: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (!authLoading && role !== "company") {
      router.push("/dashboard")
    }
  }, [user, role, authLoading, router])

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Get company info
        const companiesRef = collection(db, "companies")
        const companyQuery = query(companiesRef, where("managerId", "==", user.uid))
        const companySnapshot = await getDocs(companyQuery)

        if (companySnapshot.empty) {
          setLoading(false)
          return
        }

        const companyId = companySnapshot.docs[0].id

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

        // Get flights
        const flightsRef = collection(db, "flights")
        const flightsQuery = query(flightsRef, where("companyId", "==", companyId))
        const flightsSnapshot = await getDocs(flightsQuery)

        const flights = flightsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          departureTime: doc.data().departureTime.toDate(),
        }))

        // Filter flights by date
        const filteredFlights = flights.filter((f: any) => f.createdAt >= startDate)

        const activeFlights = filteredFlights.filter((f: any) => f.status === "scheduled").length
        const completedFlights = filteredFlights.filter((f: any) => f.status === "completed").length

        // Get bookings for these flights
        const flightIds = flights.map((f: any) => f.id)
        let totalPassengers = 0
        let totalRevenue = 0
        let totalBookings = 0

        if (flightIds.length > 0) {
          // Firestore has a limit of 10 items in 'in' queries, so we need to batch
          const batchSize = 10
          for (let i = 0; i < flightIds.length; i += batchSize) {
            const batch = flightIds.slice(i, i + batchSize)
            const bookingsRef = collection(db, "bookings")
            const bookingsQuery = query(bookingsRef, where("flightId", "in", batch), where("status", "==", "confirmed"))
            const bookingsSnapshot = await getDocs(bookingsQuery)

            bookingsSnapshot.docs.forEach((doc) => {
              const booking = doc.data()
              const bookingDate = booking.bookedAt.toDate()

              if (bookingDate >= startDate) {
                totalPassengers += booking.passengers
                totalRevenue += booking.totalPrice
                totalBookings++
              }
            })
          }
        }

        const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0

        setStats({
          totalFlights: filteredFlights.length,
          activeFlights,
          completedFlights,
          totalPassengers,
          totalRevenue,
          averageBookingValue,
          totalBookings,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user && role === "company") {
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

  if (!user || role !== "company") return null

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Statistics & Analytics</h1>
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
                <CardTitle className="text-sm font-medium">Active Flights</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeFlights}</div>
                <p className="text-xs text-muted-foreground">Upcoming flights</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Passengers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPassengers}</div>
                <p className="text-xs text-muted-foreground">From {stats.totalBookings} bookings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Avg: ${stats.averageBookingValue.toFixed(2)} per booking
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Flights Created</span>
                  <span className="font-semibold">{stats.totalFlights}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Bookings</span>
                  <span className="font-semibold">{stats.totalBookings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Passengers Served</span>
                  <span className="font-semibold">{stats.totalPassengers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Booking Value</span>
                  <span className="font-semibold">${stats.averageBookingValue.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flight Status Breakdown</CardTitle>
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
        </div>
      </main>
      <Footer />
    </div>
  )
}
