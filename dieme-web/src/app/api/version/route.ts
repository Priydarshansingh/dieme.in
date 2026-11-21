import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 8,
    versionName: '1.2.5',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Synchronized live website distribution and release documentation\n• Dynamic versioning across dieme-web download page and GitHub repo\n• Verified real-time in-app update check prompting immediately when newer build is published`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-21',
    publishedAt: '2026-11-21T17:03:18Z',
  },
  dgImages: {
    versionCode: 8,
    versionName: '1.2.5',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Synchronized live website distribution and release documentation\n• Dynamic versioning across dieme-web download page and GitHub repo\n• Verified real-time in-app update check prompting immediately when newer build is published`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-21',
    publishedAt: '2026-11-21T17:03:18Z',
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
