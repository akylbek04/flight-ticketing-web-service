"""Airline company repository implementation."""
from typing import Dict, Any
from domain.models import AirlineCompany
from .base_repository import BaseRepository


class CompanyRepository(BaseRepository[AirlineCompany]):
    """Repository for AirlineCompany entity operations."""
    
    def __init__(self, db):
        super().__init__(db, "companies")
    
    def _to_domain(self, doc_dict: Dict[str, Any]) -> AirlineCompany:
        """Convert Firestore document to AirlineCompany domain model."""
        return AirlineCompany(
            id=doc_dict['id'],
            name=doc_dict['name'],
            code=doc_dict['code'],
            manager_id=doc_dict['manager_id'],
            active=doc_dict.get('active', True),
            created_at=doc_dict['created_at']
        )
    
    def _from_domain(self, entity: AirlineCompany) -> Dict[str, Any]:
        """Convert AirlineCompany domain model to Firestore document."""
        return {
            'name': entity.name,
            'code': entity.code,
            'manager_id': entity.manager_id,
            'active': entity.active,
            'created_at': entity.created_at
        }
    
    def get_by_manager(self, manager_id: str):
        """Get company by manager ID."""
        companies = self.find_by_field('manager_id', manager_id)
        return companies[0] if companies else None
    
    def activate_company(self, company_id: str) -> bool:
        """Activate a company."""
        return self.update(company_id, {'active': True})
    
    def deactivate_company(self, company_id: str) -> bool:
        """Deactivate a company."""
        return self.update(company_id, {'active': False})

