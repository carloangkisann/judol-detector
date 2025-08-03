import logging
from fastapi import APIRouter, HTTPException, File, UploadFile
from app.models.schemas import (
    CommentInsertRequest,
    CommentFileInsertRequest,
    CommentDeleteRequest, 
    CommentOperationResponse,
    CommentFileUploadResponse,
    AlgorithmType
)
from app.core.youtube_client import YouTubeClient
from app.core.auth_manager import get_auth_manager
from app.core.comment_file_manager import get_comment_file_manager

logger = logging.getLogger(__name__)
router = APIRouter()

auth_manager = get_auth_manager()
comment_file_manager = get_comment_file_manager()

def get_authenticated_youtube_client() -> YouTubeClient:
    if not auth_manager.is_authenticated():
        logger.warning("Authentication check failed - no valid memory session")
        raise HTTPException(
            status_code=401, 
            detail="OAuth authentication required. Please authenticate first via /api/auth/authorize"
        )
    
    credentials = auth_manager.get_credentials()
    if not credentials:
        logger.warning("No credentials available despite auth check passing")
        raise HTTPException(
            status_code=401,
            detail="No valid credentials found. Please re-authenticate."
        )
    
    if not credentials.valid:
        logger.warning("Credentials are invalid or expired")
        raise HTTPException(
            status_code=401,
            detail="Credentials are invalid or expired. Please re-authenticate."
        )
    
    logger.info("Creating YouTube client with memory-stored credentials")
    return YouTubeClient(credentials=credentials)

