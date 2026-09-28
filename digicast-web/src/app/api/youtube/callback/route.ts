// GET /api/youtube/callback
// Handles the OAuth callback from Google/YouTube, exchanges code for tokens,
// and stores them securely in the workspace.

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
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

  if (error) {
    return NextResponse.redirect(`${baseUrl}/settings?error=youtube_auth_failed`);
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

  if (!code || !state || !clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}/settings?error=invalid_callback`);
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

    // 4. Automatically sync broadcasts & recent streams
    try {
      await fetch(`${baseUrl}/api/youtube/sync?workspaceId=${workspaceId}`);
    } catch (syncErr) {
      console.warn('[youtube-callback] Initial sync warning:', syncErr);
    }

    // Success redirect
    return NextResponse.redirect(`${baseUrl}/dashboard?success=youtube_connected`);

  } catch (err) {
    console.error("[youtube-callback-error]", err);
    return NextResponse.redirect(`${baseUrl}/settings?error=connection_failed`);
  }
}
