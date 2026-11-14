// GET /api/clips?workspaceId=...&streamId=...
// Returns clip markers for a workspace, optionally filtered by stream.
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

  // Verify user is owner or member of this workspace
  let hasAccess = workspaceId === uid;
  if (!hasAccess) {
    try {
      const wsDoc = await adminDb.doc(col.workspace(workspaceId)).get();
      if (wsDoc.exists) {
        const wsData = wsDoc.data() || {};
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
  }

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const streamId = searchParams.get('streamId');
    let snap;
    try {
      let q = adminDb.collection(col.clips(workspaceId));
      if (streamId) {
        snap = await q.where('streamId', '==', streamId).get();
        if (snap.empty) {
          snap = await q.where('youtubeVideoId', '==', streamId).get();
        }
      } else {
        snap = await q.get();
      }
    } catch (qErr) {
      snap = await adminDb.collection(col.clips(workspaceId)).get();
    }

    const clips = snap.docs.map((d) => {
      const data = d.data();
      return { id: d.id, ...data };
    });

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
    const isOwner = (await adminDb.doc(col.workspace(workspaceId)).get()).data()?.ownerUid === uid;
    if (!memberDoc.exists && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
      createdAt: new Date().toISOString(),
    };

    await clipRef.set(clipData, { merge: true });

    return NextResponse.json({ ok: true, clip: clipData });
  } catch (err) {
    console.error('[clips POST] Error:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
