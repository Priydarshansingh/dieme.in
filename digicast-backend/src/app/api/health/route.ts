import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const uptimeSeconds = process.uptime ? Math.floor(process.uptime()) : 0;

  return NextResponse.json({
    status: 'online',
    service: 'digicast-backend',
    version: '1.0.0',
    timestamp: Date.now(),
    uptimeSeconds,
    features: {
      doubleEntryLedger: true,
      currencyConversion: '10_D_COINS_EQ_1_DP_EQ_1_INR',
      hmacSecurityGateway: true,
      adRewardProofOfView: true,
      godPanelRelocated: true,
      externalWithdrawalDisabled: true,
    },
    milestones: {
      targetPayingUsers: 50,
      targetMonthlyRevenueINR: 7500,
    },
    message: 'Digicast Core Backend & Security Gateway running cleanly.',
  });
}
