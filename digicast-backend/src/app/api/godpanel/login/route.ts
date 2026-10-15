import { NextRequest, NextResponse } from 'next/server';
import {
  getRootAdminRecord,
  verifyAdminPassword,
  createGodSessionToken,
} from '@/lib/godpanelAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const rootAdmin = getRootAdminRecord();

    if (cleanUsername !== rootAdmin.username) {
      return NextResponse.json({ error: 'Invalid God Panel credentials' }, { status: 401 });
    }

    if (!rootAdmin.isActive) {
      return NextResponse.json({ error: 'This admin account has been deactivated' }, { status: 403 });
    }

    const isMatch = verifyAdminPassword(password, rootAdmin.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid God Panel credentials' }, { status: 401 });
    }

    rootAdmin.lastLoginAt = new Date().toISOString();

    const token = createGodSessionToken({
      username: rootAdmin.username,
      role: rootAdmin.role,
      name: rootAdmin.name,
    });

    const response = NextResponse.json({
      success: true,
      message: 'God Panel authentication successful',
      admin: {
        username: rootAdmin.username,
        role: rootAdmin.role,
        name: rootAdmin.name,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: 'godpanel_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
