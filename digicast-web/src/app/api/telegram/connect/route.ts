// GET /api/telegram/connect
// Initiates the Telegram connection process by returning the bot username and connection code

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";

const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Token verification failed" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  // Generate a random 6-character connect code (e.g., A7X91K)
  const connectCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Store code in Firestore for the webhook to verify
  await adminDb.doc(`telegram_codes/${connectCode}`).set({
    workspaceId,
    connectedBy: uid,
    expiresAt,
  });

  return NextResponse.json({
    botUsername: TELEGRAM_BOT_USERNAME,
    connectCode,
    botUrl: `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${connectCode}`,
  });
}
