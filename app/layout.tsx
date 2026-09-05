import type { Metadata } from 'next';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-[#0a0e17] text-slate-100 antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
