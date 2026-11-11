import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyGodSessionToken } from '@/lib/godpanelAuth';
import { getAdEarningsAnalytics } from '@/lib/adTracking';

export const dynamic = 'force-dynamic';

/**
 * GET /api/godpanel/ads
 * Provides comprehensive daily ad monetization metrics, provider breakdowns,
 * and live impression telemetry for the GodPanel dashboard.
 */
export async function GET(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get('godpanel_token')?.value;
    const authHeader = req.headers.get('authorization') || '';
    const headerToken = authHeader.replace('Bearer ', '').trim();
    const token = cookieToken || headerToken;

    const admin = verifyGodSessionToken(token);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized God Panel access' }, { status: 401 });
    }

    const analytics = await getAdEarningsAnalytics(adminDb, 30);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (err: any) {
    console.error('[godpanel/ads GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch ad earnings' }, { status: 500 });
  }
}
