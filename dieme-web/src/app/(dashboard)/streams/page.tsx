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
  viewCount?: number;
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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  live:           { label: 'Live',           color: '#F87171', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' },
  ended:          { label: 'Ended',          color: '#94A3B8', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
  vod_processing: { label: 'Processing',     color: '#FBBF24', bg: 'rgba(217,119,6,0.15)', border: 'rgba(217,119,6,0.3)' },
  vod_ready:      { label: 'VOD Ready',      color: '#34D399', bg: 'rgba(5,150,105,0.15)', border: 'rgba(5,150,105,0.3)' },
  archived:       { label: 'Archived',       color: '#64748B', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.08)' },
};

function EmptyState({ onSync, isSyncing }: { onSync: () => void; isSyncing: boolean }) {
  return (
    <div
      className="glass-card rounded-2xl p-16 text-center space-y-4 border border-dashed border-white/15"
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-red-500/10 text-red-400 border border-red-500/20"
      >
        <Youtube className="w-6 h-6" />
      </div>
      <div>
        <p className="font-bold text-sm text-white">No streams yet</p>
        <p className="text-xs mt-1 leading-relaxed max-w-sm mx-auto text-slate-400">
          Sync your connected YouTube channel to populate your livestream broadcasts and videos.
        </p>
      </div>
      <button
        onClick={onSync}
        disabled={isSyncing}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition disabled:opacity-50 shadow-sm"
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
      const idToken = await user?.getIdToken().catch(() => '');
      const headers: Record<string, string> = {
        'x-user-uid': user?.uid || '',
        'x-user-email': user?.email || '',
      };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      let list: StreamDoc[] = [];
      try {
        const res = await fetch(`/api/streams?workspaceId=${wid}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.streams)) {
            list = data.streams;
          }
        }
      } catch (streamApiErr) {
        console.warn('[streams] api fallback note:', streamApiErr);
      }

      if (list.length === 0) {
        try {
          const snap = await getDocs(
            query(collection(db, 'workspaces', wid, 'streams'), limit(50))
          );
          list = snap.docs.map(d => ({ id: d.id, ...d.data() } as StreamDoc));
          list.sort((a, b) => parseDate(b.startedAt).getTime() - parseDate(a.startedAt).getTime());
        } catch {
          // ignore
        }
      }

      setStreams(list);
      return list.length;
    } catch (err) {
      console.error('Streams load error:', err);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleSyncStreams = async () => {
    if (!workspaceId) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const idToken = await user?.getIdToken().catch(() => '');
      const headers: Record<string, string> = {
        'x-user-uid': user?.uid || '',
        'x-user-email': user?.email || '',
      };
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch(`/api/youtube/sync?workspaceId=${workspaceId}`, {
        headers,
        signal: AbortSignal.timeout(30000),
      });
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
    let isCancelled = false;

    async function init() {
      const fallbackWid = user!.uid;
      setWorkspaceId(fallbackWid);

      let wid = fallbackWid;
      try {
        const userSnap = await getDoc(doc(db, 'users', user!.uid));
        if (userSnap.exists() && userSnap.data()?.defaultWorkspaceId) {
          wid = userSnap.data().defaultWorkspaceId;
          if (!isCancelled) setWorkspaceId(wid);
        }
      } catch (err) {
        console.warn('[streams] user doc note:', err);
      }

      const count = await loadStreams(wid);
      if (count === 0 && !isCancelled) {
        try {
          await fetch(`/api/youtube/sync?workspaceId=${wid}`);
          if (!isCancelled) await loadStreams(wid);
        } catch {
          // Ignore
        }
      }
    }
    init();

    return () => {
      isCancelled = true;
    };
  }, [user, loadStreams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1B2237', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Streams</h1>
          <p className="text-sm mt-1 text-slate-400">
            All your YouTube livestreams and their clip markers.
          </p>
        </div>
        <button
          onClick={handleSyncStreams}
          disabled={isSyncing}
          className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-xs font-semibold rounded-xl border bg-white/10 border-white/15 hover:bg-white/20 transition shadow-sm disabled:opacity-50 text-white w-full sm:w-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync YouTube'}
        </button>
      </div>

      {syncFeedback && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-200 flex items-center justify-between shadow">
          <span>{syncFeedback}</span>
          <button onClick={() => setSyncFeedback(null)} className="text-cyan-400 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {streams.length === 0 ? (
        <EmptyState onSync={handleSyncStreams} isSyncing={isSyncing} />
      ) : (
        <div
          className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.06] shadow-xl border border-white/10"
        >
          {streams.map((s) => {
            const isLive = s.status === 'live';
            return (
              <a
                key={s.id}
                href={`/streams/${s.id}`}
                className="flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-white/[0.03] active:bg-white/[0.06] transition group"
              >
                {/* Thumbnail */}
                {s.thumbnailUrl ? (
                  <div className="relative w-20 sm:w-28 aspect-video rounded-xl overflow-hidden shrink-0 border border-white/10 bg-slate-900 shadow">
                    <img
                      src={s.thumbnailUrl}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {isLive && (
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-600 text-white uppercase shadow flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                ) : (
                  <div
                    className="w-20 sm:w-28 aspect-video rounded-xl flex items-center justify-center shrink-0 bg-white/5 border border-white/10 text-slate-400"
                  >
                    <Radio className="w-5 h-5" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-bold text-white truncate group-hover:text-cyan-300 transition">
                    {s.title || 'Untitled Stream'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                    <span>{s.startedAt ? formatDate(s.startedAt) : '—'}</span>
                    {s.startedAt && <span>· {formatDuration(s.startedAt, s.endedAt)}</span>}
                    {s.viewCount != null && Number(s.viewCount) > 0 && (
                      <span>· {Number(s.viewCount).toLocaleString()} views</span>
                    )}
                  </div>
                </div>

                {/* Status badge (Clean normal neutral tokens) */}
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 border ${
                    isLive
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-white/[0.04] text-slate-400 border-white/10'
                  }`}
                >
                  {isLive ? 'Live' : 'Ended'}
                </span>

                {/* Clips count */}
                <div className="text-right shrink-0 min-w-[48px]">
                  <p className="text-sm font-bold text-white">{s.clipCount ?? 0}</p>
                  <p className="text-xs text-slate-400">
                    <Scissors className="inline w-3 h-3 mr-0.5" />clips
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 shrink-0 text-slate-500 opacity-0 group-hover:opacity-100 group-hover:text-cyan-400 transition hidden sm:block" />
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
