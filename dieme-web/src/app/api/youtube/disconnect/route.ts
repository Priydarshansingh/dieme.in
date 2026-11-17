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

export async function POST(req: NextRequest) {
  return handleDisconnect(req);
}

export async function DELETE(req: NextRequest) {
  return handleDisconnect(req);
}

async function handleDisconnect(req: NextRequest) {
  try {
    const caller = await getCaller(req);
    const { searchParams } = new URL(req.url);
    let workspaceId = searchParams.get('workspaceId');

    let bodyData: any = {};
    try {
      bodyData = await req.json();
    } catch {
      // No JSON body
    }

    workspaceId = workspaceId || bodyData?.workspaceId || (caller ? caller.uid : null);

    if (!caller && !workspaceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const callerUid = caller?.uid || workspaceId!;

    // Resolve user's canonical workspace
    try {
      const userDoc = await adminDb.doc(col.user(callerUid)).get();
      if (userDoc.exists) {
        const defaultWid = userDoc.data()?.defaultWorkspaceId;
        if (defaultWid) workspaceId = defaultWid;
      }
    } catch (err) {
      console.warn('[youtube/disconnect] user doc lookup warning:', err);
    }

    if (!workspaceId) {
      workspaceId = callerUid;
    }

    // Verify ownership or membership
    const wsRef = adminDb.doc(col.workspace(workspaceId));
    const wsDoc = await wsRef.get();
    if (wsDoc.exists) {
      const wsData = wsDoc.data() || {};
      const isOwner = wsData.ownerUid === callerUid || wsData.ownerId === callerUid || workspaceId === callerUid;
      if (!isOwner) {
        const memberDoc = await adminDb.doc(col.member(workspaceId, callerUid)).get();
        if (!memberDoc.exists) {
          return NextResponse.json({ error: 'Forbidden: You do not have permission to disconnect this channel' }, { status: 403 });
        }
      }
    }

    // 1. Fetch connected YouTube account docs to revoke tokens and delete
    const ytSnap = await adminDb.collection(col.youtube(workspaceId)).get();
    for (const docSnap of ytSnap.docs) {
      const data = docSnap.data();
      const tokenToRevoke = data.refresh_token || data.access_token;
      if (tokenToRevoke) {
        try {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokenToRevoke)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            signal: AbortSignal.timeout(3000),
          });
        } catch (revokeErr) {
          console.warn('[youtube/disconnect] OAuth revoke note:', revokeErr);
        }
      }
      // Delete document
      await docSnap.ref.delete();
    }

    // Also check caller UID collection if workspaceId was different
    if (callerUid !== workspaceId) {
      const callerYtSnap = await adminDb.collection(col.youtube(callerUid)).get();
      for (const d of callerYtSnap.docs) {
        await d.ref.delete().catch(() => {});
      }
    }

    // 2. Mark workspace as disconnected
    await wsRef.set({
      youtubeConnected: false,
      channelId: null,
      channelName: null,
      channelThumbnail: null,
      primaryYoutubeChannelId: null,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // 3. Purge all streams in this workspace so no stream data or history from the disconnected channel leaks
    const allStreamsSnap = await adminDb
      .collection(col.streams(workspaceId))
      .get();

    const purgeBatch = adminDb.batch();
    for (const sDoc of allStreamsSnap.docs) {
      purgeBatch.delete(sDoc.ref);
    }
    if (!allStreamsSnap.empty) {
      await purgeBatch.commit().catch(() => {});
    }

    // Also purge streams under callerUid workspace if different
    if (callerUid !== workspaceId) {
      const callerStreamsSnap = await adminDb.collection(col.streams(callerUid)).get();
      const callerBatch = adminDb.batch();
      for (const cs of callerStreamsSnap.docs) {
        callerBatch.delete(cs.ref);
      }
      if (!callerStreamsSnap.empty) {
        await callerBatch.commit().catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      message: 'YouTube channel disconnected successfully.',
      workspaceId,
    });
  } catch (err: any) {
    console.error('[youtube/disconnect] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to disconnect YouTube channel' }, { status: 500 });
  }
}
