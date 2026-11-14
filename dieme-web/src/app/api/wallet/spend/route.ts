import { NextRequest, NextResponse } from 'next/server';
import { callBackendService } from '@/lib/backendClient';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, itemType, itemId, amount, dpAmount, currency } = body;

    if (!uid || !itemType) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'uid and itemType are required' },
        { status: 400 }
      );
    }

    // Proxy spend debit directly to dieme-backend ledger engine
    const backendRes = await callBackendService('api/wallet/spend', {
      method: 'POST',
      body: { uid, itemType, itemId, amount, dpAmount, currency },
    });

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: 'SPEND_FAILED', message: backendRes.error || 'Backend debit failed' },
        { status: backendRes.status || 500 }
      );
    }

    return NextResponse.json(backendRes.data);
  } catch (err: any) {
    return NextResponse.json({ error: 'SPEND_PROXY_ERROR', message: err.message }, { status: 500 });
  }
}
