"""Firebase database connection using Singleton pattern."""
import json
from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore, auth
from config.settings import Settings


class FirebaseConnection:
    """
    Singleton class for Firebase connection.
    Ensures only one instance of Firebase connection exists.
    """
    _instance: Optional['FirebaseConnection'] = None
    _initialized: bool = False
    
    def __new__(cls):
        """Implement Singleton pattern."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize Firebase connection (only once)."""
        if not self._initialized:
            self._initialize_firebase()
            FirebaseConnection._initialized = True
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK."""
        settings = Settings()
        
        # Create credentials dictionary
        cred_dict = {
            "type": "service_account",
            "project_id": settings.firebase_project_id,
            "private_key_id": settings.firebase_private_key_id,
            "private_key": settings.firebase_private_key.replace('\\n', '\n'),
            "client_email": settings.firebase_client_email,
            "client_id": settings.firebase_client_id,
            "auth_uri": settings.firebase_auth_uri,
            "token_uri": settings.firebase_token_uri,
            "auth_provider_x509_cert_url": settings.firebase_auth_provider_cert_url,
            "client_x509_cert_url": settings.firebase_client_cert_url
        }
        
        # Initialize Firebase app if not already initialized
        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
        
        self._db = firestore.client()
        self._auth = auth
    
    @property
    def db(self):
        """Get Firestore database instance."""
        return self._db
    
    @property
    def auth(self):
        """Get Firebase Auth instance."""
        return self._auth
    
    def get_collection(self, collection_name: str):
        """Get a Firestore collection reference."""
        return self._db.collection(collection_name)
    
    def get_document(self, collection_name: str, document_id: str):
        """Get a specific document from a collection."""
        return self._db.collection(collection_name).document(document_id)


def get_firebase_db():
    """Dependency injection function for Firebase database."""
    return FirebaseConnection().db


def get_firebase_auth():
    """Dependency injection function for Firebase auth."""
    return FirebaseConnection().auth

