// GET /api/mobile/sync
// Secure synchronization endpoint for Digicast Android app.
// Fetches active stream, clip markers, and workspace profile for the authenticated user/editor.

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";
import { computeWorkspaceSubscription } from "@/lib/subscription";

async function verifyAuth(req: NextRequest): Promise<{ uid: string; email: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email || "" };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  // ── Authentication ────────────────────────────────────────────────────────
  // The token must be a Firebase ID token. A custom token will NOT verify here.
  const caller = await verifyAuth(req);
  if (!caller) {
    return NextResponse.json(
      { error: "Not authenticated. Please sign in again." },
      { status: 401 }
    );
  }

  try {
    // ── Authorization ───────────────────────────────────────────────────────
    // Resolve the real workspace first, then confirm the caller is a member of
    // it. Without this, any authenticated user could read any workspace's data
    // just by guessing its ID.
    const requestedWsDoc = await adminDb.doc(col.workspace(workspaceId)).get();
    let actualWorkspaceId = workspaceId;

    if (!requestedWsDoc.exists) {
      // Allow lookup by ownerUid (the app may send an owner UID instead of the
      // workspace doc ID for freshly-provisioned workspaces).
      const ownedSnap = await adminDb
        .collection(col.workspaces())
        .where("ownerUid", "==", workspaceId)
        .limit(1)
        .get();

      if (ownedSnap.empty) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
      actualWorkspaceId = ownedSnap.docs[0].id;
    }

    // Caller must be a member of the resolved workspace.
    const membership = await adminDb
      .doc(col.member(actualWorkspaceId, caller.uid))
      .get();

    if (!membership.exists) {
      const isOwner = await adminDb
        .collection(col.workspaces())
        .where("ownerUid", "==", caller.uid)
        .limit(1)
        .get();

      const ownsThisWorkspace =
        !isOwner.empty && isOwner.docs[0].id === actualWorkspaceId;

      if (!ownsThisWorkspace) {
        return NextResponse.json(
          { error: "You do not have access to this workspace." },
          { status: 403 }
        );
      }
    }

    // Re-read the canonical workspace doc for metadata.
    const wsDoc = await adminDb.doc(col.workspace(actualWorkspaceId)).get();
    let wsData: any = wsDoc.exists
      ? wsDoc.data()
      : { name: "Creator Studio", ownerUid: actualWorkspaceId, subscription: "free_trial" };

    // 2. Fetch active or latest stream for this workspace
    let activeStream: any = null;
    let streams: any[] = [];
    try {
      const streamsSnap = await adminDb
        .collection(col.streams(actualWorkspaceId))
        .orderBy("startedAt", "desc")
        .limit(25)
        .get();

      streams = streamsSnap.docs.map(doc => {
        const d = doc.data();
        let startedAtMs = Date.now();
        if (d.startedAt?._seconds) {
          startedAtMs = d.startedAt._seconds * 1000;
        } else if (typeof d.startedAt === "number") {
          startedAtMs = d.startedAt;
        } else if (typeof d.startedAt === "string") {
          const parsed = Date.parse(d.startedAt);
          if (!isNaN(parsed)) startedAtMs = parsed;
        }

        return {
          id: doc.id,
          ...d,
          startedAtMs,
        };
      });
      activeStream = streams.find((s: any) => s.status === 'live') || streams[0] || null;
    } catch (streamErr) {
      console.warn("[mobile/sync] Stream fetch warning:", streamErr);
    }

    // 3. Fetch recent clip markers for this workspace
    let clips: any[] = [];
    try {
      const clipsSnap = await adminDb
        .collection(col.clips(actualWorkspaceId))
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();

      clips = clipsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (clipErr) {
      console.warn("[mobile/sync] Clip fetch warning:", clipErr);
    }

    // 4. Fetch YouTube Account connection status
    let youtubeAccount: any = null;
    try {
      const ytSnap = await adminDb
        .collection(col.youtube(actualWorkspaceId))
        .limit(1)
        .get();

      if (!ytSnap.empty) {
        const ytDoc = ytSnap.docs[0];
        const ytData = ytDoc.data();
        youtubeAccount = {
          channelId: ytData.channelId,
          channelName: ytData.channelName,
          channelThumbnail: ytData.channelThumbnail,
          connectionStatus: ytData.connectionStatus || 'connected',
        };
      }
    } catch (ytErr) {
      console.warn("[mobile/sync] YouTube account fetch warning:", ytErr);
    }

    const subscription = computeWorkspaceSubscription(wsData);
    if (subscription.isExpired) {
      return NextResponse.json({
        error: "Your workspace trial or subscription has expired. Please renew your plan on the web dashboard to continue using the app.",
        isExpired: true,
        subscription,
      }, { status: 403 });
    }

    return NextResponse.json({
      workspace: {
        id: actualWorkspaceId,
        name: wsData?.name || "Workspace",
        ownerId: wsData?.ownerUid || wsData?.ownerId || workspaceId,
        subscription: wsData?.subscription || "free_trial",
      },
      subscription,
      youtubeAccount,
      activeStream,
      streams,
      clips,
      syncedAt: new Date().toISOString(),
    });

  } catch (err: any) {
    console.error("[mobile/sync] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to sync workspace data" }, { status: 500 });
  }
}
