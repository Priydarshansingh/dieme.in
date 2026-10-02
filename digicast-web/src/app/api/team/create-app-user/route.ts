import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";

// POST /api/team/create-app-user
// Protected endpoint for Workspace Owners to create a new App User (with Email/Password)
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
    } catch (e) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { email, password, displayName, role, workspaceId } = await req.json();

    if (!email || !password || !workspaceId) {
      return NextResponse.json({ error: "Email, password, and workspaceId are required" }, { status: 400 });
    }

    // Verify caller is owner of this workspace
    const memberDoc = await adminDb.doc(col.member(workspaceId, decodedToken.uid)).get();
    if (!memberDoc.exists || memberDoc.data()?.role !== "owner") {
      return NextResponse.json({ error: "Only workspace owners can create App users" }, { status: 403 });
    }

    // 1. Create the user in Firebase Auth with the Password
    let newUid;
    try {
      const userRecord = await adminAuth.createUser({
        email: email.trim().toLowerCase(),
        password: password,
        displayName: displayName || "App User",
      });
      newUid = userRecord.uid;
    } catch (firebaseErr: any) {
      // If email already exists, Firebase throws "email-already-exists"
      if (firebaseErr.code === "auth/email-already-exists") {
        return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
      }
      throw firebaseErr;
    }

    // 2. Add them as a member to the workspace
    await adminDb.doc(col.member(workspaceId, newUid)).set({
      id: newUid,
      uid: newUid,
      workspaceId: workspaceId,
      email: email.trim().toLowerCase(),
      displayName: displayName || "App User",
      role: role || "editor",
      telegramUpload: false,
      joinedAt: new Date().toISOString(),
    });

    // 3. Add to root users collection
    await adminDb.doc(col.user(newUid)).set({
      uid: newUid,
      email: email.trim().toLowerCase(),
      displayName: displayName || "App User",
      createdAt: new Date().toISOString(),
    }, { merge: true });

    return NextResponse.json({ message: "App user created successfully", uid: newUid });
  } catch (err: any) {
    console.error("[create-app-user] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create app user" }, { status: 500 });
  }
}
