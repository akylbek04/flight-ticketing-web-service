"""Authentication service layer."""
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict
from firebase_admin import auth as firebase_auth
from domain.models import User, UserCreate, UserLogin, UserRole
from infrastructure.repositories import UserRepository
from core.security import PasswordHasher, TokenManager


class AuthService:
    """
    Service class for authentication operations.
    Implements business logic for user authentication.
    """
    
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
        self.password_hasher = PasswordHasher()
        self.token_manager = TokenManager()
    
    def register_user(self, user_data: UserCreate) -> Dict[str, str]:
        """
        Register a new user.
        Creates user in Firebase Auth and Firestore.
        """
        # Check if user already exists
        existing_user = self.user_repo.get_by_email(user_data.email)
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # Create user in Firebase Auth
        try:
            firebase_user = firebase_auth.create_user(
                email=user_data.email,
                password=user_data.password,
                display_name=user_data.name
            )
            user_id = firebase_user.uid
        except Exception as e:
            raise ValueError(f"Failed to create user: {str(e)}")
        
        # Create user document in Firestore
        user_doc = {
            'email': user_data.email,
            'name': user_data.name,
            'role': user_data.role.value,
            'created_at': datetime.utcnow(),
            'blocked': False
        }
        
        self.user_repo.create(user_id, user_doc)
        
        # Set custom claims for role
        firebase_auth.set_custom_user_claims(user_id, {'role': user_data.role.value})
        
        # Generate access token
        access_token = self.token_manager.create_access_token(
            data={"sub": user_id, "email": user_data.email, "role": user_data.role.value}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user_id
        }
    
    def login_user(self, login_data: UserLogin) -> Dict[str, str]:
        """
        Authenticate user and generate token.
        Note: In production, you'd typically verify password via Firebase Auth client SDK.
        This is a simplified backend-only approach.
        """
        # Get user by email
        user = self.user_repo.get_by_email(login_data.email)
        if not user:
            raise ValueError("Invalid email or password")
        
        # Check if user is blocked
        if user.blocked:
            raise ValueError("User account is blocked")
        
        # Verify user exists in Firebase Auth and get user
        try:
            firebase_user = firebase_auth.get_user_by_email(login_data.email)
        except Exception:
            raise ValueError("Invalid email or password")
        
        # Generate access token
        access_token = self.token_manager.create_access_token(
            data={"sub": user.id, "email": user.email, "role": user.role.value}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_id": user.id,
            "role": user.role.value
        }
    
    def verify_firebase_token(self, id_token: str) -> Dict[str, str]:
        """
        Verify Firebase ID token and return user info.
        This is for frontend Firebase Auth integration.
        """
        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            user_id = decoded_token['uid']
            
            # Get user from database
            user = self.user_repo.get_by_id(user_id)
            if not user:
                raise ValueError("User not found")
            
            if user.blocked:
                raise ValueError("User account is blocked")
            
            # Generate our own access token
            access_token = self.token_manager.create_access_token(
                data={"sub": user.id, "email": user.email, "role": user.role.value}
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_id": user.id,
                "role": user.role.value
            }
        except Exception as e:
            raise ValueError(f"Invalid token: {str(e)}")

