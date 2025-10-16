"""Content repositories for banners and offers."""
from typing import Dict, Any, List
from domain.models import Banner, Offer
from .base_repository import BaseRepository
from google.cloud.firestore_v1 import FieldFilter


class BannerRepository(BaseRepository[Banner]):
    """Repository for Banner entity operations."""
    
    def __init__(self, db):
        super().__init__(db, "banners")
    
    def _to_domain(self, doc_dict: Dict[str, Any]) -> Banner:
        """Convert Firestore document to Banner domain model."""
        return Banner(
            id=doc_dict['id'],
            title=doc_dict['title'],
            description=doc_dict['description'],
            image_url=doc_dict['image_url'],
            link=doc_dict.get('link'),
            active=doc_dict.get('active', True),
            order=doc_dict.get('order', 0),
            created_at=doc_dict['created_at'],
            updated_at=doc_dict.get('updated_at')
        )
    
    def _from_domain(self, entity: Banner) -> Dict[str, Any]:
        """Convert Banner domain model to Firestore document."""
        data = {
            'title': entity.title,
            'description': entity.description,
            'image_url': entity.image_url,
            'active': entity.active,
            'order': entity.order,
            'created_at': entity.created_at
        }
        if entity.link:
            data['link'] = entity.link
        if entity.updated_at:
            data['updated_at'] = entity.updated_at
        return data
    
    def get_active_banners(self) -> List[Banner]:
        """Get all active banners ordered by order field."""
        docs = (self.collection
                .where(filter=FieldFilter("active", "==", True))
                .order_by("order")
                .stream())
        
        results = []
        for doc in docs:
            doc_dict = doc.to_dict()
            doc_dict['id'] = doc.id
            results.append(self._to_domain(doc_dict))
        return results


class OfferRepository(BaseRepository[Offer]):
    """Repository for Offer entity operations."""
    
    def __init__(self, db):
        super().__init__(db, "offers")
    
    def _to_domain(self, doc_dict: Dict[str, Any]) -> Offer:
        """Convert Firestore document to Offer domain model."""
        return Offer(
            id=doc_dict['id'],
            flight_id=doc_dict['flight_id'],
            image_url=doc_dict.get('image_url'),
            discount=doc_dict['discount'],
            valid_until=doc_dict['valid_until'],
            active=doc_dict.get('active', True),
            created_at=doc_dict['created_at'],
            updated_at=doc_dict.get('updated_at')
        )
    
    def _from_domain(self, entity: Offer) -> Dict[str, Any]:
        """Convert Offer domain model to Firestore document."""
        data = {
            'flight_id': entity.flight_id,
            'discount': entity.discount,
            'valid_until': entity.valid_until,
            'active': entity.active,
            'created_at': entity.created_at
        }
        if entity.image_url:
            data['image_url'] = entity.image_url
        if entity.updated_at:
            data['updated_at'] = entity.updated_at
        return data
    
    def get_active_offers(self) -> List[Offer]:
        """Get all active offers that are still valid."""
        from datetime import datetime
        docs = (self.collection
                .where(filter=FieldFilter("active", "==", True))
                .where(filter=FieldFilter("valid_until", ">=", datetime.utcnow()))
                .stream())
        
        results = []
        for doc in docs:
            doc_dict = doc.to_dict()
            doc_dict['id'] = doc.id
            results.append(self._to_domain(doc_dict))
        return results

