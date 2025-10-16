"""API routes package."""
from .auth import router as auth_router
from .flights import router as flights_router
from .bookings import router as bookings_router
from .admin import router as admin_router

__all__ = ["auth_router", "flights_router", "bookings_router", "admin_router"]

