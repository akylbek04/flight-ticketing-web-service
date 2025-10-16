"""Booking API routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from domain.models import Booking, BookingCreate, User
from services import BookingService
from infrastructure.repositories import BookingRepository, FlightRepository
from infrastructure.database import get_firebase_db
from core.dependencies import get_current_user

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def get_booking_service(db = Depends(get_firebase_db)) -> BookingService:
    """Dependency to get BookingService instance."""
    booking_repo = BookingRepository(db)
    flight_repo = FlightRepository(db)
    return BookingService(booking_repo, flight_repo)


@router.post("/", response_model=Booking, status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user),
    booking_service: BookingService = Depends(get_booking_service)
):
    """Create a new booking. Requires authentication."""
    try:
        booking = booking_service.create_booking(current_user.id, booking_data)
        return booking
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/my-bookings", response_model=List[Booking])
async def get_my_bookings(
    current_user: User = Depends(get_current_user),
    booking_service: BookingService = Depends(get_booking_service)
):
    """Get all bookings for the current user."""
    try:
        bookings = booking_service.get_user_bookings(current_user.id)
        return bookings
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{booking_id}", response_model=Booking)
async def get_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    booking_service: BookingService = Depends(get_booking_service)
):
    """Get booking details by ID."""
    booking = booking_service.get_booking(booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    
    # Verify user owns this booking
    if booking.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return booking


@router.delete("/{booking_id}")
async def cancel_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    booking_service: BookingService = Depends(get_booking_service)
):
    """Cancel a booking."""
    try:
        success = booking_service.cancel_booking(booking_id, current_user.id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
        return {"message": "Booking cancelled successfully"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/flight/{flight_id}/bookings", response_model=List[Booking])
async def get_flight_bookings(
    flight_id: str,
    current_user: User = Depends(get_current_user),
    booking_service: BookingService = Depends(get_booking_service)
):
    """Get all bookings for a specific flight. Requires company or admin role."""
    from domain.models import UserRole
    
    if current_user.role not in [UserRole.COMPANY, UserRole.ADMIN]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    try:
        bookings = booking_service.get_flight_bookings(flight_id)
        return bookings
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

