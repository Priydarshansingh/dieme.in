import { NextRequest, NextResponse } from 'next/server';
import { createSignedAdSession } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID_REQUIRED' }, { status: 400 });
    }

    const session = createSignedAdSession(uid);

    return NextResponse.json({
      success: true,
      adSession: session,
      instructions: 'Display advertisement. Upon completion callback, submit session data to /api/ads/verify-view to unlock 24-hour access pass.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'AD_SESSION_ERROR', details: error.message }, { status: 500 });
  }
}
