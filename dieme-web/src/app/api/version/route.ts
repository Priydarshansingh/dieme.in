import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 18,
    versionName: '1.2.15',
    minSupportedVersionCode: 1,
    releaseNotes:
      `Fixed ChatGPT composer file assignment in Dg-Images to attach base and visual reference without duplication
• Pure 16:9 thumbnail showcase in Dieme Studio with active revision cards displaying live pin points and assets
• Instant fresh chat initialization on New Session with full cache purge and sidebar dismiss`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-24T11:51:53Z',
  },
  dgImages: {
    versionCode: 18,
    versionName: '1.2.15',
    minSupportedVersionCode: 1,
    releaseNotes:
      `Fixed ChatGPT composer file assignment in Dg-Images to attach base and visual reference without duplication
• Pure 16:9 thumbnail showcase in Dieme Studio with active revision cards displaying live pin points and assets
• Instant fresh chat initialization on New Session with full cache purge and sidebar dismiss`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-24T11:51:53Z',
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
