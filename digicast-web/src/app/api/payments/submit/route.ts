import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";
import { PRICING_PLANS, buildVerificationTelegramUrl, UPI_CONFIG } from "@/lib/pricingPlans";

// POST /api/payments/submit
// Submits a UPI payment proof (UTR / Ref ID) for verification
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
      return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 });
    }

    const { workspaceId, planId, utrNumber, note, screenshotUrl } = await req.json();

    if (!workspaceId || !planId || !utrNumber) {
      return NextResponse.json({ error: "Workspace ID, Plan, and UTR number are required" }, { status: 400 });
    }

    const cleanUtr = String(utrNumber).trim();
    if (cleanUtr.length < 6) {
      return NextResponse.json({ error: "Please enter a valid UPI Reference / UTR Number" }, { status: 400 });
    }

    const selectedPlan = PRICING_PLANS.find(p => p.id === planId);
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
    const userEmail = decodedToken.email || wsData.ownerEmail || "";

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const paymentRecord = {
      id: paymentId,
      workspaceId,
      workspaceName,
      userUid: decodedToken.uid,
      userEmail,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      amount: selectedPlan.priceINR,
      currency: "INR",
      receiverUpiId: UPI_CONFIG.upiId,
      utrNumber: cleanUtr,
      note: note || "",
      screenshotUrl: screenshotUrl || null,
      submittedVia: "web",
      status: "pending_verification", // 'pending_verification' | 'approved' | 'rejected'
      createdAt: now,
      updatedAt: now,
      verifiedAt: null,
      verifiedBy: null,
    };

    // Store in global payments collection for GodPanel
    await adminDb.collection("payments").doc(paymentId).set(paymentRecord);

    // Also store under workspace for user history
    await adminDb.doc(`workspaces/${workspaceId}/payments/${paymentId}`).set(paymentRecord);

    // Build instant verification URLs
    const telegramUrl = buildVerificationTelegramUrl({
      workspaceId,
      workspaceName,
      userEmail,
      planName: selectedPlan.name,
      amount: selectedPlan.priceINR,
      utrNumber: cleanUtr,
    });

    return NextResponse.json({
      success: true,
      message: `Payment proof for ${selectedPlan.name} (₹${selectedPlan.priceINR}) submitted successfully!`,
      payment: paymentRecord,
      telegramUrl,
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

    const payments = snap.docs.map(d => d.data());
    return NextResponse.json({ payments });
  } catch (err: any) {
    console.error("[payments GET] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch payments" }, { status: 500 });
  }
}
