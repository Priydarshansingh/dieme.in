import { NextRequest, NextResponse } from 'next/server';
import { verifySignedAdSession } from '@/lib/security';
import { recordLedgerTransaction } from '@/lib/ledger';
import { userAdPassStore } from '@/lib/adStore';
import { adminDb } from '@/lib/firebase/admin';
import { recordAdImpression } from '@/lib/adTracking';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const {
      sessionId,
      uid,
      nonce,
      expiresAt,
      signature,
      provider = 'ADMOB',
      adUnitId,
      platform = 'ANDROID',
      format = 'REWARDED_VIDEO',
      userEmail,
    } = await req.json();

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

    // Record impression and daily aggregate earnings in Firestore
    let impressionResult: any = null;
    try {
      impressionResult = await recordAdImpression(adminDb, {
        uid,
        userEmail,
        provider,
        adUnitId,
        platform,
        format,
      });
    } catch (dbErr) {
      console.warn('[ads/verify-view] Warning: Failed to record ad impression in Firestore:', dbErr);
    }

    const earnedINR = impressionResult?.impression?.earnedINR || 1.25;

    // Credit 10 D Coins viewing reward to user wallet
    const ledgerResult = recordLedgerTransaction({
      uid,
      type: 'CREDIT',
      currency: 'D_COIN',
      amount: 10,
      source: 'AD_REWARD',
      description: `Reward bonus for watching 1 sponsored ${provider} advertisement`,
      referenceId: sessionId,
      metadata: {
        sessionId,
        grantedHours: 24,
        adUnitId: adUnitId || 'ca-app-pub-5470934256709090/8839247619',
        provider,
        earnedINR,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ad view verified! 24-hour uninterrupted stream intelligence access pass granted.',
      provider,
      earnedINR,
      adPass: {
        uid,
        hasActivePass: true,
        passExpiresAt: newExpiresAt,
        remainingHours: Math.round(((newExpiresAt - now) / (60 * 60 * 1000)) * 10) / 10,
        totalAdsWatched: totalWatched,
      },
      bonusReward: {
        dCoinsAwarded: 10,
        newDCoinsBalance: ledgerResult.balance.dCoinsBalance,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'AD_VERIFICATION_ERROR', details: error.message }, { status: 500 });
  }
}
