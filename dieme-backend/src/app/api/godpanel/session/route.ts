import { NextRequest, NextResponse } from 'next/server';
import { verifyGodSessionToken } from '@/lib/godpanelAuth';
import { verifyAdminKey } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Support both Cookie session or X-Admin-Key header
  const adminKey = req.headers.get('x-admin-key');
  if (adminKey && verifyAdminKey(adminKey)) {
    return NextResponse.json({
      authenticated: true,
      authMethod: 'ADMIN_KEY',
      admin: {
        username: 'master_superadmin',
        role: 'super_admin',
        name: 'Master Key SuperAdmin',
      },
    });
  }

  const token = req.cookies.get('godpanel_token')?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false, error: 'NO_SESSION' }, { status: 401 });
  }

  const session = verifyGodSessionToken(token);
  if (!session) {
    return NextResponse.json({ authenticated: false, error: 'INVALID_OR_EXPIRED_SESSION' }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    authMethod: 'SESSION_COOKIE',
    admin: session,
  });
}
