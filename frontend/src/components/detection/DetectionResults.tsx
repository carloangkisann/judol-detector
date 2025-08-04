import { Card, CardContent, CardHeader, CardTitle, Alert } from '../ui';
import { VideoPlayer } from './VideoPlayer';
import { 
  Target, 
  Clock, 
  MessageSquare, 
  AlertTriangle, 
  User, 
  ThumbsUp, 
  Calendar,
  TrendingUp
} from 'lucide-react';
import type { DetectionResponse, JudolComment } from '@/lib/types';
import { formatNumber } from '@/lib/utils';

interface DetectionResultsProps {
  results: DetectionResponse;
}

export function DetectionResults({ results }: DetectionResultsProps) {
  const detectionRate = results.total_comments > 0 
    ? (results.detection_count / results.total_comments * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Comments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(results.total_comments)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Judol Detected</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatNumber(results.detection_count)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Detection Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {detectionRate}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Processing Time</p>
                <p className="text-2xl font-bold text-green-600">
                  {results.processing_time.toFixed(2)}s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Video Player */}
      {results.video_title && (
        <VideoPlayer 
          videoId={results.video_id}
          title={results.video_title}
        />
      )}

      {/* Detection Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-pink-500" />
            <span>Detection Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Algorithm Used: <span className="font-medium">{results.algorithm_used}</span>
            </p>
            <p className="text-sm text-gray-600">
              Processing Time: <span className="font-medium">{results.processing_time.toFixed(2)}s</span>
            </p>
            {results.patterns_used.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Patterns Used:</p>
                <div className="flex flex-wrap gap-1">
                  {results.patterns_used.map((pattern, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-pink-100 text-pink-800 rounded"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detection Results */}
      {results.detection_count > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>Detected Judol Comments ({results.detection_count})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
              {results.judol_comments.map((judolComment, index) => (
                <JudolCommentCard key={judolComment.comment.comment_id} judolComment={judolComment} index={index} />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert variant="success">
          <div>
            <h4 className="font-medium">No Judol Comments Detected!</h4>
            <p className="text-sm mt-1">
              Great news! No gambling-related comments were found in this video.
            </p>
          </div>
        </Alert>
      )}
    </div>
  );
}

function JudolCommentCard({ judolComment, index }: { judolComment: JudolComment; index: number }) {
  const { comment, matched_patterns, normalized_text } = judolComment;
  
  return (
    <div className="border border-red-100 rounded-lg p-4 bg-red-50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full">
            {index + 1}
          </span>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span className="font-medium">{comment.author}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <ThumbsUp className="w-4 h-4" />
            <span>{formatNumber(comment.like_count)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(comment.published_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Original Comment:</p>
          <p className="text-sm text-gray-900 bg-white p-2 rounded border">
            {comment.text}
          </p>
        </div>
        
        {normalized_text !== comment.text && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Normalized Text:</p>
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
              {normalized_text}
            </p>
          </div>
        )}
        
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Matched Patterns:</p>
          <div className="flex flex-wrap gap-1">
            {matched_patterns.map((pattern, patternIndex) => (
              <span
                key={patternIndex}
                className="inline-block px-2 py-1 text-xs bg-red-200 text-red-800 rounded font-mono"
              >
                {pattern}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}