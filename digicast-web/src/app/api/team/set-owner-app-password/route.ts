import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";
import { computeWorkspaceSubscription } from "@/lib/subscription";

// POST /api/team/set-owner-app-password
// Allows a workspace owner to set or update their own password for mobile app sign-in
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const { workspaceId, password } = await req.json();

    if (!workspaceId || !password) {
      return NextResponse.json({ error: "Workspace ID and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Verify subscription status
    const wsDoc = await adminDb.doc(col.workspace(workspaceId)).get();
    const wsData = wsDoc.exists ? wsDoc.data() : null;
    const sub = computeWorkspaceSubscription(wsData);
    if (sub.isExpired) {
      return NextResponse.json({
        error: "Your workspace subscription has expired. Please renew your plan before setting app credentials.",
        isExpired: true,
      }, { status: 403 });
    }

    // Verify caller is owner of this workspace
    const isOwnerByDoc = wsData?.ownerUid === decodedToken.uid || wsData?.ownerId === decodedToken.uid || workspaceId === decodedToken.uid;
    if (!isOwnerByDoc) {
      const memberDoc = await adminDb.doc(col.member(workspaceId, decodedToken.uid)).get();
      if (!memberDoc.exists || memberDoc.data()?.role !== "owner") {
        return NextResponse.json({ error: "Only the workspace owner can set this password" }, { status: 403 });
      }
    }

    // Ensure member record exists and has owner role
    await adminDb.doc(col.member(workspaceId, decodedToken.uid)).set({
      id: decodedToken.uid,
      uid: decodedToken.uid,
      workspaceId,
      role: "owner",
      email: decodedToken.email || "",
      displayName: decodedToken.name || "Workspace Owner",
      appPassword: password, // Store credential for eye toggle viewing
      telegramUpload: true,
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Set the password in Firebase Auth for this owner
    await adminAuth.updateUser(decodedToken.uid, {
      password: password,
    });

    // Make sure user document has defaultWorkspaceId set to this workspace
    await adminDb.doc(col.user(decodedToken.uid)).set({
      defaultWorkspaceId: workspaceId,
      role: "owner",
      appPassword: password,
    }, { merge: true });

    // Set custom claims so ID tokens carry workspaceId and owner role
    try {
      await adminAuth.setCustomUserClaims(decodedToken.uid, {
        workspaceId,
        role: "owner",
      });
    } catch (claimErr) {
      console.warn("[set-owner-app-password] claim setting warning:", claimErr);
    }

    return NextResponse.json({
      success: true,
      message: "Owner App Password successfully updated. You can now use your email and this password to log into the Digicast Android app."
    });
  } catch (err: any) {
    console.error("[set-owner-app-password] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to update app password" }, { status: 500 });
  }
}
