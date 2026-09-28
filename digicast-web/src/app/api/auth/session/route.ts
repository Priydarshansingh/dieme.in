// POST /api/auth/session
// Exchange a Firebase ID token (from client) for a server-side session cookie.
// All subsequent API requests verify this session server-side.
//
// SECURITY: Never expose firebase-admin credentials to the client.
// firebase-admin is imported here (server-only file).

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (!idToken || typeof idToken !== 'string') {
      return NextResponse.json({ error: 'idToken required' }, { status: 400 });
    }

    // Verify the ID token with Firebase Admin
    const decoded = await adminAuth.verifyIdToken(idToken);

    // TODO: Create a short-lived session cookie via adminAuth.createSessionCookie()
    // For now, return the verified UID so the client can proceed.
    return NextResponse.json({ uid: decoded.uid, email: decoded.email });
  } catch (err) {
    console.error('[auth/session] Error:', err instanceof Error ? err.message : 'unknown');
    // IMPORTANT: Do NOT log idToken values — security policy
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
