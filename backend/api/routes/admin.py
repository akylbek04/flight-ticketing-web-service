"""Admin API routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from domain.models import User, UserRole
from infrastructure.repositories import UserRepository
from infrastructure.database import get_firebase_db
from core.dependencies import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


def get_user_repo(db = Depends(get_firebase_db)) -> UserRepository:
    """Dependency to get UserRepository instance."""
    return UserRepository(db)


@router.get("/users", response_model=List[User])
async def get_all_users(
    current_user: User = Depends(get_current_admin),
    user_repo: UserRepository = Depends(get_user_repo)
):
    """Get all users. Requires admin role."""
    try:
        users = user_repo.get_all()
        return users
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/users/{user_id}/block")
async def block_user(
    user_id: str,
    current_user: User = Depends(get_current_admin),
    user_repo: UserRepository = Depends(get_user_repo)
):
    """Block a user. Requires admin role."""
    try:
        success = user_repo.block_user(user_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return {"message": "User blocked successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/users/{user_id}/unblock")
async def unblock_user(
    user_id: str,
    current_user: User = Depends(get_current_admin),
    user_repo: UserRepository = Depends(get_user_repo)
):
    """Unblock a user. Requires admin role."""
    try:
        success = user_repo.unblock_user(user_id)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return {"message": "User unblocked successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.put("/users/{user_id}/role")
async def set_user_role(
    user_id: str,
    role: UserRole,
    current_user: User = Depends(get_current_admin),
    user_repo: UserRepository = Depends(get_user_repo)
):
    """Set user role. Requires admin role."""
    try:
        success = user_repo.set_role(user_id, role)
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        # Update Firebase custom claims
        from infrastructure.database import get_firebase_auth
        firebase_auth = get_firebase_auth()
        firebase_auth.set_custom_user_claims(user_id, {'role': role.value})
        
        return {"message": f"User role set to {role.value} successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/users/{user_id}", response_model=User)
async def get_user(
    user_id: str,
    current_user: User = Depends(get_current_admin),
    user_repo: UserRepository = Depends(get_user_repo)
):
    """Get user by ID. Requires admin role."""
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

