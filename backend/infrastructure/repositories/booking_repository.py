"""Booking repository implementation."""
from typing import Dict, Any, List
from domain.models import Booking, BookingStatus
from .base_repository import BaseRepository


class BookingRepository(BaseRepository[Booking]):
    """Repository for Booking entity operations."""
    
    def __init__(self, db):
        super().__init__(db, "bookings")
    
    def _to_domain(self, doc_dict: Dict[str, Any]) -> Booking:
        """Convert Firestore document to Booking domain model."""
        return Booking(
            id=doc_dict['id'],
            user_id=doc_dict['user_id'],
            flight_id=doc_dict['flight_id'],
            confirmation_id=doc_dict['confirmation_id'],
            passengers=doc_dict['passengers'],
            total_price=doc_dict['total_price'],
            status=BookingStatus(doc_dict.get('status', 'confirmed')),
            booked_at=doc_dict['booked_at'],
            cancelled_at=doc_dict.get('cancelled_at')
        )
    
    def _from_domain(self, entity: Booking) -> Dict[str, Any]:
        """Convert Booking domain model to Firestore document."""
        data = {
            'user_id': entity.user_id,
            'flight_id': entity.flight_id,
            'confirmation_id': entity.confirmation_id,
            'passengers': entity.passengers,
            'total_price': entity.total_price,
            'status': entity.status.value,
            'booked_at': entity.booked_at
        }
        if entity.cancelled_at:
            data['cancelled_at'] = entity.cancelled_at
        return data
    
    def get_by_user(self, user_id: str) -> List[Booking]:
        """Get all bookings for a specific user."""
        return self.find_by_field('user_id', user_id)
    
    def get_by_flight(self, flight_id: str) -> List[Booking]:
        """Get all bookings for a specific flight."""
        return self.find_by_field('flight_id', flight_id)
    
    def cancel_booking(self, booking_id: str) -> bool:
        """Cancel a booking."""
        from datetime import datetime
        return self.update(booking_id, {
            'status': BookingStatus.CANCELLED.value,
            'cancelled_at': datetime.utcnow()
        })

