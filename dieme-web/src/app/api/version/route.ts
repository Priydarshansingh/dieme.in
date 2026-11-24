import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 14,
    versionName: '1.2.11',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Resolved ChatGPT page-reload race condition by switching to SPA in-memory new chat transition via sidebar
• Guaranteed clean composer state and pre-cleared attachments before dispatching media assets
• Fixed multi-touch remove button detection and spinner tracking for instantaneous attachment readiness
• Synchronized New Session lifecycle to wipe past session assets and reset ChatGPT without full WebView reload
• Verified robust thumbnail generation and seamless 1080p canvas result display`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-24T09:19:38Z',
  },
  dgImages: {
    versionCode: 14,
    versionName: '1.2.11',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Resolved ChatGPT page-reload race condition by switching to SPA in-memory new chat transition via sidebar
• Guaranteed clean composer state and pre-cleared attachments before dispatching media assets
• Fixed multi-touch remove button detection and spinner tracking for instantaneous attachment readiness
• Synchronized New Session lifecycle to wipe past session assets and reset ChatGPT without full WebView reload
• Verified robust thumbnail generation and seamless 1080p canvas result display`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-24T09:19:38Z',
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
