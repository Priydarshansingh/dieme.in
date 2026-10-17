import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import {
  verifyGatewayWebhookSignature,
  activateSubscriptionForPayment,
  UPI_GATEWAY_WEBHOOK_SECRET,
} from "@/lib/upiGatewayClient";
import { PRICING_PLANS } from "@/lib/pricingPlans";

/**
 * POST /api/payments/webhook
 * Receives authoritative payment confirmation events from the self-hosted UPI Gateway.
 * Automatically verifies bank credits and instantly activates user subscriptions.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-gateway-signature");
    const eventType = req.headers.get("x-gateway-event") || "UNKNOWN";
    const deliveryId = req.headers.get("x-gateway-delivery-id") || "";

    // In production with secret configured, verify HMAC signature
    if (process.env.NODE_ENV === "production" && process.env.UPI_GATEWAY_WEBHOOK_SECRET) {
      const isValid = verifyGatewayWebhookSignature(rawBody, signature, UPI_GATEWAY_WEBHOOK_SECRET);
      if (!isValid) {
        console.warn("[payments/webhook] Invalid webhook signature received.");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Malformed JSON payload" }, { status: 400 });
    }

    const event = (payload.event || eventType || "").toUpperCase();
    console.log(`[payments/webhook] Received event: ${event}, deliveryId: ${deliveryId}`);

    if (event !== "SUCCESS") {
      // Return 200 for other terminal events (e.g. EXPIRED, CANCELLED) to acknowledge receipt
      return NextResponse.json({
        success: true,
        message: `Event ${event} acknowledged.`,
      });
    }

    const {
      paymentId: gatewayPaymentId,
      orderId,
      amount,
      amountPaise,
      metadata = {},
    } = payload;

    const parsedAmount = amount ? parseFloat(amount) : (amountPaise ? Number(amountPaise) / 100 : 0);

    // Resolve workspaceId & planId from metadata or lookup payment in Firestore
    let workspaceId = metadata.workspaceId;
    let planId = metadata.planId;
    let targetPaymentId = metadata.paymentId || gatewayPaymentId;
    let utrNumber = metadata.utrNumber || metadata.bankReferenceNumber || payload.utr || "AUTO_GATEWAY_VERIFIED";

    if (!workspaceId) {
      // Lookup existing payment session in Firestore by orderId or gatewayPaymentId
      const paymentsCol = adminDb.collection("payments");
      let querySnap = await paymentsCol.where("orderId", "==", orderId).limit(1).get();
      if (querySnap.empty && gatewayPaymentId) {
        querySnap = await paymentsCol.where("gatewayPaymentId", "==", gatewayPaymentId).limit(1).get();
      }
      if (querySnap.empty && targetPaymentId) {
        const doc = await paymentsCol.doc(targetPaymentId).get();
        if (doc.exists) {
          const docData = doc.data()!;
          workspaceId = docData.workspaceId;
          planId = planId || docData.planId;
          targetPaymentId = doc.id;
        }
      } else if (!querySnap.empty) {
        const doc = querySnap.docs[0];
        const docData = doc.data();
        workspaceId = docData.workspaceId;
        planId = planId || docData.planId;
        targetPaymentId = doc.id;
      }
    }

    if (!workspaceId) {
      console.error("[payments/webhook] Could not resolve workspaceId for order:", orderId);
      return NextResponse.json(
        { error: "Workspace ID could not be identified for this payment" },
        { status: 422 }
      );
    }

    // Default plan if not specified (resolve based on received amount)
    if (!planId) {
      const matchedPlan = PRICING_PLANS.find((p) => p.priceINR === Math.round(parsedAmount));
      planId = matchedPlan ? matchedPlan.id : "pro";
    }

    const paymentIdToSave = targetPaymentId || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Authoritatively activate workspace subscription immediately
    const activationResult = await activateSubscriptionForPayment(adminDb, {
      workspaceId,
      paymentId: paymentIdToSave,
      planId,
      amount: parsedAmount,
      utrNumber,
      verifiedBy: "UPI_GATEWAY_AUTO_OBSERVER",
    });

    console.log(
      `[payments/webhook] ✅ Successfully auto-approved payment ${paymentIdToSave} for workspace ${workspaceId}. Active until ${activationResult.activatedUntil}`
    );

    return NextResponse.json({
      success: true,
      message: "Payment confirmed and subscription activated immediately",
      workspaceId,
      plan: activationResult.plan,
      activatedUntil: activationResult.activatedUntil,
      paymentId: paymentIdToSave,
    });
  } catch (err: any) {
    console.error("[payments/webhook] Error handling webhook:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error processing payment webhook" },
      { status: 500 }
    );
  }
}
