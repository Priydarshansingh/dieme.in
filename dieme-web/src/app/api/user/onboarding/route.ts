import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { col } from "@/lib/firestore/collections";
import { registerReferral, getReferralCode } from "@/lib/referrals/service";

export async function POST(req: NextRequest) {
  try {
    let uid = "";
    let email = "";
    const authHeader = req.headers.get("authorization") || "";

    if (authHeader.startsWith("Bearer ")) {
      try {
        const decoded = await adminAuth.verifyIdToken(authHeader.substring(7));
        uid = decoded.uid;
        email = decoded.email || "";
      } catch (authErr) {
        return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 });
      }
    }

    const body = await req.json();
    if (!uid && body.uid) {
      uid = body.uid;
      email = body.email || "";
    }

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized: User ID required" }, { status: 401 });
    }

    const { policyAccepted, referralCode } = body;

    if (!policyAccepted) {
      return NextResponse.json(
        { error: "You must accept all platform policies to use Dieme Studio." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const ownReferralCode = getReferralCode(uid);

    // 1. Update user record
    const userRef = adminDb.doc(col.user(uid));
    const userSnap = await userRef.get();
    const existingUserData = userSnap.exists ? userSnap.data() || {} : {};

    await userRef.set(
      {
        uid,
        email: email || existingUserData.email || "",
        onboardingCompleted: true,
        policyAcceptedAt: now,
        policyVersion: "v2026.11",
        referralCode: existingUserData.referralCode || ownReferralCode,
        updatedAt: now,
      },
      { merge: true }
    );

    // 2. Index own referral code
    await adminDb.doc(col.referralCode(ownReferralCode)).set(
      {
        uid,
        email: email || existingUserData.email || "",
        displayName: existingUserData.displayName || "",
        createdAt: now,
      },
      { merge: true }
    );

    // 3. Update workspace
    const workspaceId = existingUserData.defaultWorkspaceId || uid;
    await adminDb.doc(col.workspace(workspaceId)).set(
      {
        policyAcceptedAt: now,
        onboardingCompleted: true,
        updatedAt: now,
      },
      { merge: true }
    );

    // 4. Register referral if provided and not already referred
    let referralResult: any = null;
    if (referralCode && !existingUserData.referredBy) {
      referralResult = await registerReferral({
        referrerCode: referralCode.trim().toUpperCase(),
        referredUid: uid,
        referredEmail: email || existingUserData.email || "",
      });
    }

    return NextResponse.json({
      success: true,
      onboardingCompleted: true,
      policyAcceptedAt: now,
      referralCode: ownReferralCode,
      referralLinked: referralResult?.success ?? false,
      referralMessage: referralResult?.message ?? null,
    });
  } catch (err: any) {
    console.error("[user/onboarding] Error completing onboarding:", err);
    return NextResponse.json({ error: err.message || "Failed to complete onboarding" }, { status: 500 });
  }
}
