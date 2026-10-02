import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import {
  verifyGodSessionToken,
  hashAdminPassword,
  ensureDefaultRootAdmin,
} from "@/lib/godpanelAuth";

export const dynamic = "force-dynamic";

// GET /api/godpanel/admins
// Lists all admins (Only accessible by super_admin)
export async function GET(req: NextRequest) {
  try {
    await ensureDefaultRootAdmin();
    const token = req.cookies.get("godpanel_token")?.value;
    const session = verifyGodSessionToken(token || "");

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "super_admin") {
      return NextResponse.json({ error: "Access denied. Only Super Admins can manage administrators." }, { status: 403 });
    }

    const adminsSnap = await adminDb.collection("admins").get();
    const admins = adminsSnap.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        username: d.username,
        name: d.name || d.username,
        role: d.role,
        isActive: d.isActive !== false,
        permissions: d.permissions || [],
        createdAt: d.createdAt,
        lastLoginAt: d.lastLoginAt || null,
      };
    });

    return NextResponse.json({ admins });
  } catch (err: any) {
    console.error("[godpanel/admins GET] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch admins" }, { status: 500 });
  }
}

// POST /api/godpanel/admins
// Creates a new admin (with 'super_admin' or 'sub_admin' role)
export async function POST(req: NextRequest) {
  try {
    await ensureDefaultRootAdmin();
    const token = req.cookies.get("godpanel_token")?.value;
    const session = verifyGodSessionToken(token || "");

    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Access denied. Only Super Admins can create new admins." }, { status: 403 });
    }

    const { username, password, name, role = "sub_admin" } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Check if username already exists
    const existing = await adminDb.collection("admins").where("username", "==", cleanUsername).get();
    if (!existing.empty) {
      return NextResponse.json({ error: "An admin with this username already exists" }, { status: 400 });
    }

    const validRole = role === "super_admin" ? "super_admin" : "sub_admin";
    const permissions = validRole === "super_admin"
      ? ["all"]
      : ["view_workspaces", "manage_subscriptions"];

    const passwordHash = hashAdminPassword(password);
    const docId = `admin_${cleanUsername.replace(/[^a-z0-9_]/g, "")}`;

    await adminDb.collection("admins").doc(docId).set({
      id: docId,
      username: cleanUsername,
      name: name || cleanUsername,
      role: validRole,
      passwordHash,
      isActive: true,
      permissions,
      createdBy: session.username,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Admin ${cleanUsername} (${validRole}) successfully created.`,
      admin: {
        id: docId,
        username: cleanUsername,
        name: name || cleanUsername,
        role: validRole,
        permissions,
      },
    });
  } catch (err: any) {
    console.error("[godpanel/admins POST] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create admin" }, { status: 500 });
  }
}

// DELETE /api/godpanel/admins?id=...
// Deletes/deactivates an admin
export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get("godpanel_token")?.value;
    const session = verifyGodSessionToken(token || "");

    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Access denied. Only Super Admins can remove admins." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get("id");

    if (!adminId) {
      return NextResponse.json({ error: "Admin ID is required" }, { status: 400 });
    }

    const docRef = adminDb.collection("admins").doc(adminId);
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const data = doc.data();
    if (data?.username === "admin" || docIdIsRoot(adminId)) {
      return NextResponse.json({ error: "Cannot delete the root God Admin account" }, { status: 400 });
    }

    if (data?.username === session.username) {
      return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: `Admin ${data?.username} has been removed.`,
    });
  } catch (err: any) {
    console.error("[godpanel/admins DELETE] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete admin" }, { status: 500 });
  }
}

function docIdIsRoot(id: string): boolean {
  return id === "admin_root";
}
