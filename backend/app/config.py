import os
from functools import lru_cache
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

class Settings:
    def __init__(self):
        # YouTube API
        self.youtube_api_key: str = os.getenv("YOUTUBE_API_KEY", "")
        
        # OAuth Client Secrets
        self.google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", "")
        self.google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
        self.google_project_id: str = os.getenv("GOOGLE_PROJECT_ID", "")
        self.redirect_uri: str = os.getenv("REDIRECT_URI", "http://localhost:8000/api/auth/callback")

@lru_cache()
def get_settings():
    return Settings()

def get_oauth_config() -> Dict[str, Any]:
    settings = get_settings()
    
    if all([settings.google_client_id, settings.google_client_secret, settings.google_project_id]):
        return {
            "web": {
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "project_id": settings.google_project_id,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "redirect_uris": [settings.redirect_uri]
            }
        }