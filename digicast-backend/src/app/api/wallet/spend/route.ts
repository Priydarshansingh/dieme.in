import { NextRequest, NextResponse } from 'next/server';
import { recordLedgerTransaction } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { uid, dpAmount, itemType, itemId, idempotencyKey } = await req.json();

    if (!uid || !dpAmount || !itemType) {
      return NextResponse.json({ error: 'MISSING_FIELDS', message: 'uid, dpAmount, and itemType are required' }, { status: 400 });
    }

    if (itemType !== 'WATERMARK_REMOVAL' && itemType !== 'SUBSCRIPTION_PURCHASE' && itemType !== 'ASSET_PURCHASE') {
      return NextResponse.json({ error: 'INVALID_ITEM_TYPE', message: 'Item type must be WATERMARK_REMOVAL, SUBSCRIPTION_PURCHASE, or ASSET_PURCHASE' }, { status: 400 });
    }

    const description =
      itemType === 'WATERMARK_REMOVAL'
        ? 'Unlocked Watermark Removal using DP'
        : itemType === 'SUBSCRIPTION_PURCHASE'
        ? `Purchased subscription plan [${itemId}] using DP`
        : `Purchased stream asset [${itemId}] using DP`;

    const result = recordLedgerTransaction({
      uid,
      type: 'DEBIT',
      currency: 'DP',
      amount: dpAmount,
      source: itemType as any,
      description,
      referenceId: itemId,
      idempotencyKey,
      metadata: { unlockedAt: Date.now(), itemId },
    });

    return NextResponse.json({
      success: true,
      purchasedItem: itemType,
      itemId,
      dpDeducted: dpAmount,
      wallet: result.balance,
      message: `${description} successfully.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'SPEND_FAILED', message: error.message }, { status: 400 });
  }
}
