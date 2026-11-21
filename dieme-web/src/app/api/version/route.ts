import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 6,
    versionName: '1.2.3',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Compile-time BuildConfig version detection ensuring no popups when app is up to date
• Synchronized direct APK distribution on dieme.in
• Real-time launch check with session-only dismiss`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-21',
    publishedAt: '2026-11-21T10:07:22Z',
  },
  dgImages: {
    versionCode: 6,
    versionName: '1.2.3',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Compile-time BuildConfig version detection ensuring no popups when app is up to date
• Synchronized direct APK distribution on dieme.in
• Real-time launch check with session-only dismiss`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-21',
    publishedAt: '2026-11-21T10:07:22Z',
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
