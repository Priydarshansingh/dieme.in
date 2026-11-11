import { NextRequest, NextResponse } from 'next/server';
import { liveStreamAssets } from '@/lib/assetStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isPremium = searchParams.get('isPremium');

    let results = [...liveStreamAssets];

    if (category && category !== 'ALL') {
      results = results.filter((a) => a.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (isPremium !== null && isPremium !== undefined) {
      const prem = isPremium === 'true';
      results = results.filter((a) => a.isPremium === prem);
    }

    return NextResponse.json({
      success: true,
      totalAssets: results.length,
      categories: ['FACECAM_OVERLAYS', 'GREEN_SCREEN_EFFECTS', 'CUSTOM_VIDEO_FRAMES', 'LIVE_FRAME_PHOTOS'],
      assets: results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'FETCH_ASSETS_FAILED', details: error.message }, { status: 500 });
  }
}
