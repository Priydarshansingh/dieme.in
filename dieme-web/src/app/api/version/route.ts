import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 29,
    versionName: '1.2.26',
    minSupportedVersionCode: 1,
    releaseNotes:
      `Native Cloud AI Thumbnail Studio integration, automated multi-provider AI shuffling (FLUX, SDXL, Gemini Imagen), Google Drive backend storage for chat & generations, and standalone Dieme app without companion APK dependency.`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-27',
    publishedAt: '2026-11-27T08:00:00Z',
  },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const app = (searchParams.get('app') || '').toLowerCase();

  const body = (app === 'dieme' || app === 'core' || app === 'app' || !app)
    ? VERSION_METADATA.dieme
    : VERSION_METADATA.dieme;

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
