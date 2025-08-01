import type { Metadata } from "next";
import { Inter } from 'next/font/google'
import "./globals.css";

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Judol Detector | Deteksi Komentar Judi Online YouTube',
  description: 'Aplikasi web untuk mendeteksi komentar yang mengandung konten judi online di video YouTube menggunakan berbagai algoritma string matching.',
  keywords: 'judol, judi online, youtube, detector, string matching, kmp, boyer moore, rabin karp',
  authors: [{ name: 'Carlo' }],
  openGraph: {
    title: 'Judol Detector',
    description: 'Deteksi Komentar Judi Online YouTube',
    type: 'website',
    images: '/zeus.jpg',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
