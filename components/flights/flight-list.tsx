"use client"

import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Flight } from "@/types"
import { FlightCard } from "./flight-card"
import { Skeleton } from "@/components/ui/skeleton"

interface FlightListProps {
  origin: string
  destination: string
  date: string
  passengers: number
  filters: {
    maxPrice: number
    airlines: string[]
    stops: string
    sortBy: string
    destinations?: string[]
  }
  onAirlinesChange?: (airlines: string[]) => void
  onDestinationsChange?: (destinations: string[]) => void
}

export function FlightList({ origin, destination, date, passengers, filters, onAirlinesChange, onDestinationsChange }: FlightListProps) {
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)

  console.log("Flight List Filters:", filters)

  console.log("Flight List Flights:", flights)

  useEffect(() => {
    const fetchFlights = async () => {
      setLoading(true)
      try {
        const flightsRef = collection(db, "flights")
        
        // Build query based on whether we have search parameters
        let q
        if (origin && destination) {
          // Search scenario: filter by origin and destination
          q = query(
            flightsRef,
            where("origin", "==", origin),
            where("destination", "==", destination),
            where("status", "==", "scheduled"),
          )
        } else {
          // Browse scenario: get all scheduled flights
          q = query(
            flightsRef,
            where("status", "==", "scheduled"),
          )
        }

        const querySnapshot = await getDocs(q)
        const flightsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          departureTime: doc.data().departureTime.toDate(),
          arrivalTime: doc.data().arrivalTime.toDate(),
          createdAt: doc.data().createdAt.toDate(),
        })) as Flight[]

        // Apply filters
        const filtered = flightsData.filter((flight) => {
          if (flight.price > filters.maxPrice) return false
          if (filters.airlines.length > 0 && !filters.airlines.includes(flight.companyName)) return false
          if (filters.destinations && filters.destinations.length > 0 && !filters.destinations.includes(flight.destination)) return false
          if (filters.stops === "nonstop" && flight.stops !== 0) return false
          if (filters.stops === "1stop" && flight.stops !== 1) return false
          if (flight.availableSeats < passengers) return false

          if (date) {
            const searchDate = new Date(date) // incoming prop from search
            const flightDate = new Date(flight.departureTime)
        
            const searchDateStr = searchDate.toISOString().split("T")[0]
            const flightDateStr = flightDate.toISOString().split("T")[0]
        
            if (searchDateStr !== flightDateStr) return false
          }
        
          return true
        })



        // Sort
        filtered.sort((a, b) => {
          if (filters.sortBy === "price") return a.price - b.price
          if (filters.sortBy === "duration") return a.duration - b.duration
          if (filters.sortBy === "departure") return a.departureTime.getTime() - b.departureTime.getTime()
          return 0
        })

        setFlights(filtered)
        
        // Extract unique airlines and destinations from all flights (not just filtered ones)
        const uniqueAirlines = [...new Set(flightsData.map(flight => flight.companyName))].sort()
        const uniqueDestinations = [...new Set(flightsData.map(flight => flight.destination))].sort()
        onAirlinesChange?.(uniqueAirlines)
        onDestinationsChange?.(uniqueDestinations)
      } catch (error) {
        console.error("Error fetching flights:", error)
      } finally {
        setLoading(false)
      }
    }

    // Always fetch flights, regardless of search parameters
    fetchFlights()
  }, [origin, destination, date, passengers, filters])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48" />
        ))}
      </div>
    )
  }

  if (flights.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">No flights found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {flights.map((flight) => (
        <FlightCard key={flight.id} flight={flight} passengers={passengers} />
      ))}
    </div>
  )
}
