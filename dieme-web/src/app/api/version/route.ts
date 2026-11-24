import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 13,
    versionName: '1.2.10',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Guaranteed main thread execution for all WebView JavaScript evaluations via safeEvalJs to fix background thread attachment detection failures
• Hardened active composer form targeting using editor.closest('form')
• Added resilient fallback handling in attachment readiness polling to prevent false-negative timeouts
• Replaced progressbar false-positives with multi-element chip detection`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-24T09:04:02Z',
  },
  dgImages: {
    versionCode: 13,
    versionName: '1.2.10',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Guaranteed main thread execution for all WebView JavaScript evaluations via safeEvalJs to fix background thread attachment detection failures
• Hardened active composer form targeting using editor.closest('form')
• Added resilient fallback handling in attachment readiness polling to prevent false-negative timeouts
• Replaced progressbar false-positives with multi-element chip detection`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-24T09:04:02Z',
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
