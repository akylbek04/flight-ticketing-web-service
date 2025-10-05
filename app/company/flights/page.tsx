"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Plane, RefreshCw } from "lucide-react"
import type { Flight } from "@/types"

export default function CompanyFlightsPage() {
  const { user, role, loading: authLoading } = useAuth()
  const router = useRouter()
  const [flights, setFlights] = useState<Flight[]>([])
  const [loading, setLoading] = useState(true)
  const [companyId, setCompanyId] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null)

  console.log("Flights:", flights)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (!authLoading && role !== "company") {
      router.push("/dashboard")
    }
  }, [user, role, authLoading, router])

  const fetchFlights = async () => {
    if (!user || role !== "company") return

    setLoading(true)
    try {
      // Get company info
      const companiesRef = collection(db, "companies")
      const companyQuery = query(companiesRef, where("managerId", "==", user.uid))
      const companySnapshot = await getDocs(companyQuery)

      if (companySnapshot.empty) {
        console.log("No company found for user:", user.uid)
        setLoading(false)
        return
      }

      const company = companySnapshot.docs[0]
      const companyData = company.data()
      setCompanyId(company.id)
      setCompanyName(companyData.name)

      // Get flights
      const flightsRef = collection(db, "flights")
      const flightsQuery = query(flightsRef, where("companyId", "==", company.id))
      console.log("Querying flights for company:", company.id)
      const flightsSnapshot = await getDocs(flightsQuery)
      console.log("Found", flightsSnapshot.docs.length, "flight documents")

      const flightsData = flightsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        departureTime: doc.data().departureTime.toDate(),
        arrivalTime: doc.data().arrivalTime.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Flight[]

      console.log("Fetched flights:", flightsData.length, "flights")
      setFlights(flightsData)
    } catch (error) {
      console.error("Error fetching flights:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch flights when auth is not loading and user has company role
    console.log("Auth state:", { authLoading, user: !!user, role })
    if (!authLoading && user && role === "company") {
      console.log("Fetching flights for user:", user.uid)
      fetchFlights()
    }
  }, [user, role, authLoading])

  // Refetch data when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && role === "company" && companyId) {
        console.log("Page became visible, refetching flights")
        fetchFlights()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [user, role, companyId])

  // Ensure flights are fetched when companyId becomes available
  useEffect(() => {
    if (companyId && flights.length === 0 && !loading) {
      console.log("Company ID available but no flights, refetching...")
      fetchFlights()
    }
  }, [companyId])

  const handleDelete = async (flightId: string) => {
    if (!confirm("Are you sure you want to delete this flight?")) return

    try {
      await deleteDoc(doc(db, "flights", flightId))
      setFlights((prev) => prev.filter((f) => f.id !== flightId))
    } catch (error) {
      console.error("Error deleting flight:", error)
      alert("Failed to delete flight")
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

  if (!user || role !== "company") return null

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Manage Flights</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fetchFlights()}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingFlight(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Flight
                </Button>
              </DialogTrigger>
              </Dialog>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingFlight ? "Edit Flight" : "Add New Flight"}</DialogTitle>
                  <DialogDescription>
                    {editingFlight ? "Update flight details" : "Create a new flight for your airline"}
                  </DialogDescription>
                </DialogHeader>
                {companyId && companyName ? (
                  <FlightForm
                    companyId={companyId}
                    companyName={companyName}
                    flight={editingFlight}
                    onSuccess={(newFlight) => {
                      if (editingFlight) {
                        setFlights((prev) => prev.map((f) => (f.id === newFlight.id ? newFlight : f)))
                      } else {
                        setFlights((prev) => [...prev, newFlight])
                      }
                      setDialogOpen(false)
                      setEditingFlight(null)
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                      <p className="text-sm text-muted-foreground">Loading company information...</p>
                    </div>
                  </div>
                )}
            </DialogContent>
          </Dialog>

          {flights.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Plane className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground mb-4">No flights yet</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Flight
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {flights.map((flight) => (
                <Card key={flight.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">Flight {flight.flightNumber}</h3>
                          <Badge variant={flight.status === "scheduled" ? "default" : "secondary"}>
                            {flight.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {flight.origin} → {flight.destination}
                        </p>
                        <p className="text-sm">
                          {flight.departureTime.toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {flight.availableSeats} / {flight.totalSeats} seats available • ${flight.price} per seat
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingFlight(flight)
                            setDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(flight.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

function FlightForm({
  companyId,
  companyName,
  flight,
  onSuccess,
}: {
  companyId: string
  companyName: string
  flight: Flight | null
  onSuccess: (flight: Flight) => void
}) {
  const [formData, setFormData] = useState({
    flightNumber: flight?.flightNumber || "",
    origin: flight?.origin || "",
    destination: flight?.destination || "",
    departureTime: flight?.departureTime
      ? new Date(flight.departureTime.getTime() - flight.departureTime.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : "",
    arrivalTime: flight?.arrivalTime
      ? new Date(flight.arrivalTime.getTime() - flight.arrivalTime.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : "",
    price: flight?.price || 0,
    totalSeats: flight?.totalSeats || 0,
    stops: flight?.stops || 0,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const departureTime = new Date(formData.departureTime)
      const arrivalTime = new Date(formData.arrivalTime)
      const duration = Math.floor((arrivalTime.getTime() - departureTime.getTime()) / (1000 * 60))

      const flightData = {
        companyId,
        companyName,
        flightNumber: formData.flightNumber,
        origin: formData.origin,
        destination: formData.destination,
        departureTime,
        arrivalTime,
        duration,
        price: Number(formData.price),
        totalSeats: Number(formData.totalSeats),
        availableSeats: flight ? flight.availableSeats : Number(formData.totalSeats),
        stops: Number(formData.stops),
        status: "scheduled",
        createdAt: flight?.createdAt || new Date(),
      }

      if (flight) {
        await updateDoc(doc(db, "flights", flight.id), flightData)
        onSuccess({ ...flightData, id: flight.id } as Flight)
      } else {
        const docRef = await addDoc(collection(db, "flights"), flightData)
        onSuccess({ ...flightData, id: docRef.id } as Flight)
      }
    } catch (error) {
      console.error("Error saving flight:", error)
      alert("Failed to save flight")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="flightNumber">Flight Number</Label>
          <Input
            id="flightNumber"
            value={formData.flightNumber}
            onChange={(e) => setFormData({ ...formData, flightNumber: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stops">Stops</Label>
          <Input
            id="stops"
            type="number"
            min="0"
            value={formData.stops}
            onChange={(e) => setFormData({ ...formData, stops: Number(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="origin">Origin</Label>
          <Input
            id="origin"
            value={formData.origin}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="destination">Destination</Label>
          <Input
            id="destination"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="departureTime">Departure Time</Label>
          <Input
            id="departureTime"
            type="datetime-local"
            value={formData.departureTime}
            onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="arrivalTime">Arrival Time</Label>
          <Input
            id="arrivalTime"
            type="datetime-local"
            value={formData.arrivalTime}
            onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price per Seat ($)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="totalSeats">Total Seats</Label>
          <Input
            id="totalSeats"
            type="number"
            min="1"
            value={formData.totalSeats}
            onChange={(e) => setFormData({ ...formData, totalSeats: Number(e.target.value) })}
            required
            disabled={!!flight}
          />
        </div>
      </div>

      <Button type="submit" disabled={saving} className="w-full">
        {saving ? "Saving..." : flight ? "Update Flight" : "Create Flight"}
      </Button>
    </form>
  )
}
