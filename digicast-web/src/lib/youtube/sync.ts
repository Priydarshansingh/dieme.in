import { adminDb } from '@/lib/firebase/admin';
import { col } from '@/lib/firestore/collections';

// Helper to refresh YouTube OAuth token if expired
export async function getValidAccessToken(
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

export interface SyncYouTubeResult {
  success: boolean;
  channelId?: string;
  channelName?: string;
  activeLiveStream?: any;
  syncedCount: number;
  error?: string;
}

/**
 * Synchronizes active live broadcasts and recent video streams for a workspace.
 */
export async function syncWorkspaceYouTubeStreams(workspaceId: string): Promise<SyncYouTubeResult> {
  try {
    // 1. Fetch connected YouTube account for this workspace
    let accountsSnap = await adminDb
      .collection(col.youtube(workspaceId))
      .where('connectionStatus', '==', 'connected')
      .limit(1)
      .get();

    // Fallback: If not found directly, check if another workspace in the organization / linked team has it
    if (accountsSnap.empty) {
      const membersSnap = await adminDb.collectionGroup('members').where('workspaceId', '==', workspaceId).limit(5).get();
      for (const mDoc of membersSnap.docs) {
        const uid = mDoc.data().uid;
        if (!uid) continue;
        const userWsSnap = await adminDb.collection(col.youtube(uid)).where('connectionStatus', '==', 'connected').limit(1).get();
        if (!userWsSnap.empty) {
          accountsSnap = userWsSnap;
          break;
        }
      }
    }

    if (accountsSnap.empty) {
      return { success: false, syncedCount: 0, error: 'No connected YouTube channel found' };
    }

    const accountData = accountsSnap.docs[0].data();
    const channelId = accountData.channelId || accountsSnap.docs[0].id;
    const token = await getValidAccessToken(workspaceId, accountData);

    if (!token) {
      return { success: false, syncedCount: 0, error: 'Could not obtain valid YouTube token' };
    }

    let syncedCount = 0;
    let activeLiveStream: any = null;
    const seenVideoIds = new Set<string>();

    // A. Check for currently active live broadcast via liveBroadcasts API
    try {
      const liveRes = await fetch(
        'https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails&broadcastStatus=active&maxResults=5',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const liveData = await liveRes.json();

      if (liveData.items && Array.isArray(liveData.items)) {
        for (const item of liveData.items) {
          const videoId = item.id;
          if (!videoId) continue;
          seenVideoIds.add(videoId);

          const thumb =
            item.snippet?.thumbnails?.maxres?.url ||
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          const payload = {
            id: videoId,
            workspaceId,
            youtubeVideoId: videoId,
            title: item.snippet?.title || 'YouTube Live Stream',
            thumbnailUrl: thumb,
            status: 'live',
            channelId,
            channelName: item.snippet?.channelTitle || accountData.channelName || '',
            liveChatId: item.snippet?.liveChatId || null,
            startedAt: new Date(item.snippet?.actualStartTime || item.snippet?.publishedAt || Date.now()),
            updatedAt: new Date().toISOString(),
          };

          await adminDb.doc(col.stream(workspaceId, videoId)).set(payload, { merge: true });
          activeLiveStream = payload;
          syncedCount++;
        }
      }
    } catch (liveErr) {
      console.warn('[youtube-sync] liveBroadcasts active check warning:', liveErr);
    }

    // B. Fallback search for live broadcasts if not returned by liveBroadcasts
    if (!activeLiveStream) {
      try {
        const searchLiveRes = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&maxResults=5`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const searchLiveData = await searchLiveRes.json();

        if (searchLiveData.items && Array.isArray(searchLiveData.items)) {
          for (const item of searchLiveData.items) {
            const videoId = item.id?.videoId;
            if (!videoId) continue;
            seenVideoIds.add(videoId);

            const thumb =
              item.snippet?.thumbnails?.maxres?.url ||
              item.snippet?.thumbnails?.high?.url ||
              item.snippet?.thumbnails?.medium?.url ||
              item.snippet?.thumbnails?.default?.url ||
              `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            const payload = {
              id: videoId,
              workspaceId,
              youtubeVideoId: videoId,
              title: item.snippet?.title || 'YouTube Live Stream',
              thumbnailUrl: thumb,
              status: 'live',
              channelId,
              channelName: item.snippet?.channelTitle || accountData.channelName || '',
              startedAt: new Date(item.snippet?.publishedAt || Date.now()),
              updatedAt: new Date().toISOString(),
            };

            await adminDb.doc(col.stream(workspaceId, videoId)).set(payload, { merge: true });
            activeLiveStream = payload;
            syncedCount++;
          }
        }
      } catch (searchLiveErr) {
        console.warn('[youtube-sync] search eventType=live warning:', searchLiveErr);
      }
    }

    // C. Fetch all recent live broadcasts (completed/upcoming)
    try {
      const allBroadcastsRes = await fetch(
        'https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status&broadcastStatus=all&maxResults=10',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const allBroadcastsData = await allBroadcastsRes.json();

      if (allBroadcastsData.items && Array.isArray(allBroadcastsData.items)) {
        for (const item of allBroadcastsData.items) {
          const videoId = item.id;
          if (!videoId || seenVideoIds.has(videoId)) continue;
          seenVideoIds.add(videoId);

          const isCurrentlyLive = item.status?.lifeCycleStatus === 'live';
          const thumb =
            item.snippet?.thumbnails?.maxres?.url ||
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          const payload = {
            id: videoId,
            workspaceId,
            youtubeVideoId: videoId,
            title: item.snippet?.title || 'YouTube Broadcast',
            thumbnailUrl: thumb,
            status: isCurrentlyLive ? 'live' : 'ended',
            channelId,
            channelName: item.snippet?.channelTitle || accountData.channelName || '',
            liveChatId: item.snippet?.liveChatId || null,
            startedAt: new Date(item.snippet?.actualStartTime || item.snippet?.publishedAt || Date.now()),
            updatedAt: new Date().toISOString(),
          };

          await adminDb.doc(col.stream(workspaceId, videoId)).set(payload, { merge: true });
          if (isCurrentlyLive && !activeLiveStream) {
            activeLiveStream = payload;
          }
          syncedCount++;
        }
      }
    } catch (allBroadcastsErr) {
      console.warn('[youtube-sync] all broadcasts fetch warning:', allBroadcastsErr);
    }

    // D. Fetch recent video uploads/streams
    try {
      const recentRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=15`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const recentData = await recentRes.json();

      if (recentData.items && Array.isArray(recentData.items)) {
        for (const item of recentData.items) {
          const videoId = item.id?.videoId;
          if (!videoId || seenVideoIds.has(videoId)) continue;
          seenVideoIds.add(videoId);

          const thumb =
            item.snippet?.thumbnails?.maxres?.url ||
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

          const payload = {
            id: videoId,
            workspaceId,
            youtubeVideoId: videoId,
            title: item.snippet?.title || 'YouTube Video',
            thumbnailUrl: thumb,
            status: 'ended',
            channelId,
            channelName: item.snippet?.channelTitle || accountData.channelName || '',
            startedAt: new Date(item.snippet?.publishedAt || Date.now()),
            updatedAt: new Date().toISOString(),
          };

          await adminDb.doc(col.stream(workspaceId, videoId)).set(payload, { merge: true });
          syncedCount++;
        }
      }
    } catch (recentErr) {
      console.warn('[youtube-sync] recent videos fetch warning:', recentErr);
    }

    // E. If there is NO active live stream, ensure no stale stream is marked 'live'
    if (!activeLiveStream) {
      const staleLiveSnap = await adminDb
        .collection(col.streams(workspaceId))
        .where('status', '==', 'live')
        .get();

      for (const staleDoc of staleLiveSnap.docs) {
        if (!seenVideoIds.has(staleDoc.id)) {
          await staleDoc.ref.update({ status: 'ended', updatedAt: new Date().toISOString() });
        }
      }
    }

    return {
      success: true,
      channelId,
      channelName: accountData.channelName,
      activeLiveStream,
      syncedCount,
    };
  } catch (error: any) {
    console.error('[youtube-sync] Error in syncWorkspaceYouTubeStreams:', error);
    return { success: false, syncedCount: 0, error: error.message };
  }
}
