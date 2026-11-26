import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 27,
    versionName: '1.2.24',
    minSupportedVersionCode: 1,
    releaseNotes:
      `Fix ChatGPT generation detection by scoping stop button and draft checks strictly to assistant turn
• Automated GitHub Releases workflow on main for instant distribution of APK assets and .dcast extensions
• Safe React backdrop handling and single-element Drag-and-Drop file attachment`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-26',
    publishedAt: '2026-11-26T01:30:00Z',
  },
  dgImages: {
    versionCode: 27,
    versionName: '1.2.24',
    minSupportedVersionCode: 1,
    releaseNotes:
      `Fix ChatGPT generation detection by scoping stop button and draft checks strictly to assistant turn
• Automated GitHub Releases workflow on main for instant distribution of APK assets and .dcast extensions
• Safe React backdrop handling and single-element Drag-and-Drop file attachment`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-26',
    publishedAt: '2026-11-26T01:30:00Z',
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
