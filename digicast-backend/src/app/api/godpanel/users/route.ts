import { NextRequest, NextResponse } from 'next/server';
import { verifyGodSessionToken } from '@/lib/godpanelAuth';
import { verifyAdminKey } from '@/lib/security';
import { getActualPlatformUsers, updatePlatformUser, createPlatformUser } from '@/lib/userStore';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

function isAuthorized(req: NextRequest) {
  const token = req.cookies.get('godpanel_token')?.value;
  const adminKey = req.headers.get('x-admin-key');
  return (token && verifyGodSessionToken(token)) || (adminKey && verifyAdminKey(adminKey));
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'UNAUTHORIZED_GODPANEL' }, { status: 401 });
  }

  const users = await getActualPlatformUsers();
  return NextResponse.json({
    users,
    totalCount: users.length,
    activeOnlineCount: users.filter((u) => u.isOnline).length,
    streamersCount: users.filter((u) => u.role === 'streamer').length,
    editorsCount: users.filter((u) => u.role === 'editor').length,
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'UNAUTHORIZED_GODPANEL' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, uid, updates, newUser } = body;

    if (action === 'CREATE' && newUser) {
      const created = createPlatformUser(newUser);
      if (adminDb && newUser.uid) {
        try {
          await adminDb.collection('users').doc(newUser.uid).set(newUser, { merge: true });
        } catch (e: any) {
          console.warn('[godpanel/users CREATE] Firestore warning:', e.message);
        }
      }
      return NextResponse.json({ success: true, user: created });
    }

    if (action === 'UPDATE' && uid && updates) {
      const updated = updatePlatformUser(uid, updates);

      // Persist to Firestore
      if (adminDb) {
        try {
          const nowIso = new Date().toISOString();
          const cleanUpdates: any = { ...updates, updatedAt: nowIso };

          await adminDb.collection('users').doc(uid).set(cleanUpdates, { merge: true });

          // If plan or status was updated, also update or create the user's workspace
          if (updates.plan || updates.status) {
            const wsUpdates: any = {
              updatedAt: nowIso,
            };
            if (updates.plan) {
              wsUpdates.plan = updates.plan;
              wsUpdates.subscription = updates.plan;
              if (updates.plan !== 'free' && updates.plan !== 'free_trial') {
                wsUpdates.subscriptionStatus = 'active';
              }
            }
            if (updates.status === 'suspended') {
              wsUpdates.status = 'suspended';
              wsUpdates.subscriptionStatus = 'suspended';
            } else if (updates.status === 'active') {
              wsUpdates.status = 'active';
            }

            // Check if workspace exists under workspace doc with ownerId or doc id == uid
            const wsRef = adminDb.collection('workspaces').doc(uid);
            await wsRef.set(wsUpdates, { merge: true });
          }
        } catch (e: any) {
          console.warn('[godpanel/users UPDATE] Firestore write warning:', e.message);
        }
      }

      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ error: 'INVALID_ACTION_OR_PAYLOAD' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

