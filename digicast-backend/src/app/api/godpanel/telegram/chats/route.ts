// src/app/api/godpanel/telegram/chats/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    const { adminDb } = await import('@/lib/firebase/admin');

    if (chatId) {
      // Fetch messages for a specific chat
      const messagesSnap = await adminDb
        .collection('telegram_chats')
        .doc(chatId)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .limit(100)
        .get();

      const messages = messagesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch chat metadata
      const chatDoc = await adminDb.collection('telegram_chats').doc(chatId).get();
      const chatInfo = chatDoc.exists ? chatDoc.data() : null;

      // Mark unread as 0
      if (chatDoc.exists && (chatDoc.data()?.unreadCount || 0) > 0) {
        await adminDb.collection('telegram_chats').doc(chatId).update({ unreadCount: 0 });
      }

      return NextResponse.json({
        success: true,
        chat: chatInfo,
        messages,
      });
    }

    // List all chats
    const chatsSnap = await adminDb
      .collection('telegram_chats')
      .orderBy('lastMessageAt', 'desc')
      .limit(50)
      .get();

    const chats = chatsSnap.docs.map(doc => ({
      id: doc.id,
      chatId: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      chats,
    });
  } catch (error: any) {
    console.error('[godpanel/telegram/chats] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
