"""Base repository with common CRUD operations."""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional, Dict, Any
from datetime import datetime
from google.cloud.firestore_v1 import FieldFilter

T = TypeVar('T')


class BaseRepository(ABC, Generic[T]):
    """
    Abstract base repository implementing Repository pattern.
    Provides common CRUD operations for all entities.
    """
    
    def __init__(self, db, collection_name: str):
        """Initialize repository with database and collection name."""
        self.db = db
        self.collection_name = collection_name
        self.collection = db.collection(collection_name)
    
    @abstractmethod
    def _to_domain(self, doc_dict: Dict[str, Any]) -> T:
        """Convert Firestore document to domain model."""
        pass
    
    @abstractmethod
    def _from_domain(self, entity: T) -> Dict[str, Any]:
        """Convert domain model to Firestore document."""
        pass
    
    def create(self, entity_id: str, data: Dict[str, Any]) -> str:
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
    
    def get_all(self, limit: Optional[int] = None) -> List[T]:
        """Get all entities with optional limit."""
        query = self.collection
        if limit:
            query = query.limit(limit)
        
        docs = query.stream()
        results = []
        for doc in docs:
            doc_dict = doc.to_dict()
            doc_dict['id'] = doc.id
            results.append(self._to_domain(doc_dict))
        return results
    
    def update(self, entity_id: str, data: Dict[str, Any]) -> bool:
        """Update an entity."""
        data['updated_at'] = datetime.utcnow()
        self.collection.document(entity_id).update(data)
        return True
    
    def delete(self, entity_id: str) -> bool:
        """Delete an entity."""
        self.collection.document(entity_id).delete()
        return True
    
    def find_by_field(self, field: str, value: Any) -> List[T]:
        """Find entities by a specific field value."""
        docs = self.collection.where(filter=FieldFilter(field, "==", value)).stream()
        results = []
        for doc in docs:
            doc_dict = doc.to_dict()
            doc_dict['id'] = doc.id
            results.append(self._to_domain(doc_dict))
        return results
    
    def exists(self, entity_id: str) -> bool:
        """Check if entity exists."""
        doc = self.collection.document(entity_id).get()
        return doc.exists

