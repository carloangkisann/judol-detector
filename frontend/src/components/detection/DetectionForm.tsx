"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  Alert,
} from "../ui";
import { Search, Upload, X } from "lucide-react";
import {
  AlgorithmType,
  type DetectionRequest,
  type DetectionResponse,
  type PatternFileUploadResponse,
} from "@/lib/types";
import { DetectionService } from "@/lib/api/services";
import { useApi } from "@/hooks/useApi";
import { extractVideoId } from "@/lib/utils";

interface DetectionFormProps {
  onDetectionComplete: (result: DetectionResponse) => void;
  onDetectionError?: (error: string, videoInput: string) => void;
}

export function DetectionForm({
  onDetectionComplete,
  onDetectionError,
}: DetectionFormProps) {
  const [videoInput, setVideoInput] = useState("");
  const [algorithm, setAlgorithm] = useState<AlgorithmType>(
    AlgorithmType.REGEX
  );
  const [maxResults, setMaxResults] = useState(100);
  const [patternFile, setPatternFile] =
    useState<PatternFileUploadResponse | null>(null);
  const [videoValidation, setVideoValidation] = useState<{
    isValid: boolean;
    error?: string;
    videoId?: string;
  }>({ isValid: true });

  const detectionApi = useApi((...args) =>
    DetectionService.detect(...(args as [DetectionRequest]))
  );
  const uploadPatternsApi = useApi((...args) =>
    DetectionService.uploadPatterns(...(args as [File]))
  );

  const validateVideoInput = (input: string) => {
    if (!input.trim()) {
      setVideoValidation({ isValid: true });
      return;
    }

    try {
      const videoId = extractVideoId(input);
      setVideoValidation({ isValid: true, videoId });
    } catch (error) {
      setVideoValidation({
        isValid: false,
        error:
          error instanceof Error ? error.message : "Invalid video URL or ID",
      });
    }
  };

  const handleVideoInputChange = (value: string) => {
    setVideoInput(value);
    validateVideoInput(value);
  };

  const algorithmOptions = [
    { value: AlgorithmType.REGEX, label: "Regular Expression (Default)" },
    { value: AlgorithmType.KMP, label: "Knuth-Morris-Pratt (KMP)" },
    { value: AlgorithmType.BOYER_MOORE, label: "Boyer-Moore" },
    { value: AlgorithmType.RABIN_KARP, label: "Rabin-Karp" },
  ];

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadPatternsApi.execute(file);
      setPatternFile(result);
    } catch (error) {
      console.error("Failed to upload patterns:", error);
    }
  };

  const handleRemovePatternFile = async () => {
    try {
      await DetectionService.clearPatternFile();
      setPatternFile(null);
    } catch (error) {
      console.error("Failed to clear pattern file:", error);
    }
  };

  const handleDetection = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!videoInput.trim() || !videoValidation.isValid) {
      return;
    }

    try {
      const videoId = videoValidation.videoId || extractVideoId(videoInput);

      const request: DetectionRequest = {
        video_id: videoId,
        algorithm,
        max_results: maxResults,
        pattern_file_id: patternFile?.file_id,
      };

      const result = await detectionApi.execute(request);
      onDetectionComplete(result);
    } catch (error) {
      console.error("Detection failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Detection failed";

      // Update validation state if video is invalid
      if (
        errorMessage.includes("Invalid") ||
        errorMessage.includes("404") ||
        errorMessage.includes("not found")
      ) {
        setVideoValidation({
          isValid: false,
          error: "Video not found or is private/unavailable",
        });
      }

      if (onDetectionError) {
        onDetectionError(errorMessage, videoInput);
      }
    }
  };

  const needsPatternFile = algorithm !== AlgorithmType.REGEX;
  const canSubmit =
    videoInput.trim() &&
    videoValidation.isValid &&
    (!needsPatternFile || patternFile);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-pink-500" />
          <span>Judol Comment Detection</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleDetection} className="space-y-6">
          {/* Video Input */}
          <div className="space-y-2">
            <Input
              label="YouTube Video URL or ID"
              placeholder="https://youtube.com/watch?v=... or video ID"
              value={videoInput}
              onChange={(e) => handleVideoInputChange(e.target.value)}
            />

            {/* Video Validation Feedback */}
            {videoInput.trim() && (
              <div className="flex items-center space-x-2 text-sm">
                {videoValidation.isValid ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-green-600">
                      Valid video ID: {videoValidation.videoId}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-red-600">
                      {videoValidation.error}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Algorithm Selection */}
          <Select
            label="Detection Algorithm"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as AlgorithmType)}
            options={algorithmOptions}
          />

          {/* Pattern File Upload for non-regex algorithms */}
          {needsPatternFile && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Pattern File (.txt)
              </label>

              {patternFile ? (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium text-green-800">
                      {patternFile.filename}
                    </span>
                    <span className="text-xs text-green-600">
                      ({patternFile.patterns_count} patterns)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePatternFile}
                    className="text-green-600 hover:text-green-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-pink-200 border-dashed rounded-lg cursor-pointer bg-pink-50 hover:bg-pink-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-pink-400" />
                      <p className="text-sm text-pink-600 font-medium">
                        Click to upload pattern file
                      </p>
                      <p className="text-xs text-pink-500">.txt files only</p>
                    </div>
                    <input
                      type="file"
                      accept=".txt"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadPatternsApi.loading}
                    />
                  </label>

                  {uploadPatternsApi.error && (
                    <Alert variant="error">{uploadPatternsApi.error}</Alert>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Max Results */}
          <Input
            label="Maximum Comments to Analyze"
            type="number"
            min="1"
            max="1000"
            value={maxResults}
            onChange={(e) => setMaxResults(parseInt(e.target.value) || 100)}
          />

          <Button
            type="submit"
            className="w-full"
            loading={detectionApi.loading || uploadPatternsApi.loading}
            disabled={!canSubmit}
          >
            <Search className="w-4 h-4 mr-2" />
            Detect Judol Comments
          </Button>

          {/* Error Display */}
          {detectionApi.error && (
            <Alert variant="error">
              <div>
                <h4 className="font-medium mb-1">Detection Failed</h4>
                <p className="text-sm">
                  {detectionApi.error.includes("404") ||
                  detectionApi.error.includes("not found")
                    ? "Video not found. Please check if the video exists, is public, and comments are enabled."
                    : detectionApi.error.includes("403") ||
                      detectionApi.error.includes("private")
                    ? "Cannot access this video. It may be private, restricted, or have comments disabled."
                    : detectionApi.error}
                </p>
                <div className="mt-2 text-xs text-red-600">
                  <p>Common issues:</p>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    <li>Video is private or unlisted</li>
                    <li>Comments are disabled on the video</li>
                    <li>Video has been deleted or removed</li>
                    <li>Invalid video URL or ID format</li>
                  </ul>
                </div>
              </div>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
