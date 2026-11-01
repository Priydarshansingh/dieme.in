import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";

export const dynamic = "force-dynamic";

async function getCaller(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    try {
      const decoded = await adminAuth.verifyIdToken(authHeader.split("Bearer ")[1]);
      return { uid: decoded.uid, email: decoded.email || "" };
    } catch {
      // Fall through
    }
  }

  const headerUid = req.headers.get("x-user-uid");
  const headerEmail = req.headers.get("x-user-email");
  if (headerUid) {
    return { uid: headerUid, email: headerEmail || "" };
  }

  return null;
}

// GET /api/youtube/status
// Server-side authoritative check for connected YouTube channel and workspace details.
export async function GET(req: NextRequest) {
  try {
    const caller = await getCaller(req);
    const { searchParams } = new URL(req.url);
    let requestedWid = searchParams.get("workspaceId");

    let actualWorkspaceId = requestedWid || (caller ? caller.uid : null);

    if (!actualWorkspaceId && !caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve user's canonical default workspace if available
    if (caller) {
      try {
        const userDoc = await adminDb.doc(col.user(caller.uid)).get();
        if (userDoc.exists) {
          const defaultWid = userDoc.data()?.defaultWorkspaceId;
          if (defaultWid) actualWorkspaceId = defaultWid;
        }
      } catch (err) {
        console.warn("[youtube/status] user doc resolve note:", err);
      }
    }

    if (!actualWorkspaceId) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 400 });
    }

    // 1. Fetch Workspace Profile
    let wsData: any = {};
    try {
      const wsDoc = await adminDb.doc(col.workspace(actualWorkspaceId)).get();
      if (wsDoc.exists) {
        wsData = wsDoc.data() || {};
      } else {
        // Fallback by ownerUid query
        const snap = await adminDb
          .collection(col.workspaces())
          .where("ownerUid", "==", actualWorkspaceId)
          .limit(1)
          .get();
        if (!snap.empty) {
          actualWorkspaceId = snap.docs[0].id;
          wsData = snap.docs[0].data() || {};
        }
      }
    } catch (wsErr) {
      console.warn("[youtube/status] workspace read note:", wsErr);
    }

    // 2. Fetch Connected YouTube Channel
    let youtubeAccount: any = null;
    try {
      // Direct workspace query
      let ytSnap = await adminDb
        .collection(col.youtube(actualWorkspaceId))
        .where("connectionStatus", "==", "connected")
        .limit(1)
        .get();

      if (ytSnap.empty) {
        ytSnap = await adminDb
          .collection(col.youtube(actualWorkspaceId))
          .limit(1)
          .get();
      }

      // Check caller UID workspace if different
      if (ytSnap.empty && caller?.uid && caller.uid !== actualWorkspaceId) {
        const callerYtSnap = await adminDb
          .collection(col.youtube(caller.uid))
          .limit(1)
          .get();
        if (!callerYtSnap.empty) {
          ytSnap = callerYtSnap;
        }
      }

      // Check known primary account workspace if caller is owner
      if (ytSnap.empty && caller?.email === "pskishnawat133@gmail.com") {
        const masterSnap = await adminDb
          .collection(col.youtube("mdv4xDAiBdQAiyd04fymN3Y5yq52"))
          .limit(1)
          .get();
        if (!masterSnap.empty) {
          ytSnap = masterSnap;
        }
      }

      if (!ytSnap.empty) {
        const doc = ytSnap.docs[0];
        const data = doc.data();
        youtubeAccount = {
          id: doc.id,
          channelId: data.channelId || doc.id,
          channelName: data.channelName || "Connected YouTube Channel",
          channelThumbnail: data.channelThumbnail || "",
          connectionStatus: data.connectionStatus || "connected",
          connectedAt: data.connectedAt || null,
          workspaceId: actualWorkspaceId,
        };
      }
    } catch (ytErr) {
      console.warn("[youtube/status] youtube query note:", ytErr);
    }

    // 3. Count streams
    let streamsCount = 0;
    try {
      const sSnap = await adminDb
        .collection(col.streams(actualWorkspaceId))
        .limit(100)
        .get();
      streamsCount = sSnap.size;
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      success: true,
      workspaceId: actualWorkspaceId,
      workspaceName: wsData?.name || "Creator Studio",
      plan: wsData?.plan || wsData?.subscription || "free_trial",
      telegramConnected: Boolean(wsData?.telegramEnabled),
      telegramChatId: wsData?.telegramChatId || "",
      connected: Boolean(youtubeAccount),
      channel: youtubeAccount,
      streamsCount,
    });
  } catch (err: any) {
    console.error("[youtube/status] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
