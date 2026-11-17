import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getUserReferralStats, getReferralCode } from "@/lib/referrals/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    let uid = "";
    const authHeader = req.headers.get("authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      try {
        const decoded = await adminAuth.verifyIdToken(authHeader.substring(7));
        uid = decoded.uid;
      } catch {}
    }

    if (!uid) {
      const { searchParams } = new URL(req.url);
      uid = searchParams.get("uid") || "";
    }

    if (!uid) {
      return NextResponse.json({
        referralCode: "REF_CREATOR",
        referralLink: "https://www.dieme.in/login",
        referredCount: 0,
        lifetimeCommissionINR: 0,
        creditedToWalletDP: 0,
        commissionPercent: 15,
        streamers: [],
      });
    }

    const stats = await getUserReferralStats(uid);
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch referral stats" }, { status: 500 });
  }
}
