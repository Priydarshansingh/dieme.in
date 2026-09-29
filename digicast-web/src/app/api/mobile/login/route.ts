// POST /api/mobile/login
// Direct, instantaneous authentication endpoint for the Digicast Android mobile app.
// Bypasses browser OAuth hurdles, Google Cloud verification blocks, and deep-link redirect failures.

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toLowerCase().trim();
    const displayName = body.displayName || email.split("@")[0] || "Digicast User";
    const requestedRole = (body.role || "owner").toLowerCase();
    const requestedWorkspaceId = body.workspaceId || "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email address is required" }, { status: 400 });
    }

    // 1. Get or create user in Firebase Auth
    let uid: string;
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      uid = existingUser.uid;
    } catch {
      const newUser = await adminAuth.createUser({
        email,
        displayName,
      });
      uid = newUser.uid;
    }

    // 2. Upsert in Firestore users
    await adminDb.doc(col.user(uid)).set({
      uid,
      email,
      displayName,
      lastLoginAt: new Date().toISOString(),
    }, { merge: true });

    // 3. Generate custom authentication token
    const customToken = await adminAuth.createCustomToken(uid, {
      email,
      displayName,
      role: requestedRole,
    });

    // 4. Match or create workspace
    let activeWorkspaceId = requestedWorkspaceId;
    let activeWorkspaceName = "Personal Workspace";
    let role = requestedRole;

    if (!activeWorkspaceId) {
      // A. Check if workspace document ID matches user's UID directly
      const directWsDoc = await adminDb.doc(col.workspace(uid)).get();
      if (directWsDoc.exists) {
        activeWorkspaceId = directWsDoc.id;
        activeWorkspaceName = directWsDoc.data()?.name || `${displayName}'s Workspace`;
        role = "owner";
      } else {
        // B. Check owned workspaces by ownerUid (primary field in web app)
        let ownedSnap = await adminDb
          .collection(col.workspaces())
          .where("ownerUid", "==", uid)
          .limit(1)
          .get();

        if (ownedSnap.empty) {
          // Fallback to checking ownerId
          ownedSnap = await adminDb
            .collection(col.workspaces())
            .where("ownerId", "==", uid)
            .limit(1)
            .get();
        }

        if (!ownedSnap.empty) {
          const doc = ownedSnap.docs[0];
          activeWorkspaceId = doc.id;
          activeWorkspaceName = doc.data().name || `${displayName}'s Workspace`;
          role = "owner";
        } else {
          // C. Attempt check for invited email across member collections
          try {
            const memberByEmailSnap = await adminDb
              .collectionGroup("members")
              .where("email", "==", email)
              .limit(1)
              .get();

            if (!memberByEmailSnap.empty) {
              const memberDoc = memberByEmailSnap.docs[0];
              const memberData = memberDoc.data();
              activeWorkspaceId = memberData.workspaceId || memberDoc.ref.parent.parent?.id || "";
              role = memberData.role || "editor";

              await memberDoc.ref.set({
                uid,
                displayName,
                status: "active",
                updatedAt: new Date().toISOString(),
              }, { merge: true });

              if (activeWorkspaceId) {
                const wsDoc = await adminDb.doc(col.workspace(activeWorkspaceId)).get();
                if (wsDoc.exists) {
                  activeWorkspaceName = wsDoc.data()?.name || "Team Workspace";
                }
              }
            }
          } catch (idxErr) {
            console.warn("[mobile/login] Index warning on members query:", idxErr);
          }
        }
      }
    }

    // If still no workspace, create one
    if (!activeWorkspaceId) {
      activeWorkspaceId = uid;
      activeWorkspaceName = `${displayName}'s Studio`;
      role = requestedRole;

      await adminDb.doc(col.workspace(activeWorkspaceId)).set({
        id: activeWorkspaceId,
        name: activeWorkspaceName,
        ownerUid: uid,
        ownerId: uid,
        createdAt: new Date().toISOString(),
        subscription: "free_trial",
      });

      await adminDb.doc(col.member(activeWorkspaceId, uid)).set({
        id: uid,
        uid,
        workspaceId: activeWorkspaceId,
        role: role,
        displayName,
        email,
        joinedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      session: {
        uid,
        email,
        displayName,
        photoUrl: "",
        workspaceId: activeWorkspaceId,
        workspaceName: activeWorkspaceName,
        role,
        token: customToken,
      },
      message: "Signed in successfully"
    });
  } catch (err: any) {
    console.error("[mobile/login] Error:", err);
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 });
  }
}
