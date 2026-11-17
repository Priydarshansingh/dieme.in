// GET /api/auth/mobile/google
// Generates the Google OAuth login URL for the Digicast Android app

import { NextRequest, NextResponse } from "next/server";

function getBaseUrl(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/youtube.readonly",
];

export async function GET(req: NextRequest) {
  const baseUrl = getBaseUrl(req);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI || (
    isLocalhost
      ? "http://localhost:3000/api/youtube/callback"
      : host.includes("dieme.in")
        ? `https://${host}/api/youtube/callback`
        : "https://digicast-web.vercel.app/api/youtube/callback"
  );
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth is not configured on server" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const requestedWorkspaceId = searchParams.get("workspaceId") || "";

  const state = Buffer.from(JSON.stringify({
    source: "mobile_android",
    workspaceId: requestedWorkspaceId,
    redirectUri,
    timestamp: Date.now()
  })).toString("base64");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent select_account",
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  // If request is from browser navigation, redirect directly; if API fetch, return JSON
  if (req.headers.get("accept")?.includes("text/html")) {
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.json({ authUrl });
}
