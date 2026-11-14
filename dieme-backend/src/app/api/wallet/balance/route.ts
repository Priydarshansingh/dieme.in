import { NextRequest, NextResponse } from 'next/server';
import { getUserWalletAsync, loadUserLedgerFromFirestore } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json({ error: 'UID_REQUIRED', message: 'User ID is required' }, { status: 400 });
    }

    const wallet = await getUserWalletAsync(uid);
    const recentLedger = (await loadUserLedgerFromFirestore(uid)).slice(-10);

    return NextResponse.json({
      success: true,
      wallet,
      recentTransactions: recentLedger,
      conversionRate: {
        dCoinsPerDP: 10,
        inrPerDP: 1,
        rule: '10 D Coins = 1 DP = ₹1 INR',
      },
      withdrawalPolicy: {
        externalWithdrawalAllowed: false,
        notice: 'Balances are strictly for in-app subscriptions, watermark removal, and asset unlocks.',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'WALLET_FETCH_FAILED', details: error.message }, { status: 500 });
  }
}
