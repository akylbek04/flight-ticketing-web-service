"""
Example API usage with Python requests library.
This demonstrates how to interact with the Flight Ticketing Service API.

Install requests library first: pip install requests
"""
import requests
from typing import Optional


class FlightAPIClient:
    """Client for interacting with Flight Ticketing Service API."""
    
    def __init__(self, base_url: str = "http://localhost:8000/api"):
        self.base_url = base_url
        self.access_token: Optional[str] = None
    
    @property
    def headers(self):
        """Get headers with authentication token."""
        headers = {"Content-Type": "application/json"}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        return headers
    
    # Authentication Methods
    
    def register(self, email: str, password: str, name: str, role: str = "user"):
        """Register a new user."""
        response = requests.post(
            f"{self.base_url}/auth/register",
            json={
                "email": email,
                "password": password,
                "name": name,
                "role": role
            }
        )
        response.raise_for_status()
        data = response.json()
        self.access_token = data["access_token"]
        return data
    
    def login(self, email: str, password: str):
        """Login and get access token."""
        response = requests.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "password": password}
        )
        response.raise_for_status()
        data = response.json()
        self.access_token = data["access_token"]
        return data
    
    def get_current_user(self):
        """Get current authenticated user information."""
        response = requests.get(
            f"{self.base_url}/auth/me",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    # Flight Methods
    
    def search_flights(self, origin=None, destination=None, departure_date=None, limit=50):
        """Search for flights."""
        params = {"limit": limit}
        if origin:
            params["origin"] = origin
        if destination:
            params["destination"] = destination
        if departure_date:
            params["departure_date"] = departure_date
        
        response = requests.get(
            f"{self.base_url}/flights/",
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def get_flight(self, flight_id: str):
        """Get flight details by ID."""
        response = requests.get(f"{self.base_url}/flights/{flight_id}")
        response.raise_for_status()
        return response.json()
    
    def create_flight(self, flight_data: dict):
        """Create a new flight (requires company role)."""
        response = requests.post(
            f"{self.base_url}/flights/",
            json=flight_data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def update_flight(self, flight_id: str, update_data: dict):
        """Update flight information (requires company role)."""
        response = requests.put(
            f"{self.base_url}/flights/{flight_id}",
            json=update_data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    # Booking Methods
    
    def create_booking(self, flight_id: str, passengers: int):
        """Create a new booking."""
        response = requests.post(
            f"{self.base_url}/bookings/",
            json={"flight_id": flight_id, "passengers": passengers},
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_my_bookings(self):
        """Get all bookings for the current user."""
        response = requests.get(
            f"{self.base_url}/bookings/my-bookings",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def cancel_booking(self, booking_id: str):
        """Cancel a booking."""
        response = requests.delete(
            f"{self.base_url}/bookings/{booking_id}",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    # Admin Methods
    
    def get_all_users(self):
        """Get all users (requires admin role)."""
        response = requests.get(
            f"{self.base_url}/admin/users",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def block_user(self, user_id: str):
        """Block a user (requires admin role)."""
        response = requests.put(
            f"{self.base_url}/admin/users/{user_id}/block",
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()


# Example Usage
def main():
    """Example usage of the API client."""
    
    # Initialize client
    client = FlightAPIClient()
    
    print("=" * 60)
    print("Flight Ticketing Service API - Example Usage")
    print("=" * 60)
    
    # 1. Register a new user
    print("\n1. Registering new user...")
    try:
        user = client.register(
            email="demo@example.com",
            password="SecurePassword123",
            name="Demo User",
            role="user"
        )
        print(f"✓ Registered user: {user['user_id']}")
        print(f"✓ Access token received")
    except requests.exceptions.HTTPError as e:
        print(f"✗ Registration failed: {e}")
        print("  (User might already exist, trying to login instead)")
        
        # Try to login instead
        try:
            user = client.login("demo@example.com", "SecurePassword123")
            print(f"✓ Logged in successfully")
        except Exception as login_error:
            print(f"✗ Login also failed: {login_error}")
            return
    
    # 2. Get current user info
    print("\n2. Getting current user information...")
    try:
        current_user = client.get_current_user()
        print(f"✓ User: {current_user['name']} ({current_user['email']})")
        print(f"  Role: {current_user['role']}")
    except Exception as e:
        print(f"✗ Failed to get user info: {e}")
    
    # 3. Search for flights
    print("\n3. Searching for flights...")
    try:
        flights = client.search_flights(limit=5)
        print(f"✓ Found {len(flights)} flights")
        for i, flight in enumerate(flights[:3], 1):
            print(f"  {i}. {flight['flight_number']}: "
                  f"{flight['origin']} → {flight['destination']} "
                  f"(${flight['price']})")
    except Exception as e:
        print(f"✗ Failed to search flights: {e}")
    
    # 4. Get user's bookings
    print("\n4. Getting my bookings...")
    try:
        bookings = client.get_my_bookings()
        print(f"✓ You have {len(bookings)} booking(s)")
        for i, booking in enumerate(bookings, 1):
            print(f"  {i}. Confirmation: {booking['confirmation_id']} "
                  f"- Passengers: {booking['passengers']} "
                  f"- Status: {booking['status']}")
    except Exception as e:
        print(f"✗ Failed to get bookings: {e}")
    
    # 5. Create a booking (if flights exist)
    print("\n5. Creating a booking...")
    try:
        flights = client.search_flights(limit=1)
        if flights:
            flight = flights[0]
            booking = client.create_booking(
                flight_id=flight['id'],
                passengers=1
            )
            print(f"✓ Booking created!")
            print(f"  Confirmation ID: {booking['confirmation_id']}")
            print(f"  Total Price: ${booking['total_price']}")
            
            # Cancel the booking (cleanup)
            print("\n6. Cancelling the booking...")
            result = client.cancel_booking(booking['id'])
            print(f"✓ {result['message']}")
        else:
            print("  No flights available to book")
    except Exception as e:
        print(f"✗ Booking operation failed: {e}")
    
    print("\n" + "=" * 60)
    print("Example completed!")
    print("=" * 60)
    print("\nNext steps:")
    print("- Visit http://localhost:8000/api/docs for interactive API docs")
    print("- Modify this script to test other endpoints")
    print("- Check the API response for more details")


if __name__ == "__main__":
    # Check if API is running
    try:
        response = requests.get("http://localhost:8000/health")
        response.raise_for_status()
        print("✓ API is running")
        print()
        main()
    except requests.exceptions.ConnectionError:
        print("✗ Error: Cannot connect to API")
        print("  Make sure the API is running on http://localhost:8000")
        print("  Run: python main.py")
    except Exception as e:
        print(f"✗ Unexpected error: {e}")

