import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 26,
    versionName: '1.2.23',
    minSupportedVersionCode: 1,
    releaseNotes:
      `Prevented ChatGPT sidebar drawer lockup by safely dismissing overlays without destroying React DOM backdrops
• Single targeted Drag-and-Drop file attachment to guarantee exactly 1 copy of each asset
• Active generation waiting: verifies draft completion, percentage, and stop button before capturing
• Strict assistant turn filtering to prevent echoing reference images`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-25',
    publishedAt: '2026-11-25T23:00:00Z',
  },
  dgImages: {
    versionCode: 26,
    versionName: '1.2.23',
    minSupportedVersionCode: 1,
    releaseNotes:
      `Prevented ChatGPT sidebar drawer lockup by safely dismissing overlays without destroying React DOM backdrops
• Single targeted Drag-and-Drop file attachment to guarantee exactly 1 copy of each asset
• Active generation waiting: verifies draft completion, percentage, and stop button before capturing
• Strict assistant turn filtering to prevent echoing reference images`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-25',
    publishedAt: '2026-11-25T23:00:00Z',
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
