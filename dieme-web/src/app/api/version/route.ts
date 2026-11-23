import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 11,
    versionName: '1.2.8',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Fixed ChatGPT image attachment and readiness detector in Dg-Images companion app
• Resolved false-negative attachment detector timeouts that blocked prompt submission
• Prevented duplicate image stacking in ChatGPT composer (strictly 1 base + 1 pinpoint reference)
• Integrated clean Start New Session lifecycle: resets ChatGPT chat, composer attachments, and cached files
• Added media and storage permissions in Dg-Images manifest and single-pass Base64 dispatch in Dieme
• Updated version metadata across mobile clients, website, and GitHub distribution`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-23T19:43:38Z',
  },
  dgImages: {
    versionCode: 11,
    versionName: '1.2.8',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Fixed ChatGPT image attachment and readiness detector in Dg-Images companion app
• Resolved false-negative attachment detector timeouts that blocked prompt submission
• Prevented duplicate image stacking in ChatGPT composer (strictly 1 base + 1 pinpoint reference)
• Integrated clean Start New Session lifecycle: resets ChatGPT chat, composer attachments, and cached files
• Added media and storage permissions in Dg-Images manifest and single-pass Base64 dispatch in Dieme
• Updated version metadata across mobile clients, website, and GitHub distribution`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-23T19:43:38Z',
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
