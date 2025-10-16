"""Booking service layer."""
import uuid
from datetime import datetime
from typing import List, Optional
from domain.models import Booking, BookingCreate, BookingStatus
from infrastructure.repositories import BookingRepository, FlightRepository


class BookingService:
    """Service class for booking operations."""
    
    def __init__(self, booking_repo: BookingRepository, flight_repo: FlightRepository):
        self.booking_repo = booking_repo
        self.flight_repo = flight_repo
    
    def create_booking(self, user_id: str, booking_data: BookingCreate) -> Booking:
        """Create a new booking."""
        # Get flight details
        flight = self.flight_repo.get_by_id(booking_data.flight_id)
        if not flight:
            raise ValueError("Flight not found")
        
        # Check if enough seats available
        if flight.available_seats < booking_data.passengers:
            raise ValueError(f"Not enough seats available. Only {flight.available_seats} seats left")
        
        # Check if flight is scheduled
        if flight.status != "scheduled":
            raise ValueError("Flight is not available for booking")
        
        # Update available seats
        success = self.flight_repo.update_available_seats(
            booking_data.flight_id,
            booking_data.passengers
        )
        
        if not success:
            raise ValueError("Failed to reserve seats")
        
        # Create booking
        booking_id = str(uuid.uuid4())
        confirmation_id = f"CNF{uuid.uuid4().hex[:8].upper()}"
        
        booking_doc = {
            'user_id': user_id,
            'flight_id': booking_data.flight_id,
            'confirmation_id': confirmation_id,
            'passengers': booking_data.passengers,
            'total_price': flight.price * booking_data.passengers,
            'status': BookingStatus.CONFIRMED.value,
            'booked_at': datetime.utcnow()
        }
        
        self.booking_repo.create(booking_id, booking_doc)
        return self.booking_repo.get_by_id(booking_id)
    
    def get_booking(self, booking_id: str) -> Optional[Booking]:
        """Get booking by ID."""
        return self.booking_repo.get_by_id(booking_id)
    
    def get_user_bookings(self, user_id: str) -> List[Booking]:
        """Get all bookings for a user."""
        bookings = self.booking_repo.get_by_user(user_id)
        
        # Enrich with flight details
        for booking in bookings:
            flight = self.flight_repo.get_by_id(booking.flight_id)
            if flight:
                booking.flight = flight
        
        return bookings
    
    def cancel_booking(self, booking_id: str, user_id: str) -> bool:
        """Cancel a booking and restore seats."""
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise ValueError("Booking not found")
        
        # Verify booking belongs to user
        if booking.user_id != user_id:
            raise ValueError("Unauthorized to cancel this booking")
        
        # Check if already cancelled
        if booking.status == BookingStatus.CANCELLED:
            raise ValueError("Booking is already cancelled")
        
        # Cancel booking
        success = self.booking_repo.cancel_booking(booking_id)
        
        if success:
            # Restore seats to flight
            flight = self.flight_repo.get_by_id(booking.flight_id)
            if flight:
                new_available = flight.available_seats + booking.passengers
                self.flight_repo.update(booking.flight_id, {'available_seats': new_available})
        
        return success
    
    def get_flight_bookings(self, flight_id: str) -> List[Booking]:
        """Get all bookings for a flight (for company/admin)."""
        return self.booking_repo.get_by_flight(flight_id)

