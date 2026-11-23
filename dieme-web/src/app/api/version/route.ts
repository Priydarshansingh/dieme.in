import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 10,
    versionName: '1.2.7',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Added persistent version details, build number, and update check footers across Settings and bottom bars\n• Added sideways History Drawer version status in Thumbnail Studio\n• Enhanced ChatGPT attachment and new session lifecycle in Dg-Images companion app`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-23',
    publishedAt: '2026-11-23T17:49:44Z',
  },
  dgImages: {
    versionCode: 10,
    versionName: '1.2.7',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Added persistent version details, build number, and update check footers across Settings and bottom bars\n• Added sideways History Drawer version status in Thumbnail Studio\n• Enhanced ChatGPT attachment and new session lifecycle in Dg-Images companion app`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-23',
    publishedAt: '2026-11-23T17:49:44Z',
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
