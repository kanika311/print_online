import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PrintPorter — Smart Printing & Cyber Café Platform',
  description:
    'On-demand cloud printing platform connecting users with nearby cyber cafes with real-time queue tracking, QR ordering, and fleet management.',
  keywords: [
    'print shop',
    'cyber cafe',
    'online printing',
    'smart printer',
    'print queue',
    'cloud print',
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
