"use client";

import React, { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Alert,
} from "@/components/ui";
import {
  Plus,
  Upload,
  Trash2,
  MessageSquare,
  FileText,
  Lock,
} from "lucide-react";
import {
  AlgorithmType,
  type CommentInsertRequest,
  type CommentFileInsertRequest,
  type CommentDeleteRequest,
  type CommentOperationResponse,
  type CommentFileUploadResponse,
} from "@/lib/types";
import { CommentsService } from "@/lib/api/services";
import { useApi } from "@/hooks/useApi";
import { extractVideoId } from "@/lib/utils";
import { useAuth } from "@/lib/context/AuthContext";

export function CommentsManagement() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [videoInput, setVideoInput] = useState("");
  const [commentText, setCommentText] = useState("");
  const [uploadedFile, setUploadedFile] =
    useState<CommentFileUploadResponse | null>(null);

  const insertCommentsApi = useApi<CommentOperationResponse>((...args) =>
    CommentsService.insertComments(...(args as [CommentInsertRequest]))
  );
  const uploadFileApi = useApi<CommentFileUploadResponse>((...args) =>
    CommentsService.uploadCommentFile(...(args as [File]))
  );
  const insertFromFileApi = useApi<CommentOperationResponse>((...args) =>
    CommentsService.insertFromFile(...(args as [CommentFileInsertRequest]))
  );
  const deleteCommentsApi = useApi<CommentOperationResponse>((...args) =>
    CommentsService.deleteComments(...(args as [CommentDeleteRequest]))
  );

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFileApi.execute(file);
      setUploadedFile(result);
    } catch (error) {
      console.error("Failed to upload comment file:", error);
    }
  };

  const handleInsertComment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!videoInput.trim() || !commentText.trim()) return;

    try {
      const videoId = extractVideoId(videoInput);
      const request: CommentInsertRequest = {
        video_id: videoId,
        comments: [commentText],
      };

      await insertCommentsApi.execute(request);
      setCommentText("");
    } catch (error) {
      console.error("Failed to insert comment:", error);
    }
  };

  const handleInsertFromFile = async () => {
    if (!videoInput.trim() || !uploadedFile) return;

    try {
      const videoId = extractVideoId(videoInput);
      const request: CommentFileInsertRequest = {
        video_id: videoId,
        comment_file_id: uploadedFile.file_id,
      };

      await insertFromFileApi.execute(request);
    } catch (error) {
      console.error("Failed to insert comments from file:", error);
    }
  };

  const handleDeleteComments = async (deleteJudolOnly: boolean) => {
    if (!videoInput.trim()) return;

    try {
      const videoId = extractVideoId(videoInput);
      const request: CommentDeleteRequest = {
        video_id: videoId,
        delete_judol_only: deleteJudolOnly,
        algorithm: AlgorithmType.REGEX,
      };

      await deleteCommentsApi.execute(request);
    } catch (error) {
      console.error("Failed to delete comments:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Authentication Status Notice */}
      {!authLoading && !isAuthenticated && (
        <Alert variant="warning">
          <Lock className="h-5 w-5" />
          <div>
            <h4 className="font-medium">Authentication Required</h4>
            <p className="text-sm mt-1">
              You need to be logged in with YouTube to manage comments. Please
              click &quot;Login with YouTube&quot; in the header to
              authenticate.
            </p>
          </div>
        </Alert>
      )}

      {/* Video Input */}
      <Card className={!isAuthenticated ? "opacity-75" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-pink-500" />
            <span>Comments Management</span>
            {!isAuthenticated && <Lock className="w-4 h-4 text-gray-400" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            label="YouTube Video URL or ID"
            placeholder="https://youtube.com/watch?v=... or video ID"
            value={videoInput}
            onChange={(e) => setVideoInput(e.target.value)}
            disabled={!isAuthenticated}
          />
        </CardContent>
      </Card>

      {/* Insert Single Comment */}
      <Card className={!isAuthenticated ? "opacity-75" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-green-500" />
            <span>Insert Comment</span>
            {!isAuthenticated && <Lock className="w-4 h-4 text-gray-400" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInsertComment} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Comment Text
              </label>
              <textarea
                className="w-full h-24 px-3 py-2 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                placeholder={
                  isAuthenticated
                    ? "Enter your comment text here..."
                    : "Please login to insert comments"
                }
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={!isAuthenticated}
              />
            </div>

            <Button
              type="submit"
              loading={insertCommentsApi.loading}
              disabled={
                !isAuthenticated || !videoInput.trim() || !commentText.trim()
              }
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              {!isAuthenticated ? "Login Required" : "Insert Comment"}
            </Button>

            {insertCommentsApi.data && (
              <Alert variant="success">
                <div>
                  <h4 className="font-medium">
                    Comment Inserted Successfully!
                  </h4>
                  <p className="text-sm mt-1">
                    {insertCommentsApi.data.successful_operations} of{" "}
                    {insertCommentsApi.data.total_processed} comments inserted.
                  </p>
                </div>
              </Alert>
            )}

            {insertCommentsApi.error && (
              <Alert variant="error">{insertCommentsApi.error}</Alert>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Upload Comment File */}
      <Card className={!isAuthenticated ? "opacity-75" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <span>Insert from File</span>
            {!isAuthenticated && <Lock className="w-4 h-4 text-gray-400" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {uploadedFile ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium text-green-800">
                    {uploadedFile.filename}
                  </span>
                  <span className="text-xs text-green-600">
                    ({uploadedFile.comments_count} comments)
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <label
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-colors ${
                    isAuthenticated
                      ? "border-pink-200 bg-pink-50 hover:bg-pink-100 cursor-pointer"
                      : "border-gray-200 bg-gray-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload
                      className={`w-8 h-8 mb-2 ${
                        isAuthenticated ? "text-pink-400" : "text-gray-300"
                      }`}
                    />
                    <p
                      className={`text-sm font-medium ${
                        isAuthenticated ? "text-pink-600" : "text-gray-400"
                      }`}
                    >
                      {isAuthenticated
                        ? "Click to upload comment file"
                        : "Login required to upload files"}
                    </p>
                    <p
                      className={`text-xs ${
                        isAuthenticated ? "text-pink-500" : "text-gray-400"
                      }`}
                    >
                      .txt files with semicolon-separated comments
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".txt"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadFileApi.loading || !isAuthenticated}
                  />
                </label>

                {uploadFileApi.error && (
                  <Alert variant="error" className="mt-2">
                    {uploadFileApi.error}
                  </Alert>
                )}
              </div>
            )}

            <Button
              onClick={handleInsertFromFile}
              loading={insertFromFileApi.loading}
              disabled={!isAuthenticated || !videoInput.trim() || !uploadedFile}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {!isAuthenticated
                ? "Login Required"
                : "Insert Comments from File"}
            </Button>

            {insertFromFileApi.data && (
              <Alert variant="success">
                <div>
                  <h4 className="font-medium">Comments Inserted from File!</h4>
                  <p className="text-sm mt-1">
                    {insertFromFileApi.data.successful_operations} of{" "}
                    {insertFromFileApi.data.total_processed} comments inserted.
                  </p>
                </div>
              </Alert>
            )}

            {insertFromFileApi.error && (
              <Alert variant="error">{insertFromFileApi.error}</Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Comments */}
      <Card className={!isAuthenticated ? "opacity-75" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <span>Delete Comments</span>
            {!isAuthenticated && <Lock className="w-4 h-4 text-gray-400" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p
              className={`text-sm ${
                isAuthenticated ? "text-gray-600" : "text-gray-400"
              }`}
            >
              Delete your comments from the specified video. You can choose to
              delete only judol comments or all your comments.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="destructive"
                onClick={() => handleDeleteComments(true)}
                loading={deleteCommentsApi.loading}
                disabled={!isAuthenticated || !videoInput.trim()}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {!isAuthenticated
                  ? "Login Required"
                  : "Delete Judol Comments Only"}
              </Button>

              <Button
                variant="outline"
                onClick={() => handleDeleteComments(false)}
                loading={deleteCommentsApi.loading}
                disabled={!isAuthenticated || !videoInput.trim()}
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50 disabled:text-gray-400 disabled:border-gray-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {!isAuthenticated ? "Login Required" : "Delete All My Comments"}
              </Button>
            </div>

            {deleteCommentsApi.data && (
              <Alert variant="success">
                <div>
                  <h4 className="font-medium">
                    Comments Deleted Successfully!
                  </h4>
                  <p className="text-sm mt-1">
                    {deleteCommentsApi.data.successful_operations} of{" "}
                    {deleteCommentsApi.data.total_processed} comments deleted.
                  </p>
                </div>
              </Alert>
            )}

            {deleteCommentsApi.error && (
              <Alert variant="error">{deleteCommentsApi.error}</Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
