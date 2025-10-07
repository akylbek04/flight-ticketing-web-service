"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { FlightList } from "@/components/flights/flight-list"
import { FlightFilters } from "@/components/flights/flight-filters"
import { Skeleton } from "@/components/ui/skeleton"

function FlightsContent() {
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState({
    maxPrice: 1000,
    airlines: [] as string[],
    stops: "any",
    sortBy: "price",
    destinations: [] as string[],
  })
  const [availableAirlines, setAvailableAirlines] = useState<string[]>([])
  const [availableDestinations, setAvailableDestinations] = useState<string[]>([])

  const origin = searchParams.get("origin") || ""
  const destination = searchParams.get("destination") || ""
  const date = searchParams.get("date") || ""
  const passengers = searchParams.get("passengers") || "1"

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Available Flights</h1>
            {origin && destination ? (
              <p className="text-muted-foreground">
                {origin} → {destination}{date ? ` • ${date}` : ""} • {passengers} passenger{passengers !== "1" ? "s" : ""}
              </p>
            ) : (
              <p className="text-muted-foreground">
                Browse all available flights and use filters to find your perfect journey
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <aside className="lg:col-span-1">
              <FlightFilters 
                filters={filters} 
                setFilters={setFilters} 
                availableAirlines={availableAirlines}
                availableDestinations={availableDestinations}
              />
            </aside>
            <div className="lg:col-span-3">
              <FlightList
                origin={origin}
                destination={destination}
                date={date}
                passengers={Number.parseInt(passengers)}
                filters={filters}
                onAirlinesChange={setAvailableAirlines}
                onDestinationsChange={setAvailableDestinations}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function FlightsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-screen" />}>
      <FlightsContent />
    </Suspense>
  )
}
