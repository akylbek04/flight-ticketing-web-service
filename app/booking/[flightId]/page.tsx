"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { doc, getDoc, addDoc, collection, updateDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import type { Flight } from "@/types"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plane, Calendar, Users, CreditCard } from "lucide-react"
import { Suspense } from "react"

function BookingContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const flightId = params.flightId as string
  const passengers = Number.parseInt(searchParams.get("passengers") || "1")

  const [flight, setFlight] = useState<Flight | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    const fetchFlight = async () => {
      try {
        const flightDoc = await getDoc(doc(db, "flights", flightId))
        if (flightDoc.exists()) {
          setFlight({
            id: flightDoc.id,
            ...flightDoc.data(),
            departureTime: flightDoc.data().departureTime.toDate(),
            arrivalTime: flightDoc.data().arrivalTime.toDate(),
            createdAt: flightDoc.data().createdAt.toDate(),
          } as Flight)
        }
      } catch (error) {
        console.error("Error fetching flight:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFlight()
  }, [flightId])

  const handleBooking = async () => {
    if (!user) {
      const nextUrl = `/booking/${flightId}?passengers=${passengers}`
      router.push(`/auth/login?next=${encodeURIComponent(nextUrl)}`)
      return
    }

    if (!flight) return

    setBooking(true)
    try {
      // Generate confirmation ID
      const confirmationId = `BK${Date.now().toString(36).toUpperCase()}`

      // Create booking
      await addDoc(collection(db, "bookings"), {
        userId: user.uid,
        flightId: flight.id,
        confirmationId,
        passengers,
        totalPrice: flight.price * passengers,
        status: "confirmed",
        bookedAt: new Date(),
      })

      // Update available seats
      await updateDoc(doc(db, "flights", flight.id), {
        availableSeats: increment(-passengers),
      })

      router.push(`/dashboard/tickets?confirmation=${confirmationId}`)
    } catch (error) {
      console.error("Error creating booking:", error)
      alert("Failed to book flight. Please try again.")
    } finally {
      setBooking(false)
    }
  }

  if (loading || authLoading) {
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

  if (!flight) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg text-muted-foreground">Flight not found</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const totalPrice = flight.price * passengers

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl font-bold mb-8">Complete Your Booking</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Flight Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Plane className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{flight.companyName}</p>
                      <p className="text-sm text-muted-foreground">Flight {flight.flightNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">
                        {flight.departureTime.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
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

                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">
                        {passengers} Passenger{passengers > 1 ? "s" : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {flight.origin} → {flight.destination}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    This is a demo system. Click "Confirm Booking" to mark this booking as paid.
                  </p>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Demo Payment</p>
                    <p className="text-xs text-muted-foreground">No actual payment will be processed</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Price Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      ${flight.price} × {passengers} passenger{passengers > 1 ? "s" : ""}
                    </span>
                    <span className="font-semibold">${totalPrice}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${totalPrice}</span>
                    </div>
                  </div>
                  <Button onClick={handleBooking} disabled={booking} className="w-full" size="lg">
                    {booking ? "Processing..." : "Confirm Booking"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    By booking, you agree to our terms and conditions
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={<Skeleton className="h-screen" />}>
      <BookingContent />
    </Suspense>
  )
}
