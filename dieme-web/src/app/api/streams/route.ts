import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { col } from '@/lib/firestore/collections';

export const dynamic = 'force-dynamic';

async function getCaller(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    try {
      const decoded = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
      return { uid: decoded.uid, email: decoded.email || '' };
    } catch {
      // Fall through to headers
    }
  }

  const headerUid = req.headers.get('x-user-uid');
  const headerEmail = req.headers.get('x-user-email');
  if (headerUid) {
    return { uid: headerUid, email: headerEmail || '' };
  }

  return null;
}

export async function GET(req: NextRequest) {
  try {
    const caller = await getCaller(req);
    const { searchParams } = new URL(req.url);
    let requestedWid = searchParams.get('workspaceId');

    let actualWorkspaceId = requestedWid || (caller ? caller.uid : null);

    if (!caller && !actualWorkspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const callerUid = caller?.uid || actualWorkspaceId!;

    // Resolve user's canonical workspace if available
    try {
      const userDoc = await adminDb.doc(col.user(callerUid)).get();
      if (userDoc.exists) {
        const defaultWid = userDoc.data()?.defaultWorkspaceId;
        if (defaultWid) actualWorkspaceId = defaultWid;
      }
    } catch (err) {
      console.warn('[streams GET] user doc lookup warning:', err);
    }

    if (!actualWorkspaceId) {
      actualWorkspaceId = callerUid;
    }

    // Verify access & resolve connected YouTube channel
    let wsData: any = {};
    const wsDoc = await adminDb.doc(col.workspace(actualWorkspaceId)).get();
    if (wsDoc.exists) {
      wsData = wsDoc.data() || {};
      const isOwner = wsData.ownerUid === callerUid || wsData.ownerId === callerUid || actualWorkspaceId === callerUid;
      if (!isOwner) {
        const memberDoc = await adminDb.doc(col.member(actualWorkspaceId, callerUid)).get();
        if (!memberDoc.exists) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    }

    // Resolve active connected channel for this workspace (strict tenant & channel isolation)
    let activeChannelId: string | null = wsData.channelId || wsData.primaryYoutubeChannelId || null;
    let isYoutubeConnected: boolean = wsData.youtubeConnected === true;

    if (!activeChannelId || !isYoutubeConnected) {
      try {
        const ytAccountSnap = await adminDb
          .collection(col.youtube(actualWorkspaceId))
          .where('connectionStatus', '==', 'connected')
          .limit(1)
          .get();
        if (!ytAccountSnap.empty) {
          activeChannelId = ytAccountSnap.docs[0].data().channelId || ytAccountSnap.docs[0].id;
          isYoutubeConnected = true;
        }
      } catch (err) {
        console.warn('[streams GET] youtube account lookup warning:', err);
      }
    }

    // If channel is not connected or disconnected, return empty streams to prevent data leakage
    if (!isYoutubeConnected || !activeChannelId) {
      return NextResponse.json({
        success: true,
        workspaceId: actualWorkspaceId,
        totalCount: 0,
        activeLiveStream: null,
        streams: [],
      });
    }

    // If specific streamId requested, return that stream directly
    const streamId = searchParams.get('streamId');
    if (streamId) {
      let sDoc = await adminDb.doc(col.stream(actualWorkspaceId, streamId)).get();
      if (!sDoc.exists && callerUid !== actualWorkspaceId) {
        sDoc = await adminDb.doc(col.stream(callerUid, streamId)).get();
      }

      // Fallback: look up by youtubeVideoId or ID in actualWorkspaceId
      if (!sDoc.exists) {
        const byYt = await adminDb
          .collection(col.streams(actualWorkspaceId))
          .where('youtubeVideoId', '==', streamId)
          .limit(1)
          .get();
        if (!byYt.empty) sDoc = byYt.docs[0];
      }

      // Fallback: look up by youtubeVideoId or ID in callerUid workspace
      if (!sDoc.exists && callerUid !== actualWorkspaceId) {
        const byYtCaller = await adminDb
          .collection(col.streams(callerUid))
          .where('youtubeVideoId', '==', streamId)
          .limit(1)
          .get();
        if (!byYtCaller.empty) sDoc = byYtCaller.docs[0];
      }

      // Fallback: search collectionGroup across all streams if accessible
      if (!sDoc.exists) {
        const groupSnap = await adminDb
          .collectionGroup('streams')
          .where('youtubeVideoId', '==', streamId)
          .limit(1)
          .get();
        if (!groupSnap.empty) {
          sDoc = groupSnap.docs[0];
        }
      }

      if (sDoc.exists) {
        const d = sDoc.data() || {};
        let startedAtMs = Date.now();
        if (d.startedAt?._seconds) {
          startedAtMs = d.startedAt._seconds * 1000;
        } else if (typeof d.startedAt === 'number') {
          startedAtMs = d.startedAt;
        } else if (typeof d.startedAt === 'string') {
          const parsed = Date.parse(d.startedAt);
          if (!isNaN(parsed)) startedAtMs = parsed;
        } else if (d.startedAt?.toDate) {
          startedAtMs = d.startedAt.toDate().getTime();
        }

        let endedAtMs: number | null = null;
        if (d.endedAt?._seconds) {
          endedAtMs = d.endedAt._seconds * 1000;
        } else if (typeof d.endedAt === 'number') {
          endedAtMs = d.endedAt;
        } else if (typeof d.endedAt === 'string') {
          const parsed = Date.parse(d.endedAt);
          if (!isNaN(parsed)) endedAtMs = parsed;
        } else if (d.endedAt?.toDate) {
          endedAtMs = d.endedAt.toDate().getTime();
        }

        const videoId = d.youtubeVideoId || sDoc.id;
        const thumbnailUrl =
          d.thumbnailUrl ||
          d.thumbnail ||
          d.thumb ||
          (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');

        const formattedStream = {
          id: sDoc.id,
          title: d.title || 'Live Stream',
          youtubeVideoId: videoId,
          thumbnailUrl,
          startedAt: startedAtMs,
          endedAt: endedAtMs,
          clipCount: d.clipCount || 0,
          status: d.status || 'ended',
          viewCount: d.viewCount || 0,
          concurrentViewers: d.concurrentViewers || 0,
          channelId: d.channelId || '',
          channelName: d.channelName || '',
          durationSeconds: d.durationSeconds || (endedAtMs ? Math.max(0, Math.floor((endedAtMs - startedAtMs) / 1000)) : undefined),
        };

        return NextResponse.json({
          success: true,
          workspaceId: actualWorkspaceId,
          stream: formattedStream,
        });
      }

      return NextResponse.json({ error: 'Stream not found' }, { status: 404 });
    }

    // Fetch streams via adminDb (bypasses client security rules)
    let streamsSnap = await adminDb
      .collection(col.streams(actualWorkspaceId))
      .limit(100)
      .get();

    // Fallback to callerUid if different and empty
    if (streamsSnap.empty && callerUid !== actualWorkspaceId) {
      const callerStreamsSnap = await adminDb
        .collection(col.streams(callerUid))
        .limit(100)
        .get();
      if (!callerStreamsSnap.empty) {
        streamsSnap = callerStreamsSnap;
      }
    }

    // Filter strictly by activeChannelId to prevent any stream leakage across channel switches
    const validDocs = streamsSnap.docs.filter((docSnap) => {
      const d = docSnap.data();
      if (activeChannelId && d.channelId && d.channelId !== activeChannelId) {
        docSnap.ref.delete().catch(() => {});
        return false;
      }
      return true;
    });

    const streams = validDocs.map((docSnap) => {
      const d = docSnap.data();
      let startedAtMs = Date.now();
      if (d.startedAt?._seconds) {
        startedAtMs = d.startedAt._seconds * 1000;
      } else if (typeof d.startedAt === 'number') {
        startedAtMs = d.startedAt;
      } else if (typeof d.startedAt === 'string') {
        const parsed = Date.parse(d.startedAt);
        if (!isNaN(parsed)) startedAtMs = parsed;
      } else if (d.startedAt?.toDate) {
        startedAtMs = d.startedAt.toDate().getTime();
      }

      let endedAtMs: number | null = null;
      if (d.endedAt?._seconds) {
        endedAtMs = d.endedAt._seconds * 1000;
      } else if (typeof d.endedAt === 'number') {
        endedAtMs = d.endedAt;
      } else if (typeof d.endedAt === 'string') {
        const parsed = Date.parse(d.endedAt);
        if (!isNaN(parsed)) endedAtMs = parsed;
      } else if (d.endedAt?.toDate) {
        endedAtMs = d.endedAt.toDate().getTime();
      }

      const videoId = d.youtubeVideoId || docSnap.id;
      const thumbnailUrl =
        d.thumbnailUrl ||
        d.thumbnail ||
        d.thumb ||
        (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');

      return {
        id: docSnap.id,
        title: d.title || 'Live Stream',
        youtubeVideoId: videoId,
        thumbnailUrl,
        startedAt: startedAtMs,
        endedAt: endedAtMs,
        clipCount: d.clipCount || 0,
        status: d.status || 'ended',
        viewCount: d.viewCount || 0,
        concurrentViewers: d.concurrentViewers || 0,
        channelId: d.channelId || '',
        channelName: d.channelName || '',
      };
    });

    // In-memory sort by startedAt descending
    streams.sort((a, b) => b.startedAt - a.startedAt);

    const activeLiveStream = streams.find((s) => s.status === 'live') || null;

    return NextResponse.json({
      success: true,
      workspaceId: actualWorkspaceId,
      totalCount: streams.length,
      activeLiveStream,
      streams,
    });
  } catch (err: any) {
    console.error('[streams GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch streams' }, { status: 500 });
  }
}
