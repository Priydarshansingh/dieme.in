// POST /api/telegram/send
// Sends a clip notification message to a connected Telegram group.
// The bot token NEVER leaves the server — this is the secure relay.

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export async function POST(req: NextRequest) {
  // Authenticate the caller — must be a signed-in Digicast user
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { workspaceId, clipId, message } = body;

  if (!workspaceId || !clipId || !message) {
    return NextResponse.json({ error: "workspaceId, clipId and message are required" }, { status: 400 });
  }

  // Verify caller is a member of this workspace
  const memberDoc = await adminDb.doc(col.member(workspaceId, uid)).get();
  if (!memberDoc.exists) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check Telegram permission for this member
  const memberData = memberDoc.data();
  if (!memberData?.permissions?.telegramUpload && memberData?.role !== "owner") {
    return NextResponse.json({ error: "This user does not have Telegram upload permission" }, { status: 403 });
  }

  // Fetch the active Telegram connection for this workspace
  const telegramSnap = await adminDb
    .collection(col.telegram(workspaceId))
    .where("status", "==", "active")
    .limit(1)
    .get();

  if (telegramSnap.empty) {
    return NextResponse.json({ error: "No active Telegram group connected to this workspace" }, { status: 404 });
  }

  const { telegramChatId } = telegramSnap.docs[0].data();

  if (!TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "Telegram bot token not configured on server" }, { status: 500 });
  }

  try {
    // Send text notification to the Telegram group
    const telegramRes = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: "HTML",
        disable_notification: false,
      }),
    });

    const telegramData = await telegramRes.json();

    if (!telegramData.ok) {
      console.error("[telegram/send] Telegram API error:", telegramData.description);
      // Update clip telegram status to failed
      await adminDb.doc(col.clip(workspaceId, clipId)).update({ telegramStatus: "failed" });
      return NextResponse.json({ error: telegramData.description || "Telegram send failed" }, { status: 500 });
    }

    // Update clip Firestore record with sent status
    const messageId = telegramData.result.message_id;
    await adminDb.doc(col.clip(workspaceId, clipId)).update({
      telegramStatus: "uploaded",
    });

    // Write audit log entry
    await adminDb.collection(`workspaces/${workspaceId}/telegram_logs`).add({
      clipId,
      uploadedBy: uid,
      uploadedByName: memberData?.displayName || 'Unknown',
      uploadedAt: new Date().toISOString(),
      telegramMessageId: String(messageId),
      destinationChatId: String(telegramChatId),
      status: "success",
    });

    return NextResponse.json({ ok: true, messageId });
  } catch (err) {
    console.error("[telegram/send] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
