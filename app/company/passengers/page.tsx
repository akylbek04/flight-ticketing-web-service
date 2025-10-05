"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Users, Plane } from "lucide-react"
import type { Flight, Booking } from "@/types"

interface PassengerInfo {
  booking: Booking
  userName: string
  userEmail: string
}

export default function CompanyPassengersPage() {
  const { user, role, loading: authLoading } = useAuth()
  const router = useRouter()
  const [flights, setFlights] = useState<Flight[]>([])
  const [selectedFlightId, setSelectedFlightId] = useState<string>("")
  const [passengers, setPassengers] = useState<PassengerInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPassengers, setLoadingPassengers] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (!authLoading && role !== "company") {
      router.push("/dashboard")
    }
  }, [user, role, authLoading, router])

  useEffect(() => {
    const fetchFlights = async () => {
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

        const flightsData = flightsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          departureTime: doc.data().departureTime.toDate(),
          arrivalTime: doc.data().arrivalTime.toDate(),
          createdAt: doc.data().createdAt.toDate(),
        })) as Flight[]

        setFlights(flightsData)
        if (flightsData.length > 0) {
          setSelectedFlightId(flightsData[0].id)
        }
      } catch (error) {
        console.error("Error fetching flights:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user && role === "company") {
      fetchFlights()
    }
  }, [user, role])

  useEffect(() => {
    const fetchPassengers = async () => {
      if (!selectedFlightId) return

      setLoadingPassengers(true)
      try {
        const bookingsRef = collection(db, "bookings")
        const bookingsQuery = query(
          bookingsRef,
          where("flightId", "==", selectedFlightId),
          where("status", "==", "confirmed"),
        )
        const bookingsSnapshot = await getDocs(bookingsQuery)

        const passengersData = await Promise.all(
          bookingsSnapshot.docs.map(async (bookingDoc) => {
            const booking = {
              id: bookingDoc.id,
              ...bookingDoc.data(),
              bookedAt: bookingDoc.data().bookedAt.toDate(),
            } as Booking

            // Get user info
            const userDoc = await getDoc(doc(db, "users", booking.userId))
            const userData = userDoc.data()

            return {
              booking,
              userName: userData?.name || "Unknown",
              userEmail: userData?.email || "Unknown",
            }
          }),
        )

        setPassengers(passengersData)
      } catch (error) {
        console.error("Error fetching passengers:", error)
      } finally {
        setLoadingPassengers(false)
      }
    }

    if (selectedFlightId) {
      fetchPassengers()
    }
  }, [selectedFlightId])

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

  const selectedFlight = flights.find((f) => f.id === selectedFlightId)

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl font-bold mb-8">Flight Passengers</h1>

          {flights.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Plane className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No flights available</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Select Flight</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="flight">Flight</Label>
                    <Select value={selectedFlightId} onValueChange={setSelectedFlightId}>
                      <SelectTrigger id="flight">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {flights.map((flight) => (
                          <SelectItem key={flight.id} value={flight.id}>
                            {flight.flightNumber} - {flight.origin} → {flight.destination} (
                            {flight.departureTime.toLocaleDateString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedFlight && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Flight Details</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFlight.origin} → {selectedFlight.destination}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedFlight.departureTime.toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {loadingPassengers ? (
                <Skeleton className="h-64" />
              ) : passengers.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg text-muted-foreground">No passengers booked yet</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Passengers ({passengers.reduce((sum, p) => sum + p.booking.passengers, 0)} total)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {passengers.map((passenger) => (
                        <div
                          key={passenger.booking.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-semibold">{passenger.userName}</p>
                            <p className="text-sm text-muted-foreground">{passenger.userEmail}</p>
                            <p className="text-sm text-muted-foreground">
                              Confirmation: {passenger.booking.confirmationId}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {passenger.booking.passengers} passenger
                              {passenger.booking.passengers > 1 ? "s" : ""}
                            </p>
                            <p className="text-sm text-muted-foreground">${passenger.booking.totalPrice}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
