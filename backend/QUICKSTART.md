# Quick Start Guide

Get the Flight Ticketing Service backend up and running in minutes!

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Firebase project with Firestore enabled

## Step 1: Install Dependencies

```bash
# Install dependencies
pip install -r requirements.txt
```

## Step 2: Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file

## Step 3: Set Environment Variables

Create a `.env` file in the backend directory:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/your-email

# Security (Generate a secure random string)
SECRET_KEY=your-super-secret-key-min-32-chars-change-in-production

# API Configuration (optional)
API_HOST=0.0.0.0
API_PORT=8000
```

**Note**: Get all Firebase values from your downloaded service account JSON file.

## Step 4: Run the Application

```bash
python main.py
```
## Step 5: Test the API

Open your browser and navigate to:

- **API Documentation**: http://localhost:8000/api/docs
- **Alternative Docs**: http://localhost:8000/api/redoc
- **Health Check**: http://localhost:8000/health

## Testing with cURL

### Register a new user

```bash
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123",
    "name": "Test User",
    "role": "user"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": "abc123..."
}
```

### Login

```bash
curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123"
  }'
```

### Get Current User (requires token)

```bash
curl -X GET "http://localhost:8000/api/auth/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Search Flights (public)

```bash
curl "http://localhost:8000/api/flights/?origin=NYC&destination=LAX"
```

### Create Booking (requires authentication)

```bash
curl -X POST "http://localhost:8000/api/bookings/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "flight_id": "flight-id-here",
    "passengers": 2
  }'
```

## Testing with Swagger UI

1. Go to http://localhost:8000/api/docs
2. Click on any endpoint
3. Click "Try it out"
4. Fill in the parameters
5. Click "Execute"

For protected endpoints:
1. Register/login to get a token
2. Click the "Authorize" button at the top
3. Enter: `Bearer YOUR_TOKEN`
4. Click "Authorize"
5. Now you can access protected endpoints

## Common Issues

### Issue: "ModuleNotFoundError"

**Solution**: Make sure you've installed all dependencies:
```bash
pip install -r requirements.txt
```

### Issue: "Firebase credentials error"

**Solution**: Check your `.env` file:
- Ensure all Firebase variables are set
- Make sure FIREBASE_PRIVATE_KEY has `\n` preserved
- Verify the values match your service account JSON

### Issue: "Port already in use"

**Solution**: Change the port in `.env`:
```env
API_PORT=8001
```

Or kill the process using port 8000:
```bash
# macOS/Linux
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

## Project Structure Overview

```
backend/
├── api/              # API routes
├── config/           # Configuration
├── core/             # Security & dependencies
├── domain/           # Business models
├── infrastructure/   # Database & repositories
├── services/         # Business logic
├── main.py          # Application entry point
└── requirements.txt # Dependencies
```

## Next Steps

1. **Explore the API**: Use Swagger UI to test all endpoints
2. **Read Architecture**: Check `ARCHITECTURE.md` for design patterns
3. **Create Sample Data**: Add flights and test bookings
4. **Integrate Frontend**: Connect your Next.js frontend

## Production Deployment

For production deployment:

1. **Set secure environment variables**
2. **Use a production WSGI server** (already using Uvicorn)
3. **Enable HTTPS**
4. **Configure CORS** properly in `main.py`
5. **Set up monitoring and logging**
6. **Use environment-specific configs**

## Support

For more information:
- See `README.md` for full documentation
- Check `ARCHITECTURE.md` for design patterns
- Visit API docs at `/api/docs` for endpoint details

---

Happy coding! 🚀

