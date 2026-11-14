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

// Persist chat message for GodPanel live monitor
async function logChatMessage(adminDb: any, chatId: string | number, messageId: number | string, text: string, senderName: string, username: string, isCommand: boolean, chatTitle: string, chatType: string) {
  try {
    const now = new Date().toISOString();
    await adminDb
      .collection('telegram_chats')
      .doc(String(chatId))
      .collection('messages')
      .doc(String(messageId))
      .set({
        id: String(messageId),
        chatId: String(chatId),
        text,
        sender: 'user',
        senderName,
        username,
        timestamp: now,
        isCommand,
      }, { merge: true });

    const chatDoc = await adminDb.collection('telegram_chats').doc(String(chatId)).get();
    const curUnread = chatDoc.exists ? (chatDoc.data()?.unreadCount || 0) : 0;
    const isAiEnabled = chatDoc.exists ? (chatDoc.data()?.isAiEnabled ?? true) : true;

    await adminDb.collection('telegram_chats').doc(String(chatId)).set({
      chatId: String(chatId),
      chatTitle: chatType === 'private' ? `${senderName}${username ? ` (@${username})` : ''}` : chatTitle,
      chatType,
      username,
      lastMessage: text.slice(0, 150),
      lastMessageAt: now,
      unreadCount: curUnread + 1,
      isAiEnabled,
      updatedAt: now,
    }, { merge: true });
  } catch (e) {
    console.error('[telegram/webhook] logChatMessage error:', e);
  }
}

// Persist bot responses for GodPanel live monitor
async function logBotResponse(adminDb: any, chatId: string | number, text: string) {
  try {
    const now = new Date().toISOString();
    const docRef = adminDb.collection('telegram_chats').doc(String(chatId)).collection('messages').doc();
    await docRef.set({
      id: docRef.id,
      chatId: String(chatId),
      text,
      sender: 'bot',
      senderName: 'Digicast AI Assistant',
      timestamp: now,
    });
    await adminDb.collection('telegram_chats').doc(String(chatId)).set({
      lastMessage: `Bot: ${text.replace(/<[^>]*>?/gm, '').slice(0, 100)}`,
      lastMessageAt: now,
      updatedAt: now,
    }, { merge: true });
  } catch (e) {
    console.error('[telegram/webhook] logBotResponse error:', e);
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

    console.info(`[telegram/webhook] received message from chatId=${chatId}, type=${chatType}, command=/${command}`);

    const { adminDb, adminAuth } = await import('@/lib/firebase/admin');
    const { PRICING_PLANS } = await import('@/lib/pricingPlans');

    const senderName = message.from?.first_name || 'Creator';
    const username = message.from?.username || '';

    // Record incoming message for GodPanel live monitor
    if (chatId) {
      await logChatMessage(
        adminDb,
        chatId,
        messageId,
        rawText || (message.photo ? '[Payment Screenshot / Photo]' : '[Media Attachment]'),
        senderName,
        username,
        Boolean(command),
        chatTitle,
        chatType
      );
    }

    // ─── 1. Handling Payment Screenshot Photo (Private DM) ────────────────────
    if (message.photo && Array.isArray(message.photo) && message.photo.length > 0) {
      if (chatType !== 'private') {
        await sendTelegramMessage(
          chatId,
          `⚠️ <b>Privacy Warning:</b> Please send payment receipts directly in private DM to @${process.env.TELEGRAM_BOT_USERNAME || 'YT_digicast'} so other group members cannot see your transaction!`,
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
        const sessionDoc = await adminDb.doc(`telegram_sessions/${chatId}`).get();
        const sessionData = sessionDoc.exists ? sessionDoc.data() : null;

        const workspaceId = sessionData?.workspaceId || `tg_${message.from?.id || chatId}`;
        const planId = sessionData?.planId || 'pro';
        const targetPlan = PRICING_PLANS.find(p => p.id === planId) || PRICING_PLANS[1];
        const planName = targetPlan.name;
        const amount = targetPlan.priceINR;
        const userEmail = sessionData?.userEmail || (message.from?.username ? `@${message.from.username}` : `Telegram User`);

        const paymentId = `pay_tg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const now = new Date().toISOString();

        const paymentRecord = {
          id: paymentId,
          workspaceId,
          workspaceName: sessionData?.workspaceName || (message.from?.first_name ? `${message.from.first_name} (Telegram)` : 'Telegram User'),
          userUid: sessionData?.userId || `tg_${message.from?.id || chatId}`,
          userEmail,
          telegramChatId: String(chatId),
          telegramUsername: message.from?.username || '',
          telegramUserId: message.from?.id || null,
          planId: targetPlan.id,
          planName: `${planName} (₹${amount})`,
          amount,
          currency: 'INR',
          receiverUpiId: 'dkigicast@ptyes',
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

        // Forward screenshot to Admin Payments Group if configured
        const paymentsChatId = process.env.TELEGRAM_PAYMENTS_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID;
        if (paymentsChatId) {
          const adminCaption = [
            `⚡ <b>NEW PAYMENT PROOF (VIA TELEGRAM BOT)</b>`,
            ``,
            `👤 <b>User:</b> <code>${userEmail}</code>`,
            `🆔 <b>Account ID:</b> <code>${paymentRecord.userUid}</code>`,
            `🏢 <b>Workspace:</b> <code>${paymentRecord.workspaceName}</code> (<code>${workspaceId}</code>)`,
            `📦 <b>Plan:</b> <b>${planName}</b> (₹${amount})`,
            `🔢 <b>UTR / Ref ID:</b> <code>${utrNumber}</code>`,
            caption ? `📝 <b>Caption:</b> ${caption}` : null,
            `⏰ <b>Time:</b> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
            ``,
            `👉 <i>Approve in GodPanel: /godpanel</i>`,
          ].filter(Boolean).join('\n');

          try {
            await fetch(`${TELEGRAM_API_URL}/sendPhoto`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: paymentsChatId,
                photo: fileId,
                caption: adminCaption,
                parse_mode: 'HTML',
              }),
            });
          } catch (e) {
            console.error('[telegram/webhook] Failed to forward photo to admin group:', e);
          }
        }

        const replyMsg = `
✅ <b>Payment Screenshot Received & Forwarded!</b>

• <b>Receipt Image:</b> Captured & Uploaded
• <b>Reference / UTR:</b> <code>${utrNumber}</code>
• <b>Plan:</b> ${planName} (₹${amount})
• <b>Status:</b> 🟡 <b>Pending Admin Verification</b>

🛡️ <b>Privacy Guarantee:</b>
Your payment receipt is stored privately and has been forwarded directly to the Digicast Administrator for immediate verification.

Our team will verify the payment and activate your subscription shortly!
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

    // ─── 2. Handle /chatid or /id command ────────────────────────────────────
    if (command === 'chatid' || command === 'id') {
      const response = `
