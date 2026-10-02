// POST & GET /api/youtube/sync
// Syncs active live broadcasts and recent video streams from YouTube into Firestore

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { syncWorkspaceYouTubeStreams } from '@/lib/youtube/sync';

export async function POST(req: NextRequest) {
  return handleSync(req);
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}

async function handleSync(req: NextRequest) {
  let workspaceId: string | null = null;

  // 1. Authorize user
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
      workspaceId = decoded.uid;
    } catch {
      // Ignore if called internally with query
    }
  }

  const { searchParams } = new URL(req.url);
  workspaceId = searchParams.get('workspaceId') || workspaceId;

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  try {
    const result = await syncWorkspaceYouTubeStreams(workspaceId);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Sync failed' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      channelId: result.channelId,
      channelName: result.channelName,
      syncedCount: result.syncedCount,
      activeLiveStream: result.activeLiveStream,
    });
  } catch (error: any) {
    console.error('[youtube-sync] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync YouTube streams' },
      { status: 500 }
    );
  }
}
