import { NextRequest, NextResponse } from 'next/server';
import { generateHmacSignature, verifyHmacSignature } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const providedHmac = req.headers.get('x-digicast-hmac') || body.signature;

    if (!providedHmac) {
      return NextResponse.json(
        { error: 'MISSING_HMAC_SIGNATURE', message: 'Header X-Digicast-HMAC is required' },
        { status: 400 }
      );
    }

    const payloadToVerify = body.payload !== undefined ? body.payload : body;
    const isValid = verifyHmacSignature(payloadToVerify, providedHmac);

    if (!isValid) {
      return NextResponse.json(
        {
          error: 'INVALID_SIGNATURE',
          verified: false,
          message: 'HMAC signature mismatch. Possible tampering or invalid secret key.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      verified: true,
      timestamp: Date.now(),
      message: 'Cryptographic HMAC signature verified successfully.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'VERIFICATION_ERROR', details: error?.message }, { status: 500 });
  }
}

export async function GET() {
  // Utility to produce a sample signed test payload
  const testPayload = { action: 'ping', timestamp: Date.now() };
  const sampleSignature = generateHmacSignature(testPayload);

  return NextResponse.json({
    message: 'HMAC Verification Endpoint Ready',
    samplePayload: testPayload,
    sampleHmac: sampleSignature,
    instructions: 'Send POST with X-Digicast-HMAC header matching the payload HMAC to verify.',
  });
}
