import { NextRequest, NextResponse } from "next/server";
import { getPlatformConfig } from "@/lib/referrals/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await getPlatformConfig();
    return NextResponse.json({
      success: true,
      referralCommissionPercent: config.referralCommissionPercent,
      dpToInrRate: config.dpToInrRate,
      dCoinsPerINR: config.dCoinsPerINR,
      dCoinsPerDP: config.dCoinsPerDP,
      minWithdrawalINR: config.minWithdrawalINR,
      plans: config.plans,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load pricing config" }, { status: 500 });
  }
}
