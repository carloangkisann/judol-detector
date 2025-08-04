import React from "react";
import { CommentsManagement } from "@/app/comments/components/CommentsManagement";
import { Card, CardContent } from "@/components/ui";

export default function CommentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Comments <span className="text-pink-600">Management</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Insert, upload, and delete comments on your videos.
          </p>
        </div>

        <CommentsManagement />

        <Card className="mt-8">
          <CardContent>
            <div className="mt-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Comment File Format
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  When uploading comment files, use the following format:
                </p>
                <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                  Comment 1;Comment 2;Comment 3;Final comment without semicolon
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Separate each comment with a semicolon (;). The last comment
                  should not have a trailing semicolon.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
