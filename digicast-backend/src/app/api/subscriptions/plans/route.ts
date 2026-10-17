import { NextResponse } from 'next/server';
import {
  PRICING_PLANS,
  D_COINS_PER_DP,
  INR_PER_DP,
  UNLOCK_24H_DCOINS_COST,
  AD_REWARD_DCOINS,
  UPI_CONFIG,
} from '@/lib/pricingPlans';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let plans = PRICING_PLANS;
    let upiConfig = UPI_CONFIG;
    let unlockFee = UNLOCK_24H_DCOINS_COST;

    // Support dynamic admin overrides in Firestore system_config
    try {
      const { adminDb } = await import('@/lib/firebase/admin');
      const doc = await adminDb.collection('system_config').doc('pricing').get();
      if (doc.exists) {
        const data = doc.data();
        if (data?.plans && Array.isArray(data.plans) && data.plans.length > 0) {
          plans = data.plans;
        }
        if (data?.upiConfig) {
          upiConfig = { ...upiConfig, ...data.upiConfig };
        }
        if (typeof data?.unlock24hDCoinsCost === 'number') {
          unlockFee = data.unlock24hDCoinsCost;
        }
      }
    } catch (_) {}

    return NextResponse.json({
      success: true,
      plans,
      currencySystem: {
        dCoinsPerDp: D_COINS_PER_DP,
        inrPerDp: INR_PER_DP,
        unlock24hDCoinsCost: unlockFee,
        adRewardDCoins: AD_REWARD_DCOINS,
        rules: [
          '1 DP Diamond = ₹1 INR (Primary Platform Value Token)',
          '10 D-Coins = 1 DP Diamond = ₹1 INR',
          'Free users after 14-day trial must unlock once every 24 hours',
          '24-Hour Access unlock fee = 50 D-Coins (or watch 1 rewarded video)',
          'All packages grant unlimited continuous access for their validity duration',
        ],
      },
      upiConfig,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
