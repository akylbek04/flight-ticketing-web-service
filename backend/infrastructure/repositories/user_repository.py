"""User repository implementation."""
from typing import Dict, Any, Optional
from domain.models import User, UserRole
from .base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    """Repository for User entity operations."""
    
    def __init__(self, db):
        super().__init__(db, "users")
    
    def _to_domain(self, doc_dict: Dict[str, Any]) -> User:
        """Convert Firestore document to User domain model."""
        return User(
            id=doc_dict['id'],
            email=doc_dict['email'],
            name=doc_dict['name'],
            role=UserRole(doc_dict.get('role', 'user')),
            created_at=doc_dict['created_at'],
            blocked=doc_dict.get('blocked', False)
        )
    
    def _from_domain(self, entity: User) -> Dict[str, Any]:
        """Convert User domain model to Firestore document."""
        return {
            'email': entity.email,
            'name': entity.name,
            'role': entity.role.value,
            'created_at': entity.created_at,
            'blocked': entity.blocked
        }
    
    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email address."""
        users = self.find_by_field('email', email)
        return users[0] if users else None
    
    def block_user(self, user_id: str) -> bool:
        """Block a user."""
        return self.update(user_id, {'blocked': True})
    
    def unblock_user(self, user_id: str) -> bool:
        """Unblock a user."""
        return self.update(user_id, {'blocked': False})
    
    def set_role(self, user_id: str, role: UserRole) -> bool:
        """Set user role."""
        return self.update(user_id, {'role': role.value})

