// GET /api/workspaces
// Returns workspaces the authenticated user is a member of.
//
// SECURITY CHAIN (must be enforced on every API route):
//   authenticatedUser → workspaceMembership → role → resource ownership
// An editor from Workspace A must NEVER be able to access Workspace B.

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

async function getUidFromRequest(req: NextRequest): Promise<string | null> {
  // TODO: Replace with proper session cookie verification
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

  try {
    // Query all workspaces where this user is a member
    const membershipsSnap = await adminDb
      .collectionGroup('members')
      .where('uid', '==', uid)
      .get();

    const workspaceIds = membershipsSnap.docs.map((d) => d.ref.parent.parent!.id);

    // Fetch workspace docs
    const workspaces = await Promise.all(
      workspaceIds.map(async (wid) => {
        const doc = await adminDb.collection('workspaces').doc(wid).get();
        return doc.exists ? { id: wid, ...doc.data() } : null;
      })
    );

    return NextResponse.json({ workspaces: workspaces.filter(Boolean) });
  } catch (err) {
    console.error('[workspaces] Error:', err instanceof Error ? err.message : 'unknown');
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
