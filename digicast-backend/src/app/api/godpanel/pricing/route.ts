import { NextRequest, NextResponse } from 'next/server';
import { PRICING_PLANS, UPI_CONFIG, UNLOCK_24H_DCOINS_COST, D_COINS_PER_DP, INR_PER_DP } from '@/lib/pricingPlans';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const doc = await adminDb.collection('system_config').doc('pricing').get();
    let plans = PRICING_PLANS;
    let upiConfig = UPI_CONFIG;
    let unlock24hDCoinsCost = UNLOCK_24H_DCOINS_COST;

    if (doc.exists) {
      const data = doc.data();
      if (data?.plans) plans = data.plans;
      if (data?.upiConfig) upiConfig = data.upiConfig;
      if (typeof data?.unlock24hDCoinsCost === 'number') unlock24hDCoinsCost = data.unlock24hDCoinsCost;
    }

    return NextResponse.json({
      success: true,
      plans,
      upiConfig,
      unlock24hDCoinsCost,
      currencySystem: {
        dCoinsPerDp: D_COINS_PER_DP,
        inrPerDp: INR_PER_DP,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plans, upiConfig, unlock24hDCoinsCost } = body;

    const updatePayload: Record<string, any> = {
      updatedAt: Date.now(),
    };

    if (plans && Array.isArray(plans)) updatePayload.plans = plans;
    if (upiConfig && typeof upiConfig === 'object') updatePayload.upiConfig = upiConfig;
    if (typeof unlock24hDCoinsCost === 'number') updatePayload.unlock24hDCoinsCost = unlock24hDCoinsCost;

    await adminDb.collection('system_config').doc('pricing').set(updatePayload, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'Pricing and currency configuration saved successfully.',
      updated: updatePayload,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
