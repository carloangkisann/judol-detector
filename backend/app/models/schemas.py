from pydantic import BaseModel, validator, Field
from typing import List, Optional, Dict, Any
from enum import Enum
import re

class AlgorithmType(str, Enum):
    REGEX = "regex"
    KMP = "kmp"
    BOYER_MOORE = "boyer_moore"
    RABIN_KARP = "rabin_karp"

class CommentData(BaseModel):
    comment_id: str
    author: str
    text: str
    like_count: int = 0
    published_at: str
    reply_count: int = 0

class DetectionRequest(BaseModel):
    video_id: str = Field(..., description="YouTube video ID or URL")
    algorithm: AlgorithmType
    pattern_file_id: Optional[str] = Field(None, description="Pattern file ID for non-regex algorithms")
    max_results: int = Field(1000, ge=1, le=1000, description="Maximum number of comments to analyze")
    
    @validator('video_id')
    def validate_video_id(cls, v):
        if 'youtube.com/watch?v=' in v:
            v = v.split('watch?v=')[1].split('&')[0]
        elif 'youtu.be/' in v:
            v = v.split('youtu.be/')[1].split('?')[0]
        
        if not re.match(r'^[a-zA-Z0-9_-]{11}$', v):
            raise ValueError('Invalid YouTube video ID format')
        return v

class JudolComment(BaseModel):
    comment: CommentData
    matched_patterns: List[str]
    normalized_text: str
    detection_algorithm: AlgorithmType

class DetectionResponse(BaseModel):
    success: bool = True
    video_id: str
    video_title: Optional[str] = None
    total_comments: int
    judol_comments: List[JudolComment]
    detection_count: int
    algorithm_used: AlgorithmType
    processing_time: float
    patterns_used: List[str] = []

class PatternFileUploadResponse(BaseModel):
    success: bool
    file_id: str
    filename: str
    patterns_count: int
    patterns: List[str]
    replaced_previous: bool = False
    upload_time: str

class CommentFileUploadResponse(BaseModel):
    success: bool
    file_id: str
    filename: str
    comments_count: int
    comments_preview: List[str]
    upload_time: str
    validation: Dict[str, Any]

class CommentInsertRequest(BaseModel):
    video_id: str
    comments: List[str] = Field(..., min_items=1, max_items=100)
    
    @validator('video_id')
    def validate_video_id(cls, v):
        if 'youtube.com/watch?v=' in v:
            v = v.split('watch?v=')[1].split('&')[0]
        elif 'youtu.be/' in v:
            v = v.split('youtu.be/')[1].split('?')[0]
        if not re.match(r'^[a-zA-Z0-9_-]{11}$', v):
            raise ValueError('Invalid YouTube video ID format')
        return v

class CommentFileInsertRequest(BaseModel):
    video_id: str
    comment_file_id: Optional[str] = Field(None, description="Comment file ID to use")
    
    @validator('video_id')
    def validate_video_id(cls, v):
        if 'youtube.com/watch?v=' in v:
            v = v.split('watch?v=')[1].split('&')[0]
        elif 'youtu.be/' in v:
            v = v.split('youtu.be/')[1].split('?')[0]
        if not re.match(r'^[a-zA-Z0-9_-]{11}$', v):
            raise ValueError('Invalid YouTube video ID format')
        return v

class CommentDeleteRequest(BaseModel):
    video_id: str
    delete_judol_only: bool = True
    algorithm: AlgorithmType = AlgorithmType.REGEX
    pattern_file_id: Optional[str] = None
    
    @validator('video_id')
    def validate_video_id(cls, v):
        if 'youtube.com/watch?v=' in v:
            v = v.split('watch?v=')[1].split('&')[0]
        elif 'youtu.be/' in v:
            v = v.split('youtu.be/')[1].split('?')[0]
        if not re.match(r'^[a-zA-Z0-9_-]{11}$', v):
            raise ValueError('Invalid YouTube video ID format')
        return v

class CommentOperationResponse(BaseModel):
    success: bool
    message: str
    total_processed: int
    successful_operations: int
    failed_operations: int
    details: List[Dict[str, Any]] = []

class AuthStatusResponse(BaseModel):
    authenticated: bool
    user_channel: Optional[Dict[str, Any]] = None
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[str] = None