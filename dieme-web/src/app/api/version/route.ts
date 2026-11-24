import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 17,
    versionName: '1.2.14',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Guaranteed SPA New Chat transition in Dg-Images to prevent full page reload race conditions\n• Enforced strict attachment verification before prompt submission so ChatGPT always receives base and reference images\n• Streamlined Dieme Studio to pure 16:9 thumbnail showcase without past chat drawer or pin stream`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-24T11:19:51Z',
  },
  dgImages: {
    versionCode: 17,
    versionName: '1.2.14',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Guaranteed SPA New Chat transition in Dg-Images to prevent full page reload race conditions\n• Enforced strict attachment verification before prompt submission so ChatGPT always receives base and reference images\n• Streamlined Dieme Studio to pure 16:9 thumbnail showcase without past chat drawer or pin stream`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-24T11:19:51Z',
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
