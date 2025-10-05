import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plane, Clock, Tag } from "lucide-react"

const offers = [
  {
    id: 1,
    destination: "Paris, France",
    origin: "New York",
    price: 299,
    originalPrice: 499,
    discount: 40,
    airline: "Air France",
    duration: "7h 30m",
    image: "/eiffel-tower-paris.png",
  },
  {
    id: 2,
    destination: "Tokyo, Japan",
    origin: "Los Angeles",
    price: 599,
    originalPrice: 899,
    discount: 33,
    airline: "Japan Airlines",
    duration: "11h 45m",
    image: "/tokyo-skyline.png",
  },
  {
    id: 3,
    destination: "London, UK",
    origin: "Boston",
    price: 349,
    originalPrice: 549,
    discount: 36,
    airline: "British Airways",
    duration: "6h 50m",
    image: "/london-big-ben.png",
  },
]

export function FeaturedOffers() {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-balance">Featured Deals</h2>
          <p className="text-muted-foreground text-lg text-pretty">Don't miss out on these amazing flight offers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <img
                  src={offer.image || "/placeholder.svg"}
                  alt={offer.destination}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
                  <Tag className="h-3 w-3 mr-1" />
                  {offer.discount}% OFF
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{offer.destination}</span>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  From {offer.origin}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground line-through">${offer.originalPrice}</p>
                      <p className="text-2xl font-bold text-primary">${offer.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{offer.airline}</p>
                      <p className="text-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {offer.duration}
                      </p>
                    </div>
                  </div>
                  <Button className="w-full">Book Now</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
