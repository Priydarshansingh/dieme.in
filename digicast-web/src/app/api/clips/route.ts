// GET /api/clips?workspaceId=...&streamId=...
// Returns clip markers for a workspace, optionally filtered by stream.
//
// SECURITY: Verify user is a member of the requested workspace before returning data.
// Clips are metadata only — NEVER full video content.

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { col } from '@/lib/firestore/collections';

async function getUidFromRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const idToken = authHeader.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const uid = await getUidFromRequest(req);
  if (!uid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
  }

  // Verify user is a member of this workspace
  const memberDoc = await adminDb.doc(col.member(workspaceId, uid)).get();
  if (!memberDoc.exists) {
    // Return 403, not 404, to avoid revealing workspace existence to non-members
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    let query = adminDb.collection(col.clips(workspaceId)).orderBy('markerTimestamp', 'asc');
    const streamId = searchParams.get('streamId');
    if (streamId) {
      query = query.where('streamId', '==', streamId) as typeof query;
    }

    const snap = await query.get();
    const clips = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ clips });
  } catch (err) {
    console.error('[clips] Error:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