🆔 <b>Chat ID:</b> <code>${chatId}</code>
🏷️ <b>Title:</b> <b>${chatTitle}</b>
👥 <b>Type:</b> <i>${chatType}</i>
      `.trim();
      await sendTelegramMessage(chatId, response, messageId);
    }

    // ─── 3. Handle /start command ───────────────────────────────────────────
    else if (command === 'start') {
      // Handle payment initiation link (e.g. /start pay_WS123_starter or /start pay_WS123_pro)
      if (args && args.toLowerCase().startsWith('pay_')) {
        const parts = args.split('_');
        const wsId = parts[1] || '';
        const planId = parts[2] || 'pro';
        const targetPlan = PRICING_PLANS.find(p => p.id === planId) || PRICING_PLANS[1];

        try {
          await adminDb.doc(`telegram_sessions/${chatId}`).set({
            chatId: String(chatId),
            workspaceId: wsId,
            planId: targetPlan.id,
            planName: targetPlan.name,
            updatedAt: new Date().toISOString(),
          }, { merge: true });

          const msg = `
💳 <b>Digicast Subscription Activation</b>

• <b>Plan:</b> <b>${targetPlan.name}</b> (₹${targetPlan.priceINR} ${targetPlan.periodLabel})
• <b>Workspace ID:</b> <code>${wsId || 'Pending'}</code>
• <b>Receiver UPI:</b> <code>dkigicast@ptyes</code>

📸 <b>Please send your Payment Screenshot / QR Receipt right here in this chat.</b>
<i>Tip: Include your 12-digit UTR in the photo caption or as a reply!</i>

