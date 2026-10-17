// src/app/api/godpanel/telegram/training/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { adminDb } = await import('@/lib/firebase/admin');

    const snap = await adminDb
      .collection('telegram_training_kb')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const items = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error: any) {
    console.error('[godpanel/telegram/training] GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, id, questionOrTopic, answerOrDirective, category, active } = body;

    const { adminDb } = await import('@/lib/firebase/admin');
    const collectionRef = adminDb.collection('telegram_training_kb');

    // 1. Delete item
    if (action === 'delete') {
      if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
      await collectionRef.doc(id).delete();
      return NextResponse.json({ success: true, message: 'Training item deleted' });
    }

    // 2. Toggle active
    if (action === 'toggle_active') {
      if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
      await collectionRef.doc(id).set({
        active: Boolean(active),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return NextResponse.json({ success: true, message: 'Status updated' });
    }

    // 3. Create or Edit Training Item
    if (!questionOrTopic || !answerOrDirective) {
      return NextResponse.json({ success: false, error: 'questionOrTopic and answerOrDirective are required' }, { status: 400 });
    }

    const docRef = id ? collectionRef.doc(id) : collectionRef.doc();
    const now = new Date().toISOString();

    const data = {
      id: docRef.id,
      questionOrTopic: questionOrTopic.trim(),
      answerOrDirective: answerOrDirective.trim(),
      category: category ? category.trim() : 'General',
      active: active !== undefined ? Boolean(active) : true,
      updatedAt: now,
      ...(id ? {} : { createdAt: now }),
    };

    await docRef.set(data, { merge: true });

    return NextResponse.json({
      success: true,
      item: data,
      message: id ? 'Training item updated successfully' : 'New training item added to Bot Knowledge Base',
    });
  } catch (error: any) {
    console.error('[godpanel/telegram/training] POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
