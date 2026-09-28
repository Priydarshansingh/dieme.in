// GET & POST /api/webhooks/nightbot
// Webhook endpoint to capture !clip commands directly from Nightbot $(urlfetch)
// Zero-quota cost, serverless, instant Firestore clip marker creation.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { col } from '@/lib/firestore/collections';
import { ClipMarker } from '@/types';

async function handleNightbotClip(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Read params from query string or body (Nightbot $(urlfetch) supports both)
  let workspaceId = searchParams.get('workspaceId');
  let user = searchParams.get('user') || searchParams.get('user_name');
  let query = searchParams.get('query') || searchParams.get('label');
  const secret = searchParams.get('secret');

  // If POST, attempt to parse JSON body if parameters were sent in body
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      workspaceId = workspaceId || body.workspaceId;
      user = user || body.user || body.authorName;
      query = query || body.query || body.label;
    } catch {
      // Ignore if body is non-JSON or empty
    }
  }

  // Validate workspaceId
  if (!workspaceId) {
    return new NextResponse('Error: workspaceId query parameter is required.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Optional WEBHOOK_SECRET check if set on environment
  const expectedSecret = process.env.NIGHTBOT_WEBHOOK_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return new NextResponse('Error: Unauthorized webhook request.', {
      status: 401,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const authorName = user ? user.replace(/^@/, '') : 'Viewer';
  const labelText = query && query.trim().length > 0 ? query.trim() : 'Clip Marker';

  try {
    if (!adminDb) {
      return new NextResponse('Error: Database not configured.', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // 1. Find active live stream for workspace
    let streamId = 'live-stream';
    let youtubeVideoId = '';

    try {
      const activeStreamSnap = await adminDb
        .collection(col.streams(workspaceId))
        .where('status', '==', 'live')
        .limit(1)
        .get();

      if (!activeStreamSnap.empty) {
        const streamDoc = activeStreamSnap.docs[0];
        streamId = streamDoc.id;
        youtubeVideoId = streamDoc.data().youtubeVideoId || '';
      }
    } catch (e) {
      console.warn('[nightbot-webhook] Could not fetch active stream, defaulting:', e);
    }

    // 2. Generate unique clip marker ID
    const shortHash = Math.random().toString(36).substring(2, 8).toUpperCase();
    const clipId = `CLP-${shortHash}`;
    const nowIso = new Date().toISOString();

    const clipMarker: ClipMarker = {
      id: clipId,
      workspaceId,
      streamId,
      youtubeVideoId,
      markerTimestamp: Math.floor(Date.now() / 1000),
      markerTimestampDisplay: new Date().toLocaleTimeString('en-US', { hour12: false }),
      source: 'viewer',
      authorName,
      aiTopic: labelText,
      createdAt: nowIso,
      downloadStatus: 'not_started',
      telegramStatus: 'not_uploaded',
    };

    // 3. Save clip marker in Firestore
    await adminDb.doc(col.clip(workspaceId, clipId)).set(clipMarker);

    // 4. Return plain text response to be sent to YouTube Live Chat by Nightbot
    return new NextResponse(
      `🎬 Clip marker recorded by @${authorName}! [${clipId}: "${labelText}"]`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      }
    );
  } catch (err) {
    console.error('[nightbot-webhook] Error creating clip marker:', err);
    return new NextResponse('Error saving clip marker.', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

export async function GET(req: NextRequest) {
  return handleNightbotClip(req);
}

export async function POST(req: NextRequest) {
  return handleNightbotClip(req);
}
