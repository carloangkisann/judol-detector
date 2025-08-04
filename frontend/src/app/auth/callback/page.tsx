'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loading, Alert, Button } from '@/components/ui';
import { CheckCircle, XCircle, Home } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { checkAuthStatus } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Authentication failed: ${error}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code received');
      return;
    }

    // Refresh auth status and show success
    checkAuthStatus().then(() => {
      setStatus('success');
      setMessage('Authentication successful! You can now manage YouTube comments.');
      
      // Redirect to comments page after 3 seconds
      setTimeout(() => {
        router.push('/comments');
      }, 3000);
    }).catch(() => {
      setStatus('error');
      setMessage('Failed to verify authentication status');
    });
  }, [searchParams, router, checkAuthStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Authentication Status
          </h1>
        </div>

        {status === 'loading' && (
          <div className="text-center py-8">
            <Loading size="lg" text="Processing authentication..." />
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <Alert variant="success">
              <CheckCircle className="h-5 w-5" />
              <div>
                <h3 className="font-medium">Authentication Successful!</h3>
                <p className="text-sm mt-1">{message}</p>
              </div>
            </Alert>
            <p className="text-center text-sm text-gray-600">
              Redirecting to comments page in a few seconds...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <Alert variant="error">
              <XCircle className="h-5 w-5" />
              <div>
                <h3 className="font-medium">Authentication Failed</h3>
                <p className="text-sm mt-1">{message}</p>
              </div>
            </Alert>
            <Button 
              onClick={() => router.push('/')}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}