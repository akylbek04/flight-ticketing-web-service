"""Domain models representing business entities."""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class UserRole(str, Enum):
    """User role enumeration."""
    USER = "user"
    COMPANY = "company"
    ADMIN = "admin"


class FlightStatus(str, Enum):
    """Flight status enumeration."""
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BookingStatus(str, Enum):
    """Booking status enumeration."""
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class User(BaseModel):
    """User domain model."""
    id: str
    email: EmailStr
    name: str
    role: UserRole = UserRole.USER
    created_at: datetime
    blocked: bool = False
    
    class Config:
        use_enum_values = True


class AirlineCompany(BaseModel):
    """Airline company domain model."""
    id: str
    name: str
    code: str
    manager_id: str
    active: bool = True
    created_at: datetime
    
    class Config:
        use_enum_values = True


class Flight(BaseModel):
    """Flight domain model."""
    id: str
    company_id: str
    company_name: str
    flight_number: str
    origin: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    duration: int  # in minutes
    price: float
    available_seats: int
    total_seats: int
    stops: int = 0
    status: FlightStatus = FlightStatus.SCHEDULED
    created_at: datetime
    
    class Config:
        use_enum_values = True


class Booking(BaseModel):
    """Booking domain model."""
    id: str
    user_id: str
    flight_id: str
    confirmation_id: str
    passengers: int
    total_price: float
    status: BookingStatus = BookingStatus.CONFIRMED
    booked_at: datetime
    cancelled_at: Optional[datetime] = None
    flight: Optional[Flight] = None
    
    class Config:
        use_enum_values = True


class Banner(BaseModel):
    """Banner domain model for landing page."""
    id: str
    title: str
    description: str
    image_url: str
    link: Optional[str] = None
    active: bool = True
    order: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        use_enum_values = True


class Offer(BaseModel):
    """Special offer domain model."""
    id: str
    flight_id: str
    image_url: Optional[str] = None
    discount: float  # percentage
    valid_until: datetime
    active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        use_enum_values = True


# Request/Response DTOs
class UserCreate(BaseModel):
    """DTO for creating a new user."""
    email: EmailStr
    password: str
    name: str
    role: UserRole = UserRole.USER


class UserLogin(BaseModel):
    """DTO for user login."""
    email: EmailStr
    password: str


class FlightCreate(BaseModel):
    """DTO for creating a new flight."""
    company_id: str
    company_name: str
    flight_number: str
    origin: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    duration: int
    price: float
    available_seats: int
    total_seats: int
    stops: int = 0


class FlightUpdate(BaseModel):
    """DTO for updating flight information."""
    price: Optional[float] = None
    available_seats: Optional[int] = None
    status: Optional[FlightStatus] = None


class BookingCreate(BaseModel):
    """DTO for creating a new booking."""
    flight_id: str
    passengers: int


class BannerCreate(BaseModel):
    """DTO for creating a banner."""
    title: str
    description: str
    image_url: str
    link: Optional[str] = None
    order: int


class OfferCreate(BaseModel):
    """DTO for creating an offer."""
    flight_id: str
    image_url: Optional[str] = None
    discount: float
    valid_until: datetime

