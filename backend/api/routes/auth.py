"""Authentication API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from domain.models import UserCreate, UserLogin, User
from services import AuthService
from infrastructure.repositories import UserRepository
from infrastructure.database import get_firebase_db
from core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_auth_service(db = Depends(get_firebase_db)) -> AuthService:
    """Dependency to get AuthService instance."""
    user_repo = UserRepository(db)
    return AuthService(user_repo)


@router.post("/register")
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Register a new user."""
    try:
        result = auth_service.register_user(user_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/login")
async def login(
    login_data: UserLogin,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Login user and get access token.
    Note: For production with Firebase Auth on frontend, use verify-token endpoint instead.
    """
    try:
        result = auth_service.login_user(login_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/verify-token")
async def verify_firebase_token(
    id_token: str,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Verify Firebase ID token from frontend and get backend access token.
    Use this endpoint when using Firebase Auth on the frontend.
    """
    try:
        result = auth_service.verify_firebase_token(id_token)
        return result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information."""
    return current_user

