// GET /api/clips?workspaceId=...&streamId=...&channelId=...
// Returns clip markers for a workspace or YouTube channel, optionally filtered by stream.
//
// Cross-Platform & Channel-Scoped Persistence:
// Clips are anchored to both workspace and YouTube channelId so that when creators
// switch devices, re-login, or reconnect their YouTube channel, all recorded clips
// persist and remain accessible.
//
// SECURITY: Verify user is a member of the requested workspace before returning data.
// Clips are metadata only — NEVER full video content.

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { col } from '@/lib/firestore/collections';
import { ClipDownloadStatus, ClipTelegramStatus } from '@/types';

async function getUidFromRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const idToken = authHeader.slice(7);
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      return decoded.uid;
    } catch {
      // fall through
    }
  }
  const headerUid = req.headers.get('x-user-uid');
  if (headerUid) return headerUid;
  return null;
}

export async function GET(req: NextRequest) {
  const uid = await getUidFromRequest(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let workspaceId = searchParams.get('workspaceId');
  if (!workspaceId) {
    workspaceId = uid;
  }

  // Resolve user's canonical workspace if needed
  let userDefaultWid: string | null = null;
  try {
    const userDoc = await adminDb.doc(col.user(uid)).get();
    if (userDoc.exists) {
      userDefaultWid = userDoc.data()?.defaultWorkspaceId || null;
      if (workspaceId === uid && userDefaultWid) {
        workspaceId = userDefaultWid;
      }
    }
  } catch (uErr) {
    console.warn('[clips GET] user doc lookup warning:', uErr);
  }

  // Verify user is owner or member of this workspace
  let hasAccess = workspaceId === uid || workspaceId === userDefaultWid;
  let wsData: any = {};
  try {
    const wsDoc = await adminDb.doc(col.workspace(workspaceId)).get();
    if (wsDoc.exists) {
      wsData = wsDoc.data() || {};
      if (wsData.ownerUid === uid || wsData.ownerId === uid) {
        hasAccess = true;
      }
    }
    if (!hasAccess) {
      const memberDoc = await adminDb.doc(col.member(workspaceId, uid)).get();
      if (memberDoc.exists) {
        hasAccess = true;
      }
    }
  } catch {
    // fallback
  }

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const streamId = searchParams.get('streamId');
    const requestedChannelId = searchParams.get('channelId');

    // Resolve active YouTube Channel ID for this workspace or user
    let activeChannelId: string | null =
      requestedChannelId ||
      wsData.channelId ||
      wsData.primaryYoutubeChannelId ||
      null;

    if (!activeChannelId && userDefaultWid && userDefaultWid !== workspaceId) {
      try {
        const uWsDoc = await adminDb.doc(col.workspace(userDefaultWid)).get();
        if (uWsDoc.exists) {
          const uData = uWsDoc.data() || {};
          activeChannelId = uData.channelId || uData.primaryYoutubeChannelId || null;
        }
      } catch {}
    }

    // Deduplicated clip map (id -> clip object)
    const clipMap = new Map<string, any>();

    // 1. Fetch clips from primary workspace
    try {
      const primarySnap = await adminDb.collection(col.clips(workspaceId)).get();
      for (const d of primarySnap.docs) {
        clipMap.set(d.id, { id: d.id, ...d.data(), _source: 'primary_ws' });
      }
    } catch (wsErr) {
      console.warn('[clips GET] primary workspace clip fetch note:', wsErr);
    }

    // 2. Fetch clips from callerUid workspace if different
    if (uid !== workspaceId) {
      try {
        const uidSnap = await adminDb.collection(col.clips(uid)).get();
        for (const d of uidSnap.docs) {
          if (!clipMap.has(d.id)) {
            clipMap.set(d.id, { id: d.id, ...d.data(), _source: 'uid_ws' });
          }
        }
      } catch {}
    }

    // 3. Fetch clips from userDefaultWid workspace if different
    if (userDefaultWid && userDefaultWid !== workspaceId && userDefaultWid !== uid) {
      try {
        const defWsSnap = await adminDb.collection(col.clips(userDefaultWid)).get();
        for (const d of defWsSnap.docs) {
          if (!clipMap.has(d.id)) {
            clipMap.set(d.id, { id: d.id, ...d.data(), _source: 'default_ws' });
          }
        }
      } catch {}
    }

    // 4. Query collectionGroup('clips') to recover any channel-scoped or user-owned clips
    try {
      const allClipsSnap = await adminDb.collectionGroup('clips').get();
      for (const d of allClipsSnap.docs) {
        if (clipMap.has(d.id)) continue;
        const data = d.data();
        const matchesChannel = activeChannelId && data.channelId && data.channelId === activeChannelId;
        const matchesWs = data.workspaceId === workspaceId || data.workspaceId === uid || (userDefaultWid && data.workspaceId === userDefaultWid);
        const matchesStream = streamId && (data.streamId === streamId || data.youtubeVideoId === streamId);

        if (matchesChannel || matchesWs || matchesStream) {
          clipMap.set(d.id, { id: d.id, ...data, _source: 'channel_group' });
        }
      }
    } catch (cgErr) {
      console.warn('[clips GET] collectionGroup clips warning:', cgErr);
    }

    // Convert map to array and apply streamId filtering if specified
    let clips = Array.from(clipMap.values());
    if (streamId) {
      clips = clips.filter((c: any) => c.streamId === streamId || c.youtubeVideoId === streamId);
    }

    // Backfill missing channelId on clips if activeChannelId is known
    if (activeChannelId) {
      for (const c of clips) {
        if (!c.channelId && c.workspaceId === workspaceId) {
          c.channelId = activeChannelId;
          adminDb.doc(col.clip(workspaceId, c.id)).set({ channelId: activeChannelId }, { merge: true }).catch(() => {});
        }
      }
    }

    // In-memory sort by createdAt descending, fallback to markerTimestamp
    clips.sort((a: any, b: any) => {
      const timeA = new Date(a.createdAt || 0).getTime() || (a.markerTimestamp || 0);
      const timeB = new Date(b.createdAt || 0).getTime() || (b.markerTimestamp || 0);
      return timeB - timeA;
    });

    return NextResponse.json({ success: true, clips });
  } catch (err) {
    console.error('[clips GET] Error:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const uid = await getUidFromRequest(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      workspaceId,
      clipId,
      streamId,
      youtubeVideoId,
      channelId: inputChannelId,
      channelName: inputChannelName,
      markerTimestamp,
      markerTimestampDisplay,
      authorName,
      title,
      downloadStatus,
      status
    } = body;

    if (!workspaceId || !clipId) {
      return NextResponse.json({ error: 'workspaceId and clipId are required' }, { status: 400 });
    }

    const memberDoc = await adminDb.doc(col.member(workspaceId, uid)).get();
    const isOwner = (await adminDb.doc(col.workspace(workspaceId)).get()).data()?.ownerUid === uid || workspaceId === uid;
    if (!memberDoc.exists && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Resolve channelId and channelName
    let resolvedChannelId = inputChannelId || '';
    let resolvedChannelName = inputChannelName || '';

    if (!resolvedChannelId) {
      // Check stream document in this workspace
      const targetStreamId = streamId || youtubeVideoId;
      if (targetStreamId) {
        try {
          const sDoc = await adminDb.doc(col.stream(workspaceId, targetStreamId)).get();
          if (sDoc.exists) {
            const sData = sDoc.data() || {};
            resolvedChannelId = sData.channelId || '';
            resolvedChannelName = sData.channelName || '';
          }
        } catch {}
      }
    }

    if (!resolvedChannelId) {
      // Check workspace document
      try {
        const wsDoc = await adminDb.doc(col.workspace(workspaceId)).get();
        if (wsDoc.exists) {
          const wsData = wsDoc.data() || {};
          resolvedChannelId = wsData.channelId || wsData.primaryYoutubeChannelId || '';
          resolvedChannelName = wsData.channelName || '';
        }
      } catch {}
    }

    const clipRef = adminDb.doc(col.clip(workspaceId, clipId));

    // SM-2: Canonical cross-platform clip status resolution
    const statusUpper = (status || '').toUpperCase();
    let finalDownloadStatus: ClipDownloadStatus = downloadStatus || 'not_started';
    let finalTelegramStatus: ClipTelegramStatus = (body.telegramStatus as ClipTelegramStatus) || 'not_uploaded';
    let canonicalAndroidStatus = statusUpper || 'PENDING';

    if (statusUpper === 'UPLOADED') {
      finalDownloadStatus = 'completed';
      finalTelegramStatus = 'uploaded';
      canonicalAndroidStatus = 'UPLOADED';
    } else if (statusUpper === 'GENERATING' || statusUpper === 'PROCESSING' || statusUpper === 'DOWNLOADING') {
      finalDownloadStatus = 'processing';
      canonicalAndroidStatus = 'GENERATING';
    } else if (statusUpper === 'GENERATED' || statusUpper === 'COMPLETED' || statusUpper === 'READY') {
      finalDownloadStatus = 'completed';
      canonicalAndroidStatus = 'GENERATED';
    } else if (statusUpper === 'FAILED') {
      finalDownloadStatus = 'failed';
      canonicalAndroidStatus = 'FAILED';
    }

    const clipData = {
      id: clipId,
      workspaceId,
      channelId: resolvedChannelId,
      channelName: resolvedChannelName,
      streamId: streamId || '',
      youtubeVideoId: youtubeVideoId || streamId || '',
      markerTimestamp: typeof markerTimestamp === 'number' ? markerTimestamp : 0,
      markerTimestampDisplay: markerTimestampDisplay || '00:00',
      authorName: authorName || 'Viewer',
      title: title || 'Clip Marker',
      note: title || 'Clip Marker',
      status: canonicalAndroidStatus,
      downloadStatus: finalDownloadStatus,
      telegramStatus: finalTelegramStatus,
      updatedAt: new Date().toISOString(),
      createdAt: body.createdAt || new Date().toISOString(),
    };

    await clipRef.set(clipData, { merge: true });

    // Synchronize clipCount on stream document in workspace
    const targetVideoId = youtubeVideoId || streamId;
    if (targetVideoId) {
      try {
        const allClipsInWs = await adminDb.collection(col.clips(workspaceId)).get();
        const matchCount = allClipsInWs.docs.filter((d) => {
          const cd = d.data();
          return cd.streamId === targetVideoId || cd.youtubeVideoId === targetVideoId;
        }).length;

        const sRef = adminDb.doc(col.stream(workspaceId, targetVideoId));
        await sRef.set({ clipCount: matchCount, updatedAt: new Date().toISOString() }, { merge: true });

        // If streamId was different from youtubeVideoId, also update that document if it exists
        if (streamId && streamId !== targetVideoId) {
          const sRef2 = adminDb.doc(col.stream(workspaceId, streamId));
          await sRef2.set({ clipCount: matchCount, updatedAt: new Date().toISOString() }, { merge: true });
        }
      } catch (countErr) {
        console.warn('[clips POST] stream clipCount sync note:', countErr);
      }
    }

    return NextResponse.json({ ok: true, clip: clipData });
  } catch (err) {
    console.error('[clips POST] Error:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
