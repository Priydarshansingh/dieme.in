import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";

async function getCaller(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1];
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      return { uid: decoded.uid, email: decoded.email };
    } catch {
      // Fall through
    }
  }

  const headerUid = req.headers.get("x-user-uid");
  const headerEmail = req.headers.get("x-user-email");
  if (headerUid) {
    return { uid: headerUid, email: headerEmail || undefined };
  }

  return null;
}

// POST /api/team/developer-access
// Body: { workspaceId, targetUid, enabled }
export async function POST(req: NextRequest) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetUid, enabled } = body;
    let workspaceId = body.workspaceId;

    if (!targetUid) {
      return NextResponse.json({ error: "targetUid is required" }, { status: 400 });
    }

    if (!workspaceId || workspaceId === "null" || workspaceId === "undefined") {
      const userDoc = await adminDb.doc(col.user(caller.uid)).get();
      workspaceId = (userDoc.exists && userDoc.data()?.defaultWorkspaceId) ? userDoc.data()?.defaultWorkspaceId : caller.uid;
    }

    // Verify caller role (Owner or Admin or primary account)
    const isOwnerAccount = caller.email === "pskishnawat133@gmail.com" || caller.uid === workspaceId;
    let isAuthorized = isOwnerAccount;

    if (!isAuthorized) {
      const callerMemberDoc = await adminDb.doc(col.member(workspaceId, caller.uid)).get();
      const r = callerMemberDoc.data()?.role;
      if (r === "owner" || r === "admin") {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Only owners and admins can toggle developer access." }, { status: 403 });
    }

    const isEnabled = Boolean(enabled);

    // Update in users collection
    await adminDb.doc(col.user(targetUid)).set({
      developerAccess: isEnabled,
      isDeveloper: isEnabled,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Update in workspace members subcollection
    await adminDb.doc(col.member(workspaceId, targetUid)).set({
      developerAccess: isEnabled,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({
      success: true,
      targetUid,
      developerAccess: isEnabled,
      message: isEnabled ? "Developer preview access granted!" : "Developer preview access revoked."
    });
  } catch (err: any) {
    console.error("[api/team/developer-access POST] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to update developer access" }, { status: 500 });
  }
}

