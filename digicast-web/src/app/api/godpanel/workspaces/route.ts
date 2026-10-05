import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyGodSessionToken } from "@/lib/godpanelAuth";
import { computeWorkspaceSubscription } from "@/lib/subscription";
import { col } from "@/lib/firestore/collections";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("godpanel_token")?.value;
    const session = verifyGodSessionToken(token || "");
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access to God Panel" }, { status: 401 });
    }

    const wsSnap = await adminDb.collection("workspaces").get();
    const workspaces = [];

    for (const doc of wsSnap.docs) {
      const data = doc.data();
      const id = doc.id;
      const ownerUid = data.ownerUid || data.ownerId || id;

      // Get owner info
      let ownerEmail = "unknown";
      let ownerDisplayName = "User";
      try {
        const userDoc = await adminDb.doc(col.user(ownerUid)).get();
        if (userDoc.exists) {
          const u = userDoc.data();
          ownerEmail = u?.email || ownerEmail;
          ownerDisplayName = u?.displayName || ownerDisplayName;
        }
      } catch {}

      // Get streams count
      let streamCount = 0;
      try {
        const sSnap = await doc.ref.collection("streams").limit(50).get();
        streamCount = sSnap.size;
      } catch {}

      // Get clips count
      let clipCount = 0;
      try {
        const cSnap = await doc.ref.collection("clips").limit(50).get();
        clipCount = cSnap.size;
      } catch {}

      // Get members count
      let memberCount = 1;
      try {
        const mSnap = await doc.ref.collection("members").get();
        memberCount = Math.max(1, mSnap.size);
      } catch {}

      const subscription = computeWorkspaceSubscription(data);

      workspaces.push({
        id,
        name: data.name || "Workspace",
        ownerUid,
        ownerEmail,
        ownerDisplayName,
        streamCount,
        clipCount,
        memberCount,
        subscription,
        isSuspended: Boolean(data.isSuspended),
        createdAt: data.createdAt?._seconds
          ? new Date(data.createdAt._seconds * 1000).toISOString()
          : data.createdAt || new Date().toISOString(),
      });
    }

    return NextResponse.json({
      workspaces,
      admin: session,
    });
  } catch (err: any) {
    console.error("[godpanel/workspaces] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to load workspaces" }, { status: 500 });
  }
}
