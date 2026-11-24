import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 16,
    versionName: '1.2.13',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Fixed seamless local image transfer between Dieme and Dg-Images companion in background without app switching
• Dismissed bottom composer when generated showcase is active on 16:9 canvas
• Kept full session context with pins and reference previews persistent in Active Revision Chat drawer
• Prevented multiple duplicate attachments in ChatGPT composer`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-24T09:57:25Z',
  },
  dgImages: {
    versionCode: 16,
    versionName: '1.2.13',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Fixed seamless local image transfer between Dieme and Dg-Images companion in background without app switching
• Dismissed bottom composer when generated showcase is active on 16:9 canvas
• Kept full session context with pins and reference previews persistent in Active Revision Chat drawer
• Prevented multiple duplicate attachments in ChatGPT composer`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-24T09:57:25Z',
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
