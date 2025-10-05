"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore"
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
import { Ticket, Search, Plane, Calendar, Users, X } from "lucide-react"
import type { Booking, Flight } from "@/types"

function TicketsContent() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchId, setSearchId] = useState(searchParams.get("confirmation") || "")
  const [searchResult, setSearchResult] = useState<Booking | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return

      setLoading(true)
      try {
        const bookingsRef = collection(db, "bookings")
        const q = query(bookingsRef, where("userId", "==", user.uid))
        const querySnapshot = await getDocs(q)

        const bookingsData = await Promise.all(
          querySnapshot.docs.map(async (bookingDoc) => {
            const bookingData = {
              id: bookingDoc.id,
              ...bookingDoc.data(),
              bookedAt: bookingDoc.data().bookedAt.toDate(),
              cancelledAt: bookingDoc.data().cancelledAt?.toDate(),
            } as Booking

            // Fetch flight details
            const flightDoc = await getDoc(doc(db, "flights", bookingData.flightId))
            if (flightDoc.exists()) {
              bookingData.flight = {
                id: flightDoc.id,
                ...flightDoc.data(),
                departureTime: flightDoc.data().departureTime.toDate(),
                arrivalTime: flightDoc.data().arrivalTime.toDate(),
                createdAt: flightDoc.data().createdAt.toDate(),
              } as Flight
            }

            return bookingData
          }),
        )

        setBookings(bookingsData)
      } catch (error) {
        console.error("Error fetching bookings:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchBookings()
    }
  }, [user])

  const handleSearch = async () => {
    if (!searchId.trim()) return

    const booking = bookings.find((b) => b.confirmationId === searchId.trim())
    setSearchResult(booking || null)
  }

  const handleCancelBooking = async (bookingId: string, flightDepartureTime: Date) => {
    const hoursUntilFlight = (flightDepartureTime.getTime() - Date.now()) / (1000 * 60 * 60)

    if (hoursUntilFlight < 24) {
      if (!confirm("This booking is non-refundable (less than 24 hours before departure). Continue?")) {
        return
      }
    }

    try {
      const status = hoursUntilFlight >= 24 ? "refunded" : "cancelled"
      await updateDoc(doc(db, "bookings", bookingId), {
        status,
        cancelledAt: new Date(),
      })

      // Refresh bookings
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status, cancelledAt: new Date() } : b)))

      alert(hoursUntilFlight >= 24 ? "Booking cancelled and refunded" : "Booking cancelled (non-refundable)")
    } catch (error) {
      console.error("Error cancelling booking:", error)
      alert("Failed to cancel booking")
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

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl font-bold mb-8">My Tickets</h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search by Confirmation ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="confirmationId" className="sr-only">
                    Confirmation ID
                  </Label>
                  <Input
                    id="confirmationId"
                    placeholder="Enter confirmation ID"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                  />
                </div>
                <Button onClick={handleSearch}>Search</Button>
              </div>
              {searchResult && (
                <div className="mt-4">
                  <BookingCard booking={searchResult} onCancel={handleCancelBooking} />
                </div>
              )}
              {searchId && !searchResult && searchResult !== null && (
                <p className="mt-4 text-sm text-muted-foreground">No booking found with this confirmation ID</p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">All Bookings</h2>
            {bookings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">No bookings yet</p>
                  <Button asChild className="mt-4">
                    <a href="/">Search Flights</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} onCancel={handleCancelBooking} />
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function BookingCard({
  booking,
  onCancel,
}: {
  booking: Booking
  onCancel: (bookingId: string, flightDepartureTime: Date) => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500"
      case "cancelled":
        return "bg-red-500"
      case "refunded":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmation ID</p>
                <p className="font-mono font-bold">{booking.confirmationId}</p>
              </div>
              <Badge className={getStatusColor(booking.status)}>{booking.status.toUpperCase()}</Badge>
            </div>

            {booking.flight && (
              <>
                <div className="flex items-center gap-3">
                  <Plane className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{booking.flight.companyName}</p>
                    <p className="text-sm text-muted-foreground">Flight {booking.flight.flightNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">
                      {booking.flight.departureTime.toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.flight.origin} → {booking.flight.destination}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm">
                    {booking.passengers} passenger{booking.passengers > 1 ? "s" : ""}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col items-end justify-between gap-2">
            <div className="text-right">
              <p className="text-2xl font-bold">${booking.totalPrice}</p>
              <p className="text-sm text-muted-foreground">Total paid</p>
            </div>
            {booking.status === "confirmed" && booking.flight && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onCancel(booking.id, booking.flight!.departureTime)}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-screen" />}>
      <TicketsContent />
    </Suspense>
  )
}
