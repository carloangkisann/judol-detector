import { apiClient } from './client';
import type {
  AuthStatusResponse,
  DetectionRequest,
  DetectionResponse,
  PatternFileUploadResponse,
  CommentFileUploadResponse,
  CommentInsertRequest,
  CommentFileInsertRequest,
  CommentDeleteRequest,
  CommentOperationResponse,
  VideoInfo,
  CommentData,
} from '../types';

export class AuthService {
  static async getStatus(): Promise<AuthStatusResponse> {
    return apiClient.get<AuthStatusResponse>('/api/auth/status');
  }

  static async authorize(): Promise<{ authorization_url: string }> {
    return apiClient.get<{ authorization_url: string }>('/api/auth/authorize');
  }

  static async revoke(): Promise<{ success: boolean; message: string }> {
    return apiClient.post<{ success: boolean; message: string }>('/api/auth/revoke');
  }
}

export class DetectionService {
  static async detect(request: DetectionRequest): Promise<DetectionResponse> {
    return apiClient.post<DetectionResponse>('/api/detection/detect', request);
  }

  static async uploadPatterns(file: File): Promise<PatternFileUploadResponse> {
    return apiClient.upload<PatternFileUploadResponse>('/api/detection/upload-patterns', file);
  }

  static async clearPatternFile(): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>('/api/detection/pattern-file');
  }

  static async getVideoInfo(videoId: string): Promise<VideoInfo> {
    return apiClient.get<VideoInfo>(`/api/detection/video-info/${videoId}`);
  }
}

export class CommentsService {
  static async insertComments(request: CommentInsertRequest): Promise<CommentOperationResponse> {
    return apiClient.post<CommentOperationResponse>('/api/comments/insert', request);
  }

  static async uploadCommentFile(file: File): Promise<CommentFileUploadResponse> {
    return apiClient.upload<CommentFileUploadResponse>('/api/comments/upload-comment-file', file);
  }

  static async insertFromFile(request: CommentFileInsertRequest): Promise<CommentOperationResponse> {
    return apiClient.post<CommentOperationResponse>('/api/comments/insert-from-file', request);
  }

  static async clearCommentFile(): Promise<{ success: boolean; message: string }> {
    return apiClient.delete<{ success: boolean; message: string }>('/api/comments/comment-file');
  }

  static async deleteComments(request: CommentDeleteRequest): Promise<CommentOperationResponse> {
    return apiClient.post<CommentOperationResponse>('/api/comments/delete', request);
  }

  static async getMyComments(videoId: string): Promise<CommentData[]> {
    return apiClient.get<CommentData[]>(`/api/comments/my-comments/${videoId}`);
  }

  static async getMyChannel(): Promise<Record<string, unknown>> {
    return apiClient.get<Record<string, unknown>>('/api/comments/my-channel');
  }
}