import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json({ success: true, videoId: "", totalCount: 0, returnedCount: 0, messages: [] });
  }
  const offsetSec = searchParams.get("offsetSec") ? parseInt(searchParams.get("offsetSec")!, 10) : null;
  const windowSec = searchParams.get("windowSec") ? parseInt(searchParams.get("windowSec")!, 10) : 120; // 2 min window default

  try {
    let messages: any[] = [];

    // 1. Check local public asset store for real recorded stream chat
    const assetPath = path.join(process.cwd(), "public", "assets", `real_chat_${videoId}.json`);
    if (fs.existsSync(assetPath)) {
      const raw = fs.readFileSync(assetPath, "utf-8");
      messages = JSON.parse(raw);
    }

    // 2. Filter by offset window if specified
    let filtered = messages;
    if (offsetSec !== null && messages.length > 0) {
      const minSec = Math.max(0, offsetSec - windowSec);
      const maxSec = offsetSec + windowSec;
      filtered = messages.filter(
        (m: any) => m.offsetSec !== undefined && m.offsetSec >= minSec && m.offsetSec <= maxSec
      );

      // If exact window returned too few, widen to at least nearest 25 messages
      if (filtered.length < 10 && messages.length > 0) {
        filtered = [...messages].sort(
          (a, b) => Math.abs((a.offsetSec || 0) - offsetSec) - Math.abs((b.offsetSec || 0) - offsetSec)
        ).slice(0, 30).sort((a, b) => (a.offsetSec || 0) - (b.offsetSec || 0));
      }
    }

    return NextResponse.json({
      success: true,
      videoId,
      totalCount: messages.length,
      returnedCount: filtered.length,
      offsetSec,
      messages: filtered,
    });
  } catch (error: any) {
    console.error("[api/youtube/chat] Error fetching real chat:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch stream chat" },
      { status: 500 }
    );
  }
}

