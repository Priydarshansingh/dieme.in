import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 17,
    versionName: '1.2.14',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Fixed image attachment to ChatGPT composer using prototype property descriptor setter\n• Cleaned up New Session lifecycle in Dg-Images to guarantee fresh session and purged past assets\n• Removed past chat drawer and pin stream from Dieme Studio to showcase pure 16:9 thumbnail result\n• Added top bar Back navigation and instant New Session action button`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-24T11:11:31Z',
  },
  dgImages: {
    versionCode: 17,
    versionName: '1.2.14',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Fixed image attachment to ChatGPT composer using prototype property descriptor setter\n• Cleaned up New Session lifecycle in Dg-Images to guarantee fresh session and purged past assets\n• Removed past chat drawer and pin stream from Dieme Studio to showcase pure 16:9 thumbnail result\n• Added top bar Back navigation and instant New Session action button`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-24T11:11:31Z',
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
