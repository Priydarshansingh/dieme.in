import { NextRequest, NextResponse } from 'next/server';
import { matchEditorsForStreamer } from '@/lib/matchmakingEngine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { streamerUid, prompt, maxBudgetINR, turnaroundMaxHours } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'PROMPT_REQUIRED', message: 'Streamer requirement prompt is required' }, { status: 400 });
    }

    const response = matchEditorsForStreamer({
      streamerUid: streamerUid || 'guest_streamer',
      prompt,
      maxBudgetINR: maxBudgetINR ? Number(maxBudgetINR) : undefined,
      turnaroundMaxHours: turnaroundMaxHours ? Number(turnaroundMaxHours) : undefined,
    });

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'MATCHMAKING_FAILED', details: error.message }, { status: 500 });
  }
}
