// GET & POST /api/webhooks/nightbot
// Webhook endpoint to capture !clip commands directly from Nightbot $(urlfetch)
// Zero-quota cost, serverless, instant Firestore clip marker creation & Telegram delivery.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { col } from '@/lib/firestore/collections';
import { ClipMarker } from '@/types';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Helper to send instant clip alert to Telegram group
async function sendTelegramClipAlert(chatId: string | number, clip: {
  clipId: string;
  streamTitle: string;
  authorName: string;
  labelText: string;
  timestampDisplay: string;
}) {
  if (!TELEGRAM_BOT_TOKEN || !chatId) return false;
  try {
    const text = `
🎬 <b>New Clip Marker Recorded!</b>

🔴 <b>Stream:</b> ${clip.streamTitle}
👤 <b>Clipped by:</b> @${clip.authorName}
📝 <b>Note:</b> "${clip.labelText}"
⏱️ <b>Stream Time:</b> ${clip.timestampDisplay}
🆔 <b>Clip ID:</b> <code>${clip.clipId}</code>
    `.trim();

    const res = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    console.error('[nightbot-webhook] Telegram alert failed:', err);
    return false;
  }
}

async function handleNightbotClip(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Read params from query string or body (Nightbot $(urlfetch) supports both)
  let workspaceId = searchParams.get('workspaceId') || searchParams.get('workspace_id');
  let user = searchParams.get('user') || searchParams.get('user_name');
  let query = searchParams.get('query') || searchParams.get('label') || searchParams.get('text');
  const secret = searchParams.get('secret');

  // If POST, attempt to parse JSON body if parameters were sent in body
  if (req.method === 'POST') {
    try {
      const body = await req.json();
      workspaceId = workspaceId || body.workspaceId || body.workspace_id;
      user = user || body.user || body.authorName;
      query = query || body.query || body.label || body.text;
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
    let streamTitle = 'Live Stream';
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
        streamTitle = streamDoc.data().title || 'Live Stream';
        youtubeVideoId = streamDoc.data().youtubeVideoId || '';

        // Increment clip count on active stream
        await streamDoc.ref.update({
          clipCount: (streamDoc.data().clipCount || 0) + 1,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('[nightbot-webhook] Could not fetch active stream:', e);
    }

    // 2. Generate unique clip marker ID
    const shortHash = Math.random().toString(36).substring(2, 8).toUpperCase();
    const clipId = `CLP-${shortHash}`;
    const nowIso = new Date().toISOString();
    const timestampDisplay = new Date().toLocaleTimeString('en-US', { hour12: false });

    // 3. Deliver instant alert to Telegram if workspace has a connected Telegram group
    let telegramSent = false;
    try {
      const wsDoc = await adminDb.doc(col.workspace(workspaceId)).get();
      let targetChatId = wsDoc.data()?.telegramChatId;

      if (!targetChatId) {
        const tgSnap = await adminDb
          .collection(col.telegram(workspaceId))
          .where('status', '==', 'active')
          .limit(1)
          .get();
        if (!tgSnap.empty) {
          targetChatId = tgSnap.docs[0].data().telegramChatId || tgSnap.docs[0].id;
        }
      }

      if (targetChatId) {
        telegramSent = await sendTelegramClipAlert(targetChatId, {
          clipId,
          streamTitle,
          authorName,
          labelText,
          timestampDisplay,
        });
      }
    } catch (tgErr) {
      console.warn('[nightbot-webhook] Telegram delivery check warning:', tgErr);
    }

    // 4. Save clip marker in Firestore
    const clipMarker: ClipMarker = {
      id: clipId,
      workspaceId,
      streamId,
      youtubeVideoId,
      markerTimestamp: Math.floor(Date.now() / 1000),
      markerTimestampDisplay: timestampDisplay,
      source: 'viewer',
      authorName,
      aiTopic: labelText,
      createdAt: nowIso,
      downloadStatus: 'not_started',
      telegramStatus: telegramSent ? 'uploaded' : 'not_uploaded',
      telegramSent,
    };

    await adminDb.doc(col.clip(workspaceId, clipId)).set(clipMarker);

    // 5. Return plain text response to be sent to YouTube Live Chat by Nightbot
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
