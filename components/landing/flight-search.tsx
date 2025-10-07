"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Calendar, MapPin, Users, Search } from "lucide-react"
import { useRouter } from "next/navigation"

export function FlightSearch() {
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [date, setDate] = useState("")
  const [passengers, setPassengers] = useState("1")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams({
      origin,
      destination,
      date,
      passengers,
    })
    router.push(`/flights?${params.toString()}`)
  }

  return (
    <Card className="p-6 shadow-lg">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="origin" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              From
            </Label>
            <Input
              id="origin"
              placeholder="New York (JFK)"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="destination" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              To
            </Label>
            <Input
              id="destination"
              placeholder="Los Angeles (LAX)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Departure Date
            </Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passengers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Passengers
            </Label>
            <Input
              id="passengers"
              type="number"
              min="1"
              max="9"
              value={passengers}
              onChange={(e) => setPassengers(e.target.value)}
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg">
          <Search className="mr-2 h-4 w-4" />
          Search Flights
        </Button>
      </form>
    </Card>
  )
}
