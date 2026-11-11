import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";
import { PRICING_PLANS, buildUpiDeepLink, UPI_CONFIG } from "@/lib/pricingPlans";
import { createGatewayPaymentSession } from "@/lib/upiGatewayClient";

/**
 * POST /api/payments/session
 * Initializes a new tracked payment session for a workspace plan purchase.
 * Integrates directly with the self-hosted UPI Gateway for instant observation attribution.
 */
export async function POST(req: NextRequest) {
  try {
    let userUid = "anonymous";
    let userEmail = "";

    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        userUid = decoded.uid;
        userEmail = decoded.email || "";
      } catch {}
    }

    const { workspaceId, planId, clientEmail } = await req.json();

    if (!workspaceId || !planId) {
      return NextResponse.json({ error: "workspaceId and planId are required" }, { status: 400 });
    }

    const selectedPlan = PRICING_PLANS.find((p) => p.id === planId);
    if (!selectedPlan) {
      return NextResponse.json({ error: "Invalid planId selected" }, { status: 400 });
    }

    const wsRef = adminDb.doc(col.workspace(workspaceId));
    const wsDoc = await wsRef.get();
    if (!wsDoc.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const wsData = wsDoc.data() || {};
    const finalEmail = userEmail || clientEmail || wsData.ownerEmail || "";
    const orderId = `DIGI-${workspaceId.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    // 1. Attempt to register session with self-hosted UPI Gateway
    const gatewayResult = await createGatewayPaymentSession({
      orderId,
      amountINR: selectedPlan.priceINR,
      workspaceId,
      planId: selectedPlan.id,
      userEmail: finalEmail,
      customerName: wsData.name || "Digicast Creator",
    });

    const upiDeepLink = buildUpiDeepLink({
      amount: selectedPlan.priceINR,
      planName: selectedPlan.name,
      workspaceId,
      email: finalEmail,
    });

    const paymentRecord = {
      id: paymentId,
      orderId,
      workspaceId,
      workspaceName: wsData.name || "Creator Studio",
      userUid,
      userEmail: finalEmail,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      amount: selectedPlan.priceINR,
      currency: "INR",
      receiverUpiId: UPI_CONFIG.upiId,
      status: "pending_verification",
      gatewayPaymentId: gatewayResult.gatewayPaymentId || null,
      gatewayCheckoutUrl: gatewayResult.checkoutUrl || null,
      createdAt: nowIso,
      updatedAt: nowIso,
      submittedVia: "web_session",
    };

    // Store in global payments and workspace payments
    await adminDb.collection("payments").doc(paymentId).set(paymentRecord);
    await adminDb.doc(`workspaces/${workspaceId}/payments/${paymentId}`).set(paymentRecord);

    return NextResponse.json({
      success: true,
      paymentId,
      orderId,
      amount: selectedPlan.priceINR,
      currency: "INR",
      plan: selectedPlan,
      upiDeepLink,
      gatewayCheckoutUrl: gatewayResult.checkoutUrl || null,
      receiverUpiId: UPI_CONFIG.upiId,
    });
  } catch (err: any) {
    console.error("[payments/session] Error creating session:", err);
    return NextResponse.json({ error: err.message || "Failed to create payment session" }, { status: 500 });
  }
}
