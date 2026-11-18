import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 3,
    versionName: '1.2.0',
    minSupportedVersionCode: 1,
    releaseNotes:
      '• Clean distraction-free 16:9 canvas without overlay pills\n• Real-time countdown & dot snake mini-game while generating\n• Persistent YouTube channel clip tracking across logins\n• Instant UPI plans & payments',
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-19',
    publishedAt: '2026-11-19T02:00:00Z',
  },
  dgImages: {
    versionCode: 3,
    versionName: '1.2.0',
    minSupportedVersionCode: 1,
    releaseNotes:
      '• Minimalist obsidian top bar with pulsing emerald dot\n• Full unhindered ChatGPT view with streamlined login & navigation\n• High-performance 1080p generation with background daemon persistence\n• Dedicated Activity & session control sheet',
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-19',
    publishedAt: '2026-11-19T02:00:00Z',
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
