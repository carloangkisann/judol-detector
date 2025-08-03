import time
import logging
from typing import List, Optional, Dict, Any
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.auth.credentials import Credentials
from app.models.schemas import CommentData, AlgorithmType
from app.core.detector import JudolDetector
from app.config import get_settings

logger = logging.getLogger(__name__)

class YouTubeClient:
    def __init__(self, api_key: Optional[str] = None, credentials: Optional[Credentials] = None):
        self.settings = get_settings()
        self.api_key = api_key
        self.credentials = credentials
        
        # Initialize YouTube service
        if credentials:
            self.youtube = build('youtube', 'v3', credentials=credentials)
            self.auth_type = "oauth"
            logger.info("YouTube client initialized with OAuth credentials")
        elif api_key:
            self.youtube = build('youtube', 'v3', developerKey=api_key)
            self.auth_type = "api_key"
            logger.info("YouTube client initialized with API key")
        else:
            raise ValueError("Either API key or OAuth credentials must be provided")
    
    def has_write_access(self) -> bool:
        return self.auth_type == "oauth" and self.credentials is not None
    
    async def get_video_comments(self, video_id: str, max_results: int = 100) -> List[CommentData]:
        try:
            comments = []
            next_page_token = None
            
            while len(comments) < max_results:
                remaining = max_results - len(comments)
                per_page = min(100, remaining)  # YouTube API limit: 100 per request
                
                request = self.youtube.commentThreads().list(
                    part='snippet',
                    videoId=video_id,
                    maxResults=per_page,
                    order='relevance',
                    pageToken=next_page_token
                )
                
                response = request.execute()
                
                for item in response['items']:
                    comment_snippet = item['snippet']['topLevelComment']['snippet']
                    
                    comment_data = CommentData(
                        comment_id=item['snippet']['topLevelComment']['id'],
                        author=comment_snippet['authorDisplayName'],
                        text=comment_snippet['textDisplay'],
                        like_count=comment_snippet.get('likeCount', 0),
                        published_at=comment_snippet['publishedAt'],
                        reply_count=item['snippet'].get('totalReplyCount', 0)
                    )
                    
                    comments.append(comment_data)
                
                next_page_token = response.get('nextPageToken')
                if not next_page_token:
                    break
            
            logger.info(f"Retrieved {len(comments)} comments for video {video_id}")
            return comments
            
        except HttpError as e:
            logger.error(f"YouTube API error: {e}")
            if e.resp.status == 403:
                raise Exception("YouTube API quota exceeded or access denied")
            elif e.resp.status == 404:
                raise Exception("Video not found or comments are disabled")
            else:
                raise Exception(f"YouTube API error: {e}")
        except Exception as e:
            logger.error(f"Error retrieving comments: {e}")
            raise Exception(f"Failed to retrieve comments: {str(e)}")
    
    async def get_video_info(self, video_id: str) -> Dict[str, Any]:
        try:
            request = self.youtube.videos().list(
                part='snippet,statistics',
                id=video_id
            )
            
            response = request.execute()
            
            if not response['items']:
                raise Exception("Video not found")
            
            video_info = response['items'][0]
            return {
                'video_id': video_id,
                'title': video_info['snippet']['title'],
                'channel_title': video_info['snippet']['channelTitle'],
                'channel_id': video_info['snippet']['channelId'],
                'published_at': video_info['snippet']['publishedAt'],
                'view_count': int(video_info['statistics'].get('viewCount', 0)),
                'comment_count': int(video_info['statistics'].get('commentCount', 0)),
                'like_count': int(video_info['statistics'].get('likeCount', 0))
            }
            
        except HttpError as e:
            logger.error(f"Error getting video info: {e}")
            raise Exception(f"Failed to get video info: {str(e)}")
    
    def get_my_channel_info(self) -> Dict[str, Any]:
        if not self.has_write_access():
            raise Exception("OAuth authentication required for channel info")
        
        try:
            request = self.youtube.channels().list(
                part='snippet,statistics',
                mine=True
            )
            response = request.execute()
            
            if response['items']:
                channel = response['items'][0]
                return {
                    'channel_id': channel['id'],
                    'title': channel['snippet']['title'],
                    'description': channel['snippet']['description'],
                    'subscriber_count': int(channel['statistics'].get('subscriberCount', 0)),
                    'video_count': int(channel['statistics'].get('videoCount', 0)),
                    'view_count': int(channel['statistics'].get('viewCount', 0))
                }
            else:
                raise Exception("No channel found for authenticated user")
                
        except HttpError as e:
            logger.error(f"Error getting channel info: {e}")
            raise Exception(f"Failed to get channel info: {str(e)}")
    
    def insert_comment(self, video_id: str, comment_text: str) -> Dict[str, Any]:
        if not self.has_write_access():
            raise Exception("OAuth authentication required for comment insertion")
        
        try:
            request = self.youtube.commentThreads().insert(
                part='snippet',
                body={
                    'snippet': {
                        'videoId': video_id,
                        'topLevelComment': {
                            'snippet': {
                                'textOriginal': comment_text
                            }
                        }
                    }
                }
            )
            
            response = request.execute()
            
            return {
                'comment_id': response['id'],
                'video_id': video_id,
                'text': comment_text,
                'status': 'success'
            }
            
        except HttpError as e:
            logger.error(f"Error inserting comment: {e}")
            if e.resp.status == 403:
                raise Exception("Comments are disabled on this video or insufficient permissions")
            else:
                raise Exception(f"Failed to insert comment: {str(e)}")
    
    def insert_multiple_comments(self, video_id: str, comments: List[str]) -> Dict[str, Any]:
        if not self.has_write_access():
            raise Exception("OAuth authentication required for comment insertion")
        
        results = {
            'successful': [],
            'failed': [],
            'total': len(comments)
        }
        
        for i, comment_text in enumerate(comments):
            try:
                result = self.insert_comment(video_id, comment_text.strip())
                results['successful'].append(result)
                logger.info(f"Comment {i+1}/{len(comments)} inserted successfully")
                
                # Rate limiting - 1 comment per 2 seconds
                if i < len(comments) - 1: 
                    time.sleep(2)
                
            except Exception as e:
                results['failed'].append({
                    'comment': comment_text,
                    'error': str(e)
                })
                logger.error(f"Failed to insert comment {i+1}: {e}")
        
        return results
    
    def delete_comment(self, comment_id: str) -> bool:
        if not self.has_write_access():
            raise Exception("OAuth authentication required for comment deletion")
        
        try:
            request = self.youtube.comments().delete(id=comment_id)
            request.execute()
            
            logger.info(f"Comment deleted: {comment_id}")
            return True
            
        except HttpError as e:
            logger.error(f"Error deleting comment: {e}")
            if e.resp.status == 403:
                raise Exception("Cannot delete comment, not your comment or insufficient permissions")
            else:
                raise Exception(f"Failed to delete comment: {str(e)}")
    
    def get_my_comments_on_video(self, video_id: str) -> List[Dict[str, Any]]:
        if not self.has_write_access():
            raise Exception("OAuth authentication required to get user comments")
        
        try:
            channel_info = self.get_my_channel_info()
            my_channel_id = channel_info['channel_id']
            
            my_comments = []
            next_page_token = None
            
            while True:
                request = self.youtube.commentThreads().list(
                    part='snippet',
                    videoId=video_id,
                    maxResults=1000,
                    pageToken=next_page_token
                )
                
                response = request.execute()
                
                for item in response['items']:
                    comment = item['snippet']['topLevelComment']['snippet']
                    
                    comment_channel_id = comment.get('authorChannelId', {}).get('value')
                    if comment_channel_id == my_channel_id:
                        my_comments.append({
                            'comment_id': item['snippet']['topLevelComment']['id'],
                            'text': comment['textDisplay'],
                            'published_at': comment['publishedAt'],
                            'like_count': comment.get('likeCount', 0)
                        })
                
                next_page_token = response.get('nextPageToken')
                if not next_page_token:
                    break
            
            logger.info(f"Found {len(my_comments)} of my comments on video {video_id}")
            return my_comments
            
        except HttpError as e:
            logger.error(f"Error getting my comments: {e}")
            raise Exception(f"Failed to get my comments: {str(e)}")
    
    def delete_judol_comments_on_video(
        self, 
        video_id: str, 
        algorithm: AlgorithmType = AlgorithmType.REGEX,
        pattern_file_id: Optional[str] = None
    ) -> Dict[str, Any]:
        if not self.has_write_access():
            raise Exception("OAuth authentication required for comment deletion")
        
        try:
            my_comments = self.get_my_comments_on_video(video_id)
            
            if not my_comments:
                return {
                    'total_my_comments': 0,
                    'judol_comments_found': 0,
                    'deleted_successfully': 0,
                    'deletion_failed': 0,
                    'details': []
                }
            
            detector = JudolDetector()
            
            comment_data_list = []
            comment_id_map = {}
            
            for comment in my_comments:
                comment_data = CommentData(
                    comment_id=comment['comment_id'],
                    author="me",
                    text=comment['text'],
                    like_count=comment['like_count'],
                    published_at=comment['published_at']
                )
                comment_data_list.append(comment_data)
                comment_id_map[comment['comment_id']] = comment
            
            detection_result = detector.detect_judol_comments(
                comments=comment_data_list,
                algorithm=algorithm,
                pattern_file_id=pattern_file_id
            )
            
            judol_comments = detection_result['judol_comments']
            
            results = {
                'total_my_comments': len(my_comments),
                'judol_comments_found': len(judol_comments), 
                'deleted_successfully': 0,
                'deletion_failed': 0,
                'details': []
            }
            
            for judol_comment in judol_comments:
                comment_id = judol_comment.comment.comment_id
                
                try:
                    self.delete_comment(comment_id)
                    results['deleted_successfully'] += 1
                    results['details'].append({
                        'comment_id': comment_id,
                        'text': judol_comment.comment.text[:100] + '...' if len(judol_comment.comment.text) > 100 else judol_comment.comment.text,
                        'matched_patterns': judol_comment.matched_patterns,
                        'status': 'deleted'
                    })
                    
                    # Rate limiting
                    time.sleep(2)
                    
                except Exception as e:
                    results['deletion_failed'] += 1
                    results['details'].append({
                        'comment_id': comment_id,
                        'text': judol_comment.comment.text[:100] + '...' if len(judol_comment.comment.text) > 100 else judol_comment.comment.text,
                        'error': str(e),
                        'status': 'failed'
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Error deleting judol comments: {e}")
            raise Exception(f"Failed to delete judol comments: {str(e)}")
    
    def delete_all_my_comments_on_video(self, video_id: str) -> Dict[str, Any]:
        if not self.has_write_access():
            raise Exception("OAuth authentication required for comment deletion")
        
        try:
            my_comments = self.get_my_comments_on_video(video_id)
            
            results = {
                'total_comments': len(my_comments),
                'deleted_successfully': 0,
                'deletion_failed': 0,
                'details': []
            }
            
            for comment in my_comments:
                try:
                    self.delete_comment(comment['comment_id'])
                    results['deleted_successfully'] += 1
                    results['details'].append({
                        'comment_id': comment['comment_id'],
                        'status': 'deleted'
                    })
                    
                    # Rate limiting
                    time.sleep(2)
                    
                except Exception as e:
                    results['deletion_failed'] += 1
                    results['details'].append({
                        'comment_id': comment['comment_id'],
                        'error': str(e),
                        'status': 'failed'
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Error deleting all comments: {e}")
            raise Exception(f"Failed to delete all comments: {str(e)}")