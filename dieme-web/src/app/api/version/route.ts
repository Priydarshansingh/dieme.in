import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 9,
    versionName: '1.2.6',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Fixed ChatGPT photo attachment selector to target photo-specific input without capture
• Added automated dismissal for 'Stay on web' promo bottom-sheet and sidebar drawer
• Verified seamless Start New Session chat reset and pinpoint thumbnail generation
• Cleaned drawer chat history view after generated result is produced`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-23',
    publishedAt: '2026-11-23T07:10:53Z',
  },
  dgImages: {
    versionCode: 9,
    versionName: '1.2.6',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Fixed ChatGPT photo attachment selector to target photo-specific input without capture
• Added automated dismissal for 'Stay on web' promo bottom-sheet and sidebar drawer
• Verified seamless Start New Session chat reset and pinpoint thumbnail generation
• Cleaned drawer chat history view after generated result is produced`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-23',
    publishedAt: '2026-11-23T07:10:53Z',
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
