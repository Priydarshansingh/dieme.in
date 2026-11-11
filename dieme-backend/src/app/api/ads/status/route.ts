import { NextRequest, NextResponse } from 'next/server';
import { userAdPassStore } from '@/lib/adStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'UID_REQUIRED' }, { status: 400 });
    }

    const pass = userAdPassStore.get(uid);
    const now = Date.now();
    const isActive = pass ? pass.passExpiresAt > now : false;
    const remainingMs = pass && pass.passExpiresAt > now ? pass.passExpiresAt - now : 0;
    const remainingHours = Math.round((remainingMs / (60 * 60 * 1000)) * 10) / 10;

    return NextResponse.json({
      uid,
      hasActivePass: isActive,
      passExpiresAt: pass?.passExpiresAt || 0,
      remainingHours,
      totalAdsWatched: pass?.totalAdsWatched || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'AD_STATUS_ERROR', details: error.message }, { status: 500 });
  }
}
