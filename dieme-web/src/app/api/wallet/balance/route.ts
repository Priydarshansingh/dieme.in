import { NextRequest, NextResponse } from 'next/server';
import { callBackendService } from '@/lib/backendClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'UID_REQUIRED', message: 'User ID is required' }, { status: 400 });
    }

    // Proxy request through secure HMAC inter-service bridge to dieme-backend
    const backendRes = await callBackendService(`api/wallet/balance?uid=${encodeURIComponent(uid)}`, {
      method: 'GET',
    });

    if (!backendRes.ok) {
      // Graceful fallback if backend is momentarily unreachable
      return NextResponse.json({
        success: true,
        wallet: { dCoins: 0, dp: 0, totalEarnedDCoins: 0, totalEarnedDP: 0 },
        recentTransactions: [],
        conversionRate: { dCoinsPerDP: 10, inrPerDP: 1, rule: '10 D Coins = 1 DP = ₹1 INR' },
        degraded: true,
      });
    }

    return NextResponse.json(backendRes.data);
  } catch (err: any) {
    return NextResponse.json({ error: 'WALLET_PROXY_ERROR', message: err.message }, { status: 500 });
  }
}
