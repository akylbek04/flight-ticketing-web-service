export type UserRole = "user" | "company" | "admin"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
  blocked?: boolean
}

export interface AirlineCompany {
  id: string
  name: string
  code: string
  managerId: string
  active: boolean
  createdAt: Date
}

export interface Flight {
  id: string
  companyId: string
  companyName: string
  flightNumber: string
  origin: string
  destination: string
  departureTime: Date
  arrivalTime: Date
  duration: number
  price: number
  availableSeats: number
  totalSeats: number
  stops: number
  status: "scheduled" | "completed" | "cancelled"
  createdAt: Date
}

export interface Booking {
  id: string
  userId: string
  flightId: string
  confirmationId: string
  passengers: number
  totalPrice: number
  status: "confirmed" | "cancelled" | "refunded"
  bookedAt: Date
  cancelledAt?: Date
  flight?: Flight
}

export interface Banner {
  id: string
  title: string
  description: string
  imageUrl: string
  link?: string
  active: boolean
  order: number
  createdAt: Date
  updatedAt?: Date
}

export interface Offer {
  id: string
  title: string
  description: string
  flightId: string
  discount: number
  validUntil: Date
  active: boolean
  createdAt: Date
  updatedAt?: Date
}
