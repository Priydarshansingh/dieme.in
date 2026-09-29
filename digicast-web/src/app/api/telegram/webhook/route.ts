// POST /api/telegram/webhook
// Receives incoming Telegram bot updates and responds to /start, /chatid, /help, etc.

import { NextRequest, NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

// Helper to send text message via Telegram Bot API
async function sendTelegramMessage(chatId: string | number, text: string, replyToMessageId?: number) {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_to_message_id: replyToMessageId,
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error('[telegram-webhook] Failed to send message:', err);
  }
}

export async function POST(req: NextRequest) {
  // 1. Validate secret token header if configured
  const secretHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (WEBHOOK_SECRET && secretHeader !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, any>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 2. Extract message / update
  const message = body.message ?? body.channel_post;
  const callbackQuery = body.callback_query;

  if (message) {
    const chatId = message.chat?.id;
    const messageId = message.message_id;
    const rawText = (message.text || '').trim();
    const chatType = message.chat?.type || 'private';
    const chatTitle = message.chat?.title || message.from?.first_name || 'Chat';

    // Normalize command (handles /command and /command@digicast_bot)
    const commandMatch = rawText.match(/^\/([a-zA-Z0-9_]+)(?:@\w+)?(?:\s+(.*))?$/);
    const command = commandMatch ? commandMatch[1].toLowerCase() : '';
    const args = commandMatch ? (commandMatch[2] || '').trim() : '';

    console.info(`[telegram/webhook] received command: /${command} from chatId=${chatId}, type=${chatType}`);

    // A. Handle /chatid or /id command
    if (command === 'chatid' || command === 'id') {
      const response = `
🆔 <b>Chat ID:</b> <code>${chatId}</code>
🏷️ <b>Title:</b> <b>${chatTitle}</b>
👥 <b>Type:</b> <i>${chatType}</i>
      `.trim();
      await sendTelegramMessage(chatId, response, messageId);
    }

    // B. Handle /start command
    else if (command === 'start') {
      // Check if code was passed (e.g. /start A8X91K)
      if (args) {
        const code = args.toUpperCase();
        try {
          const { adminDb } = await import('@/lib/firebase/admin');
          const { col } = await import('@/lib/firestore/collections');

          const codeDoc = await adminDb.doc(`telegram_codes/${code}`).get();

          if (codeDoc.exists) {
            const data = codeDoc.data()!;
            if (Date.now() < data.expiresAt) {
              const { workspaceId, connectedBy } = data;

              await adminDb.doc(col.telegramConnection(workspaceId, String(chatId))).set({
                id: String(chatId),
                workspaceId,
                telegramChatId: String(chatId),
                chatType,
                chatTitle,
                connectedBy,
                connectedAt: new Date().toISOString(),
                status: 'active',
              });

              await codeDoc.ref.delete();

              await sendTelegramMessage(
                chatId,
                `🎉 <b>Digicast Connected!</b>\n\nThis chat is now linked. Clip markers from your YouTube streams will be delivered here automatically.`,
                messageId
              );
              return NextResponse.json({ ok: true });
            }
          }
        } catch (e) {
          console.error('[telegram/webhook] Auth code processing error:', e);
        }
      }

      // Default /start welcome message
      const welcomeMessage = `
🎬 <b>Welcome to Digicast Bot!</b>

<b>Purpose:</b>
Digicast is the real-time Live Intelligence & Instant Clip Delivery Platform for YouTube Creators and live streamers. 

When viewers type <code>!clip</code> in your YouTube live chat, Digicast automatically captures the moment, creates markers, and delivers alerts straight to this Telegram group for your video editors!

👨‍💻 <b>Developer & Creator:</b> @livehellboy

<b>Available Commands:</b>
• <code>/chatid</code> — Get the Chat ID of this group/chat
• <code>/status</code> — Check current livestream & capture status
• <code>/help</code> — View bot documentation and commands
      `.trim();
      await sendTelegramMessage(chatId, welcomeMessage, messageId);
    }

    // C. Handle /help command
    else if (command === 'help') {
      const helpMessage = `
📖 <b>Digicast Bot Commands:</b>

• <code>/chatid</code> — Get this group's Chat ID
• <code>/status</code> — Check active stream & clip capture
• <code>/start</code> — Bot introduction & connection
• <code>/help</code> — Show this help message

👨‍💻 <b>Developer:</b> @livehellboy
🚀 <b>Platform:</b> Digicast Live Intelligence
      `.trim();
      await sendTelegramMessage(chatId, helpMessage, messageId);
    }

    // D. Handle /status command
    else if (command === 'status') {
      const statusMessage = `
⚡ <b>Digicast Status:</b>
🟢 <b>Bot Server:</b> Online & Operational
🤖 <b>Nightbot Webhook:</b> Active (24/7 Zero-Quota)
🆔 <b>Current Chat ID:</b> <code>${chatId}</code>
      `.trim();
      await sendTelegramMessage(chatId, statusMessage, messageId);
    }

    // E. When Bot is added to a new group
    if (message.new_chat_members && Array.isArray(message.new_chat_members)) {
      const isBotAdded = message.new_chat_members.some((m: any) => m.is_bot && m.username?.toLowerCase() === 'digicast_bot');
      if (isBotAdded) {
        const groupGreeting = `
👋 <b>Hello ${chatTitle}!</b>

Thanks for adding <b>Digicast Bot</b>!
I deliver YouTube livestream clip moments recorded by your viewers directly to this group.

🆔 <b>Your Group Chat ID:</b> <code>${chatId}</code>
👨‍💻 <b>Developed by:</b> @livehellboy
        `.trim();
        await sendTelegramMessage(chatId, groupGreeting);
      }
    }
  }

  return NextResponse.json({ ok: true });
}

// GET /api/telegram/webhook (Registers webhook with Telegram API)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const register = searchParams.get('register');

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is not configured' }, { status: 500 });
  }

  if (register === 'true') {
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'digicast-web.vercel.app';
    const webhookUrl = `${proto}://${host}/api/telegram/webhook`;

    try {
      const res = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: WEBHOOK_SECRET || undefined,
          allowed_updates: ['message', 'channel_post', 'callback_query'],
        }),
      });

      const data = await res.json();
      return NextResponse.json({ webhookUrl, telegramResponse: data });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    status: 'Telegram webhook endpoint ready',
    instructions: 'Pass ?register=true to register this webhook with Telegram API',
  });
}
