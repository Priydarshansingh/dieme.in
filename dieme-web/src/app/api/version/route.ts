import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 7,
    versionName: '1.2.4',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Fresh ChatGPT session & asset reset on New Session in Dieme\n• Deterministic attachment without duplicate multi-image uploads\n• Authenticated in-WebView image capture directly cached to local storage\n• Replaced downside chat clutter with crisp Generated Result Showcase Card\n• Added Active Session Ongoing Assets & Target Pins HUD in Drawer`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-21',
    publishedAt: '2026-11-21T14:03:08Z',
  },
  dgImages: {
    versionCode: 7,
    versionName: '1.2.4',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Fresh ChatGPT session & asset reset on New Session in Dieme\n• Deterministic attachment without duplicate multi-image uploads\n• Authenticated in-WebView image capture directly cached to local storage\n• Replaced downside chat clutter with crisp Generated Result Showcase Card\n• Added Active Session Ongoing Assets & Target Pins HUD in Drawer`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-21',
    publishedAt: '2026-11-21T14:03:08Z',
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
