"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface FlightFiltersProps {
  filters: {
    maxPrice: number
    airlines: string[]
    stops: string
    sortBy: string
    destinations?: string[]
  }
  setFilters: (filters: any) => void
  availableAirlines?: string[]
  availableDestinations?: string[]
}

export function FlightFilters({ filters, setFilters, availableAirlines = [], availableDestinations = [] }: FlightFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Max Price: ${filters.maxPrice}</Label>
          <Slider
            value={[filters.maxPrice]}
            onValueChange={([value]) => setFilters({ ...filters, maxPrice: value })}
            max={2000}
            min={100}
            step={50}
          />
        </div>

        <div className="space-y-2">
          <Label>Airlines</Label>
          <div className="space-y-2">
            {availableAirlines.map((airline) => (
              <div key={airline} className="flex items-center space-x-2">
                <Checkbox
                  id={airline}
                  checked={filters.airlines.includes(airline)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setFilters({ ...filters, airlines: [...filters.airlines, airline] })
                    } else {
                      setFilters({
                        ...filters,
                        airlines: filters.airlines.filter((a) => a !== airline),
                      })
                    }
                  }}
                />
                <label htmlFor={airline} className="text-sm cursor-pointer">
                  {airline}
                </label>
              </div>
            ))}
          </div>
        </div>

        {availableDestinations.length > 0 && (
          <div className="space-y-2">
            <Label>Destinations</Label>
            <div className="space-y-2">
              {availableDestinations.map((destination) => (
                <div key={destination} className="flex items-center space-x-2">
                  <Checkbox
                    id={destination}
                    checked={filters.destinations?.includes(destination) || false}
                    onCheckedChange={(checked) => {
                      const currentDestinations = filters.destinations || []
                      if (checked) {
                        setFilters({ ...filters, destinations: [...currentDestinations, destination] })
                      } else {
                        setFilters({
                          ...filters,
                          destinations: currentDestinations.filter((d) => d !== destination),
                        })
                      }
                    }}
                  />
                  <label htmlFor={destination} className="text-sm cursor-pointer">
                    {destination}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Stops</Label>
          <RadioGroup value={filters.stops} onValueChange={(value) => setFilters({ ...filters, stops: value })}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="any" id="any" />
              <Label htmlFor="any" className="cursor-pointer">
                Any
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nonstop" id="nonstop" />
              <Label htmlFor="nonstop" className="cursor-pointer">
                Nonstop
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1stop" id="1stop" />
              <Label htmlFor="1stop" className="cursor-pointer">
                1 Stop
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Sort By</Label>
          <RadioGroup value={filters.sortBy} onValueChange={(value) => setFilters({ ...filters, sortBy: value })}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="price" id="price" />
              <Label htmlFor="price" className="cursor-pointer">
                Price
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="duration" id="duration" />
              <Label htmlFor="duration" className="cursor-pointer">
                Duration
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="departure" id="departure" />
              <Label htmlFor="departure" className="cursor-pointer">
                Departure Time
              </Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  )
}
