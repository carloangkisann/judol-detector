import logging
import uuid
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

@dataclass
class PatternFile:
    file_id: str
    filename: str
    patterns: List[str]
    upload_time: datetime
    patterns_count: int

class PatternManager:
    
    def __init__(self):
        self._current_pattern_file: Optional[PatternFile] = None
        logger.info("PatternManager initialized")
    
    def upload_patterns(self, content: str, filename: str) -> Dict[str, Any]:
        try:
            if self._current_pattern_file:
                old_filename = self._current_pattern_file.filename
                self._clear_current_file()
            
            patterns = self._parse_patterns(content)
            if not patterns:
                raise ValueError("No valid patterns found in file")
            
            unique_patterns = list(dict.fromkeys(patterns))
            
            file_id = f"pattern_{uuid.uuid4().hex[:8]}"
            
            pattern_file = PatternFile(
                file_id=file_id,
                filename=filename,
                patterns=unique_patterns,
                upload_time=datetime.now(),
                patterns_count=len(unique_patterns)
            )
            
            self._current_pattern_file = pattern_file
            
            logger.info(f"Pattern file uploaded successfully: {filename} ({len(unique_patterns)} patterns)")
            
            return {
                "success": True,
                "file_id": file_id,
                "filename": filename,
                "patterns_count": len(unique_patterns),
                "patterns": unique_patterns,
                "upload_time": pattern_file.upload_time.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error uploading patterns: {e}")
            raise ValueError(f"Failed to upload patterns: {str(e)}")
    
    def get_patterns(self, file_id: str = None) -> List[str]:
        if not self._current_pattern_file:
            raise ValueError("No pattern file currently loaded")
        
        if file_id and file_id != self._current_pattern_file.file_id:
            raise ValueError(f"Pattern file not found: {file_id}")
        
        logger.debug(f"Retrieved {len(self._current_pattern_file.patterns)} patterns")
        return self._current_pattern_file.patterns
    
    def get_current_file_info(self) -> Optional[Dict[str, Any]]:
        if not self._current_pattern_file:
            return None
        
        return {
            "file_id": self._current_pattern_file.file_id,
            "filename": self._current_pattern_file.filename,
            "patterns_count": self._current_pattern_file.patterns_count,
            "upload_time": self._current_pattern_file.upload_time.isoformat()
        }
    
    def clear_current_file(self) -> bool:
        if not self._current_pattern_file:
            return False
        
        filename = self._current_pattern_file.filename
        self._clear_current_file()
        logger.info(f"Pattern file cleared: {filename}")
        return True
    
    def validate_patterns(self, patterns: List[str]) -> Dict[str, Any]:
        if not patterns:
            return {"valid": False, "error": "No patterns provided"}
        
        valid_patterns = []
        invalid_patterns = []
        
        for pattern in patterns:
            pattern = pattern.strip()
            if len(pattern) < 1:
                invalid_patterns.append({"pattern": pattern, "error": "Empty pattern"})
            elif len(pattern) > 1000:
                invalid_patterns.append({"pattern": pattern, "error": "Pattern too long (max 1000 chars)"})
            else:
                valid_patterns.append(pattern)
        
        return {
            "valid": len(invalid_patterns) == 0,
            "total_patterns": len(patterns),
            "valid_patterns": len(valid_patterns),
            "invalid_patterns": len(invalid_patterns),
            "invalid_details": invalid_patterns,
            "validation_passed": len(invalid_patterns) == 0
        }
    
    def _parse_patterns(self, content: str) -> List[str]:
        patterns = [line.strip() for line in content.split('\n') if line.strip()]
        return patterns
    
    def _clear_current_file(self):
        self._current_pattern_file = None
    
    def has_patterns(self) -> bool:
        return self._current_pattern_file is not None

# Singleton instance
_pattern_manager = None

def get_pattern_manager() -> PatternManager:
    global _pattern_manager
    if _pattern_manager is None:
        _pattern_manager = PatternManager()
    return _pattern_manager