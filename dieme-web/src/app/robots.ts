import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/godpanel',
          '/godpanel/',
          '/api/godpanel',
          '/api/godpanel/',
          '/api/telegram/webhook',
          '/api/payments/submit',
          '/api/mobile/',
        ],
      },
    ],
  };
}
