import { NextResponse } from 'next/server';
import { SUBSCRIPTION_PLANS } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    plans: SUBSCRIPTION_PLANS,
    milestone: {
      targetPayingUsers: 50,
      averageTicketINR: 150,
      targetMonthlyRevenueINR: 7500,
      description: 'Initial milestone: 50 creators paying ~₹150/month generating ₹7,500 monthly revenue.',
    },
    currencyNotice: 'All paid plans can be purchased with real INR or equivalent in-app DP balance earned from tasks.',
  });
}
