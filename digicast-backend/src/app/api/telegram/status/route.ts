import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let workspaceId = searchParams.get("workspaceId");

  try {
    if (!workspaceId) {
      const wsSnap = await adminDb.collection("workspaces").limit(1).get();
      if (!wsSnap.empty) {
        workspaceId = wsSnap.docs[0].id;
      }
    }

    if (!workspaceId) {
      return NextResponse.json({
        connected: false,
        telegramChatId: null,
        message: "No workspace found. Please log in or connect in Web Dashboard.",
      });
    }
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
