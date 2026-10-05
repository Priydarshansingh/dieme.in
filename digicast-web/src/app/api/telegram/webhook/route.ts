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

    // Handling Private Payment Screenshot Photo
    if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
      if (chatType !== 'private') {
        await sendTelegramMessage(
          chatId,
          `⚠️ <b>Privacy Warning:</b> Please send payment receipts directly in private DM to @${process.env.TELEGRAM_BOT_USERNAME || 'DIGICAST_BOT'} so other group members cannot see your transaction!`,
          messageId
        );
        return NextResponse.json({ ok: true });
      }

      const photo = message.photo[message.photo.length - 1]; // highest resolution
      const fileId = photo.file_id;
      const caption = (message.caption || '').trim();

      try {
        const fileRes = await fetch(`${TELEGRAM_API_URL}/getFile?file_id=${fileId}`);
        const fileData = await fileRes.json();
        const filePath = fileData?.result?.file_path;
        const directScreenshotUrl = filePath ? `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}` : '';

        // Extract possible 12-digit UTR from caption
        const utrMatch = caption.match(/\b\d{12}\b/);
        const utrNumber = utrMatch ? utrMatch[0] : (caption ? caption.slice(0, 50) : `TG-${message.from?.id || chatId}-${Date.now().toString().slice(-6)}`);

        // Check user session
        const { adminDb } = await import('@/lib/firebase/admin');
        const sessionDoc = await adminDb.doc(`telegram_sessions/${chatId}`).get();
        const sessionData = sessionDoc.exists ? sessionDoc.data() : null;

        const workspaceId = sessionData?.workspaceId || `tg_${message.from?.id || chatId}`;
        const planId = sessionData?.planId || 'pro';
        const planName = sessionData?.planName || 'Pro Streamer (₹499)';
        const amount = planId === 'starter' ? 149 : planId === 'studio' ? 999 : 499;

        const paymentId = `pay_tg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const now = new Date().toISOString();

        const paymentRecord = {
          id: paymentId,
          workspaceId,
          workspaceName: message.from?.first_name ? `${message.from.first_name} (Telegram)` : 'Telegram User',
          userUid: `tg_${message.from?.id || chatId}`,
          userEmail: message.from?.username ? `@${message.from.username}` : `tg_${message.from?.id || chatId}`,
          telegramChatId: String(chatId),
          telegramUsername: message.from?.username || '',
          telegramUserId: message.from?.id || null,
          planId,
          planName,
          amount,
          currency: 'INR',
          receiverUpiId: 'priyadarshankishnawat@ybl',
          utrNumber,
          note: caption || 'Submitted via Telegram bot private chat',
          screenshotUrl: directScreenshotUrl,
          submittedVia: 'telegram_bot',
          status: 'pending_verification',
          createdAt: now,
          updatedAt: now,
          verifiedAt: null,
          verifiedBy: null,
        };

        // Save in global payments collection for GodPanel
        await adminDb.collection('payments').doc(paymentId).set(paymentRecord);
        if (workspaceId && !workspaceId.startsWith('tg_')) {
          await adminDb.doc(`workspaces/${workspaceId}/payments/${paymentId}`).set(paymentRecord);
        }

        const replyMsg = `
✅ <b>Payment Screenshot Received!</b>

• <b>Receipt Image:</b> Captured & Uploaded
• <b>Reference / UTR:</b> <code>${utrNumber}</code>
• <b>Plan:</b> ${planName}
• <b>Status:</b> 🟡 <b>Pending Admin Verification</b>

🛡️ <b>Privacy Guarantee:</b>
Your payment receipt is stored privately and is only visible to the Digicast Administrator in the GodPanel.

Our team will verify this against the UPI account and activate your subscription shortly!
        `.trim();

        await sendTelegramMessage(chatId, replyMsg, messageId);
      } catch (err) {
        console.error('[telegram/webhook] Error processing payment photo:', err);
        await sendTelegramMessage(
          chatId,
          '❌ Could not process payment screenshot. Please try sending again or submit via the web dashboard.',
          messageId
        );
      }
      return NextResponse.json({ ok: true });
    }

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
      // Check if start is for payment (e.g. /start pay_WS123_pro)
      if (args && args.toLowerCase().startsWith('pay_')) {
        const parts = args.split('_');
        const wsId = parts[1] || '';
        const planId = parts[2] || 'pro';
        const planName = planId === 'starter' ? 'Starter Creator (₹149)' : planId === 'studio' ? 'Studio VIP (₹999)' : 'Pro Streamer (₹499)';

        try {
          const { adminDb } = await import('@/lib/firebase/admin');
          await adminDb.doc(`telegram_sessions/${chatId}`).set({
            chatId: String(chatId),
            workspaceId: wsId,
            planId,
            planName,
            updatedAt: new Date().toISOString(),
          }, { merge: true });

          const msg = `
💳 <b>Digicast Subscription Payment</b>

• <b>Plan:</b> ${planName}
• <b>Workspace ID:</b> <code>${wsId}</code>
• <b>Receiver UPI:</b> <code>priyadarshankishnawat@ybl</code>

📸 <b>Please reply with your Payment Screenshot now.</b>
<i>Include your 12-digit UTR in the photo caption!</i>

🔒 <i>Notice: This 1-on-1 private chat is strictly confidential. No other users can see your payment details.</i>
          `.trim();
          await sendTelegramMessage(chatId, msg, messageId);
          return NextResponse.json({ ok: true });
        } catch (e) {
          console.error('[telegram/webhook] pay_ session error:', e);
        }
      }

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
