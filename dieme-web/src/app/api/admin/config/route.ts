import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getPlatformConfig, updatePlatformConfig } from "@/lib/referrals/service";

export const dynamic = "force-dynamic";

async function verifyAdminCaller(req: NextRequest): Promise<{ isAdmin: boolean; uid?: string; email?: string }> {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { isAdmin: false };
  }

  try {
    const token = authHeader.substring(7);
    const decoded = await adminAuth.verifyIdToken(token);
    // Allow designated owner or admin claim
    const isOwner =
      decoded.email === "pskishnawat133@gmail.com" ||
      decoded.email === "johnykand8@gmail.com" ||
      decoded.role === "admin" ||
      decoded.admin === true;

    return { isAdmin: Boolean(isOwner), uid: decoded.uid, email: decoded.email };
  } catch {
    return { isAdmin: false };
  }
}

// GET /api/admin/config
export async function GET(req: NextRequest) {
  try {
    const config = await getPlatformConfig();
    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load platform config" }, { status: 500 });
  }
}

// POST /api/admin/config
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminCaller(req);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin privileges required to modify currency & pricing conversion rules." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updated = await updatePlatformConfig(body, auth.uid || "admin");

    return NextResponse.json({
      success: true,
      message: "Platform pricing, currency conversion and referral commission updated successfully.",
      config: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update platform config" }, { status: 500 });
  }
}
