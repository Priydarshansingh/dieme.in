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

// POST /api/user/avatar
// Updates the user's active avatar URL in Auth, users/{uid}, and members
export async function POST(req: NextRequest) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { photoURL, workspaceId } = body;

    if (!photoURL || typeof photoURL !== "string") {
      return NextResponse.json(
        { error: "photoURL string is required." },
        { status: 400 }
      );
    }

    // 1. Update Firebase Auth user record
    try {
      await adminAuth.updateUser(caller.uid, {
        photoURL,
      });
    } catch (authErr) {
      console.warn("[api/user/avatar] adminAuth.updateUser note:", authErr);
    }

    // 2. Update users/{uid} document in Firestore
    try {
      await adminDb.doc(col.user(caller.uid)).set(
        {
          photoURL,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    } catch (dbErr) {
      console.warn("[api/user/avatar] user doc update note:", dbErr);
    }

    // 3. Update member entry in caller's workspace(s)
    let targetWid = workspaceId;
    if (!targetWid || targetWid === "null" || targetWid === "undefined") {
      try {
        const userDoc = await adminDb.doc(col.user(caller.uid)).get();
        targetWid = userDoc.exists && userDoc.data()?.defaultWorkspaceId ? userDoc.data()?.defaultWorkspaceId : caller.uid;
      } catch {
        targetWid = caller.uid;
      }
    }

    if (targetWid) {
      try {
        await adminDb.doc(col.member(targetWid, caller.uid)).set(
          {
            photoURL,
            updatedAt: new Date(),
          },
          { merge: true }
        );
      } catch (memErr) {
        console.warn("[api/user/avatar] workspace member doc update note:", memErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Avatar updated successfully!",
      photoURL,
    });
  } catch (error: any) {
    console.error("[api/user/avatar] POST error:", error);
    return NextResponse.json(
      { error: "Failed to update avatar", details: error.message },
      { status: 500 }
    );
  }
}

