"""Flight repository implementation."""
from typing import Dict, Any, List
from datetime import datetime
from domain.models import Flight, FlightStatus
from .base_repository import BaseRepository
from google.cloud.firestore_v1 import FieldFilter


class FlightRepository(BaseRepository[Flight]):
    """Repository for Flight entity operations."""
    
    def __init__(self, db):
        super().__init__(db, "flights")
    
    def _to_domain(self, doc_dict: Dict[str, Any]) -> Flight:
        """Convert Firestore document to Flight domain model."""
        return Flight(
            id=doc_dict['id'],
            company_id=doc_dict['company_id'],
            company_name=doc_dict['company_name'],
            flight_number=doc_dict['flight_number'],
            origin=doc_dict['origin'],
            destination=doc_dict['destination'],
            departure_time=doc_dict['departure_time'],
            arrival_time=doc_dict['arrival_time'],
            duration=doc_dict['duration'],
            price=doc_dict['price'],
            available_seats=doc_dict['available_seats'],
            total_seats=doc_dict['total_seats'],
            stops=doc_dict.get('stops', 0),
            status=FlightStatus(doc_dict.get('status', 'scheduled')),
            created_at=doc_dict['created_at']
        )
    
    def _from_domain(self, entity: Flight) -> Dict[str, Any]:
        """Convert Flight domain model to Firestore document."""
        return {
            'company_id': entity.company_id,
            'company_name': entity.company_name,
            'flight_number': entity.flight_number,
            'origin': entity.origin,
            'destination': entity.destination,
            'departure_time': entity.departure_time,
            'arrival_time': entity.arrival_time,
            'duration': entity.duration,
            'price': entity.price,
            'available_seats': entity.available_seats,
            'total_seats': entity.total_seats,
            'stops': entity.stops,
            'status': entity.status.value,
            'created_at': entity.created_at
        }
    
    def search_flights(
        self,
        origin: str = None,
        destination: str = None,
        departure_date: datetime = None,
        limit: int = 50
    ) -> List[Flight]:
        """Search flights with filters."""
        query = self.collection
        
        if origin:
            query = query.where(filter=FieldFilter("origin", "==", origin))
        
        if destination:
            query = query.where(filter=FieldFilter("destination", "==", destination))
        
        if departure_date:
            # Search for flights on the same date
            start_of_day = departure_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = departure_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            query = query.where(filter=FieldFilter("departure_time", ">=", start_of_day))
            query = query.where(filter=FieldFilter("departure_time", "<=", end_of_day))
        
        # Only show scheduled flights
        query = query.where(filter=FieldFilter("status", "==", "scheduled"))
        query = query.limit(limit)
        
        docs = query.stream()
        results = []
        for doc in docs:
            doc_dict = doc.to_dict()
            doc_dict['id'] = doc.id
            results.append(self._to_domain(doc_dict))
        return results
    
    def get_by_company(self, company_id: str) -> List[Flight]:
        """Get all flights for a specific company."""
        return self.find_by_field('company_id', company_id)
    
    def update_available_seats(self, flight_id: str, seats_to_book: int) -> bool:
        """Update available seats after booking."""
        flight = self.get_by_id(flight_id)
        if not flight or flight.available_seats < seats_to_book:
            return False
        
        new_available = flight.available_seats - seats_to_book
        return self.update(flight_id, {'available_seats': new_available})

