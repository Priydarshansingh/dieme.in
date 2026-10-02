import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyGodSessionToken } from "@/lib/godpanelAuth";
import { computeWorkspaceSubscription } from "@/lib/subscription";
import { col } from "@/lib/firestore/collections";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.cookies.get("godpanel_token")?.value;
    const session = verifyGodSessionToken(token || "");
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access to God Panel" }, { status: 401 });
    }

    const workspaceId = params.id;
    const { action, days = 30, plan = "pro" } = await req.json();

    const wsRef = adminDb.doc(col.workspace(workspaceId));
    const wsDoc = await wsRef.get();
    if (!wsDoc.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const currentData = wsDoc.data();
    const currentSub = computeWorkspaceSubscription(currentData);
    const now = Date.now();
    const daysMs = days * 24 * 60 * 60 * 1000;

    let updates: any = {
      updatedAt: new Date().toISOString(),
      lastAdminActionBy: session.username,
      lastAdminActionAt: new Date().toISOString(),
    };

    if (action === "activate_pro" || action === "renew") {
      let baseMs = now;
      if (!currentSub.isExpired && currentSub.status === "active" && currentSub.subscriptionExpiresAt) {
        const existingMs = Date.parse(currentSub.subscriptionExpiresAt);
        if (!isNaN(existingMs) && existingMs > now) baseMs = existingMs;
      }
      updates.plan = "pro";
      updates.subscription = "pro";
      updates.subscriptionStatus = "active";
      updates.subscriptionExpiresAt = new Date(baseMs + daysMs).toISOString();
    } else if (action === "extend_days") {
      let baseMs = now;
      if (currentSub.plan === "pro" && currentSub.subscriptionExpiresAt) {
        const existingMs = Date.parse(currentSub.subscriptionExpiresAt);
        if (!isNaN(existingMs) && existingMs > now) baseMs = existingMs;
      } else if (currentSub.trialEndsAt) {
        const existingMs = Date.parse(currentSub.trialEndsAt);
        if (!isNaN(existingMs) && existingMs > now) baseMs = existingMs;
      }
      const newExpire = new Date(baseMs + daysMs).toISOString();
      if (currentSub.plan === "pro") {
        updates.subscriptionExpiresAt = newExpire;
        updates.subscriptionStatus = "active";
      } else {
        updates.trialEndsAt = newExpire;
        updates.subscriptionStatus = "trial";
      }
    } else if (action === "expire_now") {
      updates.subscriptionStatus = "expired";
      updates.subscriptionExpiresAt = new Date(now - 1000).toISOString();
      updates.trialEndsAt = new Date(now - 1000).toISOString();
    } else if (action === "reset_trial") {
      updates.plan = "free_trial";
      updates.subscription = "free_trial";
      updates.subscriptionStatus = "trial";
      updates.trialEndsAt = new Date(now + (14 * 24 * 60 * 60 * 1000)).toISOString();
    } else if (action === "set_plan") {
      updates.plan = plan;
      updates.subscription = plan;
      if (plan === "pro") {
        updates.subscriptionStatus = "active";
        updates.subscriptionExpiresAt = new Date(now + (30 * 24 * 60 * 60 * 1000)).toISOString();
      } else {
        updates.subscriptionStatus = "trial";
        updates.trialEndsAt = new Date(now + (14 * 24 * 60 * 60 * 1000)).toISOString();
      }
    }

    await wsRef.update(updates);
    const updatedDoc = await wsRef.get();
    const newSubscription = computeWorkspaceSubscription(updatedDoc.data());

    return NextResponse.json({
      success: true,
      message: `Workspace subscription updated by ${session.username}`,
      subscription: newSubscription,
    });
  } catch (err: any) {
    console.error("[godpanel/workspaces/subscription] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to update subscription" }, { status: 500 });
  }
}
