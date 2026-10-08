import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Digicast — Creator Live Intelligence Platform',
  description: 'Capture, clip, and deliver your YouTube livestream moments.',
  icons: {
    icon: '/logo-mark.png',
    shortcut: '/logo-mark.png',
    apple: '/logo-mark.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'Nunito', sans-serif" }}>{children}</body>
    </html>
  );
}
