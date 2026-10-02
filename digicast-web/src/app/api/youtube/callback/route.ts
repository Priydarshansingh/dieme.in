// GET /api/youtube/callback
// Handles Google/YouTube OAuth callback registered in Google Cloud Console.
// Supports both Web YouTube Account linking and Mobile Android deep-link authentication.

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";

function getBaseUrl(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const baseUrl = getBaseUrl(req);
  const redirectUri = `${baseUrl}/api/youtube/callback`;
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.json({ error: error || "Authorization error or missing code" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Server OAuth credentials missing" }, { status: 500 });
  }

  try {
    let decodedState: any = {};
    if (state) {
      try {
        decodedState = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
      } catch {
        decodedState = {};
      }
    }

    // ── 1. MOBILE ANDROID AUTHENTICATION FLOW ────────────────────────────────
    if (decodedState.source === "mobile_android") {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenRes.json();
      if (tokenData.error) {
        throw new Error(tokenData.error_description || "Failed to exchange authorization code with Google");
      }

      const { access_token } = tokenData;

      // Fetch user email & profile
      const userProfileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const profile = await userProfileRes.json();

      const email = (profile.email || "").toLowerCase().trim();
      const displayName = profile.name || email.split("@")[0] || "Digicast User";
      const photoURL = profile.picture || "";

      if (!email) {
        throw new Error("Unable to retrieve email from Google profile");
      }

      // Upsert user in Firebase Auth
      let uid: string;
      try {
        const existingUser = await adminAuth.getUserByEmail(email);
        uid = existingUser.uid;
      } catch {
        const newUser = await adminAuth.createUser({
          email,
          displayName,
          photoURL,
        });
        uid = newUser.uid;
      }

      // Save user profile to Firestore
      await adminDb.doc(col.user(uid)).set({
        uid,
        email,
        displayName,
        photoURL,
        lastLoginAt: new Date().toISOString(),
      }, { merge: true });

      // Generate Firebase Custom Token
      const customToken = await adminAuth.createCustomToken(uid, {
        email,
        displayName,
      });

      // Workspace & Editor Matching
      let activeWorkspaceId = decodedState.workspaceId || "";
      let activeWorkspaceName = "Personal Workspace";
      let role = "owner";

      if (!activeWorkspaceId) {
        const ownedSnap = await adminDb
          .collection(col.workspaces())
          .where("ownerId", "==", uid)
          .limit(1)
          .get();

        if (!ownedSnap.empty) {
          const doc = ownedSnap.docs[0];
          activeWorkspaceId = doc.id;
          activeWorkspaceName = doc.data().name || `${displayName}'s Workspace`;
          role = "owner";
        } else {
          try {
            const memberByEmailSnap = await adminDb
              .collectionGroup("members")
              .where("email", "==", email)
              .limit(1)
              .get();

            if (!memberByEmailSnap.empty) {
              const memberDoc = memberByEmailSnap.docs[0];
              const memberData = memberDoc.data();
              activeWorkspaceId = memberData.workspaceId || memberDoc.ref.parent.parent?.id || "";
              role = memberData.role || "editor";

              await memberDoc.ref.set({
                uid,
                displayName,
                photoURL,
                status: "active",
                updatedAt: new Date().toISOString(),
              }, { merge: true });

              if (activeWorkspaceId) {
                const wsDoc = await adminDb.doc(col.workspace(activeWorkspaceId)).get();
                if (wsDoc.exists) {
                  activeWorkspaceName = wsDoc.data()?.name || "Team Workspace";
                }
              }
            }
          } catch (idxErr) {
            console.warn("[youtube/callback] Member index query skipped:", idxErr);
          }
        }
      }

      if (!activeWorkspaceId) {
        activeWorkspaceId = `ws-${uid.substring(0, 8)}`;
        activeWorkspaceName = `${displayName}'s Workspace`;
        role = "owner";

        await adminDb.doc(col.workspace(activeWorkspaceId)).set({
          id: activeWorkspaceId,
          name: activeWorkspaceName,
          ownerId: uid,
          createdAt: new Date().toISOString(),
          subscription: "free_trial",
        });

        await adminDb.doc(col.member(activeWorkspaceId, uid)).set({
          id: uid,
          uid,
          workspaceId: activeWorkspaceId,
          role: "owner",
          displayName,
          email,
          photoURL,
          joinedAt: new Date().toISOString(),
        });
      }

      // Construct mobile deep-link URL
      const deepLinkUrl = `digicast://oauth?token=${encodeURIComponent(customToken)}&uid=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(displayName)}&photoUrl=${encodeURIComponent(photoURL)}&workspaceId=${encodeURIComponent(activeWorkspaceId)}&workspaceName=${encodeURIComponent(activeWorkspaceName)}&role=${encodeURIComponent(role)}`;

      // Perform direct HTTP 302 redirect back to Android App via deep link
      return NextResponse.redirect(deepLinkUrl);
    }

    // ── 2. WEB YOUTUBE ACCOUNT CONNECTION FLOW ──────────────────────────────
    const { workspaceId, uid } = decodedState;
    if (!workspaceId || !uid) throw new Error("Invalid state context");

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description || "Token exchange failed");

    const { access_token, refresh_token, expires_in } = tokenData;

    const youtubeRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const youtubeData = await youtubeRes.json();
    if (!youtubeData.items || youtubeData.items.length === 0) {
      throw new Error("No YouTube channel found for this account.");
    }

    const channelId = youtubeData.items[0].id;
    const channelName = youtubeData.items[0].snippet.title;
    const channelThumbnail = youtubeData.items[0].snippet.thumbnails?.default?.url || "";

    await adminDb.doc(col.youtubeAccount(workspaceId, channelId)).set({
      id: channelId,
      workspaceId,
      channelId,
      channelName,
      channelThumbnail,
      connectionStatus: "connected",
      connectedAt: new Date().toISOString(),
      connectedBy: uid,
      access_token,
      refresh_token: refresh_token || null,
    }, { merge: true });

    // Automatically trigger immediate stream sync so live broadcasts and thumbnails appear at once
    try {
      const { syncWorkspaceYouTubeStreams } = await import("@/lib/youtube/sync");
      await syncWorkspaceYouTubeStreams(workspaceId);
    } catch (syncErr) {
      console.warn("[youtube-callback] Post-connection sync non-fatal warning:", syncErr);
    }

    return NextResponse.redirect(`${baseUrl}/dashboard?success=youtube_connected`);

  } catch (err: any) {
    console.error("[youtube-callback-error]", err);
    return NextResponse.redirect(`${baseUrl}/settings?error=${encodeURIComponent(err.message || "connection_failed")}`);
  }
}
