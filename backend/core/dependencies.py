"""FastAPI dependencies for authentication and authorization."""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from domain.models import User, UserRole
from infrastructure.database import get_firebase_db
from infrastructure.repositories import UserRepository
from core.security import TokenManager

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_firebase_db)
) -> User:
    """
    Dependency to get the current authenticated user.
    Validates JWT token and retrieves user from database.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode token
    token = credentials.credentials
    payload = TokenManager.decode_token(token)
    
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Get user from database
    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_id)
    
    if user is None:
        raise credentials_exception
    
    # Check if user is blocked
    if user.blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is blocked"
        )
    
    return user


def require_role(*allowed_roles: UserRole):
    """
    Dependency factory to check if user has required role.
    Usage: Depends(require_role(UserRole.ADMIN))
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join([r.value for r in allowed_roles])}"
            )
        return current_user
    
    return role_checker


# Specific role dependencies
async def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure user is an admin."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


async def get_current_company(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure user is a company manager."""
    if current_user.role != UserRole.COMPANY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company access required"
        )
    return current_user


async def get_current_user_or_company(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to ensure user is either a regular user or company."""
    if current_user.role not in [UserRole.USER, UserRole.COMPANY]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User or company access required"
        )
    return current_user

