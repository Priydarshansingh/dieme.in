import { NextRequest, NextResponse } from 'next/server';
import { recordLedgerTransaction } from '@/lib/ledger';
import { UNLOCK_24H_DCOINS_COST } from '@/lib/pricingPlans';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { uid, dpAmount, amount, currency, itemType, itemId, idempotencyKey } = await req.json();

    if (!uid || !itemType) {
      return NextResponse.json({ error: 'MISSING_FIELDS', message: 'uid and itemType are required' }, { status: 400 });
    }

    const validItemTypes = ['WATERMARK_REMOVAL', 'SUBSCRIPTION_PURCHASE', 'ASSET_PURCHASE', 'PASS_24H_UNLOCK'];
    if (!validItemTypes.includes(itemType)) {
      return NextResponse.json({
        error: 'INVALID_ITEM_TYPE',
        message: `Item type must be one of: ${validItemTypes.join(', ')}`,
      }, { status: 400 });
    }

    let spendCurrency: 'DP' | 'D_COIN' = currency === 'D_COIN' ? 'D_COIN' : 'DP';
    let spendAmount = amount || dpAmount;

    if (itemType === 'PASS_24H_UNLOCK') {
      spendCurrency = currency === 'DP' ? 'DP' : 'D_COIN';
      spendAmount = spendAmount || (spendCurrency === 'D_COIN' ? UNLOCK_24H_DCOINS_COST : 5);
    }

    if (!spendAmount || spendAmount <= 0) {
      return NextResponse.json({ error: 'INVALID_AMOUNT', message: 'Valid spend amount is required' }, { status: 400 });
    }

    const description =
      itemType === 'PASS_24H_UNLOCK'
        ? `Unlocked 24-Hour Studio Access using ${spendAmount} ${spendCurrency}`
        : itemType === 'WATERMARK_REMOVAL'
        ? 'Unlocked Watermark Removal using DP'
        : itemType === 'SUBSCRIPTION_PURCHASE'
        ? `Purchased subscription plan [${itemId}] using DP`
        : `Purchased stream asset [${itemId}] using DP`;

    const result = recordLedgerTransaction({
      uid,
      type: 'DEBIT',
      currency: spendCurrency,
      amount: spendAmount,
      source: itemType as any,
      description,
      referenceId: itemId || '24h_pass',
      idempotencyKey,
      metadata: { unlockedAt: Date.now(), itemId, itemType },
    });

    // If PASS_24H_UNLOCK, activate pass in Firestore
    let passExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
    try {
      const { adminDb } = await import('@/lib/firebase/admin');
      await adminDb.collection('ad_passes').doc(uid).set({
        uid,
        hasActivePass: true,
        passExpiresAt,
        lastUnlockedAt: Date.now(),
        unlockMethod: 'D_COINS',
      }, { merge: true });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      purchasedItem: itemType,
      itemId,
      deductedAmount: spendAmount,
      currency: spendCurrency,
      passExpiresAt: itemType === 'PASS_24H_UNLOCK' ? passExpiresAt : undefined,
      wallet: result.balance,
      message: `${description} successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'SPEND_FAILED', message: error.message }, { status: 400 });
  }
}
