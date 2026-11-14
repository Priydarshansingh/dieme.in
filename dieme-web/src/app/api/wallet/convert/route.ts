import { NextRequest, NextResponse } from 'next/server';
import { callBackendService } from '@/lib/backendClient';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, dCoinsToConvert } = body;

    if (!uid || typeof dCoinsToConvert !== 'number') {
      return NextResponse.json(
        { error: 'INVALID_PARAMETERS', message: 'uid and dCoinsToConvert are required' },
        { status: 400 }
      );
    }

    // Proxy conversion directly to dieme-backend ledger engine
    const backendRes = await callBackendService('api/wallet/convert', {
      method: 'POST',
      body: { uid, dCoinsToConvert },
    });

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: 'CONVERSION_FAILED', message: backendRes.error || 'Backend conversion failed' },
        { status: backendRes.status || 500 }
      );
    }

    return NextResponse.json(backendRes.data);
  } catch (err: any) {
    return NextResponse.json({ error: 'CONVERT_PROXY_ERROR', message: err.message }, { status: 500 });
  }
}
