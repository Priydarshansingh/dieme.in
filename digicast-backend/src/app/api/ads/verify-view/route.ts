import { NextRequest, NextResponse } from 'next/server';
import { verifySignedAdSession } from '@/lib/security';
import { recordLedgerTransaction } from '@/lib/ledger';
import { userAdPassStore } from '@/lib/adStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, uid, nonce, expiresAt, signature } = await req.json();

    if (!sessionId || !uid || !nonce || !expiresAt || !signature) {
      return NextResponse.json({ error: 'MISSING_VERIFICATION_PARAMS' }, { status: 400 });
    }

    const isValid = verifySignedAdSession(sessionId, uid, nonce, expiresAt, signature);

    if (!isValid) {
      return NextResponse.json(
        { error: 'INVALID_OR_EXPIRED_AD_SESSION', message: 'Cryptographic proof-of-view verification failed.' },
        { status: 403 }
      );
    }

    // Grant 24 hours full feature access from now
    const now = Date.now();
    const passDurationMs = 24 * 60 * 60 * 1000; // 24 Hours
    const currentPass = userAdPassStore.get(uid);

    // If existing active pass, extend from current expiration or now
    const baseTime = currentPass && currentPass.passExpiresAt > now ? currentPass.passExpiresAt : now;
    const newExpiresAt = baseTime + passDurationMs;
    const totalWatched = (currentPass?.totalAdsWatched || 0) + 1;

    userAdPassStore.set(uid, {
      passExpiresAt: newExpiresAt,
      totalAdsWatched: totalWatched,
      lastAdWatchedAt: now,
    });

    // Credit 5 D Coins viewing reward to user wallet
    const ledgerResult = recordLedgerTransaction({
      uid,
      type: 'CREDIT',
      currency: 'D_COIN',
      amount: 5,
      source: 'AD_REWARD',
      description: 'Reward bonus for watching 1 sponsored advertisement',
      referenceId: sessionId,
      metadata: { sessionId, grantedHours: 24 },
    });

    return NextResponse.json({
      success: true,
      message: 'Ad view verified! 24-hour uninterrupted stream intelligence access pass granted.',
      adPass: {
        uid,
        hasActivePass: true,
        passExpiresAt: newExpiresAt,
        remainingHours: Math.round(((newExpiresAt - now) / (60 * 60 * 1000)) * 10) / 10,
        totalAdsWatched: totalWatched,
      },
      bonusReward: {
        dCoinsAwarded: 5,
        newDCoinsBalance: ledgerResult.balance.dCoinsBalance,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'AD_VERIFICATION_ERROR', details: error.message }, { status: 500 });
  }
}
