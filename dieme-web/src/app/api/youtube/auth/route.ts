// GET /api/youtube/auth
// Generates the YouTube OAuth2 authorization URL and redirects the user

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";

function getBaseUrl(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

// Required scopes for YouTube channel management, broadcasts, and chat
const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl", // Need for chat messaging
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tokenParam = searchParams.get("token");
  const authHeader = req.headers.get("Authorization");

  let idToken = "";
  if (authHeader?.startsWith("Bearer ")) {
    idToken = authHeader.slice(7);
  } else if (tokenParam) {
    idToken = tokenParam;
  } else {
    if (searchParams.get("redirect") === "true" || req.headers.get("accept")?.includes("text/html")) {
      return NextResponse.redirect(`${getBaseUrl(req)}/settings#youtube`);
    }
    return NextResponse.json({ error: "Unauthorized: Missing authentication token" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    if (searchParams.get("redirect") === "true" || req.headers.get("accept")?.includes("text/html")) {
      return NextResponse.redirect(`${getBaseUrl(req)}/settings#youtube`);
    }
    return NextResponse.json({ error: "Token verification failed" }, { status: 401 });
  }

  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const source = searchParams.get("source") || "web";

  const origin = getBaseUrl(req);
  // Pass workspaceId, uid, source, and originating domain via state variable to maintain context for callback
  const state = Buffer.from(JSON.stringify({ workspaceId, uid, source, origin })).toString("base64");

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
  // Always use the authorized redirect URI registered in Google Cloud Console
  const redirectUri = isLocalhost
    ? "http://localhost:3000/api/youtube/callback"
    : "https://digicast-web.vercel.app/api/youtube/callback";
  const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ error: "YOUTUBE_CLIENT_ID is not configured on server" }, { status: 500 });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: YOUTUBE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent", // Force refresh token generation
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  if (searchParams.get("redirect") === "true") {
    return NextResponse.redirect(authUrl);
  }

  return NextResponse.json({ authUrl });
}
