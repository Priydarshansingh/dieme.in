import { NextRequest, NextResponse } from 'next/server';
import { convertDCoinsToDPAsync } from '@/lib/ledger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { uid, dCoinsToConvert } = await req.json();

    if (!uid || typeof dCoinsToConvert !== 'number') {
      return NextResponse.json({ error: 'INVALID_PARAMETERS', message: 'uid and dCoinsToConvert are required' }, { status: 400 });
    }

    const result = await convertDCoinsToDPAsync(uid, dCoinsToConvert);

    return NextResponse.json({
      success: true,
      convertedDP: result.convertedDP,
      wallet: result.balance,
      message: `Successfully converted ${dCoinsToConvert} D Coins to ${result.convertedDP} DP (₹${result.convertedDP} INR).`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'CONVERSION_FAILED', message: error.message }, { status: 400 });
  }
}
