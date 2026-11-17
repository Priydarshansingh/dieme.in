import { NextRequest, NextResponse } from "next/server";
import { validateReferralCode } from "@/lib/referrals/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, currentUid } = body;

    if (!code) {
      return NextResponse.json({ valid: false, message: "Please provide a referral code." }, { status: 400 });
    }

    const result = await validateReferralCode(code, currentUid);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ valid: false, message: err.message || "Failed to validate code" }, { status: 500 });
  }
}
