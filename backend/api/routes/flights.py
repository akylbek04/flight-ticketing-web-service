"""Flight API routes."""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from domain.models import Flight, FlightCreate, FlightUpdate, User
from services import FlightService
from infrastructure.repositories import FlightRepository
from infrastructure.database import get_firebase_db
from core.dependencies import get_current_user, get_current_company, get_current_admin

router = APIRouter(prefix="/flights", tags=["Flights"])


def get_flight_service(db = Depends(get_firebase_db)) -> FlightService:
    """Dependency to get FlightService instance."""
    flight_repo = FlightRepository(db)
    return FlightService(flight_repo)


@router.get("/", response_model=List[Flight])
async def search_flights(
    origin: Optional[str] = Query(None, description="Origin airport code"),
    destination: Optional[str] = Query(None, description="Destination airport code"),
    departure_date: Optional[datetime] = Query(None, description="Departure date"),
    limit: int = Query(50, ge=1, le=100),
    flight_service: FlightService = Depends(get_flight_service)
):
    """Search flights with optional filters. Public endpoint."""
    try:
        flights = flight_service.search_flights(origin, destination, departure_date, limit)
        return flights
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/all", response_model=List[Flight])
async def get_all_flights(
    limit: int = Query(100, ge=1, le=200),
    flight_service: FlightService = Depends(get_flight_service)
):
    """Get all flights. Public endpoint."""
    try:
        flights = flight_service.get_all_flights(limit)
        return flights
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{flight_id}", response_model=Flight)
async def get_flight(
    flight_id: str,
    flight_service: FlightService = Depends(get_flight_service)
):
    """Get flight details by ID. Public endpoint."""
    flight = flight_service.get_flight(flight_id)
    if not flight:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found")
    return flight


@router.post("/", response_model=Flight, status_code=status.HTTP_201_CREATED)
async def create_flight(
    flight_data: FlightCreate,
    current_user: User = Depends(get_current_company),
    flight_service: FlightService = Depends(get_flight_service)
):
    """Create a new flight. Requires company role."""
    try:
        # Verify the flight belongs to the company manager
        # In production, you'd check if current_user is the manager of the company
        flight = flight_service.create_flight(flight_data)
        return flight
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/{flight_id}", response_model=Flight)
async def update_flight(
    flight_id: str,
    update_data: FlightUpdate,
    current_user: User = Depends(get_current_company),
    flight_service: FlightService = Depends(get_flight_service)
):
    """Update flight information. Requires company role."""
    try:
        flight = flight_service.update_flight(flight_id, update_data)
        if not flight:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found")
        return flight
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{flight_id}")
async def cancel_flight(
    flight_id: str,
    current_user: User = Depends(get_current_company),
    flight_service: FlightService = Depends(get_flight_service)
):
    """Cancel a flight. Requires company role."""
    try:
        success = flight_service.cancel_flight(flight_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flight not found")
        return {"message": "Flight cancelled successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

