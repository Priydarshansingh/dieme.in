import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";
import { computeWorkspaceSubscription } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = (body.email || "").toString();
    // 1. Strip ALL whitespace (standard spaces, NBSP \u00a0, zero-width spaces, tabs, newlines)
    let email = rawEmail.replace(/[\s\u00a0\u200b\u200c\u200d\ufeff]+/g, "").toLowerCase().trim();
    const password = (body.password || "").toString().trim();

    // 2. Fix common domain typos automatically
    if (email.endsWith("@gmial.com")) email = email.replace("@gmial.com", "@gmail.com");
    if (email.endsWith("@gamil.com")) email = email.replace("@gamil.com", "@gmail.com");
    if (email.endsWith("@gmil.com")) email = email.replace("@gmil.com", "@gmail.com");
    if (email.endsWith("@gmai.com")) email = email.replace("@gmai.com", "@gmail.com");

    // 3. If phone number entered as identifier, resolve user by appPassword or contact
    if (/^\+?\d{10,12}$/.test(email)) {
      const cleanPhone = email.replace(/\D/g, "").slice(-10);
      try {
        const snap = await adminDb.collection(col.users()).where("appPassword", "==", cleanPhone).limit(1).get();
        if (!snap.empty && snap.docs[0].data()?.email) {
          email = snap.docs[0].data().email.toLowerCase().trim();
        }
      } catch (phoneErr) {
        console.warn("[mobile/login] Phone fallback lookup error:", phoneErr);
      }
    }

    // 4. If no '@' is provided, try looking up in Auth or Firestore
    if (!email.includes("@") && email.length > 0) {
      const gmailVariant = `${email}@gmail.com`;
      try {
        const u = await adminAuth.getUserByEmail(gmailVariant);
        if (u) {
          email = gmailVariant;
        }
      } catch {
        // Fallback: check Firestore users for matching username or displayName
        try {
          const usersSnap = await adminDb.collection(col.users()).where("displayName", "==", rawEmail.trim()).limit(1).get();
          if (!usersSnap.empty && usersSnap.docs[0].data()?.email) {
            email = usersSnap.docs[0].data().email.toLowerCase().trim();
          }
        } catch {
          // ignore
        }
      }
    }

    // We get role & workspace requests from the app, but they are overridden by server truth if the user already belongs to a workspace
    const requestedRole = (body.role || "owner").toLowerCase();
    const requestedWorkspaceId = body.workspaceId || "";

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email address is required" }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: "Password is required for app login" }, { status: 400 });
    }

    console.log(`[mobile/login] Attempting login for email: "${email}"`);

    // 1. Verify password using Firebase Identity Toolkit REST API
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      throw new Error("Server misconfiguration: missing Firebase API Key");
    }

    let authRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    // If failed and password has surrounding whitespace (common on mobile keyboards), retry with trimmed password
    if (!authRes.ok && password.trim() !== password) {
      const retryRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: password.trim(), returnSecureToken: true }),
      });
      if (retryRes.ok) {
        authRes = retryRes;
      }
    }

    if (!authRes.ok) {
      const errorData = await authRes.json();
      const code = errorData?.error?.message || "Invalid credentials";
      console.warn(`[mobile/login] Identity Toolkit rejected "${email}":`, code);

      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        // Check if user has a password provider attached
        const hasPassword = userRecord.providerData.some(p => p.providerId === "password");
        if (!hasPassword) {
          console.warn(`[mobile/login] User "${email}" exists but has NO password provider.`);
          return NextResponse.json({
            error: "No mobile app password set yet. Please open the Web Dashboard, go to 'Team & App Access' -> 'My Mobile App Login', enter your password and click Save.",
            code: "PASSWORD_NOT_SET"
          }, { status: 401 });
        } else {
          console.warn(`[mobile/login] User "${email}" entered incorrect password.`);
          return NextResponse.json({
            error: "Incorrect password. You can reset or update your password on the Web Dashboard under 'Team & App Access'.",
            code: "INVALID_PASSWORD"
          }, { status: 401 });
        }
      } catch (userLookupErr: any) {
        if (userLookupErr.code === "auth/user-not-found") {
          console.warn(`[mobile/login] User "${email}" not found in Firebase Auth.`);
          return NextResponse.json({
            error: "No account found with this email. Please verify your email or ask your workspace owner to add you as an editor on the Web Dashboard.",
            code: "USER_NOT_FOUND"
          }, { status: 401 });
        }
      }

      if (code === "USER_DISABLED") {
        return NextResponse.json({ error: "This account has been disabled." }, { status: 401 });
      }

      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
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

    // Check user profile for defaultWorkspaceId first
    try {
      const userSnap = await adminDb.doc(col.user(uid)).get();
      if (userSnap.exists) {
        const uData = userSnap.data();
        if (uData?.defaultWorkspaceId) {
          const wsDoc = await adminDb.doc(col.workspace(uData.defaultWorkspaceId)).get();
          if (wsDoc.exists) {
            activeWorkspaceId = wsDoc.id;
            activeWorkspaceName = wsDoc.data()?.name || `${displayName}'s Studio`;
            role = uData.role || (wsDoc.data()?.ownerUid === uid ? "owner" : "editor");
          }
        }
      }
    } catch (userLookupErr) {
      console.warn("[mobile/login] User lookup error:", userLookupErr);
    }

    if (!activeWorkspaceId) {
      // A. Check if workspace document ID matches user's UID directly
      const directWsDoc = await adminDb.doc(col.workspace(uid)).get();
      if (directWsDoc.exists) {
        activeWorkspaceId = directWsDoc.id;
        activeWorkspaceName = directWsDoc.data()?.name || `${displayName}'s Studio`;
        role = "owner";
      } else {
        // B. Check owned workspaces by ownerUid (primary field in web app)
        let ownedSnap = await adminDb
          .collection(col.workspaces())
          .where("ownerUid", "==", uid)
          .limit(1)
          .get();

        if (ownedSnap.empty) {
          ownedSnap = await adminDb
            .collection(col.workspaces())
            .where("ownerId", "==", uid)
            .limit(1)
            .get();
        }

        if (!ownedSnap.empty) {
          const doc = ownedSnap.docs[0];
          activeWorkspaceId = doc.id;
          activeWorkspaceName = doc.data().name || `${displayName}'s Studio`;
          role = "owner";
        } else {
          // C. Search existing workspaces for membership by uid or email
          try {
            const allWsSnap = await adminDb.collection(col.workspaces()).limit(50).get();
            for (const wsDoc of allWsSnap.docs) {
              const wsData = wsDoc.data();
              if (wsData.ownerUid === uid || wsData.ownerId === uid) {
                activeWorkspaceId = wsDoc.id;
                activeWorkspaceName = wsData.name || "Creator Studio";
                role = "owner";
                break;
              }

              // Check members subcollection by UID
              const memByUid = await wsDoc.ref.collection("members").doc(uid).get();
              if (memByUid.exists) {
                activeWorkspaceId = wsDoc.id;
                activeWorkspaceName = wsData.name || "Creator Studio";
                role = memByUid.data()?.role || "editor";
                break;
              }

              // Check members subcollection by email
              const memByEmail = await wsDoc.ref.collection("members").where("email", "==", email).limit(1).get();
              if (!memByEmail.empty) {
                const mDoc = memByEmail.docs[0];
                activeWorkspaceId = wsDoc.id;
                activeWorkspaceName = wsData.name || "Creator Studio";
                role = mDoc.data()?.role || "editor";
                await mDoc.ref.set({ uid, displayName, status: "active" }, { merge: true });
                break;
              }
            }
          } catch (wsSearchErr) {
            console.warn("[mobile/login] Workspace search warning:", wsSearchErr);
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

    // Persist defaultWorkspaceId on user doc so future queries are instant
    await adminDb.doc(col.user(uid)).set({
      defaultWorkspaceId: activeWorkspaceId,
      role,
    }, { merge: true });

    // 4. Verify workspace subscription status
    const finalWsDoc = await adminDb.doc(col.workspace(activeWorkspaceId)).get();
    const finalWsData = finalWsDoc.exists ? finalWsDoc.data() : { plan: "free_trial", createdAt: new Date().toISOString() };

    // Check if workspace is suspended by Administrator
    if (finalWsData?.isSuspended) {
      return NextResponse.json({
        error: "This workspace has been suspended by administration. All app access is temporarily locked. Please contact support.",
        isSuspended: true,
      }, { status: 403 });
    }

    // Check if free trial was locked due to duplicate YouTube channel trial bypass
    if (finalWsData?.trialBypassDetected && (finalWsData?.plan === "free_trial" || !finalWsData?.plan)) {
      return NextResponse.json({
        error: "14-Day Free Trial already consumed: This YouTube channel has already used its trial on another account. Please activate the ₹29 First Month Pass on the web dashboard to continue using the mobile app.",
        isExpired: true,
        trialBypassDetected: true,
      }, { status: 403 });
    }

    const subscription = computeWorkspaceSubscription(finalWsData);

    let activeSub = subscription;
    if (subscription.isExpired) {
      // Allow free creators whose trial expired to log in under free ad-supported tier
      activeSub = {
        ...subscription,
        isExpired: false,
        status: "trial",
        plan: "free_ad_pass",
        daysRemaining: 1,
      };
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
        subscription: activeSub,
        createdAt: finalWsData?.createdAt || new Date().toISOString(),
      },
      message: "Signed in successfully"
    });
  } catch (err: any) {
    console.error("[mobile/login] Error:", err);
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 });
  }
}
