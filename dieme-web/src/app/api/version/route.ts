import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 2,
    versionName: '1.1.0',
    minSupportedVersionCode: 1,
    releaseNotes:
      '• Retro dot-matrix canvas mini-game while generating thumbnails\n• Saved thumbnail history & past chat reachability\n• Native UPI gateway direct launch\n• Real-time in-app update checker with 24h snooze',
    downloadUrl: 'https://www.dieme.in/api/download/apk',
    releaseDate: '2026-11-15',
    publishedAt: '2026-11-15T14:00:00Z',
  },
  dgImages: {
    versionCode: 2,
    versionName: '1.1.0',
    minSupportedVersionCode: 1,
    releaseNotes:
      '• Secure normal user background overlay & ChatGPT privacy barrier\n• Developer passcode bypass\n• Direct redirect to Dieme Web Thumbnail creator\n• In-app update system with 24h snooze',
    downloadUrl: 'https://www.dieme.in/api/download/thumbnail',
    releaseDate: '2026-11-15',
    publishedAt: '2026-11-15T14:00:00Z',
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
