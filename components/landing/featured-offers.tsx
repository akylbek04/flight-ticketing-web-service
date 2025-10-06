"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plane, Clock, Tag } from "lucide-react"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import type { Offer, Flight } from "@/types"

export function FeaturedOffers() {
  const { user } = useAuth()
  const router = useRouter()
  const [offers, setOffers] = useState<Offer[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  console.log('offers', offers)

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const offersQuery = query(
          collection(db, "offers"),
          where("active", "==", true),
        )
        const offersSnapshot = await getDocs(offersQuery)
        const offersData = offersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          validUntil: doc.data().validUntil.toDate(),
          createdAt: doc.data().createdAt.toDate(),
        })) as Offer[]

        // Fetch associated flights
        const flightIds = offersData.map(offer => offer.flightId)
        const flightsQuery = query(
          collection(db, "flights"),
          where("__name__", "in", flightIds)
        )
        const flightsSnapshot = await getDocs(flightsQuery)
        const flightsData = flightsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          departureTime: doc.data().departureTime.toDate(),
          arrivalTime: doc.data().arrivalTime.toDate(),
          createdAt: doc.data().createdAt.toDate(),
        })) as Flight[]

        setOffers(offersData)
        setFlights(flightsData)
      } catch (error) {
        console.error("Error fetching offers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOffers()
  }, [])

  const handleBookNow = (offer: Offer) => {
    if (user) {
      // User is logged in, navigate to booking page
      router.push(`/booking/${offer.flightId}`)
    } else {
      // User is not logged in, redirect to login
      const nextUrl = `/booking/${offer.flightId}`
      router.push(`/auth/login?next=${encodeURIComponent(nextUrl)}`)
    }
  }

  const getFlightForOffer = (offer: Offer) => {
    return flights.find(flight => flight.id === offer.flightId)
  }

  const getOfferTitle = (offer: Offer) => {
    const flight = getFlightForOffer(offer)
    return flight ? `${flight.origin} → ${flight.destination}` : "Unknown Route"
  }
  if (loading) {
    return (
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-balance">Featured Deals</h2>
            <p className="text-muted-foreground text-lg text-pretty">Don't miss out on these amazing flight offers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-full mb-4" />
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-balance">Featured Deals</h2>
          <p className="text-muted-foreground text-lg text-pretty">Don't miss out on these amazing flight offers</p>
        </div>

        {offers.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold mb-2">No offers available</h3>
            <p className="text-muted-foreground">Check back later for exciting deals!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => {
              const flight = getFlightForOffer(offer)
              if (!flight) return null

              const discountedPrice = flight.price - (flight.price * offer.discount / 100)
              const duration = Math.round(flight.duration / 60) // Convert minutes to hours

              return (
                <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48">
                    <img
                      src={offer.imageUrl || "/placeholder.svg"}
                      alt={getOfferTitle(offer)}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
                      <Tag className="h-3 w-3 mr-1" />
                      {offer.discount}% OFF
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{getOfferTitle(offer)}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      {flight.origin} → {flight.destination}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground line-through">${flight.price}</p>
                          <p className="text-2xl font-bold text-primary">${Math.round(discountedPrice)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">{flight.companyName}</p>
                          <p className="text-sm flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {duration}h {flight.duration % 60}m
                          </p>
                        </div>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={() => handleBookNow(offer)}
                      >
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
