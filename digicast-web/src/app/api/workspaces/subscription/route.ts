import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";
import { computeWorkspaceSubscription } from "@/lib/subscription";

// GET /api/workspaces/subscription?workspaceId=...
// POST /api/workspaces/subscription (Renew or upgrade subscription)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const wsDoc = await adminDb.doc(col.workspace(workspaceId)).get();
    if (!wsDoc.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const wsData = wsDoc.data();
    const subscription = computeWorkspaceSubscription(wsData);

    return NextResponse.json({
      workspaceId,
      workspaceName: wsData?.name || "Workspace",
      subscription,
    });
  } catch (err: any) {
    console.error("[subscription GET] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch subscription" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { workspaceId, action } = await req.json();
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    // Verify caller is owner of this workspace
    const memberDoc = await adminDb.doc(col.member(workspaceId, decodedToken.uid)).get();
    if (!memberDoc.exists || memberDoc.data()?.role !== "owner") {
      return NextResponse.json({ error: "Only the workspace owner can manage subscriptions" }, { status: 403 });
    }

    const wsRef = adminDb.doc(col.workspace(workspaceId));
    const wsDoc = await wsRef.get();
    if (!wsDoc.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const currentData = wsDoc.data();
    const currentSub = computeWorkspaceSubscription(currentData);

    let newExpiresMs = now + thirtyDaysMs;
    // If renewing an active subscription that hasn't expired yet, extend from existing expiry date
    if (!currentSub.isExpired && currentSub.status === 'active' && currentSub.subscriptionExpiresAt) {
      const existingMs = Date.parse(currentSub.subscriptionExpiresAt);
      if (!isNaN(existingMs) && existingMs > now) {
        newExpiresMs = existingMs + thirtyDaysMs;
      }
    }

    await wsRef.update({
      plan: "pro",
      subscription: "pro",
      subscriptionStatus: "active",
      subscriptionExpiresAt: new Date(newExpiresMs).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const updatedDoc = await wsRef.get();
    const updatedSub = computeWorkspaceSubscription(updatedDoc.data());

    return NextResponse.json({
      success: true,
      message: "Subscription successfully renewed for 30 days.",
      subscription: updatedSub,
    });
  } catch (err: any) {
    console.error("[subscription POST] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to update subscription" }, { status: 500 });
  }
}
