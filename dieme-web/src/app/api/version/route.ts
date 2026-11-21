import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 5,
    versionName: '1.2.2',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Real-time in-app update checks on every app launch
• Skippable update alert with session-based dismissal
• 50MB disk caching in OkHttp client for high-performance offline resilience
• Persistent YouTube channel clip markers & auth sync`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-21',
    publishedAt: '2026-11-21T09:43:35Z',
  },
  dgImages: {
    versionCode: 5,
    versionName: '1.2.2',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Real-time in-app update checks on every app launch
• Bulletproof ChatGPT image asset attachment retry engine & DataTransfer bridge
• Extended 30s upload timeout with automated retry assignment
• Minimalist top bar status indicator`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-21',
    publishedAt: '2026-11-21T09:43:35Z',
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
