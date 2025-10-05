"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plane, Users, DollarSign, TrendingUp, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function CompanyDashboardPage() {
  const { user, role, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalFlights: 0,
    activeFlights: 0,
    completedFlights: 0,
    totalPassengers: 0,
    totalRevenue: 0,
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

        // Get flights
        const flightsRef = collection(db, "flights")
        const flightsQuery = query(flightsRef, where("companyId", "==", companyId))
        const flightsSnapshot = await getDocs(flightsQuery)

        const flights = flightsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        const activeFlights = flights.filter((f: any) => f.status === "scheduled").length
        const completedFlights = flights.filter((f: any) => f.status === "completed").length

        // Get bookings for these flights
        const flightIds = flights.map((f: any) => f.id)
        let totalPassengers = 0
        let totalRevenue = 0

        if (flightIds.length > 0) {
          const bookingsRef = collection(db, "bookings")
          const bookingsQuery = query(
            bookingsRef,
            where("flightId", "in", flightIds.slice(0, 10)), // Firestore limit
          )
          const bookingsSnapshot = await getDocs(bookingsQuery)

          bookingsSnapshot.docs.forEach((doc) => {
            const booking = doc.data()
            if (booking.status === "confirmed") {
              totalPassengers += booking.passengers
              totalRevenue += booking.totalPrice
            }
          })
        }

        setStats({
          totalFlights: flights.length,
          activeFlights,
          completedFlights,
          totalPassengers,
          totalRevenue,
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
  }, [user, role])

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
          <h1 className="text-3xl font-bold mb-8">Company Dashboard</h1>

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
                <p className="text-xs text-muted-foreground">Booked passengers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">From confirmed bookings</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Manage Flights</CardTitle>
                <CardDescription>Add, edit, or delete your flights</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/company/flights">Manage Flights</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>View Passengers</CardTitle>
                <CardDescription>See who's booked on your flights</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/company/passengers">View Passengers</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Statistics
                </CardTitle>
                <CardDescription>View detailed analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href="/company/statistics">View Statistics</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
