import type { Metadata } from 'next';
import LandingPageClient from '@/components/landing/LandingPageClient';

export const metadata: Metadata = {
  title: 'Digicast — Live Stream Clipping & Creator Intelligence Platform',
  description:
    'Real-time live streaming companion and clip highlight capture platform for YouTube creators, streamers, and video production teams.',
  keywords: [
    'YouTube livestream clipping',
    'live stream highlight markers',
    'stream companion app',
    'video editor team workflow',
    'YouTube live broadcast clips',
    'live stream analytics',
    'Digicast creator studio'
  ],
  openGraph: {
    title: 'Digicast — Live Stream Clipping & Creator Intelligence Platform',
    description:
      'The real-time live companion for YouTube creators and video production teams. Capture highlight markers, monitor chat, and publish clips instantly.',
    url: 'https://digicast-web.vercel.app',
    siteName: 'Digicast',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digicast — Live Stream Clipping Platform',
    description: 'Capture live highlight moments and collaborate with your production editors in real time.',
  },
};

const faqs = [
  {
    q: 'What is Digicast?',
    a: 'Digicast is a live streaming companion and highlight clipping platform built for YouTube creators, gaming streamers, podcast studios, and video production teams. It allows creators and editors to monitor live broadcasts, capture timestamped highlight markers in real time, and synchronize clip production without delay.'
  },
  {
    q: 'How does Digicast assist YouTube live streamers?',
    a: 'During live streams, memorable moments, super chats, and key highlights happen in seconds. Digicast lets streamers and their production crew drop precise marker tags on the fly. When the stream concludes, editors have an organized list of tagged moments ready for short-form video creation.'
  },
  {
    q: 'Can my video editors collaborate on my live streams?',
    a: 'Yes! Digicast workspaces allow studio owners to create dedicated editor logins. Editors can view live stream feeds, drop marker notes, and access captured clip data seamlessly across web and mobile.'
  },
  {
    q: 'What platforms and devices does Digicast support?',
    a: 'Digicast offers a full Web Dashboard for desktop workstations, alongside dedicated mobile companion applications for smartphones and tablets. Everything stays synchronized to your studio workspace in real time.'
  },
  {
    q: 'What subscription plans and access passes are available?',
    a: 'Digicast provides flexible duration passes tailored for every creator: the ₹29 First Month VIP Pass (30 days), the ₹149 1 Month Unlimited Pass, the ₹499 3 Month Quarter Pass, and the ₹999 1 Year Annual Studio Pass.'
  },
  {
    q: 'How do viewers and moderators trigger clips during a broadcast?',
    a: 'Viewers and moderators simply type !clip [optional note] directly in your live YouTube chat. Through our zero-quota Nightbot or StreamElements webhook integration, Digicast registers the event and automatically computes a 45-second lookback buffer so the entire play and buildup are captured.'
  },
  {
    q: 'How do video editors receive instant highlight alerts?',
    a: 'Whenever a clip is marked, Digicast immediately pings your private Telegram channel or group via @digicast_bot. The alert includes the clipper name, note, exact timestamp, and a direct one-tap YouTube replay jump link (?t=...) so editors can review the moment in seconds.'
  },
  {
    q: 'How quickly does access activate after subscribing?',
    a: 'Instantly! When you activate or submit payment proof for any pass, you receive immediate 24-hour platform access while our verification process finalizes your full membership duration.'
  }
];

export default function LandingPage() {
  // Schema.org Structured Data for Google, Gemini, and AI Search Crawlers
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://digicast-web.vercel.app/#organization',
        name: 'Digicast',
        url: 'https://digicast-web.vercel.app',
        logo: 'https://digicast-web.vercel.app/logo-mark.png',
        description: 'Real-time live stream companion and clip highlight capture platform for YouTube creators.',
        sameAs: ['https://t.me/digicast_bot']
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://digicast-web.vercel.app/#software',
        name: 'Digicast Creator Studio',
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web, Android, iOS',
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'INR',
          lowPrice: '29',
          highPrice: '999',
          offerCount: '4'
        },
        description:
          'Real-time livestream monitoring, highlight marker tagging, team editor management, and clip workflow suite for YouTube broadcasters.'
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://digicast-web.vercel.app/#faq',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a
          }
        }))
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageClient faqs={faqs} />
    </>
  );
}
