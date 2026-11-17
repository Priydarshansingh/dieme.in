// GET /api/auth/mobile/callback
// Handles Google OAuth callback for Android app, resolves editor/workspace matching,
// creates secure tokens, and redirects back into Digicast app via deep link.

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
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  let decodedState: any = {};
  if (state) {
    try {
      decodedState = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
    } catch {}
  }

  const redirectUri = decodedState.redirectUri || `${baseUrl}/api/auth/mobile/callback`;

  if (error || !code) {
    return NextResponse.json({ error: error || "Missing authorization code" }, { status: 400 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "Server OAuth configuration missing" }, { status: 500 });
  }

  try {
    // 1. Exchange code for Google tokens
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
      throw new Error(tokenData.error_description || "Failed to exchange token with Google");
    }

    const { access_token } = tokenData;

    // 2. Fetch Google User Profile (email, name, picture)
    const userProfileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = await userProfileRes.json();

    const email = (profile.email || "").toLowerCase().trim();
    const displayName = profile.name || email.split("@")[0] || "Dieme User";
    const photoURL = profile.picture || "";

    if (!email) {
      throw new Error("Unable to retrieve email from Google profile");
    }

    // 3. Upsert user in Firebase Auth and Firestore
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

    // Save/update user profile in Firestore
    await adminDb.doc(col.user(uid)).set({
      uid,
      email,
      displayName,
      photoURL,
      lastLoginAt: new Date().toISOString(),
    }, { merge: true });

    // 4. Generate custom authentication token for mobile app
    const customToken = await adminAuth.createCustomToken(uid, {
      email,
      displayName,
    });

    // 5. UNBREAKABLE WORKSPACE & EDITOR MATCHING:
    // Search for workspaces where:
    // A) User is the Owner (ownerId == uid)
    // B) User was invited as an Editor/Member by this exact Gmail address
    let activeWorkspaceId = "";
    let activeWorkspaceName = "Personal Workspace";
    let role = "owner";

    // Check workspaces owned by user
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
      // Check if user's email was added as an editor across all workspace member collections
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

        // Link UID to this member document if it was previously just an email invite
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
    }

    // If no workspace exists yet for this user, automatically create one
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

      // Add user as owner member
      await adminDb.doc(col.member(activeWorkspaceId, uid)).set({
        id: uid,
        uid,
        workspaceId: activeWorkspaceId,
        role: "owner",
        displayName,
        email,
        photoURL,
        joinedAt: new Date().toISOString(),
        permissions: {
          viewStreams: true,
          viewSharedChat: true,
          generateClips: true,
          downloadClips: true,
          telegramUpload: true,
          manageTeam: true,
          manageBilling: true,
        }
      });
    }

    // 6. Build Deep Link to redirect back to Android App
    const deepLinkUrl = `digicast://oauth?token=${encodeURIComponent(customToken)}&uid=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(displayName)}&photoUrl=${encodeURIComponent(photoURL)}&workspaceId=${encodeURIComponent(activeWorkspaceId)}&workspaceName=${encodeURIComponent(activeWorkspaceName)}&role=${encodeURIComponent(role)}`;

    // Render HTML page that immediately redirects to the deep link and provides a manual fallback button
    const htmlResponse = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Dieme Authentication</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #0B101E;
              color: #FFFFFF;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              padding: 20px;
              text-align: center;
              box-sizing: border-box;
            }
            .card {
              background-color: #161F36;
              border: 1px solid #283556;
              border-radius: 16px;
              padding: 32px 24px;
              max-width: 420px;
              width: 100%;
              box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
            }
            .avatar {
              width: 64px;
              height: 64px;
              border-radius: 50%;
              margin-bottom: 16px;
              border: 2px solid #FF3B30;
            }
            h1 { font-size: 22px; margin: 0 0 8px; color: #FFFFFF; }
            p { font-size: 14px; color: #8F9CAE; margin: 0 0 24px; line-height: 1.5; }
            .btn {
              display: inline-block;
              background-color: #FF3B30;
              color: #FFFFFF;
              text-decoration: none;
              font-weight: 600;
              font-size: 16px;
              padding: 14px 28px;
              border-radius: 10px;
              transition: background-color 0.2s;
              width: 100%;
              box-sizing: border-box;
            }
            .btn:hover { background-color: #E02E24; }
            .badge {
              display: inline-block;
              background-color: #1E2945;
              color: #4E95FF;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 16px;
              text-transform: uppercase;
            }
          </style>
          <script>
            // Automatically launch deep link
            window.onload = function() {
              window.location.href = "${deepLinkUrl}";
            };
          </script>
        </head>
        <body>
          <div class="card">
            ${photoURL ? `<img class="avatar" src="${photoURL}" alt="${displayName}" />` : ''}
            <div class="badge">${role} Verified</div>
            <h1>Welcome, ${displayName}!</h1>
            <p>Signed in as <b>${email}</b>.<br>Connected to workspace <b>${activeWorkspaceName}</b>.</p>
            <a href="${deepLinkUrl}" class="btn">Return to Dieme App</a>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(htmlResponse, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });

  } catch (err: any) {
    console.error("[mobile-oauth-callback-error]", err);
    return NextResponse.json({ error: err.message || "Mobile authentication failed" }, { status: 500 });
  }
}
