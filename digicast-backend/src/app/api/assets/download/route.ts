import { NextRequest, NextResponse } from 'next/server';
import { liveStreamAssets } from '@/lib/assetStore';
import { recordLedgerTransaction, getUserWallet } from '@/lib/ledger';
import { userAdPassStore } from '@/lib/adStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { uid, assetId } = await req.json();

    if (!uid || !assetId) {
      return NextResponse.json({ error: 'MISSING_FIELDS', message: 'uid and assetId are required' }, { status: 400 });
    }

    const asset = liveStreamAssets.find((a) => a.id === assetId);
    if (!asset) {
      return NextResponse.json({ error: 'ASSET_NOT_FOUND' }, { status: 404 });
    }

    // 1. If requires Ad Pass, check if user has active 24h pass
    if (asset.requiresAdPass) {
      const pass = userAdPassStore.get(uid);
      const hasActivePass = pass ? pass.passExpiresAt > Date.now() : false;

      if (!hasActivePass) {
        return NextResponse.json({
          error: 'REQUIRES_AD_PASS',
          message: 'This asset is unlocked via the free ad-supported tier. Watch 1 sponsored ad to unlock 24-hour access!',
          requiresAdWatch: true,
        }, { status: 402 });
      }
    }

    // 2. If Premium with DP cost, check and debit user DP
    if (asset.isPremium && asset.dpCost > 0) {
      const wallet = getUserWallet(uid);
      if (wallet.dpBalance < asset.dpCost) {
        return NextResponse.json({
          error: 'INSUFFICIENT_DP',
          message: `This asset requires ${asset.dpCost} DP (₹${asset.dpCost}). Your current balance: ${wallet.dpBalance} DP. Complete a community task or watch an ad to earn balance!`,
          requiredDP: asset.dpCost,
          currentDP: wallet.dpBalance,
        }, { status: 402 });
      }

      // Debit DP
      recordLedgerTransaction({
        uid,
        type: 'DEBIT',
        currency: 'DP',
        amount: asset.dpCost,
        source: 'ASSET_PURCHASE',
        description: `Unlocked live stream asset: ${asset.title}`,
        referenceId: asset.id,
      });
    }

    asset.downloadsCount += 1;

    return NextResponse.json({
      success: true,
      assetId: asset.id,
      title: asset.title,
      downloadUrl: asset.downloadUrl,
      message: `Asset "${asset.title}" unlocked successfully!`,
      obsInstructions: 'Add as a Media Source or Image Source in OBS Studio / Streamlabs.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'DOWNLOAD_FAILED', details: error.message }, { status: 500 });
  }
}
