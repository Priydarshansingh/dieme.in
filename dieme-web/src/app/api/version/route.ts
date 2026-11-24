import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 15,
    versionName: '1.2.12',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Implemented foreground companion handover during inpaint generation so Android and OEM battery managers never throttle WebView upload threads
• Added File upload pending detection to prevent premature prompt submission before OpenAI servers finish receiving images
• Enhanced direct synchronous Canvas Base64 extraction for newly generated blob and CDN images
• Ensured seamless automatic focus return to Dieme upon thumbnail completion to showcase 1080p canvas result`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-24T09:38:41Z',
  },
  dgImages: {
    versionCode: 15,
    versionName: '1.2.12',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Implemented foreground companion handover during inpaint generation so Android and OEM battery managers never throttle WebView upload threads
• Added File upload pending detection to prevent premature prompt submission before OpenAI servers finish receiving images
• Enhanced direct synchronous Canvas Base64 extraction for newly generated blob and CDN images
• Ensured seamless automatic focus return to Dieme upon thumbnail completion to showcase 1080p canvas result`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-24T09:38:41Z',
  },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const app = (searchParams.get('app') || '').toLowerCase();

  let body: unknown = VERSION_METADATA;
  if (app === 'dieme' || app === 'core' || app === 'app') {
    body = VERSION_METADATA.dieme;
  } else if (app === 'dgimages' || app === 'dg-images' || app === 'thumbnail') {
    body = VERSION_METADATA.dgImages;
  }

  return NextResponse.json(body, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
