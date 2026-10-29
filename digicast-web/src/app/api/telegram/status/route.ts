import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  try {
    const wsDoc = await adminDb.doc(col.workspace(workspaceId)).get();
    const wsData = wsDoc.exists ? wsDoc.data() : null;

    let telegramChatId: string | null = (wsData?.telegramEnabled && wsData?.telegramChatId) ? String(wsData.telegramChatId) : null;

    if (!telegramChatId) {
      const tgSnap = await adminDb
        .collection(col.telegram(workspaceId))
        .where("status", "==", "active")
        .limit(1)
        .get();
      if (!tgSnap.empty) {
        telegramChatId = String(tgSnap.docs[0].data().telegramChatId || tgSnap.docs[0].id);
      }
    }

    if (!telegramChatId) {
      return NextResponse.json({
        connected: false,
        telegramChatId: null,
        message: "No active Telegram channel connected to this workspace in Web Dashboard.",
      });
    }

    return NextResponse.json({
      connected: true,
      telegramChatId,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || "digicast_bot",
    });
  } catch (error: any) {
    console.error("[telegram/status] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch telegram status" },
      { status: 500 }
    );
  }
}
