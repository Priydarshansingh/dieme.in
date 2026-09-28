// POST & GET /api/youtube/sync
// Syncs active live broadcasts and recent video streams from YouTube into Firestore

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { col } from '@/lib/firestore/collections';

// Helper to refresh YouTube OAuth token if expired
async function getValidAccessToken(
  workspaceId: string,
  accountDoc: any
): Promise<string | null> {
  let { access_token, refresh_token, token_expires_at, id: channelId } = accountDoc;

  // If token is valid for at least another 2 minutes, reuse it
  if (access_token && token_expires_at && Date.now() < token_expires_at - 120000) {
    return access_token;
  }

  // If we have a refresh token, request a new access token
  if (refresh_token) {
    try {
      const clientId = process.env.YOUTUBE_CLIENT_ID;
      const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

      if (!clientId || !clientSecret) return null;

      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      const refreshData = await refreshRes.json();
      if (refreshData.access_token) {
        access_token = refreshData.access_token;
        const newExpiresAt = Date.now() + (refreshData.expires_in || 3600) * 1000;

        await adminDb.doc(col.youtubeAccount(workspaceId, channelId)).update({
          access_token,
          token_expires_at: newExpiresAt,
          updatedAt: new Date().toISOString(),
        });

        return access_token;
      }
    } catch (e) {
      console.error('[youtube-sync] Failed to refresh access token:', e);
    }
  }

  return access_token || null;
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}

async function handleSync(req: NextRequest) {
  let workspaceId: string | null = null;

  // 1. Authorize user
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
      workspaceId = decoded.uid;
    } catch {
      // Ignore if called internally with query
    }
  }

  const { searchParams } = new URL(req.url);
  workspaceId = searchParams.get('workspaceId') || workspaceId;

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  try {
    // 2. Fetch connected YouTube account
    const accountsSnap = await adminDb
      .collection(col.youtube(workspaceId))
      .where('connectionStatus', '==', 'connected')
      .limit(1)
      .get();

    if (accountsSnap.empty) {
      return NextResponse.json(
        { error: 'No connected YouTube channel found for this workspace' },
        { status: 404 }
      );
    }

    const accountData = accountsSnap.docs[0].data();
    const channelId = accountData.channelId || accountsSnap.docs[0].id;
    const token = await getValidAccessToken(workspaceId, accountData);

    if (!token) {
      return NextResponse.json(
        { error: 'Could not obtain a valid YouTube access token' },
        { status: 401 }
      );
    }

    // 3. Fetch Live Streams and Recent Broadcasts/Videos from YouTube
    const syncResults: Array<{ id: string; title: string; status: string }> = [];

    // A. Check for currently live broadcasts
    try {
      const liveRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&maxResults=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const liveData = await liveRes.json();

      if (liveData.items && Array.isArray(liveData.items)) {
        for (const item of liveData.items) {
          const videoId = item.id?.videoId;
          if (!videoId) continue;

          const streamDocRef = adminDb.doc(col.stream(workspaceId, videoId));
          const existing = await streamDocRef.get();

          const streamPayload = {
            id: videoId,
            workspaceId,
            youtubeVideoId: videoId,
            title: item.snippet?.title || 'YouTube Live Stream',
            thumbnailUrl:
              item.snippet?.thumbnails?.high?.url ||
              item.snippet?.thumbnails?.default?.url ||
              '',
            status: 'live',
            channelId,
            channelName: item.snippet?.channelTitle || accountData.channelName || '',
            startedAt: new Date(item.snippet?.publishedAt || Date.now()),
            clipCount: existing.exists ? existing.data()?.clipCount || 0 : 0,
            updatedAt: new Date().toISOString(),
          };

          await streamDocRef.set(streamPayload, { merge: true });
          syncResults.push({ id: videoId, title: streamPayload.title, status: 'live' });
        }
      }
    } catch (err) {
      console.warn('[youtube-sync] Failed checking live broadcasts:', err);
    }

    // B. Fetch recent completed streams & video uploads (up to 10)
    try {
      const recentRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const recentData = await recentRes.json();

      if (recentData.items && Array.isArray(recentData.items)) {
        for (const item of recentData.items) {
          const videoId = item.id?.videoId;
          if (!videoId) continue;

          // Skip if already captured as active live stream
          if (syncResults.some((s) => s.id === videoId)) continue;

          const streamDocRef = adminDb.doc(col.stream(workspaceId, videoId));
          const existing = await streamDocRef.get();

          // Do not overwrite if stream is currently live
          if (existing.exists && existing.data()?.status === 'live') continue;

          const streamPayload = {
            id: videoId,
            workspaceId,
            youtubeVideoId: videoId,
            title: item.snippet?.title || 'YouTube Stream',
            thumbnailUrl:
              item.snippet?.thumbnails?.high?.url ||
              item.snippet?.thumbnails?.default?.url ||
              '',
            status: 'ended',
            channelId,
            channelName: item.snippet?.channelTitle || accountData.channelName || '',
            startedAt: new Date(item.snippet?.publishedAt || Date.now()),
            clipCount: existing.exists ? existing.data()?.clipCount || 0 : 0,
            updatedAt: new Date().toISOString(),
          };

          await streamDocRef.set(streamPayload, { merge: true });
          syncResults.push({ id: videoId, title: streamPayload.title, status: 'ended' });
        }
      }
    } catch (err) {
      console.warn('[youtube-sync] Failed fetching recent streams:', err);
    }

    return NextResponse.json({
      success: true,
      channelId,
      channelName: accountData.channelName,
      syncedCount: syncResults.length,
      streams: syncResults,
    });
  } catch (error: any) {
    console.error('[youtube-sync] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync YouTube streams' },
      { status: 500 }
    );
  }
}
