export enum AlgorithmType {
  REGEX = "regex",
  KMP = "kmp",
  BOYER_MOORE = "boyer_moore",
  RABIN_KARP = "rabin_karp"
}

export interface CommentData {
  comment_id: string;
  author: string;
  text: string;
  like_count: number;
  published_at: string;
  reply_count: number;
}

export interface DetectionRequest {
  video_id: string;
  algorithm: AlgorithmType;
  pattern_file_id?: string;
  max_results: number;
}

export interface JudolComment {
  comment: CommentData;
  matched_patterns: string[];
  normalized_text: string;
  detection_algorithm: AlgorithmType;
}

export interface DetectionResponse {
  success: boolean;
  video_id: string;
  video_title?: string;
  total_comments: number;
  judol_comments: JudolComment[];
  detection_count: number;
  algorithm_used: AlgorithmType;
  processing_time: number;
  patterns_used: string[];
}

export interface PatternFileUploadResponse {
  success: boolean;
  file_id: string;
  filename: string;
  patterns_count: number;
  patterns: string[];
  replaced_previous: boolean;
  upload_time: string;
}

export interface CommentFileUploadResponse {
  success: boolean;
  file_id: string;
  filename: string;
  comments_count: number;
  comments_preview: string[];
  upload_time: string;
  validation: Record<string, unknown>;
}

export interface CommentInsertRequest {
  video_id: string;
  comments: string[];
}

export interface CommentFileInsertRequest {
  video_id: string;
  comment_file_id?: string;
}

export interface CommentDeleteRequest {
  video_id: string;
  delete_judol_only: boolean;
  algorithm: AlgorithmType;
  pattern_file_id?: string;
}

export interface CommentOperationResponse {
  success: boolean;
  message: string;
  total_processed: number;
  successful_operations: number;
  failed_operations: number;
  details: Record<string, unknown>[];
}

export interface AuthStatusResponse {
  authenticated: boolean;
  user_channel?: Record<string, unknown>;
  message: string;
}

export interface ErrorResponse {
  success: boolean;
  error: string;
  details?: string;
}

export interface VideoInfo {
  video_id: string;
  title: string;
  channel_title: string;
  description: string;
  thumbnail_url: string;
  published_at: string;
  view_count: number;
  like_count: number;
  comment_count: number;
}

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error?: string;
}

export interface DetectionState {
  isDetecting: boolean;
  results?: DetectionResponse;
  error?: string;
}