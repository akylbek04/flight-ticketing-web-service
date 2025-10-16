# Design Patterns Implementation Guide

This document provides detailed explanations of all design patterns implemented in the Flight Ticketing Service backend.

## Table of Contents

1. [Singleton Pattern](#singleton-pattern)
2. [Repository Pattern](#repository-pattern)
3. [Factory Pattern](#factory-pattern)
4. [Dependency Injection](#dependency-injection)
5. [Strategy Pattern](#strategy-pattern)

---

## 1. Singleton Pattern

### Purpose
Ensure a class has only one instance and provide a global point of access to it.

### Implementation Location
`infrastructure/database/firebase_connection.py`

### Code Example

```python
class FirebaseConnection:
    """Singleton class for Firebase connection."""
    _instance: Optional['FirebaseConnection'] = None
    _initialized: bool = False
    
    def __new__(cls):
        """Implement Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize Firebase connection (only once)."""
        if not self._initialized:
            self._initialize_firebase()
            FirebaseConnection._initialized = True
```

### How It Works

1. **Class Variable `_instance`**: Stores the single instance
2. **`__new__` Method**: Controls instance creation
3. **Check Before Create**: Only creates instance if none exists
4. **Initialization Flag**: Prevents re-initialization

### Benefits

- ✅ **Resource Efficiency**: Only one Firebase connection
- ✅ **Memory Savings**: No duplicate connections
- ✅ **Consistent State**: All parts use same instance
- ✅ **Global Access**: Easy to access from anywhere

### Usage

```python
# First call creates the instance
firebase = FirebaseConnection()

# Second call returns the same instance
firebase2 = FirebaseConnection()

assert firebase is firebase2  # True - same instance
```

### Real-World Scenario

In our application:
- Multiple repositories need database access
- Creating multiple Firebase connections wastes resources
- Singleton ensures all repositories share one connection

---

## 2. Repository Pattern

### Purpose
Mediate between the domain and data mapping layers using a collection-like interface.

### Implementation Location
- `infrastructure/repositories/base_repository.py`
- `infrastructure/repositories/user_repository.py`
- `infrastructure/repositories/flight_repository.py`
- And other repository files

### Code Example

```python
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional

T = TypeVar('T')

class BaseRepository(ABC, Generic[T]):
    """Abstract base repository."""
    
    @abstractmethod
    def _to_domain(self, doc_dict: Dict) -> T:
        """Convert database document to domain model."""
        pass
    
    @abstractmethod
    def _from_domain(self, entity: T) -> Dict:
        """Convert domain model to database document."""
        pass
    
    def create(self, entity_id: str, data: Dict) -> str:
        """Create a new document."""
        data['created_at'] = datetime.utcnow()
        self.collection.document(entity_id).set(data)
        return entity_id
    
    def get_by_id(self, entity_id: str) -> Optional[T]:
        """Get entity by ID."""
        doc = self.collection.document(entity_id).get()
        if not doc.exists:
            return None
        doc_dict = doc.to_dict()
        doc_dict['id'] = doc.id
        return self._to_domain(doc_dict)
```

### Concrete Implementation

```python
class UserRepository(BaseRepository[User]):
    """Repository for User entity."""
    
    def __init__(self, db):
        super().__init__(db, "users")
    
    def _to_domain(self, doc_dict: Dict) -> User:
        """Convert Firestore doc to User model."""
        return User(
            id=doc_dict['id'],
            email=doc_dict['email'],
            name=doc_dict['name'],
            role=UserRole(doc_dict.get('role', 'user')),
            created_at=doc_dict['created_at'],
            blocked=doc_dict.get('blocked', False)
        )
    
    def _from_domain(self, entity: User) -> Dict:
        """Convert User model to Firestore doc."""
        return {
            'email': entity.email,
            'name': entity.name,
            'role': entity.role.value,
            'created_at': entity.created_at,
            'blocked': entity.blocked
        }
    
    # Custom query methods
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        users = self.find_by_field('email', email)
        return users[0] if users else None
```

### Class Diagram

```
           BaseRepository<T>
           (Abstract Class)
                  ▲
                  │
        ┌─────────┼─────────────────┐
        │         │                 │
  UserRepository  FlightRepository  BookingRepository
```

### Benefits

- ✅ **Separation of Concerns**: Data access logic separated from business logic
- ✅ **Testability**: Easy to mock repositories for testing
- ✅ **Flexibility**: Can change database without affecting services
- ✅ **Consistency**: Uniform interface for all entities
- ✅ **Reusability**: Common operations in base class

### Usage in Service Layer

```python
class BookingService:
    def __init__(self, booking_repo: BookingRepository, flight_repo: FlightRepository):
        self.booking_repo = booking_repo
        self.flight_repo = flight_repo
    
    def create_booking(self, user_id: str, booking_data: BookingCreate):
        # Service uses repository interface
        flight = self.flight_repo.get_by_id(booking_data.flight_id)
        # ... business logic ...
        self.booking_repo.create(booking_id, booking_doc)
```

---

## 3. Factory Pattern

### Purpose
Create objects without exposing the creation logic to the client.

### Implementation Location
- `config/settings.py` - Settings factory
- API route dependencies - Service factories

### Code Example

#### Settings Factory

```python
class Settings(BaseSettings):
    """Application settings."""
    firebase_project_id: str
    secret_key: str
    # ... other settings ...
    
    class Config:
        env_file = ".env"

def get_settings() -> Settings:
    """Factory function to get settings instance."""
    return Settings()
```

#### Service Factory

```python
def get_auth_service(db = Depends(get_firebase_db)) -> AuthService:
    """Factory function for AuthService instance."""
    user_repo = UserRepository(db)
    return AuthService(user_repo)

def get_flight_service(db = Depends(get_firebase_db)) -> FlightService:
    """Factory function for FlightService instance."""
    flight_repo = FlightRepository(db)
    return FlightService(flight_repo)
```

### Usage in API Routes

```python
@router.post("/register")
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service)
):
    # Factory creates AuthService with all dependencies
    return auth_service.register_user(user_data)
```

### Benefits

- ✅ **Encapsulation**: Creation logic hidden
- ✅ **Flexibility**: Easy to change creation logic
- ✅ **Dependency Management**: Handles complex object graphs
- ✅ **Testing**: Easy to provide mock factories
- ✅ **Consistency**: Centralized object creation

### Factory Pattern Variants Used

1. **Simple Factory**: `get_settings()`
2. **Dependency Injection Factory**: Service factories with `Depends()`

---

## 4. Dependency Injection

### Purpose
Provide dependencies to classes/functions from the outside rather than creating them internally.

### Implementation Location
Throughout the application, especially:
- `core/dependencies.py`
- API route handlers
- Service constructors

### Code Example

#### Dependency Provider

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_firebase_db)
) -> User:
    """Dependency to get current authenticated user."""
    token = credentials.credentials
    payload = TokenManager.decode_token(token)
    
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_id)
    
    if user is None or user.blocked:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return user
```

#### Role-Based Dependencies

```python
async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to ensure user is admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
```

#### Dependency Chain

```
get_current_admin
    ↓ depends on
get_current_user
    ↓ depends on
get_firebase_db
    ↓ depends on
FirebaseConnection (Singleton)
```

### Usage in Routes

```python
@router.get("/admin/users")
async def get_all_users(
    current_user: User = Depends(get_current_admin),
    user_repo: UserRepository = Depends(get_user_repo)
):
    """Only admins can access this endpoint."""
    return user_repo.get_all()
```

### Benefits

- ✅ **Loose Coupling**: Components don't create dependencies
- ✅ **Testability**: Easy to inject mocks for testing
- ✅ **Flexibility**: Swap implementations easily
- ✅ **Clarity**: Dependencies are explicit
- ✅ **Reusability**: Dependencies can be reused across routes

### Dependency Injection Types Used

1. **Constructor Injection**: Services receive repositories
2. **Function Injection**: FastAPI's `Depends()`
3. **Chain Injection**: Dependencies depend on other dependencies

---

## 5. Strategy Pattern

### Purpose
Define a family of algorithms, encapsulate each one, and make them interchangeable.

### Implementation Location
`services/auth_service.py`

### Code Example

```python
class AuthService:
    """Service with multiple authentication strategies."""
    
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
        self.password_hasher = PasswordHasher()
        self.token_manager = TokenManager()
    
    # Strategy 1: Register new user
    def register_user(self, user_data: UserCreate) -> Dict[str, str]:
        """Strategy: Create user in Firebase Auth + Firestore."""
        firebase_user = firebase_auth.create_user(
            email=user_data.email,
            password=user_data.password,
            display_name=user_data.name
        )
        # ... create user in database ...
        return self._generate_token(user_data)
    
    # Strategy 2: Login with credentials
    def login_user(self, login_data: UserLogin) -> Dict[str, str]:
        """Strategy: Verify credentials and generate token."""
        user = self.user_repo.get_by_email(login_data.email)
        # ... verify password ...
        return self._generate_token(user)
    
    # Strategy 3: Verify Firebase token
    def verify_firebase_token(self, id_token: str) -> Dict[str, str]:
        """Strategy: Verify existing Firebase token."""
        decoded_token = firebase_auth.verify_id_token(id_token)
        user = self.user_repo.get_by_id(decoded_token['uid'])
        return self._generate_token(user)
    
    def _generate_token(self, user_data) -> Dict[str, str]:
        """Common token generation logic."""
        access_token = self.token_manager.create_access_token(
            data={"sub": user_data.id, "email": user_data.email}
        )
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
```

### Authentication Strategies

```
AuthService
├── Strategy 1: register_user()
│   └── Firebase Auth → Firestore → JWT
├── Strategy 2: login_user()
│   └── Credentials → Verify → JWT
└── Strategy 3: verify_firebase_token()
    └── Firebase Token → Verify → JWT
```

### Benefits

- ✅ **Flexibility**: Different auth methods interchangeable
- ✅ **Extensibility**: Easy to add new auth strategies
- ✅ **Encapsulation**: Each strategy self-contained
- ✅ **Maintainability**: Clear separation of auth methods
- ✅ **Client Choice**: API consumer chooses strategy

### Usage

```python
# Client chooses strategy via endpoint

# Strategy 1: Register
POST /api/auth/register
{ "email": "...", "password": "...", ... }

# Strategy 2: Login
POST /api/auth/login
{ "email": "...", "password": "..." }

# Strategy 3: Verify token
POST /api/auth/verify-token
{ "id_token": "..." }
```

---

## Design Patterns Summary

| Pattern | Location | Key Benefit | Usage Frequency |
|---------|----------|-------------|-----------------|
| Singleton | FirebaseConnection | Single instance | Once (initialization) |
| Repository | All repositories | Data access abstraction | Every DB operation |
| Factory | Service/Settings creation | Object creation | Every request |
| Dependency Injection | Throughout app | Loose coupling | Every endpoint |
| Strategy | AuthService | Interchangeable algorithms | Authentication |

## Pattern Interactions

```
Request → API Route
            ↓ (Dependency Injection)
          Service (Factory creates it)
            ↓ (Uses)
          Repository (Uses)
            ↓ (Uses)
          FirebaseConnection (Singleton)
```

## When to Use Each Pattern

### Singleton
- ✅ Database connections
- ✅ Configuration objects
- ✅ Logging instances
- ❌ Business entities
- ❌ Request-specific data

### Repository
- ✅ Database operations
- ✅ API clients
- ✅ Data source abstraction
- ❌ Business logic
- ❌ Simple CRUD without abstraction needs

### Factory
- ✅ Complex object creation
- ✅ Multiple dependencies
- ✅ Different implementations
- ❌ Simple object creation
- ❌ No dependencies

### Dependency Injection
- ✅ Testable components
- ✅ Pluggable dependencies
- ✅ Configuration
- ❌ Static utilities
- ❌ Simple value objects

### Strategy
- ✅ Multiple algorithms
- ✅ Runtime algorithm selection
- ✅ Conditional logic complexity
- ❌ Single implementation
- ❌ No variation needed

## Best Practices

1. **Don't Overuse Patterns**: Use only when they add value
2. **Keep It Simple**: Pattern should simplify, not complicate
3. **Document Usage**: Explain why pattern is used
4. **Consistent Application**: Use patterns consistently
5. **Test Patterns**: Ensure pattern implementation works correctly

## Conclusion

These design patterns work together to create a:
- **Maintainable** codebase
- **Testable** architecture
- **Scalable** system
- **Flexible** design
- **Professional** implementation

Each pattern serves a specific purpose and solves a real problem in the application.

---

**Master these patterns to become a better software engineer! 🚀**

