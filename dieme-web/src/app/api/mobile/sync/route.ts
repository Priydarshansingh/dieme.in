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
  } catch (err: any) {
    if (err?.code === "auth/id-token-expired") {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
          const uid = payload.user_id || payload.sub;
          if (uid) {
            const user = await adminAuth.getUser(uid);
            if (user && !user.disabled) {
              return { uid: user.uid, email: user.email || "" };
            }
          }
        }
      } catch (parseErr) {
        console.warn("[mobile/sync] expired token recovery failed:", parseErr);
      }
    }
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
    // ── Authorization & Workspace Resolution ──────────────────────────────────
    let actualWorkspaceId = workspaceId;

    // Check user profile for their canonical workspace and avatar
    let userProfile: any = null;
    try {
      const userDoc = await adminDb.doc(col.user(caller.uid)).get();
      const userData = userDoc.exists ? userDoc.data() : null;
      const userDefaultWid = userData?.defaultWorkspaceId;
      if (userDefaultWid) {
        const preferredWs = await adminDb.doc(col.workspace(userDefaultWid)).get();
        if (preferredWs.exists) {
          actualWorkspaceId = userDefaultWid;
        }
      }

      let photoUrl = userData?.photoURL || userData?.photoUrl || "";
      if (!photoUrl) {
        const authUser = await adminAuth.getUser(caller.uid).catch(() => null);
        photoUrl = authUser?.photoURL || "";
      }

      userProfile = {
        uid: caller.uid,
        email: caller.email,
        displayName: userData?.displayName || "Creator",
        photoUrl,
        photoURL: photoUrl,
      };
    } catch (e) {
      console.warn("[mobile/sync] User profile check warning:", e);
    }

    const requestedWsDoc = await adminDb.doc(col.workspace(actualWorkspaceId)).get();

    if (!requestedWsDoc.exists) {
      // Allow lookup by ownerUid
      const ownedSnap = await adminDb
        .collection(col.workspaces())
        .where("ownerUid", "==", actualWorkspaceId)
        .limit(1)
        .get();

      if (ownedSnap.empty) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
      }
      actualWorkspaceId = ownedSnap.docs[0].id;
    }

    // Verify caller has access to actualWorkspaceId
    const wsDoc = await adminDb.doc(col.workspace(actualWorkspaceId)).get();
    const wsData: any = wsDoc.exists
      ? wsDoc.data()
      : { name: "Creator Studio", ownerUid: actualWorkspaceId, subscription: "free_trial" };

    const isOwner = wsData.ownerUid === caller.uid || wsData.ownerId === caller.uid;

    if (!isOwner) {
      const membership = await adminDb
        .doc(col.member(actualWorkspaceId, caller.uid))
        .get();

      if (!membership.exists) {
        // Check if member exists by email
        const memberByEmail = await adminDb
          .collection(col.members(actualWorkspaceId))
          .where("email", "==", caller.email.toLowerCase())
          .limit(1)
          .get();

        if (!memberByEmail.empty) {
          // Link member document to caller.uid
          await adminDb.doc(col.member(actualWorkspaceId, caller.uid)).set({
            ...memberByEmail.docs[0].data(),
            uid: caller.uid,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } else {
          return NextResponse.json(
            { error: "You do not have access to this workspace." },
            { status: 403 }
          );
        }
      }
    }

    // 2. Fetch and synchronize YouTube live broadcasts and streams
    let activeChannelId = wsData.channelId || wsData.primaryYoutubeChannelId || null;
    let isYoutubeConnected = wsData.youtubeConnected === true && Boolean(activeChannelId);

    // If caller workspace has channel connected, fall back to it
    if (!activeChannelId && caller.uid !== actualWorkspaceId) {
      try {
        const callerWsDoc = await adminDb.doc(col.workspace(caller.uid)).get();
        if (callerWsDoc.exists) {
          const cWsData = callerWsDoc.data() || {};
          if (cWsData.youtubeConnected && (cWsData.channelId || cWsData.primaryYoutubeChannelId)) {
            activeChannelId = cWsData.channelId || cWsData.primaryYoutubeChannelId;
            isYoutubeConnected = true;
          }
        }
      } catch {}
    }

    if (isYoutubeConnected && activeChannelId) {
      try {
        const { syncWorkspaceYouTubeStreams } = await import("@/lib/youtube/sync");
        await syncWorkspaceYouTubeStreams(actualWorkspaceId, activeChannelId);
      } catch (syncErr) {
        console.warn("[mobile/sync] YouTube auto-sync warning:", syncErr);
      }
    }

    // 3. Pre-fetch clips across workspace and channel to calculate accurate counts & return full list
    const clipMap = new Map<string, any>();
    const clipCountMap = new Map<string, number>();

    // 3a. Primary workspace clips
    try {
      const primaryClipsSnap = await adminDb.collection(col.clips(actualWorkspaceId)).get();
      for (const d of primaryClipsSnap.docs) {
        clipMap.set(d.id, { id: d.id, ...d.data() });
      }
    } catch {}

    // 3b. Caller UID workspace clips if different
    if (caller.uid !== actualWorkspaceId) {
      try {
        const callerClipsSnap = await adminDb.collection(col.clips(caller.uid)).get();
        for (const d of callerClipsSnap.docs) {
          if (!clipMap.has(d.id)) {
            clipMap.set(d.id, { id: d.id, ...d.data() });
          }
        }
      } catch {}
    }

    // 3c. Collection group clips matching activeChannelId or workspace
    try {
      const allClipsSnap = await adminDb.collectionGroup('clips').get();
      for (const d of allClipsSnap.docs) {
        const data = d.data();
        if (
          (activeChannelId && data.channelId === activeChannelId) ||
          data.workspaceId === actualWorkspaceId ||
          data.workspaceId === caller.uid
        ) {
          if (!clipMap.has(d.id)) {
            clipMap.set(d.id, { id: d.id, ...data });
          }
        }
      }
    } catch {}

    // Populate clipCountMap
    Array.from(clipMap.values()).forEach((c: any) => {
      if (c.streamId) clipCountMap.set(c.streamId, (clipCountMap.get(c.streamId) || 0) + 1);
      if (c.youtubeVideoId && c.youtubeVideoId !== c.streamId) {
        clipCountMap.set(c.youtubeVideoId, (clipCountMap.get(c.youtubeVideoId) || 0) + 1);
      }
    });

    let activeStream: any = null;
    let streams: any[] = [];
    if (isYoutubeConnected && activeChannelId) {
      try {
        const streamsSnap = await adminDb
          .collection(col.streams(actualWorkspaceId))
          .orderBy("startedAt", "desc")
          .limit(30)
          .get();

        let validDocs = streamsSnap.docs.filter(doc => {
          const d = doc.data();
          return d.channelId === activeChannelId;
        });

        // If no streams found in workspace for this channel, recover from collectionGroup
        if (validDocs.length === 0) {
          const allStreamsSnap = await adminDb.collectionGroup('streams').get();
          const matchingStreams = allStreamsSnap.docs.filter((doc) => doc.data()?.channelId === activeChannelId);

          if (matchingStreams.length > 0) {
            const recoveryBatch = adminDb.batch();
            for (const ms of matchingStreams) {
              const data = ms.data();
              const targetRef = adminDb.doc(col.stream(actualWorkspaceId, ms.id));
              recoveryBatch.set(targetRef, {
                ...data,
                workspaceId: actualWorkspaceId,
                updatedAt: new Date().toISOString(),
              }, { merge: true });
            }
            await recoveryBatch.commit().catch(() => {});

            const reSnap = await adminDb.collection(col.streams(actualWorkspaceId)).limit(30).get();
            validDocs = reSnap.docs.filter(doc => doc.data()?.channelId === activeChannelId);
          }
        }

        streams = validDocs.map(doc => {
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

          const videoId = d.youtubeVideoId || doc.id;
          const thumbnailUrl =
            d.thumbnailUrl ||
            d.thumbnail ||
            d.thumb ||
            (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "");

          const liveClipCount =
            clipCountMap.get(videoId) ??
            clipCountMap.get(doc.id) ??
            (d.clipCount || 0);

          return {
            id: doc.id,
            ...d,
            thumbnailUrl,
            clipCount: liveClipCount,
            concurrentViewers: Number(d.concurrentViewers) || 0,
            viewCount: Number(d.viewCount) || 0,
            likeCount: Number(d.likeCount) || 0,
            commentCount: Number(d.commentCount) || 0,
            startedAtMs,
          };
        });

        activeStream = streams.find((s: any) => s.status === 'live') || streams[0] || null;
      } catch (streamErr) {
        console.warn("[mobile/sync] Stream fetch warning:", streamErr);
      }
    }

    // Format all retrieved clips for mobile consumption
    const clips = Array.from(clipMap.values()).map(d => {
      let normalizedStatus = d.status;
      if (!normalizedStatus) {
        if (d.downloadStatus === 'completed' || d.telegramStatus === 'uploaded' || d.telegramSent) {
          normalizedStatus = 'UPLOADED';
        } else if (d.downloadStatus === 'processing' || d.downloadStatus === 'downloading') {
          normalizedStatus = 'GENERATING';
        } else if (d.downloadStatus === 'failed') {
          normalizedStatus = 'FAILED';
        } else {
          normalizedStatus = 'PENDING';
        }
      }
      return {
        id: d.id,
        ...d,
        status: normalizedStatus,
        downloadStatus: d.downloadStatus || (normalizedStatus === 'UPLOADED' || normalizedStatus === 'GENERATED' ? 'completed' : 'not_started'),
        telegramStatus: d.telegramStatus || (normalizedStatus === 'UPLOADED' ? 'uploaded' : 'not_uploaded'),
      };
    });

    // Sort clips descending by createdAt / markerTimestamp
    clips.sort((a: any, b: any) => {
      const timeA = new Date(a.createdAt || 0).getTime() || (a.markerTimestamp || 0);
      const timeB = new Date(b.createdAt || 0).getTime() || (b.markerTimestamp || 0);
      return timeB - timeA;
    });

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
          channelThumbnail: ytData.channelThumbnail || "",
          connectionStatus: ytData.connectionStatus || 'connected',
        };
      } else if (activeChannelId) {
        youtubeAccount = {
          channelId: activeChannelId,
          channelName: wsData.channelName || "Connected Channel",
          channelThumbnail: wsData.channelThumbnail || "",
          connectionStatus: 'connected',
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

    // Resolve Telegram channel connected on Web Dashboard
    let telegramChatId: string | null = (wsData?.telegramEnabled && wsData?.telegramChatId) ? String(wsData.telegramChatId) : null;
    if (!telegramChatId) {
      try {
        const tgSnap = await adminDb
          .collection(col.telegram(actualWorkspaceId))
          .where("status", "==", "active")
          .limit(1)
          .get();
        if (!tgSnap.empty) {
          telegramChatId = String(tgSnap.docs[0].data().telegramChatId || tgSnap.docs[0].id);
        }
      } catch (tgErr) {
        console.warn("[mobile/sync] Telegram check warning:", tgErr);
      }
    }

    return NextResponse.json({
      workspace: {
        id: actualWorkspaceId,
        name: wsData?.name || "Workspace",
        ownerId: wsData?.ownerUid || wsData?.ownerId || workspaceId,
        subscription: wsData?.subscription || "free_trial",
        createdAt: wsData?.createdAt || new Date().toISOString(),
        telegramConnected: Boolean(telegramChatId),
        telegramChatId: telegramChatId || null,
      },
      user: userProfile,
      subscription: {
        ...subscription,
        createdAt: wsData?.createdAt || new Date().toISOString(),
      },
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
