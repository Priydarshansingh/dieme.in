import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";
import { computeWorkspaceSubscription } from "@/lib/subscription";

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

    // Verify workspace subscription is not expired
    const wsDoc = await adminDb.doc(col.workspace(workspaceId)).get();
    const wsData = wsDoc.exists ? wsDoc.data() : null;
    const sub = computeWorkspaceSubscription(wsData);
    if (sub.isExpired) {
      return NextResponse.json({
        error: "Your workspace subscription or trial has expired. Please renew your monthly subscription on the web dashboard to manage app credentials.",
        isExpired: true,
      }, { status: 403 });
    }

    // 1. Create or update user in Firebase Auth with the Password
    let newUid: string;
    try {
      const userRecord = await adminAuth.createUser({
        email: email.trim().toLowerCase(),
        password: password,
        displayName: displayName || "App User",
      });
      newUid = userRecord.uid;
    } catch (firebaseErr: any) {
      // If email already exists, update their password so owner can renew/reset credentials
      if (firebaseErr.code === "auth/email-already-exists") {
        const existing = await adminAuth.getUserByEmail(email.trim().toLowerCase());
        await adminAuth.updateUser(existing.uid, { password: password });
        newUid = existing.uid;
      } else {
        throw firebaseErr;
      }
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
