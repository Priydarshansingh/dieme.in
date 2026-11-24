import { NextRequest, NextResponse } from 'next/server';

const VERSION_METADATA = {
  dieme: {
    versionCode: 12,
    versionName: '1.2.9',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Fixed single-input attachment targeting to prevent duplicate image stacking in ChatGPT composer
• Resolved progressbar false-positive blocking readiness detection and added simulated pointer/mouse events to Send button
• Ensured prompt text is never sent alone without image attachments; fails early if assets fail to attach
• Synchronized fresh session reset across Dieme and Dg-Images companion app
• Extended generation polling timeout to 165s to fully support ChatGPT reasoning and DALL-E queues
• Upgraded generated thumbnail showcase and persistent version indicator display`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-24T08:09:30Z',
  },
  dgImages: {
    versionCode: 12,
    versionName: '1.2.9',
    minSupportedVersionCode: 1,
    releaseNotes:
      `• Fixed single-input attachment targeting to prevent duplicate image stacking in ChatGPT composer
• Resolved progressbar false-positive blocking readiness detection and added simulated pointer/mouse events to Send button
• Ensured prompt text is never sent alone without image attachments; fails early if assets fail to attach
• Synchronized fresh session reset across Dieme and Dg-Images companion app
• Extended generation polling timeout to 165s to fully support ChatGPT reasoning and DALL-E queues
• Upgraded generated thumbnail showcase and persistent version indicator display`,
    downloadUrl:
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
    releaseDate: '2026-11-24',
    publishedAt: '2026-11-24T08:09:30Z',
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
