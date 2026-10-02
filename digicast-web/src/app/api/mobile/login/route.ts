import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";
import { computeWorkspaceSubscription } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || "").toLowerCase().trim();
    const password = body.password || "";

    // We get role & workspace requests from the app, but they are overridden by server truth if the user already belongs to a workspace
    const requestedRole = (body.role || "owner").toLowerCase();
    const requestedWorkspaceId = body.workspaceId || "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email address is required" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Password is required for app login" }, { status: 400 });
    }

    // 1. Verify password using Firebase Identity Toolkit REST API
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      throw new Error("Server misconfiguration: missing Firebase API Key");
    }

    const authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    if (!authRes.ok) {
      const errorData = await authRes.json();
      const code = errorData?.error?.message || "Invalid credentials";

      let userMessage = "Incorrect email or password.";
      if (code === "EMAIL_NOT_FOUND") userMessage = "This email is not registered. Ask your workspace owner to create an App account for you from the Web Dashboard.";
      if (code === "INVALID_PASSWORD") userMessage = "Incorrect password.";
      if (code === "USER_DISABLED") userMessage = "This account has been disabled.";

      return NextResponse.json({ error: userMessage }, { status: 401 });
    }

    const authData = await authRes.json();
    const uid = authData.localId;
    const displayName = authData.displayName || email.split("@")[0] || "Digicast User";

    // 2. We now have a verified UID. Upsert in Firestore users.
    await adminDb.doc(col.user(uid)).set({
      uid,
      email,
      displayName,
      lastLoginAt: new Date().toISOString(),
    }, { merge: true });

    // 3. Match Workspace
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

    // 4. Verify workspace subscription status
    const finalWsDoc = await adminDb.doc(col.workspace(activeWorkspaceId)).get();
    const finalWsData = finalWsDoc.exists ? finalWsDoc.data() : { plan: "free_trial", createdAt: new Date().toISOString() };
    const subscription = computeWorkspaceSubscription(finalWsData);

    if (subscription.isExpired) {
      return NextResponse.json({
        error: "Your workspace trial or subscription has expired. Please renew your plan on the web dashboard to continue using the app.",
        isExpired: true,
        subscription,
      }, { status: 403 });
    }

    // 5. Mint an ID token for the Android client.
    //
    // The client sends this back as `Authorization: Bearer <token>` and the
    // server verifies it with adminAuth.verifyIdToken(). A CUSTOM token cannot
    // be verified that way — verifyIdToken() only accepts ID tokens. The
    // Identity Toolkit response from step 1 already IS a signed ID token, so we
    // return a freshly-minted one rather than forcing the app to do a second
    // client-side round trip through Firebase SDK's signInWithCustomToken().
    //
    // Mirror the resolved role into custom claims so token-holders downstream
    // (and Firestore rules, if enabled) can read it without a workspace lookup.
    await adminAuth.setCustomUserClaims(uid, {
      role,
      workspaceId: activeWorkspaceId,
    });

    // Re-exchange the password credential to obtain an ID token that carries
    // the claims we just set. (ID tokens are immutable; claims only appear in a
    // token issued AFTER setCustomUserClaims.)
    const refreshedAuthRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    if (!refreshedAuthRes.ok) {
      console.error("[mobile/login] Failed to mint ID token after claims update");
      return NextResponse.json(
        { error: "Could not complete sign-in. Please try again." },
        { status: 500 }
      );
    }

    const refreshedAuthData = await refreshedAuthRes.json();
    const idToken: string | undefined = refreshedAuthData.idToken;
    const refreshToken: string | undefined = refreshedAuthData.refreshToken;

    if (!idToken) {
      console.error("[mobile/login] Identity Toolkit returned no idToken");
      return NextResponse.json(
        { error: "Could not complete sign-in. Please try again." },
        { status: 500 }
      );
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
        token: idToken,
        refreshToken: refreshToken || "",
        expiresIn: Number(refreshedAuthData.expiresIn) || 3600,
        subscription,
      },
      message: "Signed in successfully"
    });
  } catch (err: any) {
    console.error("[mobile/login] Error:", err);
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 });
  }
}
