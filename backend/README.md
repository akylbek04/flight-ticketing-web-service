# Flight Ticketing Web Service - Backend

A modern, scalable backend service for a flight ticketing platform built with Python, FastAPI, and Firebase.

## 🏗️ Architecture & Design Patterns

This backend is built using **Object-Oriented Programming (OOP)** principles and implements several key **design patterns**:

### Design Patterns Used

1. **Singleton Pattern** - `FirebaseConnection` class ensures only one Firebase connection instance exists
2. **Repository Pattern** - Data access layer abstraction with `BaseRepository` and specific repositories
3. **Factory Pattern** - `get_settings()` and service dependency injection functions
4. **Dependency Injection** - FastAPI's dependency system for loose coupling
5. **Strategy Pattern** - Different authentication strategies (Firebase Auth, JWT)

### Architecture Layers

```
┌─────────────────────────────────────┐
│   API Layer (FastAPI Routes)       │
├─────────────────────────────────────┤
│   Service Layer (Business Logic)   │
├─────────────────────────────────────┤
│   Repository Layer (Data Access)   │
├─────────────────────────────────────┤
│   Infrastructure (Firebase)         │
└─────────────────────────────────────┘
```

## 📁 Project Structure

```
backend/
├── api/                      # API routes
│   └── routes/
│       ├── auth.py          # Authentication endpoints
│       ├── flights.py       # Flight management
│       ├── bookings.py      # Booking operations
│       └── admin.py         # Admin operations
├── config/                   # Configuration
│   └── settings.py          # Environment settings
├── core/                     # Core utilities
│   ├── security.py          # Authentication & encryption
│   └── dependencies.py      # FastAPI dependencies
├── domain/                   # Domain models
│   └── models.py            # Business entities & DTOs
├── infrastructure/           # Infrastructure layer
│   ├── database/
│   │   └── firebase_connection.py  # Singleton Firebase connection
│   └── repositories/        # Repository implementations
│       ├── base_repository.py
│       ├── user_repository.py
│       ├── flight_repository.py
│       ├── booking_repository.py
│       ├── company_repository.py
│       └── content_repository.py
├── services/                 # Business logic layer
│   ├── auth_service.py
│   ├── flight_service.py
│   └── booking_service.py
├── main.py                   # FastAPI application
└── requirements.txt          # Python dependencies
```

## 🚀 Features

- ✅ **User Authentication** - Firebase Auth integration with JWT
- ✅ **Role-Based Access Control** - User, Company, Admin roles
- ✅ **Flight Management** - CRUD operations for flights
- ✅ **Booking System** - Create and manage flight bookings
- ✅ **Admin Panel** - User management and content control
- ✅ **Search & Filter** - Advanced flight search capabilities
- ✅ **Security** - JWT tokens, password hashing, role validation

## 🛠️ Technologies

- **Framework**: FastAPI 0.109.0
- **Database**: Firebase Firestore
- **Authentication**: Firebase Admin SDK + JWT
- **Security**: python-jose, passlib (bcrypt)
- **Server**: Uvicorn
- **Configuration**: Pydantic Settings

## 📋 Prerequisites

- Python 3.8 or higher
- Firebase project with Firestore enabled
- Firebase service account credentials

## ⚙️ Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   Create a `.env` file in the backend directory:
   ```bash
   cp .env.example .env
   ```

4. **Configure Firebase credentials**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate a new private key
   - Copy the values to your `.env` file

5. **Environment variables** (`.env`):
   ```env
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY_ID=your-private-key-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   FIREBASE_CLIENT_ID=your-client-id
   FIREBASE_CLIENT_CERT_URL=your-client-cert-url

   # Security
   SECRET_KEY=your-secret-key-min-32-characters
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30

   # API Configuration
   API_HOST=0.0.0.0
   API_PORT=8000
   API_RELOAD=True
   ```

## 🏃 Running the Application

### Development Mode

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at:
- **API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/verify-token` | Verify Firebase token | No |
| GET | `/auth/me` | Get current user info | Yes |

### Flights (`/api/flights`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/flights/` | Search flights | No |
| GET | `/flights/all` | Get all flights | No |
| GET | `/flights/{id}` | Get flight details | No |
| POST | `/flights/` | Create flight | Yes (Company) |
| PUT | `/flights/{id}` | Update flight | Yes (Company) |
| DELETE | `/flights/{id}` | Cancel flight | Yes (Company) |

### Bookings (`/api/bookings`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/bookings/` | Create booking | Yes |
| GET | `/bookings/my-bookings` | Get user bookings | Yes |
| GET | `/bookings/{id}` | Get booking details | Yes |
| DELETE | `/bookings/{id}` | Cancel booking | Yes |
| GET | `/bookings/flight/{id}/bookings` | Get flight bookings | Yes (Company/Admin) |

### Admin (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/users` | Get all users | Yes (Admin) |
| GET | `/admin/users/{id}` | Get user details | Yes (Admin) |
| PUT | `/admin/users/{id}/block` | Block user | Yes (Admin) |
| PUT | `/admin/users/{id}/unblock` | Unblock user | Yes (Admin) |
| PUT | `/admin/users/{id}/role` | Set user role | Yes (Admin) |

## 🔐 User Roles

1. **User** (`user`) - Regular users who can search and book flights
2. **Company** (`company`) - Airline companies that manage flights
3. **Admin** (`admin`) - System administrators with full access

## 💡 Usage Examples

### Register a new user

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123",
    "name": "John Doe",
    "role": "user"
  }'
```

### Search flights

```bash
curl "http://localhost:8000/api/flights/?origin=NYC&destination=LAX&limit=10"
```

### Create a booking (authenticated)

```bash
curl -X POST "http://localhost:8000/api/bookings/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "flight_id": "flight-uuid",
    "passengers": 2
  }'
```

## 🧪 Testing the API

Use the interactive Swagger documentation at `/api/docs` to test all endpoints directly in your browser.

## 🔒 Security Features

- **Password Hashing**: bcrypt for secure password storage
- **JWT Tokens**: Stateless authentication with expiration
- **Role-Based Access Control**: Fine-grained permissions
- **Firebase Auth Integration**: Enterprise-grade authentication
- **User Blocking**: Admin can block malicious users
- **Input Validation**: Pydantic models validate all inputs

## 📦 Database Collections

Firebase Firestore collections:

- `users` - User accounts and profiles
- `flights` - Flight information
- `bookings` - Flight bookings
- `companies` - Airline companies
- `banners` - Landing page banners (future)
- `offers` - Special offers (future)

## 🤝 Contributing

This backend follows clean code principles and design patterns. When contributing:

1. Follow the existing architecture patterns
2. Add appropriate type hints
3. Document complex business logic
4. Keep services focused and repositories simple

## 📄 License

This project is part of a flight ticketing web service.

## 🆘 Support

For issues or questions, please refer to the main project README or create an issue in the repository.

---

**Built with ❤️ using Python, FastAPI, and Firebase**

