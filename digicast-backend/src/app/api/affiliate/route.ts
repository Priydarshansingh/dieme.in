import { NextRequest, NextResponse } from 'next/server';
import { affiliateLedger } from '@/lib/subscriptionStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'UID_REQUIRED' }, { status: 400 });
    }

    const cleanCode = `REF_${uid.replace('usr_', '').toUpperCase()}`;
    const baseUrl = process.env.CLIENT_WEB_URL || 'http://localhost:3000';
    const referralLink = `${baseUrl}/login?ref=${cleanCode}`;

    const stats = affiliateLedger.get(uid) || {
      totalReferrals: 0,
      lifetimeCommissionINR: 0,
      lifetimeDP: 0,
    };

    return NextResponse.json({
      uid,
      referralCode: cleanCode,
      referralLink,
      commissionRate: '15% Lifetime Recurring on all subscriber spending',
      stats: {
        totalReferredCreators: stats.totalReferrals,
        lifetimeCommissionINR: stats.lifetimeCommissionINR,
        lifetimeDP: stats.lifetimeDP,
      },
      payoutRule: 'Commissions are directly credited as DP in your wallet and can be used for any in-app subscriptions.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'AFFILIATE_ERROR', details: error.message }, { status: 500 });
  }
}
