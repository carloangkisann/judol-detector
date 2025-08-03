from fastapi import APIRouter, HTTPException, File, UploadFile
from app.models.schemas import (
    DetectionRequest, 
    DetectionResponse, 
    PatternFileUploadResponse,
    AlgorithmType
)
from app.core.detector import JudolDetector
from app.core.youtube_client import YouTubeClient
from app.core.auth_manager import get_auth_manager
from app.core.pattern_manager import get_pattern_manager
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

settings = get_settings()
auth_manager = get_auth_manager()
detector = JudolDetector()
pattern_manager = get_pattern_manager()

def get_youtube_client() -> YouTubeClient:
    if auth_manager.is_authenticated():
        credentials = auth_manager.get_credentials()
        return YouTubeClient(credentials=credentials)
    elif settings.youtube_api_key:
        return YouTubeClient(api_key=settings.youtube_api_key)
    else:
        raise HTTPException(
            status_code=500, 
            detail="No authentication available. Please authenticate or configure API key."
        )

@router.post("/detect", response_model=DetectionResponse)
async def detect_judol_comments(request: DetectionRequest):
    """
    Detect gambling comments in YouTube video
    """
    try:
        if request.algorithm != AlgorithmType.REGEX and not request.pattern_file_id:
            if not pattern_manager.has_patterns():
                raise HTTPException(
                    status_code=400,
                    detail=f"Pattern file is required for {request.algorithm.value} algorithm. "
                           f"Please upload a pattern file first."
                )
        
        youtube_client = get_youtube_client()
        
        video_info = await youtube_client.get_video_info(request.video_id)
        
        comments = await youtube_client.get_video_comments(
            request.video_id, 
            max_results=request.max_results
        )
        
        if not comments:
            return DetectionResponse(
                success=True,
                video_id=request.video_id,
                video_title=video_info.get('title'),
                total_comments=0,
                judol_comments=[],
                detection_count=0,
                algorithm_used=request.algorithm,
                processing_time=0.0,
                patterns_used=[]
            )
        
        detection_result = detector.detect_judol_comments(
            comments=comments,
            algorithm=request.algorithm,
            pattern_file_id=request.pattern_file_id
        )
        
        response = DetectionResponse(
            success=True,
            video_id=request.video_id,
            video_title=video_info.get('title'),
            total_comments=len(comments),
            judol_comments=detection_result["judol_comments"],
            detection_count=detection_result["count"],
            algorithm_used=request.algorithm,
            processing_time=detection_result["processing_time"],
            patterns_used=detection_result["patterns_used"]
        )
        
        logger.info(f"Detection completed: {detection_result['count']}/{len(comments)} "
                   f"judol comments found using {request.algorithm.value}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detection failed: {e}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@router.post("/upload-patterns", response_model=PatternFileUploadResponse)
async def upload_pattern_file(file: UploadFile = File(...)):
    """
    Upload pattern file (.txt) for non-regex algorithms
    """
    if not file.filename or not file.filename.endswith('.txt'):
        raise HTTPException(status_code=400, detail="Only .txt files are allowed")
    
    try:
        content = await file.read()
        text_content = content.decode('utf-8')

        upload_result = detector.upload_patterns(
            content=text_content,
            filename=file.filename,
        )
        
        return PatternFileUploadResponse(
            success=upload_result['success'],
            file_id=upload_result['file_id'],
            filename=upload_result['filename'],
            patterns_count=upload_result['patterns_count'],
            patterns=pattern_manager.get_patterns(upload_result['file_id']),
            replaced_previous=upload_result.get('replaced_previous', False),
            upload_time=upload_result['upload_time']
        )
        
    except HTTPException:
        raise
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing pattern file: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    
@router.delete("/pattern-file")
async def clear_pattern_file():
    """Clear currently loaded pattern file"""
    try:
        success = pattern_manager.clear_current_file()
        
        return {
            "success": success,
            "message": "Pattern file cleared" if success else "No pattern file to clear"
        }
        
    except Exception as e:
        logger.error(f"Error clearing pattern file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear pattern file: {str(e)}")

@router.get("/video-info/{video_id}")
async def get_video_info(video_id: str):
    """Get YouTube video information"""
    try:
        youtube_client = get_youtube_client()
        video_info = await youtube_client.get_video_info(video_id)
        
        return {
            "success": True,
            "video": video_info,
        }
        
    except Exception as e:
        logger.error(f"Failed to get video info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get video info: {str(e)}")