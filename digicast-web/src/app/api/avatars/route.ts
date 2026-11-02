import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { PRESET_ANIME_AVATARS, GamerAvatar } from "@/lib/avatars";
import { col } from "@/lib/firestore/collections";

// Helper to authenticate caller
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

// GET /api/avatars
// Returns preset anime gamer avatars + all custom avatars added by admins
export async function GET(req: NextRequest) {
  try {
    const customList: GamerAvatar[] = [];

    try {
      // Fetch custom avatars stored in Firestore
      const snapshot = await adminDb
        .collection("system_config")
        .doc("avatars")
        .collection("items")
        .orderBy("createdAt", "desc")
        .get();

      snapshot.forEach((doc) => {
        const d = doc.data();
        customList.push({
          id: doc.id,
          name: d.name || "Custom Avatar",
          series: d.series || "Gamer Edition",
          badge: d.badge || "Hero",
          color: d.color || "#06B6D4",
          url: d.url || "",
          description: d.description || "",
          isDefault: false,
          addedBy: d.addedBy || "",
          createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : d.createdAt,
        });
      });
    } catch (dbErr) {
      console.warn("[api/avatars] Note loading custom avatars:", dbErr);
    }

    // Merge presets with custom avatars
    const allAvatars = [...PRESET_ANIME_AVATARS, ...customList];

    return NextResponse.json({
      success: true,
      avatars: allAvatars,
      presetsCount: PRESET_ANIME_AVATARS.length,
      customCount: customList.length,
    });
  } catch (error: any) {
    console.error("[api/avatars] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load avatars", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/avatars
// Allows Admin or Owner to add a new Gamer/Anime Avatar to the roster
export async function POST(req: NextRequest) {
  try {
    const caller = await getCaller(req);
    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, series, badge, color, url, description, workspaceId } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: "Avatar name and image URL are required." },
        { status: 400 }
      );
    }

    // Verify caller has admin or owner privileges
    const resolvedWid = workspaceId || caller.uid;
    const wsDoc = await adminDb.doc(col.workspace(resolvedWid)).get();
    const isOwner = wsDoc.exists && (wsDoc.data()?.ownerUid === caller.uid || wsDoc.data()?.ownerId === caller.uid) || resolvedWid === caller.uid;

    const callerMemberDoc = await adminDb.doc(col.member(resolvedWid, caller.uid)).get();
    const callerRole = isOwner ? "owner" : (callerMemberDoc.data()?.role || "viewer");

    const canAdd = callerRole === "owner" || callerRole === "admin";
    if (!canAdd && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden: Only workspace Admins and Owners can add custom avatars." },
        { status: 403 }
      );
    }

    const avatarId = "custom-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
    const newAvatar: GamerAvatar = {
      id: avatarId,
      name: name.trim(),
      series: (series || "Anime Series").trim(),
      badge: (badge || "Gamer Legend").trim(),
      color: color || "#8B5CF6",
      url: url.trim(),
      description: (description || "Custom gamer avatar added by studio admin.").trim(),
      isDefault: false,
      addedBy: caller.email || caller.uid,
      createdAt: new Date().toISOString(),
    };

    // Save to global avatars collection
    await adminDb
      .collection("system_config")
      .doc("avatars")
      .collection("items")
      .doc(avatarId)
      .set({
        ...newAvatar,
        createdAt: new Date(),
        createdTimestamp: Date.now(),
      });

    return NextResponse.json({
      success: true,
      message: `Avatar "${newAvatar.name}" added successfully!`,
      avatar: newAvatar,
    });
  } catch (error: any) {
    console.error("[api/avatars] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create avatar", details: error.message },
      { status: 500 }
    );
  }
}

