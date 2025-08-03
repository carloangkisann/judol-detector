import logging
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import AuthStatusResponse
from app.core.auth_manager import get_auth_manager

logger = logging.getLogger(__name__)
router = APIRouter()

auth_manager = get_auth_manager()

@router.get("/status", response_model=AuthStatusResponse)
async def get_auth_status():
    """Get current authentication status"""
    try:
        auth_info = auth_manager.get_auth_info()
        
        if auth_info['authenticated']:
            return AuthStatusResponse(
                authenticated=True,
                user_channel={
                    'scopes': auth_info['scopes'],
                    'session_id': auth_info['session_id'],
                    'auth_time': auth_info['auth_time'],
                },
                message="Successfully authenticated"
            )
        else:
            return AuthStatusResponse(
                authenticated=False,
                user_channel=None,
                message="Not authenticated"
            )
    except Exception as e:
        logger.error(f"Error in auth status: {e}")
        return AuthStatusResponse(
            authenticated=False,
            user_channel=None,
            message="Authentication status check failed"
        )

@router.get("/authorize")
async def start_oauth_flow():
    """Start OAuth flow and return authorization URL"""
    try:
        auth_url = auth_manager.get_authorization_url()
        return {
            "success": True,
            "authorization_url": auth_url,
            "message": "Please visit the authorization URL to complete authentication",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start OAuth flow: {str(e)}")

@router.get("/callback")
async def handle_oauth_callback(code: str = Query(..., description="Authorization code from Google")):
    """Handle OAuth callback"""
    try:
        success = auth_manager.handle_oauth_callback(code)
        if success:
            auth_info = auth_manager.get_auth_info()
            return {
                "success": True,
                "message": "Authentication successful! Session created in memory.",
                "session_info": {
                    "session_id": auth_info['session_id'],
                    "auth_time": auth_info['auth_time'],
                },
            }
        else:
            raise HTTPException(status_code=400, detail="Authentication failed")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth callback error: {str(e)}")

@router.post("/revoke")
async def revoke_authentication():
    """Revoke current authentication"""
    try:
        auth_info = auth_manager.get_auth_info()
        
        if not auth_info['authenticated']:
            return {
                "success": True,
                "message": "No authentication to revoke"
            }
        
        old_session_id = auth_info['session_id']
        success = auth_manager.revoke_credentials()
        
        if success:
            return {
                "success": True,
                "message": f"Authentication revoked successfully"
            }
        else:
            return {
                "success": False,
                "message": "Failed to revoke authentication"
            }
    except Exception as e:
        logger.error(f"Error in revoke endpoint: {e}")
        try:
            success = auth_manager.force_clear_auth()
            return {
                "success": success,
                "message": "Authentication cleared from memory" if success else "Failed to clear authentication"
            }
        except:
            raise HTTPException(status_code=500, detail=f"Error revoking authentication: {str(e)}")