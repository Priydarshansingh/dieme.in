import crypto from "crypto";
import { PRICING_PLANS, PlanId } from "./pricingPlans";
import { col } from "./firestore/collections";

export const UPI_GATEWAY_URL =
  process.env.UPI_GATEWAY_URL ||
  process.env.BASE_PAYMENT_API_URL ||
  "https://payments.dieme.in";

export const UPI_GATEWAY_WEBHOOK_SECRET =
  process.env.UPI_GATEWAY_WEBHOOK_SECRET ||
  process.env.COIN_STORE_WEBHOOK_SECRET ||
  "merchant_webhook_secret_for_wallet_store";

/**
 * Validates HMAC SHA-256 signature from YOUPI Gateway Webhook
 */
export function verifyGatewayWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string = UPI_GATEWAY_WEBHOOK_SECRET
): boolean {
  if (!signatureHeader) return false;
  const cleanSig = signatureHeader.replace(/^sha256=/, "").trim();
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(cleanSig, "hex"),
      Buffer.from(expectedSig, "hex")
    );
  } catch {
    return cleanSig === expectedSig;
  }
}

/**
 * Creates a dynamic payment session on the self-hosted UPI Gateway
 */
export async function createGatewayPaymentSession(params: {
  orderId: string;
  amountINR: number;
  workspaceId: string;
  planId: string;
  userEmail?: string;
  customerName?: string;
}): Promise<{
  success: boolean;
  gatewayPaymentId?: string;
  checkoutUrl?: string;
  status?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${UPI_GATEWAY_URL}/api/v1/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: params.orderId,
        amount: String(params.amountINR),
        currency: "INR",
        method: "UPI",
        autoActivate: true,
        customer: {
          email: params.userEmail || "",
          name: params.customerName || "Digicast Creator",
        },
        metadata: {
          workspaceId: params.workspaceId,
          planId: params.planId,
          userEmail: params.userEmail || "",
          system: "digicast",
        },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Gateway response ${res.status}: ${errText}` };
    }

    const data = await res.json();
    return {
      success: true,
      gatewayPaymentId: data.paymentId,
      checkoutUrl: data.checkoutUrl,
      status: data.status,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to reach UPI gateway" };
  }
}

/**
 * Checks live status of a payment directly on the UPI Gateway
 */
export async function checkGatewayPaymentStatus(paymentIdOrOrderId: string): Promise<{
  reachable: boolean;
  isPaid: boolean;
  status?: string;
  amountReceived?: number;
  utr?: string;
  completedAt?: string;
  verificationLevel?: number;
  error?: string;
}> {
  try {
    const res = await fetch(`${UPI_GATEWAY_URL}/api/v1/payments/${paymentIdOrOrderId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      return { reachable: true, isPaid: false, error: `Status ${res.status}` };
    }

    const data = await res.json();
    const status = String(data.status || data.internalStatus || "").toUpperCase();
    const isPaid = status === "SUCCESS" || status === "COMPLETED";

    return {
      reachable: true,
      isPaid,
      status,
      amountReceived: data.amount ? parseFloat(data.amount) : undefined,
      utr: data.metadata?.bankReferenceNumber || data.bankReferenceNumber || data.utr,
      completedAt: data.completedAt,
      verificationLevel: data.verificationLevel || 0,
    };
  } catch (err: any) {
    return { reachable: false, isPaid: false, error: err.message };
  }
}

/**
 * Authoritatively activates workspace subscription upon verified payment
 */
export async function activateSubscriptionForPayment(
  adminDb: any,
  params: {
    workspaceId: string;
    paymentId: string;
    planId: string;
    amount: number;
    utrNumber?: string;
    verifiedBy: string;
    daysOverride?: number;
  }
) {
  const { workspaceId, paymentId, planId, amount, utrNumber, verifiedBy, daysOverride } = params;
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  const wsRef = adminDb.doc(col.workspace(workspaceId));
  const wsDoc = await wsRef.get();
  if (!wsDoc.exists) {
    throw new Error(`Workspace ${workspaceId} not found`);
  }

  const wsData = wsDoc.data() || {};
  const selectedPlan = PRICING_PLANS.find((p) => p.id === planId);
  const assignedPlan = selectedPlan ? selectedPlan.id : planId || "pro";

  // Calculate days: intro_29 -> 30d, starter -> 30d, pro -> 90d, studio -> 365d
  let planDays = 30;
  if (assignedPlan === "pro") planDays = 90;
  if (assignedPlan === "studio") planDays = 365;
  const effectiveDays = daysOverride && Number(daysOverride) !== 30 ? Number(daysOverride) : planDays;
  const additionMs = effectiveDays * 24 * 60 * 60 * 1000;

  let newExpiresMs = now + additionMs;

  // If already active, extend existing expiration date
  if (wsData.subscriptionExpiresAt && wsData.subscriptionStatus === "active") {
    const existingMs = Date.parse(wsData.subscriptionExpiresAt);
    if (!isNaN(existingMs) && existingMs > now) {
      newExpiresMs = existingMs + additionMs;
    }
  }

  const activatedUntil = new Date(newExpiresMs).toISOString();

  // 1. Update workspace
  await wsRef.update({
    plan: assignedPlan,
    subscriptionTier: assignedPlan,
    subscription: assignedPlan,
    subscriptionStatus: "active",
    temporaryGraceActive: false,
    unverifiedGraceCount: 0,
    potentialAbuseFlag: false,
    trialBypassDetected: false,
    subscriptionExpiresAt: activatedUntil,
    lastPaymentAt: nowIso,
    updatedAt: nowIso,
  });

  // 2. Update global payment record
  const paymentRef = adminDb.collection("payments").doc(paymentId);
  const paymentDoc = await paymentRef.get();
  const existingPaymentData = paymentDoc.exists ? paymentDoc.data() : {};

  const updatedPayment = {
    ...existingPaymentData,
    id: paymentId,
    workspaceId,
    planId: assignedPlan,
    planName: selectedPlan?.name || assignedPlan.toUpperCase(),
    amount,
    currency: "INR",
    utrNumber: utrNumber || existingPaymentData.utrNumber || "AUTO_VERIFIED",
    status: "approved",
    verifiedAt: nowIso,
    verifiedBy,
    activatedUntil,
    updatedAt: nowIso,
  };

  await paymentRef.set(updatedPayment, { merge: true });

  // 3. Update workspace subcollection record
  await adminDb
    .doc(`workspaces/${workspaceId}/payments/${paymentId}`)
    .set(updatedPayment, { merge: true });

  return {
    success: true,
    plan: assignedPlan,
    activatedUntil,
    payment: updatedPayment,
  };
}
