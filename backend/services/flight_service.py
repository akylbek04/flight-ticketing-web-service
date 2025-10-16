"""Flight service layer."""
import uuid
from datetime import datetime
from typing import List, Optional
from domain.models import Flight, FlightCreate, FlightUpdate, FlightStatus
from infrastructure.repositories import FlightRepository


class FlightService:
    """Service class for flight operations."""
    
    def __init__(self, flight_repo: FlightRepository):
        self.flight_repo = flight_repo
    
    def create_flight(self, flight_data: FlightCreate) -> Flight:
        """Create a new flight."""
        flight_id = str(uuid.uuid4())
        
        flight_doc = {
            'company_id': flight_data.company_id,
            'company_name': flight_data.company_name,
            'flight_number': flight_data.flight_number,
            'origin': flight_data.origin,
            'destination': flight_data.destination,
            'departure_time': flight_data.departure_time,
            'arrival_time': flight_data.arrival_time,
            'duration': flight_data.duration,
            'price': flight_data.price,
            'available_seats': flight_data.available_seats,
            'total_seats': flight_data.total_seats,
            'stops': flight_data.stops,
            'status': FlightStatus.SCHEDULED.value,
            'created_at': datetime.utcnow()
        }
        
        self.flight_repo.create(flight_id, flight_doc)
        return self.flight_repo.get_by_id(flight_id)
    
    def get_flight(self, flight_id: str) -> Optional[Flight]:
        """Get flight by ID."""
        return self.flight_repo.get_by_id(flight_id)
    
    def search_flights(
        self,
        origin: str = None,
        destination: str = None,
        departure_date: datetime = None,
        limit: int = 50
    ) -> List[Flight]:
        """Search flights with filters."""
        return self.flight_repo.search_flights(origin, destination, departure_date, limit)
    
    def get_company_flights(self, company_id: str) -> List[Flight]:
        """Get all flights for a company."""
        return self.flight_repo.get_by_company(company_id)
    
    def update_flight(self, flight_id: str, update_data: FlightUpdate) -> Optional[Flight]:
        """Update flight information."""
        # Check if flight exists
        flight = self.flight_repo.get_by_id(flight_id)
        if not flight:
            return None
        
        # Prepare update data
        update_dict = {}
        if update_data.price is not None:
            update_dict['price'] = update_data.price
        if update_data.available_seats is not None:
            update_dict['available_seats'] = update_data.available_seats
        if update_data.status is not None:
            update_dict['status'] = update_data.status.value
        
        if update_dict:
            self.flight_repo.update(flight_id, update_dict)
        
        return self.flight_repo.get_by_id(flight_id)
    
    def cancel_flight(self, flight_id: str) -> bool:
        """Cancel a flight."""
        return self.flight_repo.update(flight_id, {'status': FlightStatus.CANCELLED.value})
    
    def get_all_flights(self, limit: int = 100) -> List[Flight]:
        """Get all flights."""
        return self.flight_repo.get_all(limit)

