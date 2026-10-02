import { NextRequest, NextResponse } from "next/server";
import { verifyGodSessionToken, ensureDefaultRootAdmin } from "@/lib/godpanelAuth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ensureDefaultRootAdmin();
    const token = req.cookies.get("godpanel_token")?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const session = verifyGodSessionToken(token);
    if (!session) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      admin: session,
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err.message }, { status: 500 });
  }
}
