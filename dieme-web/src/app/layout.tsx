import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { CookieConsent } from '@/components/common/CookieConsent';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.dieme.in'),
  title: {
    default: 'Dieme — Live Stream Intelligence & Highlight Delivery Platform | Official Site (dieme.in)',
    template: '%s | Dieme',
  },
  description:
    'The official Dieme platform for YouTube live streamers and video editors. Instant !clip chat capture, hardware-accelerated video trimming, AI thumbnail studio, and direct Telegram delivery.',
  applicationName: 'Dieme',
  authors: [{ name: 'Dieme Technologies', url: 'https://www.dieme.in' }],
  creator: 'Dieme',
  publisher: 'Dieme Technologies',
  keywords: [
    'Dieme',
    'dieme',
    'dieme.in',
    'dieme app',
    'dieme live',
    'dieme stream',
    'dieme platform',
    'dieme creator studio',
    'dieme studio',
    'dieme apk',
    'dieme android',
    'YouTube live stream clipping',
    'Nightbot clip markers',
    'instant stream highlights',
    'creator wallet',
    'video editor matchmaking',
    'AI thumbnail generator',
    'dg-images',
    'stream intelligence',
  ],
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: 'https://www.dieme.in',
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
    title: 'Dieme — Live Stream Intelligence & Highlight Delivery Platform | Official Site',
    description:
      'The official Dieme platform for YouTube live streamers and video editors. Instant !clip chat capture, hardware-accelerated video trimming, AI thumbnail studio, and direct Telegram delivery.',
    images: [
      {
        url: '/logo-mark.png',
        width: 512,
        height: 512,
        alt: 'Dieme Official Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dieme — Live Stream Intelligence Platform (dieme.in)',
    description: 'The real-time live stream companion for YouTube creators and editors. Capture highlights, trim on device, and deliver clips instantly.',
    images: ['/logo-mark.png'],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || 'dieme-verification-2026',
  },
};

const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://www.dieme.in/#website',
      url: 'https://www.dieme.in',
      name: 'Dieme',
      alternateName: ['Dieme Platform', 'Dieme Studio', 'Dieme Live', 'dieme.in'],
      description:
        'Official Dieme website: Real-time live streaming intelligence, on-device highlight clipping, and AI thumbnails for YouTube creators.',
      inLanguage: 'en-US',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://www.dieme.in/clips?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': 'https://www.dieme.in/#organization',
      name: 'Dieme Technologies',
      url: 'https://www.dieme.in',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.dieme.in/logo-mark.png',
        caption: 'Dieme Logo',
      },
      sameAs: [
        'https://t.me/YT_digicast',
        'https://github.com/Priydarshansingh/dieme.in',
        'https://github.com/Priydarshansingh/Youtube-creators',
      ],
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://www.dieme.in/#software',
      name: 'Dieme Live Studio',
      operatingSystem: 'Android, Web Browser',
      applicationCategory: 'MultimediaApplication',
      downloadUrl: 'https://www.dieme.in/api/download/apk',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '154',
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      </head>
      <body className={nunito.className}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
