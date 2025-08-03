import logging
import time
import uuid
from typing import Optional, Dict, Any
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from google.auth.credentials import Credentials
from app.config import get_oauth_config

logger = logging.getLogger(__name__)

class AuthManager:    
    def __init__(self):
        self.scopes = [
            'https://www.googleapis.com/auth/youtube.force-ssl',
            'https://www.googleapis.com/auth/youtube'
        ]
        
        self._credentials: Optional[Credentials] = None
        self._oauth_flow: Optional[Flow] = None
        self._auth_time: Optional[float] = None
        self._session_id: Optional[str] = None
        
        self.oauth_config = get_oauth_config()
    
    def get_authorization_url(self, redirect_uri: str = None) -> str:
        try:
            if redirect_uri is None:
                redirect_uri = self.oauth_config["web"]["redirect_uris"][0]
            
            flow = Flow.from_client_config(
                self.oauth_config,
                scopes=self.scopes
            )
            flow.redirect_uri = redirect_uri
            
            auth_url, state = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                prompt='consent'
            )
            
            self._oauth_flow = flow
            
            logger.info("Authorization URL generated successfully")
            return auth_url
            
        except Exception as e:
            logger.error(f"Error creating authorization URL: {e}")
            raise Exception(f"Failed to create authorization URL: {str(e)}")
    
    def handle_oauth_callback(self, authorization_code: str, redirect_uri: str = None) -> bool:
        try:
            flow = self._oauth_flow
            if not flow:
                if redirect_uri is None:
                    redirect_uri = self.oauth_config["web"]["redirect_uris"][0]
                
                flow = Flow.from_client_config(
                    self.oauth_config,
                    scopes=self.scopes
                )
                flow.redirect_uri = redirect_uri
            
            flow.fetch_token(code=authorization_code)
            
            self._credentials = flow.credentials
            self._auth_time = time.time()
            self._session_id = f"session_{uuid.uuid4().hex[:8]}"
            
            self._oauth_flow = None
            
            logger.info(f"OAuth authentication successful")
            return True
            
        except Exception as e:
            logger.error(f"OAuth callback error: {e}")
            return False
    
    def is_authenticated(self) -> bool:
        if not self._credentials:
            return False
        
        if self._credentials.expired:
            if self._credentials.refresh_token:
                try:
                    self._credentials.refresh(Request())
                    self._auth_time = time.time()
                    logger.info("Credentials refreshed successfully")
                    return True
                except Exception as e:
                    logger.error(f"Error refreshing credentials: {e}")
                    self._clear_memory()
                    return False
            else:
                logger.warning("Credentials expired and no refresh token available")
                self._clear_memory()
                return False
        
        return self._credentials.valid
    
    def get_credentials(self) -> Optional[Credentials]:
        if self.is_authenticated():
            return self._credentials
        return None
    
    def revoke_credentials(self) -> bool:
        try:
            success = False
            
            if self._credentials:
                try:
                    if not self._credentials.expired or self._credentials.refresh_token:
                        self._credentials.revoke(Request())
                        logger.info("Credentials revoked via Google API")
                        success = True
                except Exception as revoke_error:
                    logger.warning(f"Failed to revoke via Google API: {revoke_error}")
                    success = True
            else:
                success = True
            
            self._clear_memory()
            
            logger.info("Authentication revoked successfully")
            return success
            
        except Exception as e:
            logger.error(f"Error during credential revocation: {e}")
            self._clear_memory()
            return False
    
    def force_clear_auth(self) -> bool:
        try:
            self._clear_memory()
            logger.info("Authentication force cleared from memory")
            return True
        except Exception as e:
            logger.error(f"Error force clearing auth: {e}")
            return False
    
    def get_auth_info(self) -> Dict[str, Any]:
        """Get authentication information for debugging"""
        return {
            'authenticated': self.is_authenticated(),
            'scopes': list(self._credentials.scopes) if self._credentials and self._credentials.scopes else None,
            'auth_time': self._auth_time,
            'session_id': self._session_id,
        }
    
    def _clear_memory(self):
        old_session = self._session_id
        self._credentials = None
        self._oauth_flow = None
        self._auth_time = None
        self._session_id = None
        
        if old_session:
            logger.info(f"Memory cleared for session: {old_session}")

_auth_manager = None

def get_auth_manager() -> AuthManager:
    global _auth_manager
    if _auth_manager is None:
        _auth_manager = AuthManager()
    return _auth_manager