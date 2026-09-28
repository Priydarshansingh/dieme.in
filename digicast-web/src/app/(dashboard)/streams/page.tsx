'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import {
  collection, query, limit, getDocs, doc, getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { Radio, Scissors, ArrowRight, RefreshCw, Youtube } from 'lucide-react';

interface StreamDoc {
  id: string;
  title: string;
  youtubeVideoId?: string;
  thumbnailUrl?: string;
  startedAt?: any;
  endedAt?: any;
  clipCount: number;
  status: 'live' | 'ended' | 'vod_processing' | 'vod_ready' | 'archived' | string;
}

function parseDate(val: any): Date {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') return val.toDate();
  if (val.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
}

function formatDuration(startVal: any, endVal?: any) {
  const start = parseDate(startVal);
  const end = endVal ? parseDate(endVal) : new Date();
  const ms = end.getTime() - start.getTime();
  const totalMins = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
}

function formatDate(ts: any) {
  return parseDate(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  live:           { label: 'Live',           color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  ended:          { label: 'Ended',          color: '#6B7280', bg: '#F4F6F9' },
  vod_processing: { label: 'Processing',     color: '#D97706', bg: 'rgba(217,119,6,0.08)' },
  vod_ready:      { label: 'VOD Ready',      color: '#059669', bg: 'rgba(5,150,105,0.08)' },
  archived:       { label: 'Archived',       color: '#9CA3AF', bg: '#F9FAFB' },
};

function EmptyState({ onSync, isSyncing }: { onSync: () => void; isSyncing: boolean }) {
  return (
    <div
      className="rounded-2xl p-16 text-center space-y-4 border border-dashed"
      style={{ borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-red-50 text-red-600"
      >
        <Youtube className="w-6 h-6" />
      </div>
      <div>
        <p className="font-bold text-sm" style={{ color: '#1B2237' }}>No streams yet</p>
        <p className="text-xs mt-1 leading-relaxed max-w-sm mx-auto" style={{ color: '#9CA3AF' }}>
          Sync your connected YouTube channel to populate your livestream broadcasts and videos.
        </p>
      </div>
      <button
        onClick={onSync}
        disabled={isSyncing}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gray-900 hover:bg-black transition disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Syncing YouTube...' : 'Sync YouTube Streams'}
      </button>
    </div>
  );
}

function StreamsContent() {
  const { user } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [streams, setStreams] = useState<StreamDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const loadStreams = useCallback(async (wid: string) => {
    try {
      const snap = await getDocs(
        query(collection(db, 'workspaces', wid, 'streams'), limit(50))
      );
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as StreamDoc));
      list.sort((a, b) => parseDate(b.startedAt).getTime() - parseDate(a.startedAt).getTime());
      setStreams(list);
      return list.length;
    } catch (err) {
      console.error('Streams load error:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSyncStreams = async () => {
    if (!workspaceId) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await fetch(`/api/youtube/sync?workspaceId=${workspaceId}`);
      const data = await res.json();
      if (data.syncedCount !== undefined) {
        setSyncFeedback(`✅ Synced ${data.syncedCount} streams from YouTube!`);
        await loadStreams(workspaceId);
      } else if (data.error) {
        setSyncFeedback(`⚠️ ${data.error}`);
      }
    } catch {
      setSyncFeedback('⚠️ Failed to sync with YouTube.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    async function init() {
      const userSnap = await getDoc(doc(db, 'users', user!.uid));
      if (!userSnap.exists()) return;
      const wid: string = userSnap.data().defaultWorkspaceId || user!.uid;
      setWorkspaceId(wid);
      const count = await loadStreams(wid);
      if (count === 0) {
        try {
          await fetch(`/api/youtube/sync?workspaceId=${wid}`);
          await loadStreams(wid);
        } catch {
          // Ignore
        }
      }
    }
    init();
  }, [user, loadStreams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1B2237', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: '#1B2237' }}>Streams</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>
            All your YouTube livestreams and their clip markers.
          </p>
        </div>
        <button
          onClick={handleSyncStreams}
          disabled={isSyncing}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border bg-white hover:bg-gray-50 transition shadow-sm disabled:opacity-50 text-gray-800"
          style={{ borderColor: '#E5E7EB' }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-red-500' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync YouTube'}
        </button>
      </div>

      {syncFeedback && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between">
          <span>{syncFeedback}</span>
          <button onClick={() => setSyncFeedback(null)} className="text-blue-500 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {streams.length === 0 ? (
        <EmptyState onSync={handleSyncStreams} isSyncing={isSyncing} />
      ) : (
        <div
          className="rounded-2xl overflow-hidden divide-y shadow-sm"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}
        >
          {streams.map((s) => {
            const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.ended;
            const isLive = s.status === 'live';
            return (
              <a
                key={s.id}
                href={`/streams/${s.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition group"
              >
                {/* Thumbnail / Icon */}
                {s.thumbnailUrl ? (
                  <img
                    src={s.thumbnailUrl}
                    alt={s.title}
                    className="w-16 h-10 rounded-lg object-cover shrink-0 border border-gray-100"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: isLive ? '#1B2237' : '#F4F6F9' }}
                  >
                    {isLive ? (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                      </span>
                    ) : (
                      <Radio className="w-4 h-4" style={{ color: '#6B7280' }} />
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isLive && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white uppercase">
                        LIVE
                      </span>
                    )}
                    <p className="text-sm font-semibold truncate" style={{ color: '#1B2237' }}>
                      {s.title || (s.startedAt ? formatDate(s.startedAt) : 'Untitled stream')}
                    </p>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                    {s.startedAt ? formatDate(s.startedAt) : '—'}
                    {s.startedAt && ` · ${formatDuration(s.startedAt, s.endedAt)}`}
                  </p>
                </div>

                {/* Status badge */}
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0"
                  style={{ color: cfg.color, backgroundColor: cfg.bg }}
                >
                  {cfg.label}
                </span>

                {/* Clips count */}
                <div className="text-right shrink-0 w-12">
                  <p className="text-sm font-bold" style={{ color: '#1B2237' }}>{s.clipCount ?? 0}</p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    <Scissors className="inline w-3 h-3 mr-0.5" />clips
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition" style={{ color: '#6B7280' }} />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StreamsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-gray-500">Loading streams...</div>}>
      <StreamsContent />
    </Suspense>
  );
}
