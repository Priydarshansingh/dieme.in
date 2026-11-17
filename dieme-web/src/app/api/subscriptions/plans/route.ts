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
    let dCoinsPerDp = D_COINS_PER_DP;
    let inrPerDp = INR_PER_DP;
    let commissionPercent = 15;

    // Support dynamic admin overrides in Firestore platformConfig & system_config
    try {
      const { getPlatformConfig } = await import('@/lib/referrals/service');
      const platformConfig = await getPlatformConfig();
      if (platformConfig) {
        if (platformConfig.dCoinsPerDP) dCoinsPerDp = platformConfig.dCoinsPerDP;
        if (platformConfig.dpToInrRate) inrPerDp = platformConfig.dpToInrRate;
        if (platformConfig.referralCommissionPercent) commissionPercent = platformConfig.referralCommissionPercent;

        // Apply price overrides to known plans
        if (platformConfig.plans) {
          plans = plans.map(p => {
            const override = platformConfig.plans[p.id];
            if (override) {
              return {
                ...p,
                priceINR: override.priceINR ?? p.priceINR,
                dpCost: override.dpCost ?? p.dpCost,
                dCoinsCost: (override.priceINR ?? p.priceINR) * dCoinsPerDp,
              };
            }
            return p;
          });
        }
      }
    } catch (_) {}

    return NextResponse.json({
      success: true,
      plans,
      currencySystem: {
        dCoinsPerDp,
        inrPerDp,
        referralCommissionPercent: commissionPercent,
        unlock24hDCoinsCost: unlockFee,
        adRewardDCoins: AD_REWARD_DCOINS,
        rules: [
          `1 DP Diamond = ₹${inrPerDp} INR (Primary Platform Value Token)`,
          `${dCoinsPerDp} D-Coins = 1 DP Diamond = ₹${inrPerDp} INR`,
          `Affiliate Referral Program: ${commissionPercent}% Lifetime Commission credited to DP wallet`,
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
