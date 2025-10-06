"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2 } from "lucide-react"
import { doc, addDoc, updateDoc, deleteDoc, collection, serverTimestamp, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Offer, Flight } from "@/types"

interface OfferFormProps {
  offers: Offer[]
  onOfferChange: () => void
}

export function OfferForm({ offers, onOfferChange }: OfferFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [flights, setFlights] = useState<Flight[]>([])
  const [formData, setFormData] = useState({
    flightId: "",
    imageUrl: "",
    discount: 0,
    validUntil: "",
    active: true,
  })

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const flightsSnapshot = await getDocs(collection(db, "flights"))
        const flightsData = flightsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          departureTime: doc.data().departureTime.toDate(),
          arrivalTime: doc.data().arrivalTime.toDate(),
          createdAt: doc.data().createdAt.toDate(),
        })) as Flight[]
        setFlights(flightsData)
      } catch (error) {
        console.error("Error fetching flights:", error)
      }
    }
    fetchFlights()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const offerData = {
        ...formData,
        discount: Number(formData.discount),
        validUntil: new Date(formData.validUntil),
      }

      if (editingOffer) {
        // Update existing offer
        await updateDoc(doc(db, "offers", editingOffer.id), {
          ...offerData,
          updatedAt: serverTimestamp(),
        })
      } else {
        // Create new offer
        await addDoc(collection(db, "offers"), {
          ...offerData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }
      onOfferChange()
      setIsOpen(false)
      setEditingOffer(null)
      setFormData({
        flightId: "",
        imageUrl: "",
        discount: 0,
        validUntil: "",
        active: true,
      })
    } catch (error) {
      console.error("Error saving offer:", error)
    }
  }

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer)
    setFormData({
      flightId: offer.flightId,
      imageUrl: offer.imageUrl || "",
      discount: offer.discount,
      validUntil: offer.validUntil.toISOString().split('T')[0],
      active: offer.active,
    })
    setIsOpen(true)
  }

  const handleDelete = async (offerId: string) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      try {
        await deleteDoc(doc(db, "offers", offerId))
        onOfferChange()
      } catch (error) {
        console.error("Error deleting offer:", error)
      }
    }
  }

  const handleOpen = () => {
    setEditingOffer(null)
    setFormData({
      flightId: "",
      imageUrl: "",
      discount: 0,
      validUntil: "",
      active: true,
    })
    setIsOpen(true)
  }

  const getFlightForOffer = (offer: Offer) => {
    return flights.find(flight => flight.id === offer.flightId)
  }

  const getOfferTitle = (offer: Offer) => {
    const flight = getFlightForOffer(offer)
    return flight ? `${flight.origin} → ${flight.destination}` : "Unknown Route"
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button onClick={handleOpen} className="mb-2">
            <Plus className="h-4 w-4 mr-2" />
            Add Offer
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingOffer ? "Edit Offer" : "Add New Offer"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount">Discount (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="flightId">Flight</Label>
              <Select
                value={formData.flightId}
                onValueChange={(value) => setFormData({ ...formData, flightId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a flight" />
                </SelectTrigger>
                <SelectContent>
                  {flights.map((flight) => (
                    <SelectItem key={flight.id} value={flight.id}>
                      {flight.origin} → {flight.destination} - ${flight.price} ({flight.companyName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="validUntil">Valid Until</Label>
              <Input
                id="validUntil"
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingOffer ? "Update" : "Create"} Offer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {offers.map((offer) => {
          const flight = getFlightForOffer(offer)
          return (
            <div key={offer.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{getOfferTitle(offer)}</p>
                  <span className={`px-2 py-1 text-xs rounded-full ${offer.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                    {offer.active ? "Active" : "Inactive"}
                  </span>
                  <span className="text-xs text-muted-foreground">{offer.discount}% OFF</span>
                </div>
                {flight && (
                  <p className="text-xs text-muted-foreground">
                    ${flight.price} - {flight.companyName}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Valid until: {offer.validUntil.toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(offer)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(offer.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
