// GET /api/youtube/callback
// Handles the OAuth callback from Google/YouTube, exchanges code for tokens,
// and stores them securely in the workspace.

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/youtube/callback`
  : "http://localhost:3000/api/youtube/callback";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=youtube_auth_failed`);
  }

  if (!code || !state || !YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_callback`);
  }

  try {
    const decodedState = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
    const { workspaceId, uid } = decodedState;

    if (!workspaceId || !uid) throw new Error("Invalid state context");

    // 1. Exchange code for access/refresh tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: YOUTUBE_CLIENT_ID,
        client_secret: YOUTUBE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description || "Token exchange failed");

    const { access_token, refresh_token, expires_in } = tokenData;

    // 2. Fetch YouTube Channel ID & Name using access token
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

    // 3. Store tokens in a SECURE Firestore collection
    // Note: In production, tokens should be encrypted before storing.
    await adminDb.doc(col.youtubeAccount(workspaceId, channelId)).set({
      id: channelId,
      workspaceId,
      channelId,
      channelName,
      channelThumbnail,
      connectionStatus: "connected",
      connectedAt: new Date().toISOString(),
      connectedBy: uid,
      access_token, // Store securely
      refresh_token: refresh_token || null, // Keep existing if not returned
      token_expires_at: Date.now() + expires_in * 1000,
    }, { merge: true });

    // Success redirect
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=youtube_connected`);

  } catch (err) {
    console.error("[youtube-callback-error]", err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=connection_failed`);
  }
}
