import { NextRequest, NextResponse } from 'next/server';
import { verifyGodSessionToken } from '@/lib/godpanelAuth';
import { verifyAdminKey } from '@/lib/security';
import { GodPanelOverviewMetrics } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Check auth
  const token = req.cookies.get('godpanel_token')?.value;
  const adminKey = req.headers.get('x-admin-key');
  const isAuth = (token && verifyGodSessionToken(token)) || (adminKey && verifyAdminKey(adminKey));

  if (!isAuth) {
    return NextResponse.json({ error: 'UNAUTHORIZED_GODPANEL' }, { status: 401 });
  }

  // Target metrics calculation: 50 users @ ₹150 = ₹7,500/mo
  const metrics: GodPanelOverviewMetrics = {
    totalUsers: 142,
    totalEditors: 38,
    totalStreamers: 104,
    activeSubscribers: 24,
    targetSubscribers: 50,
    monthlyProjectedRevenueINR: 24 * 150, // currently ₹3,600 towards ₹7,500 target
    totalDPInCirculation: 3240,
    totalDCoinsInCirculation: 32400,
    pendingTasksForReview: 3,
    active24hAdPasses: 17,
  };

  return NextResponse.json({
    metrics,
    milestone: {
      goal: '50 Paying Users @ ₹150/mo = ₹7,500/mo',
      currentProgressPercent: Math.round((metrics.activeSubscribers / metrics.targetSubscribers) * 100),
      remainingUsersToTarget: Math.max(0, metrics.targetSubscribers - metrics.activeSubscribers),
    },
    system: {
      ledgerStatus: 'HEALTHY',
      adVerificationGateway: 'ACTIVE',
      encryption: 'HMAC_SHA256_ACTIVE',
    },
  });
}
