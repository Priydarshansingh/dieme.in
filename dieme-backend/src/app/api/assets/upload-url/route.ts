import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Digicast-HMAC',
    },
  });
}

/**
 * POST /api/assets/upload-url
 * Generates a signed v4 PUT upload URL for Firebase/Google Cloud Storage.
 * Allows client browsers and Android companion devices to upload large videos,
 * audio streams, and thumbnails directly to Cloud Storage with ZERO server memory consumption.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { fileName, contentType = 'application/octet-stream', workspaceId, folder = 'clips' } = body;

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json(
        { error: 'MISSING_FILENAME', message: 'fileName is required' },
        { status: 400 }
      );
    }

    if (!workspaceId || typeof workspaceId !== 'string') {
      return NextResponse.json(
        { error: 'MISSING_WORKSPACE', message: 'workspaceId is required' },
        { status: 400 }
      );
    }

    if (!adminStorage) {
      return NextResponse.json(
        { error: 'STORAGE_UNAVAILABLE', message: 'Storage service account is not initialized' },
        { status: 503 }
      );
    }

    const bucketName =
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      'digicast-eaca1.firebasestorage.app';

    const bucket = adminStorage.bucket(bucketName);

    // Sanitize and create uniquely isolated file path
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const storagePath = `workspaces/${workspaceId}/${safeFolder}/${Date.now()}_${sanitizedName}`;
    const file = bucket.file(storagePath);

    // Generate signed URL valid for 15 minutes
    const expiresMs = Date.now() + 15 * 60 * 1000;
    const [signedUploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: expiresMs,
      contentType,
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;

    return NextResponse.json(
      {
        success: true,
        uploadUrl: signedUploadUrl,
        publicUrl,
        storagePath,
        bucket: bucketName,
        method: 'PUT',
        contentType,
        expiresInSeconds: 900,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    console.error('[Upload-URL] Error generating pre-signed URL:', err);
    return NextResponse.json(
      { error: 'SIGNED_URL_FAILED', message: err?.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
