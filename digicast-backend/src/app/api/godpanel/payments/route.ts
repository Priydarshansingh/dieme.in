import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";
import { verifyGodSessionToken } from "@/lib/godpanelAuth";
import {
  checkGatewayPaymentStatus,
  activateSubscriptionForPayment,
} from "@/lib/upiGatewayClient";

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

    const payments = snap.docs.map((doc) => doc.data());
    return NextResponse.json({ payments });
  } catch (err: any) {
    console.error("[godpanel/payments GET] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch payments" }, { status: 500 });
  }
}

// POST /api/godpanel/payments
// Approves, rejects, or checks gateway for a payment and updates workspace subscription accordingly
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

    const { paymentId, action, days = 30 } = await req.json(); // action: 'approve' | 'reject' | 'check_gateway'
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
      await adminDb.doc(`workspaces/${payment.workspaceId}/payments/${paymentId}`).set(
        {
          ...payment,
          status: "rejected",
          updatedAt: nowIso,
          verifiedAt: nowIso,
          verifiedBy: admin.username,
        },
        { merge: true }
      );

      // If user had temporary grace, expire it immediately upon rejection
      await adminDb.doc(col.workspace(payment.workspaceId)).set(
        {
          subscriptionStatus: "expired",
          temporaryGraceActive: false,
          potentialAbuseFlag: true,
          updatedAt: nowIso,
        },
        { merge: true }
      );

      return NextResponse.json({ success: true, message: "Payment rejected" });
    }

    if (action === "check_gateway") {
      const checkKey = payment.gatewayPaymentId || paymentId || payment.orderId || payment.utrNumber;
      const gatewayCheck = await checkGatewayPaymentStatus(checkKey);

      if (gatewayCheck.reachable && gatewayCheck.isPaid) {
        // Automatically approve based on confirmed gateway observation
        const activated = await activateSubscriptionForPayment(adminDb, {
          workspaceId: payment.workspaceId,
          paymentId,
          planId: payment.planId || "pro",
          amount: gatewayCheck.amountReceived || payment.amount || 149,
          utrNumber: gatewayCheck.utr || payment.utrNumber,
          verifiedBy: "UPI_GATEWAY_OBSERVER",
          daysOverride: days,
        });

        return NextResponse.json({
          success: true,
          isPaid: true,
          status: "approved",
          message: `Verified on UPI Gateway! Bank credit confirmed. Workspace activated until ${new Date(activated.activatedUntil).toLocaleDateString()}.`,
          payment: activated.payment,
        });
      }

      return NextResponse.json({
        success: true,
        isPaid: false,
        gatewayStatus: gatewayCheck.status || "UNCONFIRMED",
        reachable: gatewayCheck.reachable,
        message: gatewayCheck.reachable
          ? `Gateway reached. Status: ${gatewayCheck.status || "PENDING"}. No verified credit detected yet.`
          : `Gateway unreachable at this moment. You can still manually approve.`,
      });
    }

    if (action === "approve") {
      const activated = await activateSubscriptionForPayment(adminDb, {
        workspaceId: payment.workspaceId,
        paymentId,
        planId: payment.planId || "pro",
        amount: payment.amount || 149,
        utrNumber: payment.utrNumber,
        verifiedBy: admin.username,
        daysOverride: days,
      });

      return NextResponse.json({
        success: true,
        message: `Payment approved! Workspace activated on ${activated.plan.toUpperCase()} until ${new Date(activated.activatedUntil).toLocaleDateString()}`,
        payment: activated.payment,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[godpanel/payments POST] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to process payment" }, { status: 500 });
  }
}
