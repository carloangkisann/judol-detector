import time
import logging
from typing import List, Dict, Optional, Any
from app.models.schemas import CommentData, JudolComment, AlgorithmType
from app.core.unicode_normalizer import UnicodeNormalizer
from app.core.string_matching import StringMatchingFactory
from app.core.pattern_manager import get_pattern_manager

logger = logging.getLogger(__name__)

class JudolDetector:
    def __init__(self):
        self._normalizer = UnicodeNormalizer()
        self._pattern_manager = get_pattern_manager()
        self._string_matcher_factory = StringMatchingFactory()
        logger.info("JudolDetector initialized")

    @property
    def normalizer(self) -> UnicodeNormalizer:
        return self._normalizer
    
    @property
    def pattern_manager(self):
        return self._pattern_manager

    def detect_judol_comments(
        self, 
        comments: List[CommentData], 
        algorithm: AlgorithmType,
        pattern_file_id: Optional[str] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        
        try:
            patterns = self._load_patterns_for_algorithm(algorithm, pattern_file_id)
            
            matcher = self._create_matcher(algorithm)
            
            judol_comments = self._process_comments(comments, patterns, matcher, algorithm)
            
            processing_time = time.time() - start_time
            
            result = {
                'judol_comments': judol_comments,
                'count': len(judol_comments),
                'processing_time': processing_time,
                'algorithm_used': algorithm.value,
                'patterns_used': patterns if patterns else ['default_regex_pattern'],
                'total_comments_processed': len(comments)
            }
            
            logger.info(f"Detection completed: {len(judol_comments)}/{len(comments)} judol comments found "
                       f"in {processing_time:.3f}s using {algorithm.value}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error in judol detection: {e}")
            raise
    
    def upload_patterns(self, content: str, filename: str) -> Dict[str, Any]:
        try:
            validation_result = self._validate_pattern_content(content)
            
            if not validation_result['valid']:
                raise ValueError(validation_result['error'])
            
            upload_result = self._pattern_manager.upload_patterns(content, filename)
            
            logger.info(f"Pattern file uploaded: {filename} ({upload_result['patterns_count']} patterns)")
            return upload_result
            
        except Exception as e:
            logger.error(f"Error uploading patterns: {e}")
            raise ValueError(f"Failed to upload patterns: {str(e)}")
    
    def get_current_patterns_info(self) -> Optional[Dict[str, Any]]:
        return self._pattern_manager.get_current_file_info()
    
    def clear_patterns(self) -> bool:
        return self._pattern_manager.clear_current_file()
    
    def _load_patterns_for_algorithm(
        self, 
        algorithm: AlgorithmType, 
        pattern_file_id: Optional[str] = None
    ) -> Optional[List[str]]:
        if algorithm == AlgorithmType.REGEX:
            return None 
        
        if not pattern_file_id and not self._pattern_manager.has_patterns():
            raise ValueError(f"Pattern file required for {algorithm.value} algorithm")
        
        try:
            patterns = self._pattern_manager.get_patterns(pattern_file_id)
            
            if not patterns:
                raise ValueError("Pattern file is empty")
            
            logger.debug(f"Loaded {len(patterns)} patterns for {algorithm.value}")
            return patterns
            
        except Exception as e:
            logger.error(f"Error loading patterns: {e}")
            raise ValueError(f"Error loading pattern file: {str(e)}")
    
    def _create_matcher(self, algorithm: AlgorithmType):
        try:
            return self._string_matcher_factory.create_matcher(algorithm.value)
        except Exception as e:
            logger.error(f"Error creating matcher for {algorithm.value}: {e}")
            raise ValueError(f"Unsupported algorithm: {algorithm.value}")
    
    def _process_comments(
        self,
        comments: List[CommentData],
        patterns: Optional[List[str]],
        matcher,
        algorithm: AlgorithmType
    ) -> List[JudolComment]:
        judol_comments = []
        
        for comment in comments:
            try:
                normalized_text = self._normalizer.normalize_text(comment.text)
                
                detection_result = self._detect_patterns_in_comment(
                    comment, normalized_text, patterns, matcher, algorithm
                )
                
                if detection_result:
                    judol_comments.append(detection_result)
                    
            except Exception as e:
                logger.warning(f"Error processing comment {comment.comment_id}: {e}")
                continue
        
        return judol_comments
    
    def _detect_patterns_in_comment(
        self, 
        comment: CommentData, 
        normalized_text: str, 
        patterns: Optional[List[str]],
        matcher,
        algorithm: AlgorithmType
    ) -> Optional[JudolComment]:
        try:
            search_results = matcher.search(normalized_text, patterns)
            
            if search_results:
                matched_patterns = [pattern for pattern, positions in search_results if positions]
                
                if matched_patterns:
                    return JudolComment(
                        comment=comment,
                        matched_patterns=matched_patterns,
                        normalized_text=normalized_text,
                        detection_algorithm=algorithm
                    )
            
            return None
            
        except Exception as e:
            logger.warning(f"Error in pattern detection: {e}")
            return None
    
    def _validate_pattern_content(self, content: str) -> Dict[str, Any]:
        try:
            patterns = [line.strip() for line in content.split('\n') if line.strip()]
            
            if not patterns:
                return {
                    'valid': False,
                    'error': 'File is empty or contains no valid patterns'
                }
            
            validation_result = self._pattern_manager.validate_patterns(patterns)
            return validation_result
            
        except Exception as e:
            return {
                'valid': False,
                'error': f'Error validating content: {str(e)}'
            }