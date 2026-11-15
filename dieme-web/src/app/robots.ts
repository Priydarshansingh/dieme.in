import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/settings',
          '/wallet',
          '/assets',
          '/matchmaker',
          '/godpanel',
          '/godpanel/',
          '/api/',
          '/api/godpanel',
          '/api/godpanel/',
          '/api/telegram/webhook',
          '/api/payments/submit',
          '/api/mobile/',
        ],
      },
      {
        userAgent: [
          'Googlebot',
          'Bingbot',
          'GPTBot',
          'ChatGPT-User',
          'Google-Extended',
          'ClaudeBot',
          'PerplexityBot',
          'Applebot-Extended',
        ],
        allow: [
          '/',
          '/pricing',
          '/login',
          '/signup',
          '/clips',
          '/editors',
          '/coverage',
          '/coverage/india',
          '/coverage/international',
          '/contact',
          '/privacy',
          '/terms',
          '/refund',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/settings',
          '/wallet',
          '/assets',
          '/api/',
          '/godpanel',
        ],
      },
    ],
    sitemap: 'https://www.dieme.in/sitemap.xml',
    host: 'https://www.dieme.in',
  };
}
