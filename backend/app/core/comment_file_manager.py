import logging
import uuid
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class CommentFile:
    file_id: str
    filename: str
    comments: List[str]
    upload_time: datetime
    comments_count: int

class CommentFileManager:
    def __init__(self):
        self._current_comment_file: Optional[CommentFile] = None
        self._max_comments_per_file: int = 100  # Safety limit
        logger.info("CommentFileManager initialized")
    
    def upload_comment_file(self, content: str, filename: str) -> Dict[str, Any]:
        try:
            if self._current_comment_file:
                old_filename = self._current_comment_file.filename
                self._clear_current_file()
                logger.info(f"Cleared previous comment file: {old_filename}")
            
            comments = self._parse_comments(content)
            
            if not comments:
                raise ValueError("No valid comments found in file")
            
            if len(comments) > self._max_comments_per_file:
                raise ValueError(f"Too many comments. Maximum allowed: {self._max_comments_per_file}")
            
            validation_result = self._validate_comments(comments)
            if not validation_result['valid']:
                raise ValueError(f"Comment validation failed: {validation_result['error']}")
            
            file_id = f"comments_{uuid.uuid4().hex[:8]}"
            
            comment_file = CommentFile(
                file_id=file_id,
                filename=filename,
                comments=comments,
                upload_time=datetime.now(),
                comments_count=len(comments)
            )
            
            self._current_comment_file = comment_file
            
            logger.info(f"Comment file uploaded successfully: {filename} ({len(comments)} comments)")
            
            return {
                "success": True,
                "file_id": file_id,
                "filename": filename,
                "comments_count": len(comments),
                "comments_preview": comments,
                "upload_time": comment_file.upload_time.isoformat(),
                "validation": validation_result
            }
            
        except Exception as e:
            logger.error(f"Error uploading comment file: {e}")
            raise ValueError(f"Failed to upload comment file: {str(e)}")
    
    def get_comments(self, file_id: str = None) -> List[str]:
        if not self._current_comment_file:
            raise ValueError("No comment file currently loaded")
        
        if file_id and file_id != self._current_comment_file.file_id:
            raise ValueError(f"Comment file not found: {file_id}")
        
        logger.debug(f"Retrieved {len(self._current_comment_file.comments)} comments")
        return self._current_comment_file.comments
    
    def get_current_file_info(self) -> Optional[Dict[str, Any]]:
        if not self._current_comment_file:
            return None
        
        return {
            "file_id": self._current_comment_file.file_id,
            "filename": self._current_comment_file.filename,
            "comments_count": self._current_comment_file.comments_count,
            "upload_time": self._current_comment_file.upload_time.isoformat(),
            "comments_preview": self._current_comment_file.comments
        }
    
    def clear_current_file(self) -> bool:
        if not self._current_comment_file:
            return False
        
        filename = self._current_comment_file.filename
        self._clear_current_file()
        logger.info(f"Comment file cleared: {filename}")
        return True
    
    def has_comments(self) -> bool:
        return self._current_comment_file is not None
    
    def _parse_comments(self, content: str) -> List[str]:
        raw_comments = content.split(';')
        
        comments = []
        for comment in raw_comments:
            cleaned_comment = comment.strip().replace('\n', ' ').replace('\r', '')
            
            if cleaned_comment:
                comments.append(cleaned_comment)
        
        unique_comments = list(dict.fromkeys(comments))
        
        return unique_comments
    
    def _validate_comments(self, comments: List[str]) -> Dict[str, Any]:
        if not comments:
            return {"valid": False, "error": "No comments provided"}
        
        valid_comments = []
        invalid_comments = []
        
        for i, comment in enumerate(comments):
            if len(comment) < 1:
                invalid_comments.append({
                    "index": i,
                    "comment": comment,
                    "error": "Empty comment"
                })
            elif len(comment) > 10000:  # YouTube comment limit
                invalid_comments.append({
                    "index": i,
                    "comment": comment[:50] + "...",
                    "error": "Comment too long (max 10000 chars)"
                })
            elif len(comment.strip()) < 1:
                invalid_comments.append({
                    "index": i,
                    "comment": comment,
                    "error": "Comment contains only whitespace"
                })
            else:
                valid_comments.append(comment)
        
        return {
            "valid": len(invalid_comments) == 0,
            "total_comments": len(comments),
            "valid_comments": len(valid_comments),
            "invalid_comments": len(invalid_comments),
            "invalid_details": invalid_comments,
            "validation_passed": len(invalid_comments) == 0
        }
    
    def _clear_current_file(self):
        """Internal method to clear current file"""
        self._current_comment_file = None

# Singleton instance
_comment_file_manager = None

def get_comment_file_manager() -> CommentFileManager:
    global _comment_file_manager
    if _comment_file_manager is None:
        _comment_file_manager = CommentFileManager()
    return _comment_file_manager