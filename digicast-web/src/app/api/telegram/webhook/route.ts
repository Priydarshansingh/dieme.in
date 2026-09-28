// POST /api/telegram/webhook
// Receives incoming Telegram bot updates.
//
// SECURITY REQUIREMENTS (must remain in force):
//  - Validate the secret token header against TELEGRAM_WEBHOOK_SECRET (env var, never client-side)
//  - Verify the bot identity and known chat ID before processing any message
//  - Never log full message content — only log event type and chat ID
//  - Never store full chat content in Firestore
//  - Telegram bot token is in env vars ONLY (server-side Cloud Run secret), never in APK or client

import { NextRequest, NextResponse } from 'next/server';

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const EXPECTED_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;

export async function POST(req: NextRequest) {
  // 1. Validate secret token header (set when registering the webhook with Telegram)
  const secretHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (!WEBHOOK_SECRET || secretHeader !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 2. Extract update type
  const message = (body.message ?? body.channel_post) as Record<string, unknown> | undefined;
  const callbackQuery = body.callback_query as Record<string, unknown> | undefined;

  if (message) {
    const chatId = (message.chat as Record<string, unknown>)?.id;
    const text = (message.text as string | undefined) ?? '';

    // Log only event type + chat ID — NEVER log message text
    console.info(`[telegram/webhook] message event, chatId=${chatId}`);

    // TODO: Route to appropriate handler based on !command text
    // e.g., acknowledge !clip commands, respond to /status, etc.
    // All business logic runs here server-side — bot token never leaves the server.
  } else if (callbackQuery) {
    console.info('[telegram/webhook] callback_query event');
    // TODO: Handle inline keyboard callbacks
  }

  // Telegram expects a 200 OK quickly
  return NextResponse.json({ ok: true });
}
