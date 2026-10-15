import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { verifyGodSessionToken } from "@/lib/godpanelAuth";
import { computeWorkspaceSubscription } from "@/lib/subscription";
import { col } from "@/lib/firestore/collections";

// Helper to authenticate God Admin
function getAdminSession(req: NextRequest) {
  const cookieToken = req.cookies.get("godpanel_token")?.value;
  const authHeader = req.headers.get("authorization") || "";
  const headerToken = authHeader.replace("Bearer ", "").trim();
  return verifyGodSessionToken(cookieToken || headerToken);
}

// GET /api/godpanel/workspaces/[id]
// Returns complete deep details of a workspace: info, members with credentials, recent streams & clips
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized God Panel access" }, { status: 401 });
    }

    const workspaceId = params.id;
    const wsRef = adminDb.doc(col.workspace(workspaceId));
    const wsDoc = await wsRef.get();
    if (!wsDoc.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const wsData = wsDoc.data() || {};
    const subscription = computeWorkspaceSubscription(wsData);

    // 1. Fetch all members with their app passwords
    const membersSnap = await wsRef.collection("members").get();
    const members = membersSnap.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        id: doc.id,
        email: data.email || "",
        displayName: data.displayName || "Member",
        role: data.role || "editor",
        appPassword: data.appPassword || "",
        joinedAt: data.joinedAt || data.updatedAt || "",
      };
    });

    // 2. Fetch connected YouTube channel
    let youtubeChannel: any = null;
    try {
      const ytSnap = await wsRef.collection("youtube").limit(1).get();
      if (!ytSnap.empty) {
        youtubeChannel = ytSnap.docs[0].data();
      }
    } catch {}

    // 3. Fetch recent streams (up to 15)
    let streams: any[] = [];
    try {
      const sSnap = await wsRef.collection("streams").orderBy("startedAt", "desc").limit(15).get();
      streams = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      try {
        const sSnap = await wsRef.collection("streams").limit(15).get();
        streams = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch {}
    }

    // 4. Fetch recent clips (up to 15)
    let clips: any[] = [];
    try {
      const cSnap = await wsRef.collection("clips").orderBy("createdAt", "desc").limit(15).get();
      clips = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      try {
        const cSnap = await wsRef.collection("clips").limit(15).get();
        clips = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch {}
    }

    return NextResponse.json({
      workspace: {
        id: workspaceId,
        ...wsData,
        subscription,
      },
      members,
      youtubeChannel,
      streams,
      clips,
    });
  } catch (err: any) {
    console.error("[godpanel/workspaces/detail GET] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch workspace details" }, { status: 500 });
  }
}

