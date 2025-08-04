'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui';
import { Zap, LogOut, User } from 'lucide-react';
import { AuthService } from '@/lib/api/services';
import { useAuth } from '@/lib/context/AuthContext';

export function Header() {
  const pathname = usePathname();
  const { loading, isAuthenticated, checkAuthStatus } = useAuth();

  const handleAuth = async () => {
    if (isAuthenticated) {
      // Logout
      try {
        await AuthService.revoke();
        await checkAuthStatus(); // Refresh auth status
      } catch (error) {
        console.error('Failed to logout:', error);
      }
    } else {
      // Login
      try {
        const { authorization_url } = await AuthService.authorize();
        window.location.href = authorization_url;
      } catch (error) {
        console.error('Failed to start auth:', error);
      }
    }
  };

  return (
    <header className="bg-white border-b border-pink-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-400 to-pink-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Judol <span className="text-pink-600">Detector</span>
            </h1>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link 
              href="/" 
              className={`transition-colors ${
                pathname === '/' 
                  ? 'text-pink-600 font-medium' 
                  : 'text-gray-600 hover:text-pink-600'
              }`}
            >
              Detection
            </Link>
            <Link 
              href="/comments" 
              className={`transition-colors ${
                pathname === '/comments' 
                  ? 'text-pink-600 font-medium' 
                  : 'text-gray-600 hover:text-pink-600'
              }`}
            >
              Comments
            </Link>
            <Link 
              href="/about" 
              className={`transition-colors ${
                pathname === '/about' 
                  ? 'text-pink-600 font-medium' 
                  : 'text-gray-600 hover:text-pink-600'
              }`}
            >
              About
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="w-24 h-8 bg-pink-100 rounded animate-pulse" />
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Authenticated</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAuth}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button variant="default" size="sm" onClick={handleAuth}>
                <User className="w-4 h-4 mr-1" />
                Login with YouTube
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}