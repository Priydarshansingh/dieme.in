import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import {
  ensureDefaultRootAdmin,
  verifyAdminPassword,
  createGodSessionToken,
} from "@/lib/godpanelAuth";

export async function POST(req: NextRequest) {
  try {
    await ensureDefaultRootAdmin();

    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Fallback if database is unavailable or initializing
    if (!adminDb) {
      if (cleanUsername === "admin" && password === "DigicastGod2026!#") {
        const token = createGodSessionToken({
          username: "admin",
          role: "super_admin",
          name: "Root God Admin",
        });
        const response = NextResponse.json({
          success: true,
          message: "God Panel root authentication successful",
          admin: { username: "admin", role: "super_admin", name: "Root God Admin" },
        });
        response.cookies.set("godpanel_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60,
          path: "/",
        });
        return response;
      }
      return NextResponse.json({ error: "Invalid God Panel credentials" }, { status: 401 });
    }

    // Query admin by username
    const snap = await adminDb
      .collection("admins")
      .where("username", "==", cleanUsername)
      .limit(1)
      .get();

    if (snap.empty) {
      return NextResponse.json({ error: "Invalid God Panel credentials" }, { status: 401 });
    }

    const adminDoc = snap.docs[0];
    const adminData = adminDoc.data();

    if (!adminData.isActive) {
      return NextResponse.json({ error: "This admin account has been deactivated" }, { status: 403 });
    }

    const isMatch = verifyAdminPassword(password, adminData.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid God Panel credentials" }, { status: 401 });
    }

    // Update lastLoginAt
    await adminDoc.ref.update({
      lastLoginAt: new Date().toISOString(),
    });

    const token = createGodSessionToken({
      username: adminData.username,
      role: adminData.role,
      name: adminData.name || adminData.username,
    });

    const response = NextResponse.json({
      success: true,
      message: "God Panel authentication successful",
      admin: {
        username: adminData.username,
        role: adminData.role,
        name: adminData.name,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: "godpanel_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error("[godpanel/login] Error:", err);
    return NextResponse.json({ error: err.message || "Login failed" }, { status: 500 });
  }
}
