import { NextRequest, NextResponse } from 'next/server';
import { callBackendService } from '@/lib/backendClient';

export const dynamic = 'force-dynamic';

/**
 * POST /api/assets/upload-url (dieme-web edge proxy)
 * Requests a pre-signed v4 Cloud Storage upload URL from dieme-backend.
 * Offloads signing and storage credential handling entirely to the backend.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { fileName, contentType, workspaceId, folder } = body;

    if (!fileName || !workspaceId) {
      return NextResponse.json(
        { error: 'MISSING_PARAMS', message: 'fileName and workspaceId are required' },
        { status: 400 }
      );
    }

    const res = await callBackendService('/api/assets/upload-url', {
      method: 'POST',
      body: { fileName, contentType, workspaceId, folder },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'BACKEND_ERROR', message: res.error || 'Backend failed to generate upload URL' },
        { status: res.status }
      );
    }

    return NextResponse.json(res.data, { status: 200 });
  } catch (err: any) {
    console.error('[Upload Proxy] Error contacting backend:', err);
    return NextResponse.json(
      { error: 'PROXY_FAILED', message: err?.message || 'Failed to request upload URL from backend' },
      { status: 502 }
    );
  }
}
