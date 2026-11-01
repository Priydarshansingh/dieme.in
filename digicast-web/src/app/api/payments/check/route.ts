import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import {
  checkGatewayPaymentStatus,
  activateSubscriptionForPayment,
} from "@/lib/upiGatewayClient";

/**
 * GET /api/payments/check?paymentId=...&orderId=...&workspaceId=...
 * POST /api/payments/check
 * Instantly checks whether a payment was received by the UPI Gateway or approved in the system.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("paymentId") || "";
  const orderId = searchParams.get("orderId") || "";
  const workspaceId = searchParams.get("workspaceId") || "";
  const utrNumber = searchParams.get("utrNumber") || "";
  const listAll = searchParams.get("all") === "true";

  return processCheck({ paymentId, orderId, workspaceId, utrNumber, listAll });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return processCheck(body);
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 });
  }
}

async function processCheck(params: {
  paymentId?: string;
  orderId?: string;
  workspaceId?: string;
  utrNumber?: string;
  listAll?: boolean;
}) {
  const { paymentId, orderId, workspaceId, utrNumber, listAll } = params;

  if (!paymentId && !orderId && !workspaceId) {
    return NextResponse.json(
      { error: "At least paymentId, orderId, or workspaceId is required" },
      { status: 400 }
    );
  }

  try {
    let paymentDoc: any = null;
    let paymentData: any = null;
    let resolvedPaymentId = paymentId || "";

    // 1. Locate payment document in Firestore
    if (paymentId) {
      const doc = await adminDb.collection("payments").doc(paymentId).get();
      if (doc.exists) {
        paymentDoc = doc;
        paymentData = doc.data();
      }
    }

    if (!paymentData && orderId) {
      const snap = await adminDb.collection("payments").where("orderId", "==", orderId).limit(1).get();
      if (!snap.empty) {
        paymentDoc = snap.docs[0];
        paymentData = paymentDoc.data();
        resolvedPaymentId = paymentDoc.id;
      }
    }

    let recentPayments: any[] = [];
    if (workspaceId) {
      try {
        const snap = await adminDb
          .collection("payments")
          .where("workspaceId", "==", workspaceId)
          .limit(20)
          .get();
        recentPayments = snap.docs.map((d) => {
          const item = d.data();
          return {
            id: d.id,
            orderId: item.orderId || d.id,
            planName: item.planName || "Subscription Pass",
            amount: item.amount || 0,
            status: item.status || "pending_verification",
            utrNumber: item.utrNumber || "",
            createdAt: item.createdAt || "",
            hasScreenshot: Boolean(item.screenshotUrl),
            screenshotUrl: item.screenshotUrl || null,
          };
        });
        recentPayments.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

        const approvedItem = recentPayments.find((p) => p.status === "approved");
        if (approvedItem && (!paymentData || paymentData.status !== "approved")) {
          paymentData = approvedItem;
          resolvedPaymentId = approvedItem.id;
        }
      } catch (e) {
        console.warn("[payments/check] recent payments note:", e);
      }
    }

    if (!paymentData && workspaceId && recentPayments.length > 0) {
      paymentData = recentPayments[0];
      resolvedPaymentId = paymentData.id;
    }

    // If payment is already approved, return immediately
    if (paymentData && paymentData.status === "approved") {
      return NextResponse.json({
        success: true,
        status: "approved",
        isApproved: true,
        isPaid: true,
        paymentId: resolvedPaymentId,
        orderId: paymentData.orderId,
        workspaceId: paymentData.workspaceId,
        planId: paymentData.planId,
        planName: paymentData.planName,
        amount: paymentData.amount,
        amountReceived: paymentData.amount,
        utrNumber: paymentData.utrNumber,
        verifiedBy: paymentData.verifiedBy || "UPI_GATEWAY_OBSERVER",
        verifiedAt: paymentData.verifiedAt,
        activatedUntil: paymentData.activatedUntil,
        recentPayments,
        message: "Payment verified and approved",
      });
    }

    // 2. Query the live UPI Gateway directly if payment is pending
    const gatewayLookupKey = paymentData?.gatewayPaymentId || resolvedPaymentId || orderId;
    if (gatewayLookupKey) {
      const gatewayCheck = await checkGatewayPaymentStatus(gatewayLookupKey);

      if (gatewayCheck.reachable && gatewayCheck.isPaid) {
        // Amount was detected as received by the Gateway Observer!
        const targetWsId = paymentData?.workspaceId || workspaceId;
        const targetPlanId = paymentData?.planId || "pro";
        const targetAmount = gatewayCheck.amountReceived || paymentData?.amount || 149;
        const targetUtr = gatewayCheck.utr || utrNumber || paymentData?.utrNumber || "GATEWAY_VERIFIED";

        if (targetWsId) {
          const activated = await activateSubscriptionForPayment(adminDb, {
            workspaceId: targetWsId,
            paymentId: resolvedPaymentId || `pay_${Date.now()}`,
            planId: targetPlanId,
            amount: targetAmount,
            utrNumber: targetUtr,
            verifiedBy: "UPI_GATEWAY_INSTANT_CHECK",
          });

          return NextResponse.json({
            success: true,
            status: "approved",
            isApproved: true,
            isPaid: true,
            paymentId: resolvedPaymentId,
            workspaceId: targetWsId,
            planId: targetPlanId,
            amountReceived: targetAmount,
            utrNumber: targetUtr,
            verifiedBy: "UPI_GATEWAY_INSTANT_CHECK",
            activatedUntil: activated.activatedUntil,
            message: "Payment detected on gateway! Subscription activated immediately.",
          });
        }
      }
    }

    // 3. Fallback: Return current state
    return NextResponse.json({
      success: true,
      status: paymentData?.status || "pending_verification",
      isApproved: false,
      isPaid: false,
      paymentId: resolvedPaymentId,
      orderId: paymentData?.orderId || orderId,
      amount: paymentData?.amount,
      planId: paymentData?.planId,
      graceGranted: Boolean(paymentData?.graceGranted),
      recentPayments,
      message: paymentData ? "Payment is pending bank credit verification" : "No pending payment found",
    });
  } catch (err: any) {
    console.error("[payments/check] Error checking payment status:", err);
    return NextResponse.json({ error: err.message || "Failed to check payment status" }, { status: 500 });
  }
}
