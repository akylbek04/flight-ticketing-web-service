# Backend Architecture Documentation

## Overview

This backend is built with a **clean architecture** approach, emphasizing separation of concerns, maintainability, and testability through **Object-Oriented Programming (OOP)** and established **design patterns**.

## Design Patterns

### 1. Singleton Pattern

**Location**: `infrastructure/database/firebase_connection.py`

**Purpose**: Ensures only one Firebase connection instance exists throughout the application lifecycle.

```python
class FirebaseConnection:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
```

**Benefits**:
- Prevents multiple Firebase initializations
- Reduces memory overhead
- Centralizes database connection management

### 2. Repository Pattern

**Location**: `infrastructure/repositories/`

**Purpose**: Abstracts data access logic and provides a collection-like interface for domain objects.

**Structure**:
```
BaseRepository (Abstract)
    ├── UserRepository
    ├── FlightRepository
    ├── BookingRepository
    ├── CompanyRepository
    └── ContentRepository
```

**Benefits**:
- Decouples business logic from data access
- Easy to test with mock repositories
- Consistent interface for all entities
- Flexible to change data source

### 3. Factory Pattern

**Location**: `config/settings.py`, service dependencies

**Purpose**: Creates objects without exposing creation logic.

```python
def get_settings() -> Settings:
    """Factory function to get settings instance."""
    return Settings()

def get_auth_service(db = Depends(get_firebase_db)) -> AuthService:
    """Factory for AuthService instance."""
    user_repo = UserRepository(db)
    return AuthService(user_repo)
```

**Benefits**:
- Simplifies object creation
- Enables dependency injection
- Loose coupling between components

### 4. Dependency Injection

**Location**: Throughout the application, especially in `core/dependencies.py`

**Purpose**: Provides dependencies to functions/classes without tight coupling.

```python
@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    return current_user
```

**Benefits**:
- Testability (easy to mock dependencies)
- Flexibility (swap implementations)
- Clear dependencies declaration

### 5. Strategy Pattern

**Location**: `services/auth_service.py`

**Purpose**: Defines a family of algorithms (authentication strategies) and makes them interchangeable.

**Strategies**:
- Register new user (Firebase Auth)
- Login with credentials
- Verify Firebase token

**Benefits**:
- Different authentication methods
- Easy to add new strategies
- Encapsulates algorithms

## Layered Architecture

### 1. API Layer (`api/routes/`)

**Responsibility**: HTTP request handling and response formatting

**Components**:
- Route handlers
- Request validation
- Response serialization
- HTTP status codes

**Example**:
```python
@router.post("/register")
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service)
):
    # Delegates to service layer
    return auth_service.register_user(user_data)
```

### 2. Service Layer (`services/`)

**Responsibility**: Business logic and orchestration

**Components**:
- Business rules
- Transaction management
- Cross-cutting concerns
- Data transformation

**Example**:
```python
class BookingService:
    def create_booking(self, user_id: str, booking_data: BookingCreate):
        # 1. Validate flight exists
        # 2. Check seat availability
        # 3. Reserve seats
        # 4. Create booking
        # 5. Return booking
```

### 3. Repository Layer (`infrastructure/repositories/`)

**Responsibility**: Data access and persistence

**Components**:
- CRUD operations
- Query methods
- Data mapping

**Example**:
```python
class FlightRepository(BaseRepository[Flight]):
    def search_flights(self, origin, destination, date):
        # Firestore query logic
        pass
```

### 4. Infrastructure Layer (`infrastructure/`)

**Responsibility**: External service integration

**Components**:
- Database connections
- Third-party API clients
- File storage

### 5. Domain Layer (`domain/models.py`)

**Responsibility**: Core business entities and rules

**Components**:
- Domain models
- Enumerations
- DTOs (Data Transfer Objects)

## Data Flow

```
HTTP Request
    ↓
API Route (FastAPI)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Infrastructure (Firebase)
    ↓
Database (Firestore)
```

## Security Architecture

### Authentication Flow

1. **Registration**:
   ```
   User → API → AuthService → Firebase Auth → UserRepository → Firestore
   ```

2. **Login**:
   ```
   Credentials → AuthService → Firebase Auth → JWT Token → Response
   ```

3. **Protected Endpoints**:
   ```
   JWT Token → get_current_user → Verify → User Object → Route Handler
   ```

### Role-Based Access Control (RBAC)

```python
# Middleware checks user role
@router.post("/flights/")
async def create_flight(
    current_user: User = Depends(get_current_company)
):
    # Only company users can access
    pass
```

**Roles**:
- **User**: Book flights, view bookings
- **Company**: Manage flights, view passengers
- **Admin**: Manage users, content, system settings

## Database Schema

### Collections Structure

```
Firestore
├── users
│   └── {userId}
│       ├── email
│       ├── name
│       ├── role
│       ├── blocked
│       └── created_at
├── flights
│   └── {flightId}
│       ├── company_id
│       ├── origin
│       ├── destination
│       ├── price
│       └── ...
├── bookings
│   └── {bookingId}
│       ├── user_id
│       ├── flight_id
│       ├── confirmation_id
│       └── ...
└── companies
    └── {companyId}
        ├── name
        ├── code
        └── manager_id
```

## Error Handling Strategy

### Three-Level Approach

1. **Service Layer**: Business logic errors
   ```python
   if not flight:
       raise ValueError("Flight not found")
   ```

2. **API Layer**: HTTP error responses
   ```python
   except ValueError as e:
       raise HTTPException(status_code=400, detail=str(e))
   ```

3. **Global Exception Handler**: Unexpected errors
   - Logs error
   - Returns generic error message
   - Protects sensitive information

## Testing Strategy

### Unit Tests
- Test individual functions/methods
- Mock external dependencies
- Focus on business logic

### Integration Tests
- Test service + repository interaction
- Use test database
- Verify data persistence

### API Tests
- Test HTTP endpoints
- Verify status codes
- Check response format

## Performance Considerations

### Optimization Techniques

1. **Connection Pooling**: Singleton Firebase connection
2. **Lazy Loading**: Load related entities on demand
3. **Caching**: Future implementation for frequently accessed data
4. **Indexing**: Firestore composite indexes for complex queries
5. **Pagination**: Limit query results

## Scalability

### Horizontal Scaling
- Stateless API design
- JWT tokens (no server-side sessions)
- Multiple uvicorn workers

### Vertical Scaling
- Async/await for I/O operations
- FastAPI's async support
- Non-blocking database calls

## Security Best Practices

1. **Password Security**:
   - bcrypt hashing
   - Never store plain passwords

2. **Token Security**:
   - JWT with expiration
   - Secret key rotation (recommended)

3. **Input Validation**:
   - Pydantic models validate all inputs
   - Type checking

4. **Authorization**:
   - Role-based access control
   - Dependency injection for auth

5. **Data Protection**:
   - User blocking mechanism
   - Admin oversight

## Future Enhancements

1. **Caching Layer**: Redis for frequently accessed data
2. **Event Sourcing**: Track all system events
3. **Message Queue**: Async task processing (email, notifications)
4. **Rate Limiting**: Prevent API abuse
5. **Monitoring**: Logging, metrics, tracing
6. **Versioning**: API version management

## Conclusion

This architecture provides:
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Testability**: Easy to test each layer
- ✅ **Scalability**: Designed for growth
- ✅ **Security**: Multiple security layers
- ✅ **Flexibility**: Easy to extend and modify

The design patterns and OOP principles ensure the codebase remains clean, organized, and professional.

