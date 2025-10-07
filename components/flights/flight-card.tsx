"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plane, Clock } from "lucide-react"
import type { Flight } from "@/types"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

interface FlightCardProps {
  flight: Flight
  passengers: number
}

export function FlightCard({ flight, passengers }: FlightCardProps) {
  const router = useRouter()
  const { user } = useAuth()

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const handleBook = () => {
    if (!user) {
      const bookingUrl = `/booking/${flight.id}?passengers=${passengers}`
      router.push(`/auth/login?next=${encodeURIComponent(bookingUrl)}`)
      return
    }
    
    router.push(`/booking/${flight.id}?passengers=${passengers}`)
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{flight.companyName}</p>
                <p className="text-xs text-muted-foreground">Flight {flight.flightNumber}</p>
              </div>
              {flight.stops === 0 && <Badge variant="secondary">Nonstop</Badge>}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{formatTime(flight.departureTime)}</p>
                <p className="text-sm text-muted-foreground">{flight.origin}</p>
              </div>

              <div className="flex-1 flex flex-col items-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{formatDuration(flight.duration)}</span>
                </div>
                <div className="w-full h-px bg-border my-2 relative">
                  <Plane className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background text-muted-foreground" />
                </div>
                {flight.stops > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {flight.stops} stop{flight.stops > 1 ? "s" : ""}
                  </p>
                )}
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold">{formatTime(flight.arrivalTime)}</p>
                <p className="text-sm text-muted-foreground">{flight.destination}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{flight.availableSeats} seats available</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 md:min-w-[200px]">
            <div className="text-right">
              <p className="text-3xl font-bold">${flight.price}</p>
              <p className="text-sm text-muted-foreground">per person</p>
            </div>
            <Button onClick={handleBook} size="lg" className="w-full md:w-auto">
              Book Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