@router.post("/insert", response_model=CommentOperationResponse)
async def insert_comments(request: CommentInsertRequest):
    """Insert comments directly from list"""
    try:
        youtube_client = get_authenticated_youtube_client()
        
        if len(request.comments) > 100:
            raise HTTPException(
                status_code=400,
                detail="Maximum 100 comments allowed per request"
            )
        
        result = youtube_client.insert_multiple_comments(request.video_id, request.comments)
        
        return CommentOperationResponse(
            success=len(result['successful']) > 0,
            message=f"Inserted {len(result['successful'])} out of {result['total']} comments",
            total_processed=result['total'],
            successful_operations=len(result['successful']),
            failed_operations=len(result['failed']),
            details=[
                {
                    "type": "success",
                    "comments": result['successful'],
                    "auth_session": auth_manager.get_auth_info()['session_id']
                },
                {
                    "type": "failed", 
                    "comments": result['failed']
                }
            ] if result['failed'] else [{"type": "success", "comments": result['successful']}]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in insert_comments: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to insert comments: {str(e)}")

@router.post("/upload-comment-file", response_model=CommentFileUploadResponse)
async def upload_comment_file(file: UploadFile = File(...)):
    """
    Upload comment file (.txt with semicolon-separated comments)
    """
    if not file.filename or not file.filename.endswith('.txt'):
        raise HTTPException(status_code=400, detail="Only .txt files are allowed")
    
    try:
        content = await file.read()
        text_content = content.decode('utf-8')
        
        upload_result = comment_file_manager.upload_comment_file(
            content=text_content,
            filename=file.filename
        )
        
        return CommentFileUploadResponse(
            success=upload_result['success'],
            file_id=upload_result['file_id'],
            filename=upload_result['filename'],
            comments_count=upload_result['comments_count'],
            comments_preview=upload_result['comments_preview'],
            upload_time=upload_result['upload_time'],
            validation=upload_result['validation']
        )
        
    except HTTPException:
        raise
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing comment file: {str(e)}")

@router.post("/insert-from-file", response_model=CommentOperationResponse)
async def insert_comments_from_file(request: CommentFileInsertRequest):
    """
    Insert comments from uploaded comment file
    """
    try:
        youtube_client = get_authenticated_youtube_client()
        
        if request.comment_file_id:
            comments = comment_file_manager.get_comments(request.comment_file_id)
        else:
            if not comment_file_manager.has_comments():
                raise HTTPException(
                    status_code=400,
                    detail="No comment file loaded. Please upload a comment file first."
                )
            comments = comment_file_manager.get_comments()
        
        if not comments:
            raise HTTPException(
                status_code=400,
                detail="No comments found in file"
            )
        
        result = youtube_client.insert_multiple_comments(request.video_id, comments)
        
        file_info = comment_file_manager.get_current_file_info()
        
        return CommentOperationResponse(
            success=len(result['successful']) > 0,
            message=f"Inserted {len(result['successful'])} out of {result['total']} comments from file",
            total_processed=result['total'],
            successful_operations=len(result['successful']),
            failed_operations=len(result['failed']),
            details=[
                {
                    "type": "file_info",
                    "file_info": file_info
                },
                {
                    "type": "success",
                    "comments": result['successful']
                },
                {
                    "type": "failed", 
                    "comments": result['failed']
                }
            ] if result['failed'] else [
                {
                    "type": "file_info", 
                    "file_info": file_info
                },
                {
                    "type": "success", 
                    "comments": result['successful']
                }
            ]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in insert_comments_from_file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to insert comments from file: {str(e)}")

@router.delete("/comment-file")
async def clear_comment_file():
    """Clear currently loaded comment file"""
    try:
        success = comment_file_manager.clear_current_file()
        
        return {
            "success": success,
            "message": "Comment file cleared" if success else "No comment file to clear"
        }
        
    except Exception as e:
        logger.error(f"Error clearing comment file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear comment file: {str(e)}")

@router.post("/delete", response_model=CommentOperationResponse)
async def delete_comments(request: CommentDeleteRequest):
    """Delete comments (judol only or all user comments)"""
    try:
        youtube_client = get_authenticated_youtube_client()
        
        if request.delete_judol_only and request.algorithm != AlgorithmType.REGEX and not request.pattern_file_id:
            raise HTTPException(
                status_code=400,
                detail=f"Pattern file ID is required for {request.algorithm.value} algorithm"
            )
        
        if request.delete_judol_only:
            result = youtube_client.delete_judol_comments_on_video(
                request.video_id,
                algorithm=request.algorithm,
                pattern_file_id=request.pattern_file_id
            )
            
            return CommentOperationResponse(
                success=result['deleted_successfully'] > 0 or result['judol_comments_found'] == 0,
                message=f"Found {result['judol_comments_found']} judol comments. "
                       f"Deleted {result['deleted_successfully']}, failed {result['deletion_failed']}",
                total_processed=result['judol_comments_found'],
                successful_operations=result['deleted_successfully'],
                failed_operations=result['deletion_failed'],
                details=result['details']
            )
        else:
            result = youtube_client.delete_all_my_comments_on_video(request.video_id)
            
            return CommentOperationResponse(
                success=result['deleted_successfully'] > 0 or result['total_comments'] == 0,
                message=f"Deleted {result['deleted_successfully']} out of {result['total_comments']} comments",
                total_processed=result['total_comments'],
                successful_operations=result['deleted_successfully'],
                failed_operations=result['deletion_failed'],
                details=result['details']
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in delete_comments: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete comments: {str(e)}")

@router.get("/my-comments/{video_id}")
async def get_my_comments(video_id: str):
    """Get current user's comments on a video"""
    try:
        youtube_client = get_authenticated_youtube_client()
        
        comments = youtube_client.get_my_comments_on_video(video_id)
        
        return {
            "success": True,
            "video_id": video_id,
            "total_comments": len(comments),
            "comments": comments,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_my_comments: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get comments: {str(e)}")

@router.get("/my-channel")
async def get_my_channel_info():
    """Get current user's channel information"""
    try:
        youtube_client = get_authenticated_youtube_client()
        
        channel_info = youtube_client.get_my_channel_info()
        
        return {
            "success": True,
            "channel": channel_info,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_my_channel_info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get channel info: {str(e)}")