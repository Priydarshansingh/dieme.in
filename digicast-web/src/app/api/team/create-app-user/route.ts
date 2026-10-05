import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";
import { computeWorkspaceSubscription } from "@/lib/subscription";

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

// POST /api/team/create-app-user
// Protected endpoint for Workspace Owners and Admins to create or update team credentials
export async function POST(req: NextRequest) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Missing or invalid authorization" }, { status: 401 });
    }

    const body = await req.json();
    const { email, password, displayName, role, workspaceId } = body;

    if (!email || !password || !workspaceId) {
      return NextResponse.json({ error: "Email, password, and workspaceId are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Verify workspace subscription is not expired
    const wsDoc = await adminDb.doc(col.workspace(workspaceId)).get();
    const wsData = wsDoc.exists ? wsDoc.data() : null;
    const sub = computeWorkspaceSubscription(wsData);
    if (sub.isExpired) {
      return NextResponse.json({
        error: "Your workspace subscription or trial has expired. Please renew your plan on the web dashboard to manage team credentials.",
        isExpired: true,
      }, { status: 403 });
    }

    // Verify caller role (Owner or Admin)
    const isOwnerByDoc = wsData?.ownerUid === caller.uid || wsData?.ownerId === caller.uid || workspaceId === caller.uid;
    let callerRole: "owner" | "admin" | null = isOwnerByDoc ? "owner" : null;

    if (!callerRole) {
      const memberDoc = await adminDb.doc(col.member(workspaceId, caller.uid)).get();
      if (memberDoc.exists) {
        const r = memberDoc.data()?.role;
        if (r === "owner" || r === "admin") {
          callerRole = r;
        }
      }
    }

    if (!callerRole) {
      return NextResponse.json({ error: "Only workspace owners and admins can create team users" }, { status: 403 });
    }

    // Normalize and validate target role
    const requestedRole = (role || "editor").toLowerCase().trim();
    const validRoles = ["admin", "editor", "moderator"];
    if (!validRoles.includes(requestedRole)) {
      return NextResponse.json({ error: "Invalid role. Allowed roles are: admin, editor, moderator" }, { status: 400 });
    }

    // Admin can only create editor or moderator (cannot grant admin)
    if (callerRole === "admin" && requestedRole === "admin") {
      return NextResponse.json({ error: "Admins can only create Editor or Moderator accounts. Only owners can create Admins." }, { status: 403 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanDisplayName = (displayName || cleanEmail.split("@")[0] || "Team Member").trim();

    // 1. Create or update user in Firebase Auth with the given Password
    let targetUid: string;
    let isExisting = false;
    try {
      const userRecord = await adminAuth.createUser({
        email: cleanEmail,
        password: password,
        displayName: cleanDisplayName,
      });
      targetUid = userRecord.uid;
    } catch (firebaseErr: any) {
      // If email already exists in Auth, update password so owner/admin can reset/manage credentials
      if (firebaseErr.code === "auth/email-already-exists") {
        const existing = await adminAuth.getUserByEmail(cleanEmail);
        await adminAuth.updateUser(existing.uid, {
          password: password,
          displayName: cleanDisplayName,
        });
        targetUid = existing.uid;
        isExisting = true;
      } else {
        throw firebaseErr;
      }
    }

    // 2. Add or update member document in workspace, storing credentials for dashboard/app visibility
    await adminDb.doc(col.member(workspaceId, targetUid)).set({
      id: targetUid,
      uid: targetUid,
      workspaceId: workspaceId,
      email: cleanEmail,
      displayName: cleanDisplayName,
      role: requestedRole,
      appPassword: password, // Store credentials for Owner/Admin dashboard & app viewing
      telegramUpload: false,
      joinedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // 3. Add/update root users collection with defaultWorkspaceId & role
    await adminDb.doc(col.user(targetUid)).set({
      uid: targetUid,
      email: cleanEmail,
      displayName: cleanDisplayName,
      createdAt: new Date().toISOString(),
      defaultWorkspaceId: workspaceId,
      role: requestedRole,
      appPassword: password,
    }, { merge: true });

    // 4. Set custom claims so ID tokens carry workspaceId & role
    try {
      await adminAuth.setCustomUserClaims(targetUid, {
        workspaceId,
        role: requestedRole,
      });
    } catch (claimErr) {
      console.warn("[create-app-user] claim setting warning:", claimErr);
    }

    return NextResponse.json({
      success: true,
      message: isExisting
        ? `${requestedRole.toUpperCase()} credentials updated successfully`
        : `${requestedRole.toUpperCase()} user created successfully`,
      uid: targetUid,
      email: cleanEmail,
      displayName: cleanDisplayName,
      role: requestedRole,
      appPassword: password,
      isExisting,
    });
  } catch (err: any) {
    console.error("[create-app-user] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create app user" }, { status: 500 });
  }
}
