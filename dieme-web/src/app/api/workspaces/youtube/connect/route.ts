// GET /api/workspaces/youtube/connect
// Initiates the OAuth 2.0 flow for connecting a YouTube Channel to a Workspace.

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { col } from '@/lib/firestore/collections';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const idToken = authHeader.slice(7);
  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
  }

  try {
    // 1. Verify user is a member of the workspace
    const memberDoc = await adminDb.doc(col.member(workspaceId, uid)).get();
    if (!memberDoc.exists) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Generate Google OAuth URL for YouTube API
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const redirectUri = "https://digicast-web.vercel.app/api/youtube/callback";

    if (!clientId) {
      return NextResponse.json({ error: 'YouTube client ID not configured on server' }, { status: 500 });
    }

    // Pass the workspaceId in the state parameter to retrieve on callback
    const state = Buffer.from(JSON.stringify({ workspaceId, uid })).toString('base64');

    // Requested scopes include read-only for account metadata and live chat
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
    ].join(' ');

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${encodeURIComponent(state)}`;

    return NextResponse.json({ url: oauthUrl });
  } catch (error) {
    console.error('YouTube Connect Error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
