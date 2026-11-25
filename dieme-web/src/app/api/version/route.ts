import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 24,
    versionName: '1.2.21',
    minSupportedVersionCode: 1,
    releaseNotes:
      `Safely deferred background foreground service promotion to prevent Android 14 crashes
• Triple-tier ChatGPT media attachment pipeline (file input prototype setter, HTML5 Drag-and-Drop, and clipboard paste)
• Guaranteed drawer sidebar dismissal to prevent composer backdrop overlay blocks
• Instant 1080p generated revision returned directly to Dieme Studio 16:9 canvas`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-25',
    publishedAt: '2026-11-25T14:30:00Z',
  },
  dgImages: {
    versionCode: 24,
    versionName: '1.2.21',
    minSupportedVersionCode: 1,
    releaseNotes:
      `Safely deferred background foreground service promotion to prevent Android 14 crashes
• Triple-tier ChatGPT media attachment pipeline (file input prototype setter, HTML5 Drag-and-Drop, and clipboard paste)
• Guaranteed drawer sidebar dismissal to prevent composer backdrop overlay blocks
• Instant 1080p generated revision returned directly to Dieme Studio 16:9 canvas`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-25',
    publishedAt: '2026-11-25T14:30:00Z',
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
