import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";

// Helper to authenticate caller
async function getCaller(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.split("Bearer ")[1];
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      return { uid: decoded.uid, email: decoded.email };
    } catch {
      // Fall through to other auth headers
    }
  }

  // Fallback to x-user-uid header if provided from authorized mobile session
  const headerUid = req.headers.get("x-user-uid");
  const headerEmail = req.headers.get("x-user-email");
  if (headerUid) {
    return { uid: headerUid, email: headerEmail || undefined };
  }

  return null;
}

// GET /api/team/members?workspaceId=...
// Returns all team members in the workspace, including credentials for Owner/Admin
export async function GET(req: NextRequest) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    if (!workspaceId) {
      return NextResponse.json({ error: "Missing workspaceId" }, { status: 400 });
    }

    // Check workspace doc
    const wsDoc = await adminDb.doc(col.workspace(workspaceId)).get();
    const wsData = wsDoc.exists ? wsDoc.data() : null;
    const isOwnerByDoc = wsData?.ownerUid === caller.uid || wsData?.ownerId === caller.uid || workspaceId === caller.uid;

    // Check member doc for caller's role
    const callerMemberDoc = await adminDb.doc(col.member(workspaceId, caller.uid)).get();
    const callerRole = isOwnerByDoc ? "owner" : (callerMemberDoc.data()?.role || "viewer");

    const canViewCredentials = callerRole === "owner" || callerRole === "admin";

    // Fetch all members in this workspace
    const snap = await adminDb.collection(col.members(workspaceId)).get();
    const members = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: data.uid || doc.id,
        displayName: data.displayName || "Team Member",
        email: data.email || "",
        photoURL: data.photoURL || "",
        role: data.role || "editor",
        appPassword: canViewCredentials ? (data.appPassword || "") : undefined,
        telegramUpload: Boolean(data.telegramUpload),
        joinedAt: data.joinedAt || data.updatedAt || null,
      };
    });

    return NextResponse.json({
      members,
      callerRole,
      canManage: canViewCredentials,
    });
  } catch (err: any) {
    console.error("[api/team/members GET] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to load team members" }, { status: 500 });
  }
}

// DELETE /api/team/members?workspaceId=...&memberId=...
// Removes a member from the workspace
export async function DELETE(req: NextRequest) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const memberId = searchParams.get("memberId");

    if (!workspaceId || !memberId) {
      return NextResponse.json({ error: "workspaceId and memberId are required" }, { status: 400 });
    }

    // Verify caller role
    const wsDoc = await adminDb.doc(col.workspace(workspaceId)).get();
    const wsData = wsDoc.exists ? wsDoc.data() : null;
    const isOwnerByDoc = wsData?.ownerUid === caller.uid || wsData?.ownerId === caller.uid || workspaceId === caller.uid;

    const callerMemberDoc = await adminDb.doc(col.member(workspaceId, caller.uid)).get();
    const callerRole = isOwnerByDoc ? "owner" : (callerMemberDoc.data()?.role || "viewer");

    if (callerRole !== "owner" && callerRole !== "admin") {
      return NextResponse.json({ error: "Only owners and admins can remove members" }, { status: 403 });
    }

    // Admin cannot remove owner or another admin
    if (callerRole === "admin") {
      const targetDoc = await adminDb.doc(col.member(workspaceId, memberId)).get();
      const targetRole = targetDoc.data()?.role;
      if (targetRole === "owner" || targetRole === "admin") {
        return NextResponse.json({ error: "Admins cannot remove owners or other admins" }, { status: 403 });
      }
    }

    // Delete the member from workspace subcollection
    await adminDb.doc(col.member(workspaceId, memberId)).delete();

    return NextResponse.json({ success: true, message: "Member removed from workspace" });
  } catch (err: any) {
    console.error("[api/team/members DELETE] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to remove member" }, { status: 500 });
  }
}
