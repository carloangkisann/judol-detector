import { Card, CardContent, CardHeader, CardTitle, Alert, Button } from '../ui';
import { AlertTriangle, RefreshCw, ExternalLink, HelpCircle } from 'lucide-react';

interface VideoErrorProps {
  error: string;
  videoInput?: string;
  onRetry?: () => void;
  className?: string;
}

export function VideoError({ error, videoInput, onRetry, className }: VideoErrorProps) {
  const getErrorInfo = (errorMessage: string) => {
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return {
        title: 'Video Not Found',
        description: 'The video you\'re looking for doesn\'t exist or has been removed.',
        type: 'not-found' as const
      };
    }
    
    if (errorMessage.includes('403') || errorMessage.includes('private')) {
      return {
        title: 'Video Not Accessible',
        description: 'This video is private, restricted, or has comments disabled.',
        type: 'private' as const
      };
    }
    
    if (errorMessage.includes('Invalid')) {
      return {
        title: 'Invalid Video URL',
        description: 'The URL or video ID format is not recognized.',
        type: 'invalid' as const
      };
    }
    
    return {
      title: 'Video Error',
      description: errorMessage,
      type: 'unknown' as const
    };
  };

  const errorInfo = getErrorInfo(error);

  const openYouTubeSearch = () => {
    if (videoInput) {
      const searchQuery = encodeURIComponent(videoInput);
      window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
    } else {
      window.open('https://www.youtube.com', '_blank');
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <span>{errorInfo.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert variant="error">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <h4 className="font-medium">{errorInfo.title}</h4>
              <p className="text-sm mt-1">{errorInfo.description}</p>
            </div>
          </Alert>

          {/* Error Details */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <HelpCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-2">Common Issues</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {errorInfo.type === 'not-found' && (
                    <>
                      <li>• Video has been deleted or removed by the creator</li>
                      <li>• Video ID or URL is incorrect</li>
                      <li>• Video was made private after being public</li>
                    </>
                  )}
                  {errorInfo.type === 'private' && (
                    <>
                      <li>• Video is set to private or unlisted</li>
                      <li>• Comments are disabled on this video</li>
                      <li>• Video has age restrictions or regional blocks</li>
                      <li>• Channel has restricted access</li>
                    </>
                  )}
                  {errorInfo.type === 'invalid' && (
                    <>
                      <li>• URL format is not recognized</li>
                      <li>• Video ID should be 11 characters long</li>
                      <li>• Make sure to use a valid YouTube URL</li>
                    </>
                  )}
                  {errorInfo.type === 'unknown' && (
                    <>
                      <li>• Network connection issues</li>
                      <li>• YouTube API temporarily unavailable</li>
                      <li>• Server processing error</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Valid URL Examples */}
          {errorInfo.type === 'invalid' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Valid URL Examples</h4>
              <div className="text-sm text-blue-700 space-y-1 font-mono">
                <div>https://youtube.com/watch?v=dQw4w9WgXcQ</div>
                <div>https://youtu.be/dQw4w9WgXcQ</div>
                <div>dQw4w9WgXcQ</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </Button>
            )}
            
            <Button
              onClick={openYouTubeSearch}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Search on YouTube</span>
            </Button>
          </div>

          {/* Input Value Display */}
          {videoInput && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
              <span className="font-medium">Input value:</span> {videoInput}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}