import { NextRequest, NextResponse } from 'next/server';
import { verifyGodSessionToken } from '@/lib/godpanelAuth';
import { verifyAdminKey } from '@/lib/security';
import { getActualPlatformUsers, updatePlatformUser, createPlatformUser } from '@/lib/userStore';

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
      return NextResponse.json({ success: true, user: created });
    }

    if (action === 'UPDATE' && uid && updates) {
      const updated = updatePlatformUser(uid, updates);
      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ error: 'INVALID_ACTION_OR_PAYLOAD' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
