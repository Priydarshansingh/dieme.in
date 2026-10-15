import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";
import { verifyGodSessionToken } from "@/lib/godpanelAuth";
import { computeWorkspaceSubscription } from "@/lib/subscription";

// GET /api/godpanel/payments
// Returns all submitted payments for GodPanel verification
export async function GET(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get("godpanel_token")?.value;
    const authHeader = req.headers.get("authorization") || "";
    const headerToken = authHeader.replace("Bearer ", "").trim();
    const token = cookieToken || headerToken;

    const admin = verifyGodSessionToken(token);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized God Panel access" }, { status: 401 });
    }

    const snap = await adminDb
      .collection("payments")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const payments = snap.docs.map(doc => doc.data());
    return NextResponse.json({ payments });
  } catch (err: any) {
    console.error("[godpanel/payments GET] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch payments" }, { status: 500 });
  }
}

// POST /api/godpanel/payments
// Approves or rejects a payment and updates workspace subscription accordingly
export async function POST(req: NextRequest) {
  try {
    const cookieToken = req.cookies.get("godpanel_token")?.value;
    const authHeader = req.headers.get("authorization") || "";
    const headerToken = authHeader.replace("Bearer ", "").trim();
    const token = cookieToken || headerToken;

    const admin = verifyGodSessionToken(token);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized God Panel access" }, { status: 401 });
    }

    const { paymentId, action, days = 30 } = await req.json(); // action: 'approve' | 'reject'
    if (!paymentId || !action) {
      return NextResponse.json({ error: "paymentId and action are required" }, { status: 400 });
    }

    const paymentRef = adminDb.collection("payments").doc(paymentId);
    const paymentDoc = await paymentRef.get();
    if (!paymentDoc.exists) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const payment = paymentDoc.data()!;
    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    if (action === "reject") {
      await paymentRef.update({
        status: "rejected",
        updatedAt: nowIso,
        verifiedAt: nowIso,
        verifiedBy: admin.username,
      });

      // Update workspace record too
      await adminDb.doc(`workspaces/${payment.workspaceId}/payments/${paymentId}`).set({
        ...payment,
        status: "rejected",
        updatedAt: nowIso,
        verifiedAt: nowIso,
        verifiedBy: admin.username,
      }, { merge: true });

      // If user had temporary grace, expire it immediately upon rejection
      await adminDb.doc(col.workspace(payment.workspaceId)).set({
        subscriptionStatus: "expired",
        temporaryGraceActive: false,
        potentialAbuseFlag: true,
        updatedAt: nowIso,
      }, { merge: true });

      return NextResponse.json({ success: true, message: "Payment rejected" });
    }

    if (action === "approve") {
      const wsRef = adminDb.doc(col.workspace(payment.workspaceId));
      const wsDoc = await wsRef.get();
      if (!wsDoc.exists) {
        return NextResponse.json({ error: "Associated workspace not found" }, { status: 404 });
      }

      const wsData = wsDoc.data();
      const currentSub = computeWorkspaceSubscription(wsData);
      const assignedPlan = payment.planId || "pro";

      // Compute days based on plan tier (30d for intro/starter, 90d for 3-month pro, 365d for 1-year studio)
      let planDays = 30;
      if (assignedPlan === 'pro') planDays = 90;
      if (assignedPlan === 'studio') planDays = 365;
      const effectiveDays = (days && Number(days) !== 30) ? Number(days) : planDays;
      const additionMs = effectiveDays * 24 * 60 * 60 * 1000;
      let newExpiresMs = now + additionMs;

      if (!currentSub.isExpired && currentSub.status === "active" && currentSub.subscriptionExpiresAt) {
        const existingMs = Date.parse(currentSub.subscriptionExpiresAt);
        if (!isNaN(existingMs) && existingMs > now) {
          newExpiresMs = existingMs + additionMs;
        }
      }

      // 1. Update workspace subscription
      await wsRef.update({
        plan: assignedPlan,
        subscriptionTier: assignedPlan,
        subscription: assignedPlan,
        subscriptionStatus: "active",
        temporaryGraceActive: false,
        unverifiedGraceCount: 0, // Reset unverified counter on official approval!
        potentialAbuseFlag: false,
        trialBypassDetected: false, // Reset any trial abuse flags upon verified payment
        subscriptionExpiresAt: new Date(newExpiresMs).toISOString(),
        lastPaymentAt: nowIso,
        updatedAt: nowIso,
      });

      // 2. Update payment document
      const updatedPayment = {
        ...payment,
        status: "approved",
        updatedAt: nowIso,
        verifiedAt: nowIso,
        verifiedBy: admin.username,
        activatedUntil: new Date(newExpiresMs).toISOString(),
      };

      await paymentRef.set(updatedPayment, { merge: true });
      await adminDb.doc(`workspaces/${payment.workspaceId}/payments/${paymentId}`).set(updatedPayment, { merge: true });

      return NextResponse.json({
        success: true,
        message: `Payment approved! Workspace activated on ${assignedPlan.toUpperCase()} until ${new Date(newExpiresMs).toLocaleDateString()}`,
        payment: updatedPayment,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[godpanel/payments POST] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to process payment" }, { status: 500 });
  }
}