// PATCH /api/godpanel/workspaces/[id]
// Comprehensive admin controls: toggle suspension, change plan/tier, reset member passwords, update roles
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminSession(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized God Panel access" }, { status: 401 });
    }

    const workspaceId = params.id;
    const wsRef = adminDb.doc(col.workspace(workspaceId));
    const wsDoc = await wsRef.get();
    if (!wsDoc.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      action,
      name,
      isSuspended,
      subscriptionTier,
      memberUid,
      memberPassword,
      memberRole,
      newMemberEmail,
      newMemberName,
    } = body;

    const now = new Date().toISOString();

    // Action A: Toggle Suspension
    if (action === "toggle_suspension") {
      await wsRef.update({
        isSuspended: Boolean(isSuspended),
        suspendedBy: isSuspended ? admin.username : null,
        suspendedAt: isSuspended ? now : null,
        updatedAt: now,
      });

      return NextResponse.json({
        success: true,
        message: isSuspended ? "Workspace suspended and access locked." : "Workspace unsuspended and access restored.",
      });
    }

    // Action B: Update Workspace Profile / Settings
    if (action === "update_info") {
      const updates: any = { updatedAt: now };
      if (name) updates.name = name;
      if (body.telegramChatId !== undefined) updates.telegramChatId = body.telegramChatId;
      if (body.telegramEnabled !== undefined) updates.telegramEnabled = Boolean(body.telegramEnabled);

      await wsRef.update(updates);
      return NextResponse.json({ success: true, message: "Workspace settings updated" });
    }

    // Action C: Force Set / Reset Any Member's App Password
    if (action === "set_member_password") {
      if (!memberUid || !memberPassword || memberPassword.length < 6) {
        return NextResponse.json({ error: "Valid member UID and password (min 6 chars) required" }, { status: 400 });
      }

      // Update password in Firebase Auth if user exists
      try {
        await adminAuth.updateUser(memberUid, { password: memberPassword });
      } catch (authErr) {
        console.warn(`[godpanel] Firebase Auth update for ${memberUid} failed or user is not in Auth:`, authErr);
      }

      // Update member document in workspace
      await wsRef.collection("members").doc(memberUid).set({
        appPassword: memberPassword,
        updatedAt: now,
      }, { merge: true });

      // Update user doc if exists
      try {
        await adminDb.doc(col.user(memberUid)).set({
          appPassword: memberPassword,
          updatedAt: now,
        }, { merge: true });
      } catch {}

      return NextResponse.json({
        success: true,
        message: `Password updated for member ${memberUid}`,
      });
    }

    // Action D: Update Member Role
    if (action === "update_member_role") {
      if (!memberUid || !memberRole) {
        return NextResponse.json({ error: "memberUid and memberRole are required" }, { status: 400 });
      }

      await wsRef.collection("members").doc(memberUid).set({
        role: memberRole,
        updatedAt: now,
      }, { merge: true });

      // Update user claims
      try {
        await adminAuth.setCustomUserClaims(memberUid, {
          role: memberRole,
          workspaceId,
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: `Member role updated to ${memberRole.toUpperCase()}`,
      });
    }

    // Action E: Add New Team Member Directly from GodPanel
    if (action === "add_member") {
      if (!newMemberEmail || !memberPassword || memberPassword.length < 6) {
        return NextResponse.json({ error: "Email and password (min 6 chars) are required" }, { status: 400 });
      }

      const cleanEmail = newMemberEmail.trim().toLowerCase();
      let targetUid: string;

      try {
        const existing = await adminAuth.getUserByEmail(cleanEmail);
        targetUid = existing.uid;
        await adminAuth.updateUser(targetUid, { password: memberPassword });
      } catch {
        const newUser = await adminAuth.createUser({
          email: cleanEmail,
          password: memberPassword,
          displayName: newMemberName || cleanEmail.split("@")[0],
        });
        targetUid = newUser.uid;
      }

      const assignedRole = memberRole || "editor";
      await adminAuth.setCustomUserClaims(targetUid, {
        role: assignedRole,
        workspaceId,
      });

      await wsRef.collection("members").doc(targetUid).set({
        id: targetUid,
        uid: targetUid,
        workspaceId,
        role: assignedRole,
        email: cleanEmail,
        displayName: newMemberName || cleanEmail.split("@")[0],
        appPassword: memberPassword,
        joinedAt: now,
        updatedAt: now,
      });

      return NextResponse.json({
        success: true,
        message: `Added member ${cleanEmail} as ${assignedRole.toUpperCase()}`,
      });
    }

    // Action F: Remove Member
    if (action === "remove_member") {
      if (!memberUid) return NextResponse.json({ error: "memberUid required" }, { status: 400 });
      await wsRef.collection("members").doc(memberUid).delete();
      return NextResponse.json({ success: true, message: "Member removed from workspace" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("[godpanel/workspaces/detail PATCH] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to execute admin action" }, { status: 500 });
  }
}

// DELETE /api/godpanel/workspaces/[id]
// Deletes a workspace and its references
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = getAdminSession(req);
    if (!admin || admin.role !== "super_admin") {
      return NextResponse.json({ error: "Only Super Admin can delete workspaces" }, { status: 403 });
    }

    const workspaceId = params.id;
    const wsRef = adminDb.doc(col.workspace(workspaceId));

    // Delete subcollections (members, streams, clips)
    const membersSnap = await wsRef.collection("members").get();
    for (const doc of membersSnap.docs) await doc.ref.delete();

    const streamsSnap = await wsRef.collection("streams").get();
    for (const doc of streamsSnap.docs) await doc.ref.delete();

    const clipsSnap = await wsRef.collection("clips").get();
    for (const doc of clipsSnap.docs) await doc.ref.delete();

    // Delete workspace document
    await wsRef.delete();

    return NextResponse.json({
      success: true,
      message: `Workspace ${workspaceId} completely deleted.`,
    });
  } catch (err: any) {
    console.error("[godpanel/workspaces DELETE] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete workspace" }, { status: 500 });
  }
}
