// GET & POST /api/mobile/device
// Device verification and anti-abuse vault endpoint for Digicast.
// Tracks device hardware ID (ANDROID_ID) across installs, uninstalls, and updates
// to persist trial passes, last account identity, and ad-gating verification.

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get("deviceId")?.trim();

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId query parameter is required" }, { status: 400 });
    }

    const deviceDoc = await adminDb.collection("devices").doc(deviceId).get();

    if (!deviceDoc.exists) {
      return NextResponse.json({
        exists: false,
        deviceId,
        hasActiveAdUnlock: false,
        unlockExpiresAtMs: 0,
      });
    }

    const data = deviceDoc.data() || {};
    const now = Date.now();
    const unlockExpiresAtMs = Number(data.unlockExpiresAtMs || 0);
    const isPassValid = unlockExpiresAtMs > now;

    return NextResponse.json({
      exists: true,
      deviceId,
      email: data.email || "",
      uid: data.uid || "",
      workspaceId: data.workspaceId || "",
      hasActiveAdUnlock: isPassValid ? Boolean(data.hasActiveAdUnlock) : false,
      unlockExpiresAtMs: isPassValid ? unlockExpiresAtMs : 0,
      lastLoginAt: data.lastLoginAt || null,
      updatedAt: data.updatedAt || null,
    });
  } catch (error: any) {
    console.error("[/api/mobile/device] GET error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch device record" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const deviceId = body.deviceId?.trim();

    if (!deviceId) {
      return NextResponse.json({ error: "deviceId is required in body" }, { status: 400 });
    }

    const now = Date.now();
    const updates: Record<string, any> = {
      deviceId,
      updatedAt: new Date().toISOString(),
    };

    if (body.email !== undefined) updates.email = body.email.trim();
    if (body.uid !== undefined) updates.uid = body.uid;
    if (body.workspaceId !== undefined) updates.workspaceId = body.workspaceId;

    if (body.hasActiveAdUnlock === true) {
      updates.hasActiveAdUnlock = true;
      const durationMs = Number(body.unlockDurationMs || 24 * 60 * 60 * 1000); // Default 24h
      updates.unlockExpiresAtMs = now + durationMs;
      updates.lastUnlockedAt = new Date().toISOString();
    } else if (body.hasActiveAdUnlock === false) {
      updates.hasActiveAdUnlock = false;
      updates.unlockExpiresAtMs = 0;
    }

    if (body.lastLoginAt) {
      updates.lastLoginAt = body.lastLoginAt;
    }

    await adminDb.collection("devices").doc(deviceId).set(updates, { merge: true });

    const updatedDoc = await adminDb.collection("devices").doc(deviceId).get();
    const data = updatedDoc.data() || {};

    return NextResponse.json({
      success: true,
      deviceId,
      email: data.email || "",
      uid: data.uid || "",
      workspaceId: data.workspaceId || "",
      hasActiveAdUnlock: Boolean(data.hasActiveAdUnlock),
      unlockExpiresAtMs: Number(data.unlockExpiresAtMs || 0),
    });
  } catch (error: any) {
    console.error("[/api/mobile/device] POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to update device record" }, { status: 500 });
  }
}
