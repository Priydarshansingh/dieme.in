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

    const { workspaceId, planId, utrNumber, note, screenshotUrl, userEmail: clientEmail } = await req.json();

    if (!workspaceId || !planId) {
      return NextResponse.json({ error: "Workspace ID and Plan are required" }, { status: 400 });
    }

    const cleanUtr = utrNumber ? String(utrNumber).trim() : "";
    
    // Require at least one proof indicator (UTR, Screenshot, or Note)
    if (!cleanUtr && !screenshotUrl && !note) {
      return NextResponse.json({ error: "Please provide either a 12-digit UPI UTR number or attach a payment screenshot" }, { status: 400 });
    }

    const finalUtr = cleanUtr || (screenshotUrl ? "Attached in Screenshot" : "Pending Verification");

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
    const userEmail = decodedToken.email || clientEmail || wsData.ownerEmail || "";

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const currentUploadCount = ((wsData.proofUploadCount as number) || 0) + 1;
    const currentUnverifiedGraceCount = ((wsData.unverifiedGraceCount as number) || 0);

    // Abuse Prevention: Allow max 2 unverified grace submissions before requiring official admin approval
    const canGrantGrace = currentUnverifiedGraceCount < 2;
    const graceExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

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
      utrNumber: finalUtr,
      note: note || "",
      screenshotUrl: screenshotUrl || null,
      submittedVia: "web",
      submissionCount: currentUploadCount,
      graceGranted: canGrantGrace,
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

    // Notify Telegram Admin Group if configured in environment
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const paymentsChatId = process.env.TELEGRAM_PAYMENTS_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID;
    let telegramDispatched = false;

    if (botToken && paymentsChatId) {
      try {
        const tgRes = await notifyAdminTelegramGroup({
          botToken,
          chatId: paymentsChatId,
          userEmail,
          userId: decodedToken.uid,
          workspaceName,
          workspaceId,
          planName: selectedPlan.name,
          periodLabel: selectedPlan.periodLabel,
          amount: selectedPlan.priceINR,
          utrNumber: finalUtr,
          note: note || "",
          screenshotUrl: screenshotUrl || null,
          submissionCount: currentUploadCount,
          graceGranted: canGrantGrace,
        });
        telegramDispatched = Boolean(tgRes.ok);
      } catch (tgErr) {
        console.error("[payments/submit] Failed to dispatch Telegram notification:", tgErr);
      }
    } else {
      console.log("[payments/submit] TELEGRAM_PAYMENTS_CHAT_ID or TELEGRAM_BOT_TOKEN not set; skipping automated group notification.");
    }

    // Build instant verification URLs
    const telegramUrl = buildVerificationTelegramUrl({
      workspaceId,
      workspaceName,
      userEmail,
      planName: selectedPlan.name,
      amount: selectedPlan.priceINR,
      utrNumber: finalUtr,
    });

    return NextResponse.json({
      success: true,
      message: `Thank you for subscribing! Payment proof for ${selectedPlan.name} (₹${selectedPlan.priceINR}) received.`,
      payment: paymentRecord,
      graceGranted: canGrantGrace,
      telegramUrl,
      telegramDispatched,
      discordUrl: UPI_CONFIG.discordSupportUrl,
    });
  } catch (err: any) {
    console.error("[payments/submit] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to submit payment proof" }, { status: 500 });
  }
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function notifyAdminTelegramGroup(params: {
  botToken: string;
  chatId: string;
  userEmail: string;
  userId: string;
  workspaceName: string;
  workspaceId: string;
  planName: string;
  periodLabel: string;
  amount: number;
  utrNumber: string;
  note?: string;
  screenshotUrl?: string | null;
  submissionCount?: number;
  graceGranted?: boolean;
}) {
  const {
    botToken,
    chatId,
    userEmail,
    userId,
    workspaceName,
    workspaceId,
    planName,
    periodLabel,
    amount,
    utrNumber,
    note,
    screenshotUrl,
    submissionCount = 1,
    graceGranted = true,
  } = params;

  const countTag = submissionCount > 1
    ? `⚠️ <b>Proof Upload Count:</b> #${submissionCount} (Repeated Submission)`
    : `📊 <b>Proof Upload Count:</b> #1 (First Submission)`;

  const graceTag = graceGranted
    ? `⚡ <b>Instant Access:</b> 🟢 24-Hour Grace Granted`
    : `⚡ <b>Instant Access:</b> 🔴 Blocked (Abuse Protection - Max Grace Exceeded)`;

  const captionHtml = [
    `⚡ <b>NEW PAYMENT PROOF SUBMITTED</b>`,
    ``,
    `👤 <b>User Gmail:</b> <code>${escapeHtml(userEmail || "N/A")}</code>`,
    `🆔 <b>Account ID:</b> <code>${escapeHtml(userId)}</code>`,
    `🏢 <b>Workspace:</b> <code>${escapeHtml(workspaceName)}</code> (<code>${escapeHtml(workspaceId)}</code>)`,
    `📦 <b>Purchased Plan:</b> <b>${escapeHtml(planName)}</b> (${escapeHtml(periodLabel)})`,
    `💰 <b>Amount:</b> <b>₹${amount}</b>`,
    `🔢 <b>UTR / Ref ID:</b> <code>${escapeHtml(utrNumber)}</code>`,
    countTag,
    graceTag,
    note ? `📝 <b>Note:</b> ${escapeHtml(note)}` : null,
    `⏰ <b>Submitted At:</b> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`,
    ``,
    `👉 <i>Verify & Approve inside GodPanel: /godpanel</i>`,
  ]
    .filter(Boolean)
    .join("\n");

  // Try sending with photo if screenshotUrl is provided
  if (screenshotUrl) {
    try {
      const isDataUrl = screenshotUrl.startsWith("data:");
      if (isDataUrl) {
        const matches = screenshotUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, "base64");
          const blob = new Blob([buffer], { type: mimeType });

          const formData = new FormData();
          formData.append("chat_id", chatId);
          formData.append("photo", blob, "payment_screenshot.jpg");
          formData.append("caption", captionHtml);
          formData.append("parse_mode", "HTML");

          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: "POST",
            body: formData,
          });
          const json = await res.json();
          if (json.ok) return { ok: true, messageId: json.result?.message_id };
          console.warn("[payments/submit] sendPhoto failed, falling back to sendMessage:", json.description);
        }
      } else if (screenshotUrl.startsWith("http")) {
        const formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("photo", screenshotUrl);
        formData.append("caption", captionHtml);
        formData.append("parse_mode", "HTML");

        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (json.ok) return { ok: true, messageId: json.result?.message_id };
        console.warn("[payments/submit] sendPhoto (url) failed, falling back to sendMessage:", json.description);
      }
    } catch (photoErr) {
      console.error("[payments/submit] Error dispatching photo to Telegram:", photoErr);
    }
  }

  // Fallback or text-only dispatch
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: captionHtml,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const json = await res.json();
    return { ok: json.ok, messageId: json.result?.message_id };
  } catch (textErr) {
    console.error("[payments/submit] Error dispatching sendMessage to Telegram:", textErr);
    return { ok: false, error: textErr };
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
