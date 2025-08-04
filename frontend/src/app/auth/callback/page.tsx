"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { CheckCircle, XCircle, Home } from "lucide-react";
import { useAuth } from "@/lib/context/AuthContext";

// Separate component that uses useSearchParams
function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { checkAuthStatus } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const authStatusParam = searchParams.get("status");
    const errorMessageParam = searchParams.get("message");

    if (authStatusParam === "success") {
      checkAuthStatus()
        .then(() => {
          setStatus("success");
          setMessage(
            "Authentication successful! You can now manage YouTube comments."
          );

          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                router.push("/comments");
                return 0;
              }
              return prev - 1;
            });
          }, 1000);

          return () => clearInterval(timer);
        })
        .catch((err) => {
          setStatus("error");
          setMessage("Failed to verify authentication status");
          console.error("Authentication callback error:", err);
        });
    } else if (authStatusParam === "error") {
      setStatus("error");
      setMessage(
        errorMessageParam || "Authentication failed: An unknown error occurred."
      );
    } else {
      setStatus("error");
      setMessage("Invalid authentication callback. Please try again.");
    }
  }, [searchParams, router, checkAuthStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Authentication Status
          </h1>
          <p className="text-gray-600">Verifying your YouTube credentials</p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {status === "loading" && (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-200 border-t-pink-600"></div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Processing Authentication
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your credentials...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-8">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Authentication Successful!
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>

              {/* Countdown */}
              <div className="bg-green-50 rounded-xl p-6 mb-6 border border-green-200">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {countdown}
                    </span>
                  </div>
                  <span className="text-green-800 font-medium">
                    Redirecting to comments page in {countdown} second
                    {countdown !== 1 ? "s" : ""}...
                  </span>
                </div>
              </div>

              <Button
                onClick={() => router.push("/comments")}
                className="text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Go to Comments Now
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-8">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Authentication Failed
              </h2>
              <div className="bg-red-50 rounded-xl p-6 mb-8 border border-red-200">
                <p className="text-red-800 font-medium mb-2">Error Details:</p>
                <p className="text-red-700 text-sm leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => router.push("/")}
                  className="w-full text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Return to Home
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Having trouble? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full">
            <div className="text-center mb-12">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg"></div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Authentication Status
              </h1>
              <p className="text-gray-600">Loading authentication status...</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 mb-6">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-200 border-t-pink-600"></div>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Loading
                </h2>
                <p className="text-gray-600">
                  Please wait while we prepare your authentication status...
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
