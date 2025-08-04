'use client';

import React, { useState } from 'react';
import { DetectionForm } from '@/components/detection/DetectionForm';
import { DetectionResults } from '@/components/detection/DetectionResults';
import { VideoError } from '@/components/detection/VideoError';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Target } from 'lucide-react';
import type { DetectionResponse } from '@/lib/types';

export default function HomePage() {
  const [detectionResults, setDetectionResults] = useState<DetectionResponse | null>(null);
  const [videoError, setVideoError] = useState<{ error: string; videoInput: string } | null>(null);

  const handleDetectionComplete = (results: DetectionResponse) => {
    setDetectionResults(results);
    setVideoError(null);
  };

  const handleDetectionError = (error: string, videoInput: string) => {
    setVideoError({ error, videoInput });
    setDetectionResults(null);
  };

  const handleRetryDetection = () => {
    setVideoError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Judol <span className="text-pink-600">Detector</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Advanced gambling comment detection system for YouTube videos using multiple string matching algorithms
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Detection Form */}
          <div className="lg:col-span-1">
            <DetectionForm 
              onDetectionComplete={handleDetectionComplete}
              onDetectionError={handleDetectionError}
            />
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {detectionResults ? (
              <DetectionResults results={detectionResults} />
            ) : videoError ? (
              <VideoError 
                error={videoError.error}
                videoInput={videoError.videoInput}
                onRetry={handleRetryDetection}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Detection Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-pink-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Ready to Detect
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Enter a YouTube video URL and select your preferred detection algorithm to start analyzing comments for gambling content.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}