import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Prinly.in — Online → Local Printing Network',
  description:
    'Upload Anywhere. Print Nearby. Collect Instantly. Smart cyber cafe print network with real-time queue tracking, direct shop UPI, and 3D visual experience.',
  keywords: [
    'Prinly',
    'Prinly.in',
    'online printing',
    'cyber cafe network',
    'cloud printing',
    'local printer',
    'print documents nearby',
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
