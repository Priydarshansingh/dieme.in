// src/app/api/godpanel/telegram/reply/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chatId, text, action, isAiEnabled } = body;

    if (!chatId) {
      return NextResponse.json({ success: false, error: 'chatId is required' }, { status: 400 });
    }

    const { adminDb } = await import('@/lib/firebase/admin');

    // 1. Action: Toggle AI mode
    if (action === 'toggle_ai') {
      await adminDb.collection('telegram_chats').doc(String(chatId)).set({
        isAiEnabled: Boolean(isAiEnabled),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      return NextResponse.json({
        success: true,
        isAiEnabled: Boolean(isAiEnabled),
        message: `AI mode is now ${isAiEnabled ? 'Enabled (Auto-Pilot)' : 'Paused (Manual Mode)'}`,
      });
    }

    // 2. Action: Send admin manual reply
    if (!text || !text.trim()) {
      return NextResponse.json({ success: false, error: 'text is required' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ success: false, error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 500 });
    }

    // Send via Telegram Bot API
    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `👨‍💼 <b>Support Admin:</b>\n\n${text.trim()}`,
        parse_mode: 'HTML',
      }),
    });

    const telegramData = await telegramRes.json();
    if (!telegramData.ok) {
      return NextResponse.json({ success: false, error: telegramData.description }, { status: 500 });
    }

    const now = new Date().toISOString();
    const messageDocRef = adminDb
      .collection('telegram_chats')
      .doc(String(chatId))
      .collection('messages')
      .doc();

    await messageDocRef.set({
      id: messageDocRef.id,
      chatId: String(chatId),
      text: text.trim(),
      sender: 'admin',
      senderName: 'Digicast Support Admin',
      timestamp: now,
    });

    // Update parent chat summary
    await adminDb.collection('telegram_chats').doc(String(chatId)).set({
      lastMessage: `Admin: ${text.trim()}`,
      lastMessageAt: now,
      updatedAt: now,
    }, { merge: true });

    return NextResponse.json({
      success: true,
      messageId: messageDocRef.id,
      sentAt: now,
    });
  } catch (error: any) {
    console.error('[godpanel/telegram/reply] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
