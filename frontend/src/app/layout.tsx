import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Navbar';
import { AuthProvider } from '@/lib/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Judol Detector | YouTube Gambling Comment Detection',
  description: 'Advanced gambling comment detection system for YouTube videos using multiple string matching algorithms',
  keywords: ['youtube', 'comment', 'detection', 'gambling', 'moderation', 'algorithm'],
  authors: [{ name: 'Carlo Angkisan' }],
  openGraph: {
    title: 'Judol Detector | YouTube Gambling Comment Detection',
    description: 'Advanced gambling comment detection system for YouTube videos using multiple string matching algorithms',
    type: 'website',
    images: '/judol-detector.png',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Judol Detector | YouTube Gambling Comment Detection',
    description: 'Advanced gambling comment detection system for YouTube videos using multiple string matching algorithms',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#ec4899" />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <AuthProvider>
          <div className="min-h-full flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}