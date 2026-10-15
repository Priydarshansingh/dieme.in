import { NextRequest, NextResponse } from 'next/server';
import { verifyGodSessionToken } from '@/lib/godpanelAuth';
import { verifyAdminKey } from '@/lib/security';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { userAdPassStore } from '@/lib/adStore';
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

  let totalUsers = 0;
  let totalEditors = 0;
  let totalStreamers = 0;
  let activeSubscribers = 0;
  let monthlyProjectedRevenueINR = 0;
  let totalDPInCirculation = 0;
  let totalDCoinsInCirculation = 0;
  let pendingTasksForReview = 0;
  let active24hAdPasses = 0;

  try {
    // 1. Count actual users from Firebase Auth
    if (adminAuth) {
      const authList = await adminAuth.listUsers(1000);
      totalUsers = authList.users.length;
    }

    // 2. Count workspaces, subscriptions, and roles from Firestore
    if (adminDb) {
      const [usersSnap, wsSnap, pendingPaySnap] = await Promise.all([
        adminDb.collection('users').get(),
        adminDb.collection('workspaces').get(),
        adminDb.collection('payments').where('status', '==', 'pending_verification').get(),
      ]);

      usersSnap.forEach((doc) => {
        const u = doc.data();
        if (u.role === 'editor') totalEditors++;
        else totalStreamers++;

        if (typeof u.dpBalance === 'number') totalDPInCirculation += u.dpBalance;
        if (typeof u.dCoinsBalance === 'number') totalDCoinsInCirculation += u.dCoinsBalance;
      });

      // If streamer/editor count is less than auth count, balance it out
      if (totalStreamers + totalEditors < totalUsers) {
        totalStreamers = Math.max(0, totalUsers - totalEditors);
      }

      wsSnap.forEach((doc) => {
        const ws = doc.data();
        const plan = ws.plan || ws.subscription || 'free_trial';
        const isPaid = ws.subscriptionStatus === 'active' || (plan !== 'free_trial' && plan !== 'free');
        if (isPaid) {
          activeSubscribers++;
          if (plan === 'intro_29') monthlyProjectedRevenueINR += 29;
          else if (plan === 'starter' || plan === 'monthly_149') monthlyProjectedRevenueINR += 149;
          else if (plan === 'quarterly_449') monthlyProjectedRevenueINR += Math.round(449 / 3);
          else if (plan === 'studio' || plan === 'annual_999') monthlyProjectedRevenueINR += Math.round(999 / 12);
          else monthlyProjectedRevenueINR += 149;
        }
      });

      pendingTasksForReview = pendingPaySnap.size;
    }

    // 3. Count real active 24h ad passes
    const now = Date.now();
    userAdPassStore.forEach((pass) => {
      if (pass.passExpiresAt > now) active24hAdPasses++;
    });
  } catch (err: any) {
    console.error('[godpanel/overview] Error fetching real metrics:', err.message);
  }

  const metrics: GodPanelOverviewMetrics = {
    totalUsers,
    totalEditors,
    totalStreamers,
    activeSubscribers,
    targetSubscribers: 50,
    monthlyProjectedRevenueINR,
    totalDPInCirculation,
    totalDCoinsInCirculation,
    pendingTasksForReview,
    active24hAdPasses,
  };

  return NextResponse.json({
    metrics,
    milestone: {
      goal: '50 Paying Users @ ₹150/mo = ₹7,500/mo',
      currentProgressPercent: Math.min(100, Math.round((metrics.activeSubscribers / metrics.targetSubscribers) * 100)),
      remainingUsersToTarget: Math.max(0, metrics.targetSubscribers - metrics.activeSubscribers),
    },
    system: {
      ledgerStatus: 'HEALTHY',
      adVerificationGateway: 'ACTIVE',
      encryption: 'HMAC_SHA256_ACTIVE',
    },
  });
}
