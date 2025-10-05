"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plane, Clock, Calendar } from "lucide-react"
import type { Flight } from "@/types"

export default function SchedulesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(false)
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, authLoading, router])

  const handleSearch = async () => {
    if (!origin || !destination) return

    setLoading(true)
    try {
      const flightsRef = collection(db, "flights")
      const q = query(
        flightsRef,
        where("origin", "==", origin),
        where("destination", "==", destination),
        where("status", "==", "scheduled"),
      )

      const querySnapshot = await getDocs(q)
      const flightsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        departureTime: doc.data().departureTime.toDate(),
        arrivalTime: doc.data().arrivalTime.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Flight[]

      setFlights(flightsData.sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime()))
    } catch (error) {
      console.error("Error fetching flights:", error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
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

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl font-bold mb-8">Flight Schedules</h1>

          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="origin">From</Label>
                  <Input
                    id="origin"
                    placeholder="Origin city"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">To</Label>
                  <Input
                    id="destination"
                    placeholder="Destination city"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearch} disabled={loading} className="w-full">
                    {loading ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : flights.length > 0 ? (
            <div className="space-y-4">
              {flights.map((flight) => (
                <Card key={flight.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <Plane className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">{flight.companyName}</p>
                            <p className="text-sm text-muted-foreground">Flight {flight.flightNumber}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <p className="text-sm">
                            {flight.departureTime.toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                          <p className="text-sm">
                            {flight.departureTime.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {flight.arrivalTime.toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between">
                        <div className="text-right">
                          <p className="text-2xl font-bold">${flight.price}</p>
                          <p className="text-sm text-muted-foreground">per person</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{flight.availableSeats} seats available</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-lg text-muted-foreground">Search for flights to view schedules</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