🔒 <i>Notice: This 1-on-1 private chat is strictly confidential. Your screenshot is forwarded directly to the admin for instant activation.</i>
          `.trim();
          await sendTelegramMessage(chatId, msg, messageId);
          return NextResponse.json({ ok: true });
        } catch (e) {
          console.error('[telegram/webhook] pay_ session error:', e);
        }
      }

      // Check if connection code was passed (e.g. /start A8X91K)
      if (args && args.length >= 4 && !args.includes(' ')) {
        const code = args.toUpperCase();
        try {
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

Digicast is the real-time Live Intelligence & Instant Clip Delivery Platform for YouTube Creators.

<b>What I Can Do For You:</b>
• 💳 <b>Submit Payment Proof:</b> Send your payment screenshot in this chat for instant verification.
• 🔍 <b>Account Details Lookup:</b> Type your <b>Gmail address</b> or <b>Workspace ID</b> anytime to view your active plan and renewal status.
• ⚡ <b>Clip Notifications:</b> Add me to your team's group to receive instant stream markers & clip trims.

<b>Available Commands:</b>
• <code>/help</code> — Complete documentation & support guide
• <code>/chatid</code> — Get Chat ID of this group/channel
• <code>/status</code> — Check server connection & clip delivery health
      `.trim();
      await sendTelegramMessage(chatId, welcomeMessage, messageId);
    }

    // ─── 4. Handle /help command ────────────────────────────────────────────
    else if (command === 'help') {
      const helpMessage = `
📖 <b>Digicast Support & Help Menu:</b>

💳 <b>1. Instant Payment Verification:</b>
• Send your payment receipt screenshot directly in this chat!
• Include your 12-digit UPI UTR in the caption or text.
• Verified and approved by admin in GodPanel.

🔍 <b>2. Account & Plan Lookup:</b>
• Send your <b>Gmail address</b> (e.g. <code>creator@gmail.com</code>) or <b>Workspace ID</b> in this chat.
• I will fetch your account info, connected YouTube channel, active plan, and renewal date.

🎫 <b>3. Contact Support & Report Issues:</b>
• Send <code>/support &lt;your message&gt;</code> or simply describe your issue or concern here.
• Your ticket will be logged instantly and dispatched to our engineering team.

🤖 <b>4. Group Commands:</b>
• <code>/chatid</code> — Get this group or channel's Chat ID.
• <code>/status</code> — Check server connection & clip delivery health.
• <code>/help</code> — Show this help menu.

🌐 <b>Official Links & Support:</b>
• Pricing Passes: https://www.dieme.in/pricing
• Terms & Privacy: https://www.dieme.in/terms
• Privacy Policy: https://www.dieme.in/privacy

👨‍💻 <b>Official Telegram Bot:</b> @${process.env.TELEGRAM_BOT_USERNAME || 'YT_digicast'}
      `.trim();
      await sendTelegramMessage(chatId, helpMessage, messageId);
    }

    // ─── 5. Handle /support, /contact, /bug, /ticket commands ────────────────
    else if (['support', 'contact', 'bug', 'ticket'].includes(command)) {
      const userQuery = args || 'General Support Request';
      const ticketId = `tkt_${Date.now().toString().slice(-6)}`;
      const senderName = message.from?.first_name || message.from?.username || 'Creator';
      const senderUsername = message.from?.username ? `@${message.from.username}` : `ID: ${chatId}`;

      try {
        await adminDb.collection('support_tickets').doc(ticketId).set({
          id: ticketId,
          chatId: String(chatId),
          senderName,
          senderUsername,
          telegramUserId: message.from?.id || null,
          query: userQuery,
          commandUsed: command,
          status: 'open',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Forward to Admin Telegram Group
        const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_PAYMENTS_CHAT_ID;
        if (adminChatId) {
          const ticketAlert = [
            `🚨 <b>NEW SUPPORT TICKET (#${ticketId})</b>`,
            ``,
            `👤 <b>From:</b> ${senderName} (${senderUsername})`,
            `💬 <b>Concern / Query:</b>`,
            `<i>${userQuery}</i>`,
            ``,
            `⏰ <b>Received:</b> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
          ].join('\n');
          await sendTelegramMessage(adminChatId, ticketAlert);
        }
      } catch (ticketErr) {
        console.error('[telegram/webhook] failed to save ticket:', ticketErr);
      }

      const ticketResponse = `
🎫 <b>Support Ticket Registered (#${ticketId})</b>

Thank you <b>${senderName}</b>! Your concern has been recorded and dispatched to our support team.

📝 <b>Query Noted:</b> <i>"${userQuery}"</i>
⚡ <b>Status:</b> 🟡 Active / Under Review

💡 <i>Need immediate assistance with payment or account login? Send your <b>Gmail address</b> or <b>Payment Screenshot</b> directly in this chat for instant automated resolution!</i>
      `.trim();
      await sendTelegramMessage(chatId, ticketResponse, messageId);
    }

    // ─── 6. Handle /status command ──────────────────────────────────────────
    else if (command === 'status') {
      const statusMessage = `
⚡ <b>Digicast Status:</b>
🟢 <b>Bot Server:</b> Online & Operational
🤖 <b>Nightbot Webhook:</b> Active (24/7 Zero-Quota)
🆔 <b>Current Chat ID:</b> <code>${chatId}</code>
      `.trim();
      await sendTelegramMessage(chatId, statusMessage, messageId);
    }

    // ─── 6. User Account Identification (Gmail / Workspace ID / UTR query) ──
    else if (chatType === 'private' && rawText && !command) {
      // Check if message contains an email address, workspace ID, or 12-digit UTR
      const emailMatch = rawText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
      const utrMatch = rawText.match(/\b\d{12}\b/);
      const isWorkspaceId = rawText.startsWith('ws_') || (rawText.length >= 20 && !rawText.includes(' '));

      if (emailMatch || isWorkspaceId || utrMatch) {
        try {
          let userDoc: any = null;
          let wsDoc: any = null;
          let targetEmail = emailMatch ? emailMatch[0].toLowerCase() : '';
          let targetWsId = isWorkspaceId ? rawText.trim() : '';

          // 1. Search by email
          if (targetEmail) {
            const userQuerySnap = await adminDb
              .collection('users')
              .where('email', '==', targetEmail)
              .limit(1)
              .get();

            if (!userQuerySnap.empty) {
              userDoc = userQuerySnap.docs[0];
            } else {
              // Try searching workspaces by ownerEmail
              const wsQuerySnap = await adminDb
                .collection('workspaces')
                .where('ownerEmail', '==', targetEmail)
                .limit(1)
                .get();
              if (!wsQuerySnap.empty) {
                wsDoc = wsQuerySnap.docs[0];
              }
            }
          }

          // 2. Search by workspace ID
          if (!wsDoc && targetWsId) {
            const directWs = await adminDb.doc(`workspaces/${targetWsId}`).get();
            if (directWs.exists) {
              wsDoc = directWs;
            }
          }

          if (userDoc && !wsDoc) {
            const userData = userDoc.data();
            const wid = userData.defaultWorkspaceId || userDoc.id;
            const directWs = await adminDb.doc(`workspaces/${wid}`).get();
            if (directWs.exists) wsDoc = directWs;
          }

          if (wsDoc || userDoc) {
            const wsData = wsDoc?.data() || {};
            const userData = userDoc?.data() || {};
            const finalWsId = wsDoc ? wsDoc.id : (userData.defaultWorkspaceId || userDoc.id);
            const finalEmail = userData.email || wsData.ownerEmail || targetEmail;
            const finalUid = userDoc ? userDoc.id : (wsData.ownerUid || 'N/A');
            const wsName = wsData.name || userData.displayName || 'Creator Studio';

            // Check active subscription
            const rawPlan = (wsData.plan || wsData.subscription || 'free_trial').toLowerCase();
            const planObj = PRICING_PLANS.find(p => p.id === rawPlan);
            const planName = planObj ? planObj.name : rawPlan === 'free_trial' ? '14-Day Free Trial' : rawPlan;

            let statusText = '🟢 Active';
            let expiresText = 'Active';
            if (wsData.subscriptionExpiresAt) {
              const expDate = new Date(wsData.subscriptionExpiresAt);
              const now = Date.now();
              const daysLeft = Math.max(0, Math.ceil((expDate.getTime() - now) / (24 * 60 * 60 * 1000)));
              if (now > expDate.getTime()) {
                statusText = '🔴 Expired';
                expiresText = `Expired on ${expDate.toLocaleDateString('en-IN')}`;
              } else {
                expiresText = `Renews on ${expDate.toLocaleDateString('en-IN')} (${daysLeft} days left)`;
              }
            } else if (wsData.trialEndsAt) {
              const trialDate = new Date(wsData.trialEndsAt);
              expiresText = `Trial ends on ${trialDate.toLocaleDateString('en-IN')}`;
            }

            // Check connected YouTube channel
            let channelTitle = 'None connected';
            try {
              const ytSnap = await adminDb.collection(`workspaces/${finalWsId}/youtube`).limit(1).get();
              if (!ytSnap.empty) {
                channelTitle = ytSnap.docs[0].data().channelName || ytSnap.docs[0].data().channelTitle || 'Connected';
              }
            } catch {}

            // Check latest payment
            let latestPaymentStr = 'No payments on file';
            try {
              const paySnap = await adminDb
                .collection('payments')
                .where('workspaceId', '==', finalWsId)
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();

              if (!paySnap.empty) {
                const payData = paySnap.docs[0].data();
                latestPaymentStr = `₹${payData.amount} (${payData.planName}) — ${payData.status === 'approved' ? '🟢 Approved' : payData.status === 'rejected' ? '🔴 Rejected' : '🟡 Pending Verification'}`;
              }
            } catch {}

            // Link user document in Firestore
            if (userDoc) {
              await adminDb.collection('users').doc(userDoc.id).set({
                telegramChatId: String(chatId),
                telegramUsername: username || '',
                telegramLinkedAt: new Date().toISOString(),
              }, { merge: true });
            }

            // Save session so user can upload payment directly
            await adminDb.doc(`telegram_sessions/${chatId}`).set({
              chatId: String(chatId),
              workspaceId: finalWsId,
              workspaceName: wsName,
              userEmail: finalEmail,
              userId: finalUid,
              planId: rawPlan,
              planName,
              updatedAt: new Date().toISOString(),
            }, { merge: true });

            // Sync with GodPanel chat thread
            await adminDb.collection('telegram_chats').doc(String(chatId)).set({
              userEmail: finalEmail,
              userId: finalUid,
              workspaceId: finalWsId,
              workspaceName: wsName,
              planName,
              updatedAt: new Date().toISOString(),
            }, { merge: true });

            const infoCard = `
👤 <b>Digicast Account Connected & Verified</b>

📧 <b>Gmail / Email:</b> <code>${finalEmail}</code>
🆔 <b>Account ID:</b> <code>${finalUid}</code>
🏢 <b>Workspace:</b> <b>${wsName}</b> (<code>${finalWsId}</code>)
📦 <b>Active Plan:</b> <b>${planName}</b>
⏳ <b>Subscription Status:</b> ${statusText}
📅 <b>Validity:</b> ${expiresText}
📺 <b>Connected YouTube:</b> <b>${channelTitle}</b>
💳 <b>Recent Payment:</b> ${latestPaymentStr}

💬 <i>Your account is now linked! You can ask any question, or send your payment screenshot / UTR to activate or renew anytime!</i>
            `.trim();

            await sendTelegramMessage(chatId, infoCard, messageId);
            await logBotResponse(adminDb, chatId, infoCard);
            return NextResponse.json({ ok: true });
          } else {
            const notFoundMsg = `🔍 Could not find an active Dieme account for <code>${targetEmail || targetWsId}</code>.\n\nPlease double check the email address or sign in at https://www.dieme.in`;
            await sendTelegramMessage(chatId, notFoundMsg, messageId);
            await logBotResponse(adminDb, chatId, notFoundMsg);
            return NextResponse.json({ ok: true });
          }
        } catch (queryErr) {
          console.error('[telegram/webhook] account lookup error:', queryErr);
        }
      }

      // ─── Intelligent Groq AI Fallback with Dynamic Knowledge Base ─────────
      try {
        // SM-9: 500ms Firestore propagation grace delay to prevent race conditions with human admin replies
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Re-read fresh chat state
        const chatDoc = await adminDb.collection('telegram_chats').doc(String(chatId)).get();
        const chatData = chatDoc.exists ? chatDoc.data() : null;
        const isAiEnabled = chatData?.isAiEnabled ?? true;

        if (!isAiEnabled) {
          console.info(`[telegram/webhook] AI disabled for chatId=${chatId}, waiting for admin reply`);
          return NextResponse.json({ ok: true });
        }

        // Check if a human admin recently replied (15-minute takeover grace window)
        const lastAdminReplyTime = chatData?.lastAdminReplyAt
          ? (typeof chatData.lastAdminReplyAt === 'number'
              ? chatData.lastAdminReplyAt
              : Date.parse(chatData.lastAdminReplyAt))
          : 0;
        const ADMIN_RECENCY_WINDOW_MS = 15 * 60 * 1000;

        if (lastAdminReplyTime && Date.now() - lastAdminReplyTime < ADMIN_RECENCY_WINDOW_MS) {
          console.info(
            `[telegram/webhook] Human admin active on chatId=${chatId} (${Math.round((Date.now() - lastAdminReplyTime) / 1000)}s ago) - suppressing AI reply.`
          );
          return NextResponse.json({ ok: true, skippedAi: true, reason: 'human_admin_active' });
        }

        // Fetch user session context if linked
        const sessionDoc = await adminDb.doc(`telegram_sessions/${chatId}`).get();
        const sessionData = sessionDoc.exists ? sessionDoc.data() : null;

        let userContext: any = null;
        if (sessionData?.userEmail || sessionData?.userId) {
          let dCoins = 0;
          let dp = 0;
          try {
            const wDoc = await adminDb.doc(`wallets/${sessionData.userId || sessionData.workspaceId}`).get();
            if (wDoc.exists) {
              dCoins = wDoc.data()?.dCoinsBalance || 0;
              dp = wDoc.data()?.dpBalance || 0;
            }
          } catch {}

          userContext = {
            email: sessionData.userEmail,
            userId: sessionData.userId,
            workspaceName: sessionData.workspaceName,
            planName: sessionData.planName,
            isTrialActive: sessionData.planId === 'free_trial' || sessionData.planId === 'free',
            dCoinsBalance: dCoins,
            dpBalance: dp,
          };
        }

        // Fetch trained Q&A knowledge base rules from Firestore
        let knowledgeBase: any[] = [];
        try {
          const kbSnap = await adminDb
            .collection('telegram_training_kb')
            .where('active', '==', true)
            .limit(30)
            .get();
          knowledgeBase = kbSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (kbErr) {
          console.warn('[telegram/webhook] Failed to load KB:', kbErr);
        }

        // Fetch last 6 conversation messages for memory
        let history: any[] = [];
        try {
          const historySnap = await adminDb
            .collection('telegram_chats')
            .doc(String(chatId))
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(6)
            .get();
          history = historySnap.docs.reverse().map(d => ({
            sender: d.data().sender,
            text: d.data().text,
          }));
        } catch {}

        // Call Groq AI Assistant
        const { askGroqAI } = await import('@/lib/groqClient');
        let aiReply = await askGroqAI({
          userPrompt: rawText,
          conversationHistory: history,
          userContext,
          knowledgeBase,
        });

        // If user is unlinked, append helpful email linking hint
        if (!sessionData?.userEmail) {
          aiReply += `\n\n💡 <i><b>Account Link:</b> Reply with your registered Digicast email address anytime to check your active plan and D-Coins!</i>`;
        }

        await sendTelegramMessage(chatId, aiReply, messageId);
        await logBotResponse(adminDb, chatId, aiReply);
      } catch (aiErr: any) {
        console.error('[telegram/webhook] Groq AI fallback error:', aiErr);
        const fallbackMsg = `👋 <b>How can I help you?</b>\n\n• <b>Look Up Account:</b> Reply with your <b>Gmail address</b>.\n• <b>Activate Pass:</b> Send your UPI payment screenshot with 12-digit UTR.\n• <b>Commands:</b> Type <code>/help</code> for all features.`;
        await sendTelegramMessage(chatId, fallbackMsg, messageId);
        await logBotResponse(adminDb, chatId, fallbackMsg);
      }
    }

    // ─── 7. When Bot is added to a new group ────────────────────────────────
    if (message.new_chat_members && Array.isArray(message.new_chat_members)) {
      const isBotAdded = message.new_chat_members.some((m: any) => m.is_bot && (
        m.username?.toLowerCase() === 'yt_digicast' ||
        m.username?.toLowerCase() === 'digicast_bot' ||
        m.username?.toLowerCase() === (process.env.TELEGRAM_BOT_USERNAME || '').toLowerCase()
      ));
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
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'www.dieme.in';
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
