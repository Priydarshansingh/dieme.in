import type { Metadata } from 'next';
import './globals.css';
import { CookieConsent } from '@/components/common/CookieConsent';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.dieme.in'),
  title: {
    default: 'Dieme — Live Stream Clipping & Creator Intelligence Platform',
    template: '%s | Dieme',
  },
  description:
    'Real-time live streaming companion and clip highlight capture platform for YouTube creators, streamers, and video production teams.',
  applicationName: 'Dieme',
  authors: [{ name: 'Dieme Creator Studio' }],
  creator: 'Dieme',
  publisher: 'Dieme',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/logo-mark.png',
    shortcut: '/logo-mark.png',
    apple: '/logo-mark.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.dieme.in',
    siteName: 'Dieme',
    title: 'Dieme — Live Stream Clipping & Creator Intelligence Platform',
    description:
      'The real-time live companion for YouTube creators and video production teams. Capture highlight markers, monitor chat, and publish clips instantly.',
    images: [
      {
        url: '/logo-mark.png',
        width: 512,
        height: 512,
        alt: 'Dieme Platform Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dieme — Live Stream Clipping Platform',
    description: 'Capture live highlight moments and collaborate with your production editors in real time.',
    images: ['/logo-mark.png'],
  },
  verification: {
    google: 'REPLACE_WITH_YOUR_GOOGLE_SITE_VERIFICATION_CODE',
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
      <body style={{ fontFamily: "'Nunito', sans-serif" }}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
