import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";
import { PRICING_PLANS, UPI_CONFIG } from "@/lib/pricingPlans";
import {
  checkGatewayPaymentStatus,
  activateSubscriptionForPayment,
} from "@/lib/upiGatewayClient";

// POST /api/payments/submit
// Submits a UPI payment proof (UTR / Ref ID) for verification and instant check
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    let decodedToken: any = null;

    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.split("Bearer ")[1];
      try {
        decodedToken = await adminAuth.verifyIdToken(token);
      } catch {
        return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 });
      }
    }

    const {
      workspaceId,
      planId,
      utrNumber,
      note,
      screenshotUrl,
      userEmail: clientEmail,
      paymentId: clientPaymentId,
      orderId: clientOrderId,
    } = await req.json();

    if (!workspaceId || !planId) {
      return NextResponse.json({ error: "Workspace ID and Plan are required" }, { status: 400 });
    }

    const cleanUtr = utrNumber ? String(utrNumber).trim() : "";

    // Require at least one proof indicator (UTR, Screenshot, or Note)
    if (!cleanUtr && !screenshotUrl && !note) {
      return NextResponse.json(
        { error: "Please provide either a 12-digit UPI UTR number or attach a payment screenshot" },
        { status: 400 }
      );
    }

    const finalUtr = cleanUtr || (screenshotUrl ? "Attached in Screenshot" : "Pending Verification");

    const selectedPlan = PRICING_PLANS.find((p) => p.id === planId);
    if (!selectedPlan) {
      return NextResponse.json({ error: "Invalid pricing plan selected" }, { status: 400 });
    }

    // Verify workspace exists
    const wsRef = adminDb.doc(col.workspace(workspaceId));
    const wsDoc = await wsRef.get();
    if (!wsDoc.exists) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const wsData = wsDoc.data() || {};
    const workspaceName = wsData.name || "Creator Studio";
    const userEmail = decodedToken?.email || clientEmail || wsData.ownerEmail || "";
    const userUid = decodedToken?.uid || "anonymous_user";

    const paymentId = clientPaymentId || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const currentUploadCount = ((wsData.proofUploadCount as number) || 0) + 1;
    const currentUnverifiedGraceCount = (wsData.unverifiedGraceCount as number) || 0;

    // Abuse Prevention: Allow max 2 unverified grace submissions before requiring official approval
    const canGrantGrace = currentUnverifiedGraceCount < 2;
    const graceExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Check if the UPI Gateway has already observed this transaction via Android SMS or Gmail Observer
    let autoApproved = false;
    let gatewayCheckResult: any = null;

    if (cleanUtr) {
      // Check gateway for session or UTR match
      const checkKey = clientPaymentId || clientOrderId || cleanUtr;
      gatewayCheckResult = await checkGatewayPaymentStatus(checkKey);
      if (gatewayCheckResult.reachable && gatewayCheckResult.isPaid) {
        autoApproved = true;
      }
    }

    if (autoApproved) {
      // Amount verified directly from bank observer! Activate full plan immediately
      const activationResult = await activateSubscriptionForPayment(adminDb, {
        workspaceId,
        paymentId,
        planId: selectedPlan.id,
        amount: selectedPlan.priceINR,
        utrNumber: finalUtr,
        verifiedBy: "UPI_GATEWAY_AUTO_OBSERVER",
      });

      return NextResponse.json({
        success: true,
        autoApproved: true,
        status: "approved",
        message: `🎉 Payment of ₹${selectedPlan.priceINR} confirmed via bank observer! Full access activated until ${new Date(activationResult.activatedUntil).toLocaleDateString()}.`,
        payment: activationResult.payment,
        activatedUntil: activationResult.activatedUntil,
      });
    }

    // Otherwise record as pending_verification with 24h grace access
    const paymentRecord = {
      id: paymentId,
      orderId: clientOrderId || null,
      workspaceId,
      workspaceName,
      userUid,
      userEmail,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      amount: selectedPlan.priceINR,
      currency: "INR",
      receiverUpiId: UPI_CONFIG.upiId,
      utrNumber: finalUtr,
      note: note || "",
      screenshotUrl: screenshotUrl || null,
      submittedVia: "web",
      submissionCount: currentUploadCount,
      graceGranted: canGrantGrace,
      status: "pending_verification",
      createdAt: now,
      updatedAt: now,
      verifiedAt: null,
      verifiedBy: null,
    };

    // Store in global payments collection for GodPanel
    await adminDb.collection("payments").doc(paymentId).set(paymentRecord);

    // Also store under workspace for user history
    await adminDb.doc(`workspaces/${workspaceId}/payments/${paymentId}`).set(paymentRecord);

    // Update workspace with instant 1-day access & proof count tracking
    const wsUpdatePayload: any = {
      proofUploadCount: currentUploadCount,
      lastProofSubmittedAt: now,
      updatedAt: now,
    };

    if (canGrantGrace) {
      wsUpdatePayload.plan = selectedPlan.id;
      wsUpdatePayload.subscriptionTier = selectedPlan.id;
      wsUpdatePayload.subscription = selectedPlan.id;
      wsUpdatePayload.subscriptionStatus = "active";
      wsUpdatePayload.temporaryGraceActive = true;
      wsUpdatePayload.subscriptionExpiresAt = graceExpiresAt;
      wsUpdatePayload.unverifiedGraceCount = currentUnverifiedGraceCount + 1;
      wsUpdatePayload.lastGraceGrantedAt = now;
      wsUpdatePayload.trialBypassDetected = false;
    } else {
      wsUpdatePayload.potentialAbuseFlag = true;
    }

    await wsRef.set(wsUpdatePayload, { merge: true });

    return NextResponse.json({
      success: true,
      autoApproved: false,
      status: "pending_verification",
      message: `Thank you for subscribing! Payment proof for ${selectedPlan.name} (₹${selectedPlan.priceINR}) received.`,
      payment: paymentRecord,
      graceGranted: canGrantGrace,
      discordUrl: UPI_CONFIG.discordSupportUrl,
    });
  } catch (err: any) {
    console.error("[payments/submit] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit payment proof" }, { status: 500 });
  }
}

// GET /api/payments/submit?workspaceId=...
// Retrieves recent payments for this workspace
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
    }

    const snap = await adminDb
      .collection(`workspaces/${workspaceId}/payments`)
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    const payments = snap.docs.map((d) => d.data());
    return NextResponse.json({ payments });
  } catch (err: any) {
    console.error("[payments GET] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch payments" }, { status: 500 });
  }
}
